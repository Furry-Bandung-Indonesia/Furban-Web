/**
 * Revenue Routes
 *
 * Revenue dashboard with per-tier and per-event breakdown.
 * Admin sees admin_fee; Host sees only disbursement.
 */
import { Hono } from 'hono'
import type { Bindings, Variables, JWTPayload } from '../types'
import { authMiddleware, eventPermission } from '../middleware/auth'

const revenue = new Hono<{ Bindings: Bindings; Variables: Variables }>()

revenue.use('*', authMiddleware)

/**
 * GET /manage/:eventId/revenue
 * Revenue breakdown for an event.
 *
 * Formulas:
 *   tickets_sold      = COUNT(tickets WHERE tier_uuid AND purchase_status = 'paid')
 *   total_revenue     = tickets_sold × price_total
 *   total_admin_fee   = tickets_sold × admin_fee_internal  (ADMIN only)
 *   total_disbursement = total_revenue - total_admin_fee
 */
revenue.get('/:eventId/revenue', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const eventRole = c.get('eventRole') as string
  const isAdmin = eventRole === 'ADMIN'

  // Per-tier revenue
  const { results: tierRevenue } = await c.env.DB.prepare(`
    SELECT
      tt.tier_uuid,
      tt.tier_name,
      tt.price_total,
      tt.admin_fee_internal,
      tt.quota_total,
      tt.quota_available,
      COUNT(t.ticket_uuid) as tickets_sold,
      COALESCE(SUM(CASE WHEN t.purchase_status = 'paid' THEN tt.price_total ELSE 0 END), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN t.purchase_status = 'paid' THEN tt.admin_fee_internal ELSE 0 END), 0) as total_admin_fee,
      COALESCE(SUM(CASE WHEN t.purchase_status = 'paid' THEN (tt.price_total - tt.admin_fee_internal) ELSE 0 END), 0) as total_disbursement
    FROM ticket_tiers tt
    LEFT JOIN tickets t ON tt.tier_uuid = t.tier_uuid AND t.purchase_status = 'paid'
    WHERE tt.event_uuid = ?
    GROUP BY tt.tier_uuid, tt.tier_name, tt.price_total, tt.admin_fee_internal, tt.quota_total, tt.quota_available
    ORDER BY tt.sort_order ASC
  `).bind(eventId).all()

  // Event totals
  const eventTotals = await c.env.DB.prepare(`
    SELECT
      COALESCE(SUM(tt.price_total), 0) as event_revenue,
      COALESCE(SUM(tt.admin_fee_internal), 0) as event_admin_fee,
      COALESCE(SUM(tt.price_total - tt.admin_fee_internal), 0) as event_disbursement,
      COUNT(*) as total_tickets_sold
    FROM tickets t
    JOIN ticket_tiers tt ON t.tier_uuid = tt.tier_uuid
    WHERE t.event_uuid = ? AND t.purchase_status = 'paid'
  `).bind(eventId).first()

  // Status breakdown
  const statusBreakdown = await c.env.DB.prepare(`
    SELECT
      purchase_status,
      COUNT(*) as count
    FROM tickets
    WHERE event_uuid = ?
    GROUP BY purchase_status
  `).bind(eventId).all()

  // Build response — hide admin_fee fields from HOST
  const tiers = (tierRevenue || []).map((tier: any) => {
    const base: Record<string, any> = {
      tier_uuid: tier.tier_uuid,
      tier_name: tier.tier_name,
      price_total: tier.price_total,
      quota_total: tier.quota_total,
      quota_available: tier.quota_available,
      tickets_sold: tier.tickets_sold,
      total_revenue: tier.total_revenue,
      total_disbursement: tier.total_disbursement,
    }
    if (isAdmin) {
      base.admin_fee_internal = tier.admin_fee_internal
      base.total_admin_fee = tier.total_admin_fee
    }
    return base
  })

  const summary: Record<string, any> = {
    event_revenue: (eventTotals as any)?.event_revenue || 0,
    event_disbursement: (eventTotals as any)?.event_disbursement || 0,
    total_tickets_sold: (eventTotals as any)?.total_tickets_sold || 0,
  }
  if (isAdmin) {
    summary.event_admin_fee = (eventTotals as any)?.event_admin_fee || 0
  }

  return c.json({
    summary,
    tiers,
    status_breakdown: statusBreakdown?.results || [],
  })
})

export { revenue }
