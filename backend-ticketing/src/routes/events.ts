/**
 * Events Routes
 *
 * CRUD operations for events.
 * - Create/Update/Delete: Admin only (platform-level)
 * - List/Get: Public (published events only) or Admin/Host (all events they manage)
 */
import { Hono } from 'hono'
import type { Bindings, Variables, EventRow, JWTPayload } from '../types'
import { authMiddleware, roleGuard, eventPermission, requireEventAdmin } from '../middleware/auth'
import { UploadService, UploadError } from '../services/upload'
import { expireStaleTickets } from '../services/ticketExpiry'

const events = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ═══════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════

/**
 * GET /events
 * List published events (public).
 * Query params: ?page=1&limit=20&search=keyword
 */
events.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100)
  const search = c.req.query('search') || ''
  const offset = (page - 1) * limit

  let query = `SELECT event_uuid, event_name, description, banner_filename,
                      location_name, location_lat, location_long, start_time, end_time, status,
                      food_enabled, sales_status, sales_open_time, sales_close_time, created_at,
                      (SELECT MIN(price_total) FROM ticket_tiers WHERE ticket_tiers.event_uuid = events.event_uuid AND quota_available > 0) as min_price,
                      (SELECT COUNT(*) FROM ticket_tiers WHERE ticket_tiers.event_uuid = events.event_uuid) as tier_count
               FROM events WHERE status = 'published'`
  const params: any[] = []

  if (search) {
    query += ` AND (event_name LIKE ? OR description LIKE ? OR location_name LIKE ?)`
    const s = `%${search}%`
    params.push(s, s, s)
  }

  query += ` ORDER BY start_time ASC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  // Count total
  let countQuery = `SELECT COUNT(*) as total FROM events WHERE status = 'published'`
  const countParams: any[] = []
  if (search) {
    countQuery += ` AND (event_name LIKE ? OR description LIKE ? OR location_name LIKE ?)`
    const s = `%${search}%`
    countParams.push(s, s, s)
  }
  const total = await c.env.DB.prepare(countQuery).bind(...countParams).first() as { total: number } | null

  // Compute effective_sales_status for each event
  const now = new Date()
  const enrichedEvents = (results || []).map((ev: any) => {
    let effective_sales_status = ev.sales_status || 'available'
    if (effective_sales_status === 'coming_soon' && ev.sales_open_time) {
      if (now >= new Date(ev.sales_open_time)) effective_sales_status = 'available'
    }
    if (effective_sales_status === 'unavailable' && ev.sales_close_time) {
      if (now < new Date(ev.sales_close_time)) effective_sales_status = 'available'
    }
    if (effective_sales_status === 'available' && ev.sales_close_time) {
      if (now >= new Date(ev.sales_close_time)) effective_sales_status = 'unavailable'
    }
    return { ...ev, effective_sales_status }
  })

  return c.json({
    events: enrichedEvents,
    pagination: {
      page,
      limit,
      total: total?.total || 0,
      total_pages: Math.ceil((total?.total || 0) / limit),
    },
  })
})

/**
 * GET /events/:eventId
 * Get single event detail (public if published).
 * Includes tiers.
 */
events.get('/:eventId', async (c) => {
  const eventId = c.req.param('eventId')

  const event = await c.env.DB.prepare(
    'SELECT * FROM events WHERE event_uuid = ?'
  ).bind(eventId).first() as EventRow | null

  if (!event) return c.json({ message: 'Event not found' }, 404)

  // Public can only see published events
  if (event.status !== 'published') {
    // Check if requester is authenticated and has access
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ message: 'Event not found' }, 404)
    }
    // If auth present, they may be admin/host — let manage routes handle that
  }

  // Expire any stale tickets before returning tier availability
  await expireStaleTickets(c.env.DB, c.env.KV, eventId)

  // Get tiers (hide admin_fee_internal from public)
  const { results: tiers } = await c.env.DB.prepare(
    `SELECT tier_uuid, event_uuid, tier_name, tier_description,
            price_total, quota_total, quota_available, sort_order, name_your_price
     FROM ticket_tiers WHERE event_uuid = ? ORDER BY sort_order ASC`
  ).bind(eventId).all()

  // Compute effective sales status based on time
  const now = new Date()
  let effective_sales_status = event.sales_status || 'available'
  if (effective_sales_status === 'coming_soon' && event.sales_open_time) {
    if (now >= new Date(event.sales_open_time)) {
      effective_sales_status = 'available'
    }
  }
  if (effective_sales_status === 'unavailable' && event.sales_close_time) {
    if (now < new Date(event.sales_close_time)) {
      effective_sales_status = 'available'
    }
  }
  // Also check: if status is 'available' but sales_close_time is set and passed
  if (effective_sales_status === 'available' && event.sales_close_time) {
    if (now >= new Date(event.sales_close_time)) {
      effective_sales_status = 'unavailable'
    }
  }

  return c.json({
    ...event,
    food_options: JSON.parse(event.food_options || '[]'),
    effective_sales_status,
    tiers: tiers || [],
  })
})

// ═══════════════════════════════════════════════════
// ADMIN ROUTES (requires auth + admin role)
// ═══════════════════════════════════════════════════

/**
 * POST /events
 * Create a new event. Admin only.
 * Supports multipart/form-data for banner upload.
 */
events.post('/', authMiddleware, roleGuard(['admin']), async (c) => {
  try {
    const user = c.get('user') as JWTPayload
    const contentType = c.req.header('Content-Type') || ''

    let body: Record<string, any> = {}
    let bannerFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData()
      body = {
        event_name: formData.get('event_name') as string,
        description: formData.get('description') as string,
        tos_text: formData.get('tos_text') as string,
        location_lat: formData.get('location_lat'),
        location_long: formData.get('location_long'),
        location_name: formData.get('location_name') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
        food_enabled: formData.get('food_enabled'),
        food_multi_select: formData.get('food_multi_select'),
        food_options: formData.get('food_options') as string,
        status: formData.get('status') as string,
      }
      bannerFile = formData.get('banner') as File | null
    } else {
      body = await c.req.json()
    }

    // Validate required fields
    if (!body.event_name || !body.start_time || !body.end_time) {
      return c.json({ message: 'event_name, start_time, and end_time are required' }, 400)
    }

    const uuid = crypto.randomUUID()
    const now = new Date().toISOString()
    let bannerFilename: string | null = null

    // Upload banner if present
    if (bannerFile && bannerFile.size > 0) {
      const uploadService = new UploadService(c.env.BUCKET)
      const result = await uploadService.uploadEventBanner(uuid, bannerFile)
      bannerFilename = result.path
    }

    await c.env.DB.prepare(
      `INSERT INTO events
       (event_uuid, creator_uuid, event_name, description, banner_filename, tos_text,
        location_lat, location_long, location_name, start_time, end_time,
        food_enabled, food_multi_select, food_options, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      uuid,
      user.sub,
      body.event_name,
      body.description || null,
      bannerFilename,
      body.tos_text || null,
      body.location_lat ? parseFloat(body.location_lat) : null,
      body.location_long ? parseFloat(body.location_long) : null,
      body.location_name || null,
      body.start_time,
      body.end_time,
      body.food_enabled === '0' || body.food_enabled === false ? 0 : (body.food_enabled ? 1 : 0),
      body.food_multi_select === '0' || body.food_multi_select === false ? 0 : (body.food_multi_select ? 1 : 0),
      body.food_options || '[]',
      body.status || 'draft',
      now,
      now,
    ).run()

    // Auto-add creator as ADMIN in event_permissions
    await c.env.DB.prepare(
      `INSERT INTO event_permissions (permission_uuid, event_uuid, user_uuid, role, granted_by, created_at)
       VALUES (?, ?, ?, 'ADMIN', ?, ?)`
    ).bind(crypto.randomUUID(), uuid, user.sub, user.sub, now).run()

    return c.json({
      message: 'Event created',
      event: { event_uuid: uuid, event_name: body.event_name, status: body.status || 'draft' },
    }, 201)
  } catch (e: any) {
    if (e instanceof UploadError) {
      return c.json({ message: e.message }, e.status as 400 | 413 | 415)
    }
    console.error('Create event error:', e)
    return c.json({ message: 'Failed to create event', error: e.message }, 500)
  }
})

