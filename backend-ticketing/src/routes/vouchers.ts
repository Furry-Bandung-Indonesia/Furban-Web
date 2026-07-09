/**
 * Voucher Routes
 *
 * Provides per-event discount voucher management for admins
 * and a public validate endpoint for users at checkout.
 *
 * Public (mounted at /api):
 *   POST /events/:eventId/vouchers/validate  — validate code, preview discount
 *
 * Admin (mounted at /api/manage):
 *   GET    /:eventId/vouchers                        — list vouchers (ADMIN + HOST read-only)
 *   POST   /:eventId/vouchers                        — create voucher (ADMIN only)
 *   PATCH  /:eventId/vouchers/:voucherId             — edit voucher (ADMIN only)
 *   DELETE /:eventId/vouchers/:voucherId             — delete voucher (ADMIN only, 0 uses)
 *   GET    /:eventId/vouchers/:voucherId/usages      — usage details (ADMIN only)
 */
import { Hono } from 'hono'
import type { Bindings, Variables, JWTPayload, VoucherRow, TierRow } from '../types'
import { authMiddleware, eventPermission, requireEventAdmin } from '../middleware/auth'

const vouchers = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ═══════════════════════════════════════════════════
// HELPER: compute discount amount from voucher + subtotal
// ═══════════════════════════════════════════════════
function computeDiscount(voucher: VoucherRow, subtotal: number): number {
  if (voucher.discount_type === 'fixed') {
    return Math.min(voucher.discount_value, subtotal)
  }
  // percent
  return Math.floor((voucher.discount_value / 100) * subtotal)
}

// ═══════════════════════════════════════════════════
// PUBLIC: Validate a voucher code (does NOT consume it)
// POST /events/:eventId/vouchers/validate
// ═══════════════════════════════════════════════════
vouchers.post('/events/:eventId/vouchers/validate', authMiddleware, async (c) => {
  const eventId = c.req.param('eventId')
  const body = await c.req.json()
  const { code, tier_uuid } = body

  if (!code || !tier_uuid) {
    return c.json({ message: 'code and tier_uuid are required' }, 400)
  }

  // Fetch tier for price base
  const tier = await c.env.DB.prepare(
    'SELECT * FROM ticket_tiers WHERE tier_uuid = ? AND event_uuid = ?'
  ).bind(tier_uuid, eventId).first() as TierRow | null

  if (!tier) {
    return c.json({ message: 'Ticket tier not found' }, 404)
  }

  // Lookup voucher (case-insensitive)
  const voucher = await c.env.DB.prepare(
    `SELECT * FROM event_vouchers
     WHERE event_uuid = ? AND UPPER(code) = UPPER(?) AND is_active = 1`
  ).bind(eventId, code.trim()).first() as VoucherRow | null

  if (!voucher) {
    return c.json({ message: 'Voucher not found or inactive' }, 404)
  }

  if (voucher.uses_count >= voucher.max_uses) {
    return c.json({ message: 'This voucher has already been fully redeemed' }, 400)
  }

  // Compute discount on base tier price only for preview
  // (food/drink not selected yet at this stage)
  const subtotal = tier.price_total
  const discountAmount = computeDiscount(voucher, subtotal)
  const finalPrice = Math.max(0, subtotal - discountAmount)

  return c.json({
    voucher_uuid: voucher.voucher_uuid,
    code: voucher.code,
    discount_type: voucher.discount_type,
    discount_value: voucher.discount_value,
    discount_amount: discountAmount,
    original_price: subtotal,
    final_price: finalPrice,
  })
})

// ═══════════════════════════════════════════════════
// ADMIN: All manage routes require auth + event permission
// ═══════════════════════════════════════════════════

/**
 * GET /manage/:eventId/vouchers
 * List all vouchers for the event.
 * Accessible by ADMIN and HOST (read-only on the frontend).
 */
