/**
 * Manage Routes
 *
 * Admin/Host event management dashboard.
 * Lists events that the current user can manage.
 */
import { Hono } from 'hono'
import type { Bindings, Variables, JWTPayload, EventRow } from '../types'
import { authMiddleware } from '../middleware/auth'

const manage = new Hono<{ Bindings: Bindings; Variables: Variables }>()

manage.use('*', authMiddleware)

/**
 * GET /manage
 * Event dashboard — list events the current user can manage.
 * Platform admin sees ALL events.
 * Hosts see only events they have permission for.
 */
manage.get('/', async (c) => {
  const user = c.get('user') as JWTPayload
  const userRoles = user.role ? user.role.split(',').map(r => r.trim()) : []
  const isAdmin = userRoles.includes('admin')

  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100)
  const offset = (page - 1) * limit
  const status = c.req.query('status')  // draft, published, closed

  let query: string
  const params: any[] = []

  if (isAdmin) {
    // Admin sees all events
    query = `SELECT e.*, 'ADMIN' as user_event_role FROM events e`
    if (status) {
      query += ` WHERE e.status = ?`
      params.push(status)
    }
  } else {
    // Non-admin: see events where they are creator or have permissions
    query = `
      SELECT e.*,
             COALESCE(ep.role, CASE WHEN e.creator_uuid = ? THEN 'ADMIN' ELSE NULL END) as user_event_role
      FROM events e
      LEFT JOIN event_permissions ep ON e.event_uuid = ep.event_uuid AND ep.user_uuid = ?
      WHERE (ep.user_uuid IS NOT NULL OR e.creator_uuid = ?)`
    params.push(user.sub, user.sub, user.sub)
    if (status) {
      query += ` AND e.status = ?`
      params.push(status)
    }
  }

  query += ` ORDER BY e.created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  // Add ticket stats per event
  const eventsWithStats = await Promise.all(
    (results || []).map(async (event: any) => {
      const stats = await c.env.DB.prepare(`
        SELECT
          COUNT(*) as total_tickets,
          SUM(CASE WHEN purchase_status = 'paid' THEN 1 ELSE 0 END) as paid_tickets,
          SUM(CASE WHEN is_redeemed = 1 THEN 1 ELSE 0 END) as redeemed_tickets
        FROM tickets WHERE event_uuid = ?
      `).bind(event.event_uuid).first()

      // Get total quota from tiers
      const quotaRow = await c.env.DB.prepare(
        'SELECT COALESCE(SUM(quota_total), 0) as quota_total FROM ticket_tiers WHERE event_uuid = ?'
      ).bind(event.event_uuid).first() as { quota_total: number } | null

      return { ...event, stats: { ...stats, quota_total: quotaRow?.quota_total || 0 } }
    })
  )

  return c.json({
    events: eventsWithStats,
    pagination: { page, limit },
  })
})

/**
 * GET /manage/:eventId
 * Get full event detail for management (includes all tiers, stats).
 */
manage.get('/:eventId', async (c) => {
  const user = c.get('user') as JWTPayload
  const eventId = c.req.param('eventId')
  const userRoles = user.role ? user.role.split(',').map(r => r.trim()) : []
  const isAdmin = userRoles.includes('admin')

  const event = await c.env.DB.prepare(
    'SELECT * FROM events WHERE event_uuid = ?'
  ).bind(eventId).first() as EventRow | null

  if (!event) return c.json({ message: 'Event not found' }, 404)

  // Check access
  let userEventRole: string | null = null

  if (isAdmin) {
    userEventRole = 'ADMIN'
  } else {
    const perm = await c.env.DB.prepare(
      'SELECT role FROM event_permissions WHERE event_uuid = ? AND user_uuid = ?'
    ).bind(eventId, user.sub).first() as { role: string } | null

    if (perm) {
      userEventRole = perm.role
    } else if (event.creator_uuid === user.sub) {
      userEventRole = 'ADMIN'
    } else {
      return c.json({ message: 'Forbidden' }, 403)
    }
  }

  // Get tiers (admin sees admin_fee_internal)
  let tierQuery = 'SELECT * FROM ticket_tiers WHERE event_uuid = ? ORDER BY sort_order ASC'
  const { results: tiers } = await c.env.DB.prepare(tierQuery).bind(eventId).all()

  // Strip admin_fee_internal for non-admin
  const sanitizedTiers = isAdmin
    ? tiers
    : (tiers || []).map((t: any) => {
        const { admin_fee_internal, ...rest } = t
        return rest
      })

  // Get stats
  const stats = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total_tickets,
      SUM(CASE WHEN purchase_status = 'paid' THEN 1 ELSE 0 END) as paid_tickets,
      SUM(CASE WHEN purchase_status = 'under_payment' THEN 1 ELSE 0 END) as pending_tickets,
      SUM(CASE WHEN is_redeemed = 1 THEN 1 ELSE 0 END) as redeemed_tickets
    FROM tickets WHERE event_uuid = ?
  `).bind(eventId).first()

  // Get permissions count
  const permCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM event_permissions WHERE event_uuid = ?'
  ).bind(eventId).first() as { count: number } | null

  return c.json({
    ...event,
    food_options: JSON.parse(event.food_options || '[]'),
    tiers: sanitizedTiers || [],
    stats,
    hosts_count: permCount?.count || 0,
    user_event_role: userEventRole,
  })
})

export { manage }
