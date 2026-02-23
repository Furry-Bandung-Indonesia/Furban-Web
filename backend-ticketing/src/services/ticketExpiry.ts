/**
 * Ticket Expiry Service
 *
 * Shared helper for expiring stale tickets (claim_expiry passed).
 * Used lazily at key request entry points to avoid cron CPU cost.
 *
 * Trigger points:
 *   - Public event detail (GET /events/:id) → before returning tiers
 *   - Ticket claim (POST /events/:id/claim) → before checking quota
 *   - Payment generate (POST /payment/generate) → before creating transaction
 *   - Payment status check → when gateway says expired
 *   - Payment callback → when gateway says expired
 */
import { KVService } from './kv'

/**
 * Expire all stale under_payment tickets for a given event.
 * Restores quota, updates purchase_log, cleans KV holds.
 *
 * This is cheap: a single SELECT + N small updates (N is usually 0-2).
 * Only runs the SELECT; if no stale tickets exist, cost is ~1 D1 read.
 */
export async function expireStaleTickets(
  db: D1Database,
  kv: KVNamespace,
  eventUuid: string,
): Promise<number> {
  const now = new Date().toISOString()

  const { results: stale } = await db.prepare(
    `SELECT ticket_uuid, tier_uuid, user_uuid, event_uuid
     FROM tickets
     WHERE event_uuid = ?
       AND purchase_status = 'under_payment'
       AND claim_expiry IS NOT NULL
       AND claim_expiry < ?`
  ).bind(eventUuid, now).all()

  if (!stale || stale.length === 0) return 0

  const kvService = new KVService(kv)

  for (const t of stale as any[]) {
    // Update ticket status
    await db.prepare(
      `UPDATE tickets SET purchase_status = 'expired', updated_at = ? WHERE ticket_uuid = ?`
    ).bind(now, t.ticket_uuid).run()

    // Restore tier quota
    await db.prepare(
      'UPDATE ticket_tiers SET quota_available = quota_available + 1, updated_at = ? WHERE tier_uuid = ?'
    ).bind(now, t.tier_uuid).run()

    // Update purchase log
    await db.prepare(
      `UPDATE purchase_log SET payment_status = 'expired', updated_at = ? WHERE ticket_uuid = ?`
    ).bind(now, t.ticket_uuid).run()

    // Expire any pending payment transactions
    await db.prepare(
      `UPDATE payment_transactions SET status = 'expired', updated_at = ? WHERE ticket_uuid = ? AND status = 'pending'`
    ).bind(now, t.ticket_uuid).run()

    // Clean KV holds
    await kvService.deleteClaimHold(t.user_uuid, t.event_uuid)
    await kvService.deletePaymentLock(t.ticket_uuid)
  }

  return stale.length
}

/**
 * Expire a single ticket by UUID (used when payment gateway reports expired).
 */
export async function expireSingleTicket(
  db: D1Database,
  kv: KVNamespace,
  ticketUuid: string,
): Promise<boolean> {
  const now = new Date().toISOString()

  const ticket = await db.prepare(
    `SELECT ticket_uuid, tier_uuid, user_uuid, event_uuid
     FROM tickets WHERE ticket_uuid = ? AND purchase_status = 'under_payment'`
  ).bind(ticketUuid).first() as any

  if (!ticket) return false

  await db.prepare(
    `UPDATE tickets SET purchase_status = 'expired', updated_at = ? WHERE ticket_uuid = ?`
  ).bind(now, ticket.ticket_uuid).run()

  await db.prepare(
    'UPDATE ticket_tiers SET quota_available = quota_available + 1, updated_at = ? WHERE tier_uuid = ?'
  ).bind(now, ticket.tier_uuid).run()

  await db.prepare(
    `UPDATE purchase_log SET payment_status = 'expired', updated_at = ? WHERE ticket_uuid = ?`
  ).bind(now, ticket.ticket_uuid).run()

  const kvService = new KVService(kv)
  await kvService.deleteClaimHold(ticket.user_uuid, ticket.event_uuid)
  await kvService.deletePaymentLock(ticket.ticket_uuid)

  return true
}