vouchers.get('/:eventId/vouchers', authMiddleware, eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM event_vouchers WHERE event_uuid = ? ORDER BY created_at DESC`
  ).bind(eventId).all()

  return c.json({ vouchers: results || [] })
})

/**
 * POST /manage/:eventId/vouchers
 * Create a new voucher. ADMIN only.
 *
 * Body: { code, discount_type, discount_value, max_uses, is_active? }
 */
vouchers.post('/:eventId/vouchers', authMiddleware, eventPermission('eventId'), requireEventAdmin, async (c) => {
  const user = c.get('user') as JWTPayload
  const eventId = c.req.param('eventId')
  const body = await c.req.json()

  const { code, discount_type, discount_value, max_uses, is_active = 1 } = body

  if (!code || !discount_type || discount_value == null || max_uses == null) {
    return c.json({ message: 'code, discount_type, discount_value, and max_uses are required' }, 400)
  }

  if (!['fixed', 'percent'].includes(discount_type)) {
    return c.json({ message: 'discount_type must be "fixed" or "percent"' }, 400)
  }

  const parsedValue = Number(discount_value)
  if (isNaN(parsedValue) || parsedValue <= 0) {
    return c.json({ message: 'discount_value must be a positive number' }, 400)
  }

  if (discount_type === 'percent' && parsedValue > 100) {
    return c.json({ message: 'Percent discount cannot exceed 100' }, 400)
  }

  const parsedMaxUses = parseInt(max_uses, 10)
  if (isNaN(parsedMaxUses) || parsedMaxUses < 1) {
    return c.json({ message: 'max_uses must be at least 1' }, 400)
  }

  // Check for duplicate code in this event (case-insensitive)
  const existing = await c.env.DB.prepare(
    'SELECT voucher_uuid FROM event_vouchers WHERE event_uuid = ? AND UPPER(code) = UPPER(?)'
  ).bind(eventId, code.trim()).first()

  if (existing) {
    return c.json({ message: 'A voucher with this code already exists for this event' }, 409)
  }

  const voucherUuid = crypto.randomUUID()
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `INSERT INTO event_vouchers
     (voucher_uuid, event_uuid, code, discount_type, discount_value, max_uses, uses_count, is_active, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
  ).bind(
    voucherUuid, eventId,
    code.trim().toUpperCase(),
    discount_type, parsedValue, parsedMaxUses,
    is_active ? 1 : 0,
    user.sub, now, now,
  ).run()

  const created = await c.env.DB.prepare(
    'SELECT * FROM event_vouchers WHERE voucher_uuid = ?'
  ).bind(voucherUuid).first()

  return c.json({ message: 'Voucher created', voucher: created }, 201)
})

/**
 * PATCH /manage/:eventId/vouchers/:voucherId
 * Edit a voucher. ADMIN only.
 * Editable fields: code, discount_type, discount_value, max_uses, is_active.
 */