/**
 * PUT /events/:eventId
 * Update an event. Admin only for this event.
 */
events.put('/:eventId', authMiddleware, eventPermission('eventId'), requireEventAdmin, async (c) => {
  try {
    const eventId = c.req.param('eventId')
    const contentType = c.req.header('Content-Type') || ''

    let body: Record<string, any> = {}
    let bannerFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData()
      body = Object.fromEntries(formData.entries())
      bannerFile = formData.get('banner') as File | null
    } else {
      body = await c.req.json()
    }

    const existing = await c.env.DB.prepare(
      'SELECT * FROM events WHERE event_uuid = ?'
    ).bind(eventId).first() as EventRow | null

    if (!existing) return c.json({ message: 'Event not found' }, 404)

    // Build dynamic update
    const updates: string[] = []
    const values: any[] = []

    const stringFields = ['event_name', 'description', 'tos_text', 'location_name', 'start_time', 'end_time', 'food_options', 'status', 'sales_status']
    for (const f of stringFields) {
      if (body[f] !== undefined) {
        updates.push(`${f} = ?`)
        values.push(body[f])
      }
    }

    // Handle nullable datetime fields for sales timing
    if (body.sales_open_time !== undefined) {
      updates.push('sales_open_time = ?')
      values.push(body.sales_open_time || null)
    }
    if (body.sales_close_time !== undefined) {
      updates.push('sales_close_time = ?')
      values.push(body.sales_close_time || null)
    }

    if (body.location_lat !== undefined) { updates.push('location_lat = ?'); values.push(parseFloat(body.location_lat)) }
    if (body.location_long !== undefined) { updates.push('location_long = ?'); values.push(parseFloat(body.location_long)) }
    if (body.food_enabled !== undefined) { updates.push('food_enabled = ?'); values.push(body.food_enabled === '0' || body.food_enabled === false ? 0 : 1) }
    if (body.food_multi_select !== undefined) { updates.push('food_multi_select = ?'); values.push(body.food_multi_select === '0' || body.food_multi_select === false ? 0 : 1) }

    // Handle banner upload
    if (bannerFile && bannerFile.size > 0) {
      const uploadService = new UploadService(c.env.BUCKET)
      // Delete old banner
      if (existing.banner_filename) {
        await uploadService.deleteFile(existing.banner_filename).catch(() => {})
      }
      const result = await uploadService.uploadEventBanner(eventId, bannerFile)
      updates.push('banner_filename = ?')
      values.push(result.path)
    }

    if (updates.length === 0) {
      return c.json({ message: 'No fields to update' }, 400)
    }

    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(eventId)

    await c.env.DB.prepare(
      `UPDATE events SET ${updates.join(', ')} WHERE event_uuid = ?`
    ).bind(...values).run()

    return c.json({ message: 'Event updated' })
  } catch (e: any) {
    if (e instanceof UploadError) return c.json({ message: e.message }, e.status as 400 | 413 | 415)
    console.error('Update event error:', e)
    return c.json({ message: 'Failed to update event', error: e.message }, 500)
  }
})

