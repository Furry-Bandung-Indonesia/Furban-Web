/**
 * Ticket Tiers Routes
 *
 * CRUD for ticket tiers within an event.
 * All routes require event ADMIN permission.
 */
import { Hono } from 'hono'
import type { Bindings, Variables, TierRow, JWTPayload } from '../types'
import { authMiddleware, eventPermission, requireEventAdmin } from '../middleware/auth'

const tiers = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// All tier management requires auth + event admin
tiers.use('*', authMiddleware)

/**
 * GET /events/:eventId/tiers
 * List all tiers for an event.
 * Admin/Host see admin_fee_internal; public does not (handled in events route).
 */
tiers.get('/:eventId/tiers', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const eventRole = c.get('eventRole')

  let query: string
  if (eventRole === 'ADMIN') {
    // Admin sees admin_fee_internal
    query = `SELECT * FROM ticket_tiers WHERE event_uuid = ? ORDER BY sort_order ASC`
  } else {
    // Host sees everything except admin_fee_internal
    query = `SELECT tier_uuid, event_uuid, tier_name, tier_description,
                    price_total, quota_total, quota_available, sort_order,
                    created_at, updated_at
             FROM ticket_tiers WHERE event_uuid = ? ORDER BY sort_order ASC`
  }

  const { results } = await c.env.DB.prepare(query).bind(eventId).all()
  return c.json(results || [])
})

/**
 * POST /events/:eventId/tiers
 * Create a new tier. Admin only.
 */
tiers.post('/:eventId/tiers', eventPermission('eventId'), requireEventAdmin, async (c) => {
  const eventId = c.req.param('eventId')
  const body = await c.req.json()

  if (!body.tier_name || body.price_total === undefined || body.quota_total === undefined) {
    return c.json({ message: 'tier_name, price_total, and quota_total are required' }, 400)
  }

  if (body.price_total < 0 || body.quota_total < 1) {
    return c.json({ message: 'price_total must be >= 0 and quota_total >= 1' }, 400)
  }

  const uuid = crypto.randomUUID()
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `INSERT INTO ticket_tiers
     (tier_uuid, event_uuid, tier_name, tier_description, price_total, admin_fee_internal,
      quota_total, quota_available, sort_order, name_your_price, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    uuid,
    eventId,
    body.tier_name,
    body.tier_description || null,
    body.price_total,
    body.admin_fee_internal || 0,
    body.quota_total,
    body.quota_total, // quota_available starts = quota_total
    body.sort_order || 0,
    body.name_your_price ? 1 : 0,
    now,
    now,
  ).run()

  return c.json({
    message: 'Tier created',
    tier: { tier_uuid: uuid, tier_name: body.tier_name },
  }, 201)
})

/**
 * PUT /events/:eventId/tiers/:tierId
 * Update a tier. Admin only.
 * Cannot change quota_total below already-sold tickets.
 */
tiers.put('/:eventId/tiers/:tierId', eventPermission('eventId'), requireEventAdmin, async (c) => {
  const eventId = c.req.param('eventId')
  const tierId = c.req.param('tierId')
  const body = await c.req.json()

  const existing = await c.env.DB.prepare(
    'SELECT * FROM ticket_tiers WHERE tier_uuid = ? AND event_uuid = ?'
  ).bind(tierId, eventId).first() as TierRow | null

  if (!existing) return c.json({ message: 'Tier not found' }, 404)

  const updates: string[] = []
  const values: any[] = []

  if (body.tier_name !== undefined) { updates.push('tier_name = ?'); values.push(body.tier_name) }
  if (body.tier_description !== undefined) { updates.push('tier_description = ?'); values.push(body.tier_description) }
  if (body.price_total !== undefined) { updates.push('price_total = ?'); values.push(body.price_total) }
  if (body.admin_fee_internal !== undefined) { updates.push('admin_fee_internal = ?'); values.push(body.admin_fee_internal) }
  if (body.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(body.sort_order) }
  if (body.name_your_price !== undefined) { updates.push('name_your_price = ?'); values.push(body.name_your_price ? 1 : 0) }

  // Handle quota change: adjust quota_available by the delta
  if (body.quota_total !== undefined) {
    const sold = existing.quota_total - existing.quota_available
    if (body.quota_total < sold) {
      return c.json({
        message: `Cannot reduce quota below sold count (${sold} tickets already sold)`,
      }, 400)
    }
    updates.push('quota_total = ?')
    values.push(body.quota_total)
    updates.push('quota_available = ?')
    values.push(body.quota_total - sold)
  }

  if (updates.length === 0) return c.json({ message: 'No fields to update' }, 400)

  updates.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(tierId)
  values.push(eventId)

  await c.env.DB.prepare(
    `UPDATE ticket_tiers SET ${updates.join(', ')} WHERE tier_uuid = ? AND event_uuid = ?`
  ).bind(...values).run()

  return c.json({ message: 'Tier updated' })
})

/**
 * DELETE /events/:eventId/tiers/:tierId
 * Delete a tier. Admin only. Cannot delete if tickets have been sold.
 */
tiers.delete('/:eventId/tiers/:tierId', eventPermission('eventId'), requireEventAdmin, async (c) => {
  const eventId = c.req.param('eventId')
  const tierId = c.req.param('tierId')

  // Check if any tickets exist for this tier
  const ticketCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM tickets WHERE tier_uuid = ? AND purchase_status = 'paid'`
  ).bind(tierId).first() as { count: number } | null

  if (ticketCount && ticketCount.count > 0) {
    return c.json({
      message: `Cannot delete tier with ${ticketCount.count} paid ticket(s). Close or refund first.`,
    }, 400)
  }

  await c.env.DB.prepare(
    'DELETE FROM ticket_tiers WHERE tier_uuid = ? AND event_uuid = ?'
  ).bind(tierId, eventId).run()

  return c.json({ message: 'Tier deleted' })
})

export { tiers }