vouchers.patch('/:eventId/vouchers/:voucherId', authMiddleware, eventPermission('eventId'), requireEventAdmin, async (c) => {
  const eventId = c.req.param('eventId')
  const voucherId = c.req.param('voucherId')
  const body = await c.req.json()

  const voucher = await c.env.DB.prepare(
    'SELECT * FROM event_vouchers WHERE voucher_uuid = ? AND event_uuid = ?'
  ).bind(voucherId, eventId).first() as VoucherRow | null

  if (!voucher) return c.json({ message: 'Voucher not found' }, 404)

  const updates: string[] = []
  const params: any[] = []

  if (body.code !== undefined) {
    const newCode = body.code.trim().toUpperCase()
    // Check duplicate (exclude self)
    const dup = await c.env.DB.prepare(
      'SELECT voucher_uuid FROM event_vouchers WHERE event_uuid = ? AND UPPER(code) = UPPER(?) AND voucher_uuid != ?'
    ).bind(eventId, newCode, voucherId).first()
    if (dup) return c.json({ message: 'A voucher with this code already exists' }, 409)
    updates.push('code = ?'); params.push(newCode)
  }

  if (body.discount_type !== undefined) {
    if (!['fixed', 'percent'].includes(body.discount_type)) {
      return c.json({ message: 'discount_type must be "fixed" or "percent"' }, 400)
    }
    updates.push('discount_type = ?'); params.push(body.discount_type)
  }

  if (body.discount_value !== undefined) {
    const val = Number(body.discount_value)
    if (isNaN(val) || val <= 0) return c.json({ message: 'discount_value must be positive' }, 400)
    const effectiveType = body.discount_type ?? voucher.discount_type
    if (effectiveType === 'percent' && val > 100) {
      return c.json({ message: 'Percent discount cannot exceed 100' }, 400)
    }
    updates.push('discount_value = ?'); params.push(val)
  }

  if (body.max_uses !== undefined) {
    const val = parseInt(body.max_uses, 10)
    if (isNaN(val) || val < 1) return c.json({ message: 'max_uses must be at least 1' }, 400)
    if (val < voucher.uses_count) {
      return c.json({ message: `max_uses cannot be less than current uses (${voucher.uses_count})` }, 400)
    }
    updates.push('max_uses = ?'); params.push(val)
  }

  if (body.is_active !== undefined) {
    updates.push('is_active = ?'); params.push(body.is_active ? 1 : 0)
  }

  if (updates.length === 0) {
    return c.json({ message: 'No fields to update' }, 400)
  }

  const now = new Date().toISOString()
  updates.push('updated_at = ?'); params.push(now)
  params.push(voucherId)

  await c.env.DB.prepare(
    `UPDATE event_vouchers SET ${updates.join(', ')} WHERE voucher_uuid = ?`
  ).bind(...params).run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM event_vouchers WHERE voucher_uuid = ?'
  ).bind(voucherId).first()

  return c.json({ message: 'Voucher updated', voucher: updated })
})

/**
 * DELETE /manage/:eventId/vouchers/:voucherId
 * Delete a voucher. ADMIN only.
 * Blocked if the voucher has existing uses (uses_count > 0).
 */
vouchers.delete('/:eventId/vouchers/:voucherId', authMiddleware, eventPermission('eventId'), requireEventAdmin, async (c) => {
  const eventId = c.req.param('eventId')
  const voucherId = c.req.param('voucherId')

  const voucher = await c.env.DB.prepare(
    'SELECT * FROM event_vouchers WHERE voucher_uuid = ? AND event_uuid = ?'
  ).bind(voucherId, eventId).first() as VoucherRow | null

  if (!voucher) return c.json({ message: 'Voucher not found' }, 404)

  if (voucher.uses_count > 0) {
    return c.json({
      message: `Cannot delete voucher with existing uses (${voucher.uses_count} redemptions). Disable it instead.`
    }, 400)
  }

  await c.env.DB.prepare(
    'DELETE FROM event_vouchers WHERE voucher_uuid = ?'
  ).bind(voucherId).run()

  return c.json({ message: 'Voucher deleted' })
})

/**
 * GET /manage/:eventId/vouchers/:voucherId/usages
 * Get the list of tickets that used this voucher.
 * ADMIN only.
 */
vouchers.get('/:eventId/vouchers/:voucherId/usages', authMiddleware, eventPermission('eventId'), requireEventAdmin, async (c) => {
  const eventId = c.req.param('eventId')
  const voucherId = c.req.param('voucherId')

  const voucher = await c.env.DB.prepare(
    'SELECT voucher_uuid, code FROM event_vouchers WHERE voucher_uuid = ? AND event_uuid = ?'
  ).bind(voucherId, eventId).first()

  if (!voucher) return c.json({ message: 'Voucher not found' }, 404)

  const { results } = await c.env.DB.prepare(
    `SELECT
       t.ticket_uuid, t.ticket_number, t.first_name, t.last_name, t.nickname,
       t.purchase_status, t.discount_amount, t.created_at,
       tt.tier_name
     FROM tickets t
     JOIN ticket_tiers tt ON t.tier_uuid = tt.tier_uuid
     WHERE t.voucher_uuid = ? AND t.event_uuid = ?
     ORDER BY t.created_at DESC`
  ).bind(voucherId, eventId).all()

  return c.json({
    voucher,
    usages: results || [],
    total: (results || []).length,
  })
})

export { vouchers }