/**
 * DELETE /events/:eventId
 * Delete an event. Admin only. Cascades to all related data.
 */
events.delete('/:eventId', authMiddleware, eventPermission('eventId'), requireEventAdmin, async (c) => {
  const eventId = c.req.param('eventId')

  const existing = await c.env.DB.prepare(
    'SELECT event_uuid, banner_filename FROM events WHERE event_uuid = ?'
  ).bind(eventId).first() as EventRow | null

  if (!existing) return c.json({ message: 'Event not found' }, 404)

  // Delete banner from R2
  if (existing.banner_filename) {
    const uploadService = new UploadService(c.env.BUCKET)
    await uploadService.deleteFile(existing.banner_filename).catch(() => {})
  }

  // Cascade delete handled by FK constraints
  await c.env.DB.prepare('DELETE FROM events WHERE event_uuid = ?').bind(eventId).run()

  return c.json({ message: 'Event deleted' })
})

/**
 * PATCH /events/:eventId/status
 * Change event status (draft → published → closed). Admin only.
 */
events.patch('/:eventId/status', authMiddleware, eventPermission('eventId'), requireEventAdmin, async (c) => {
  const eventId = c.req.param('eventId')
  const { status } = await c.req.json()

  if (!['draft', 'published', 'closed'].includes(status)) {
    return c.json({ message: 'Invalid status. Must be: draft, published, closed' }, 400)
  }

  await c.env.DB.prepare(
    'UPDATE events SET status = ?, updated_at = ? WHERE event_uuid = ?'
  ).bind(status, new Date().toISOString(), eventId).run()

  return c.json({ message: `Event status changed to ${status}` })
})

export { events }
