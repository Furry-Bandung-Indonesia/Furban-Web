/**
 * KV Helper Service
 *
 * Centralized KV key patterns and operations for the ticketing system.
 *
 * Key Patterns:
 *   claim:{user_uuid}:{event_uuid}     TTL 600s — claim hold
 *   payment_lock:{ticket_uuid}         TTL 600s — payment lock
 *   mod_cache:{event_uuid}             TTL 300s — moderation list cache
 *   rate:{user_uuid}:claim             TTL 60s  — rate limit
 *   ticket_seq:{event_uuid}            persistent — ticket sequence counter
 */
import type { ClaimHold } from '../types'

export class KVService {
  constructor(private kv: KVNamespace) {}

  // ─── Claim Hold ──────────────────────────────────

  async setClaimHold(userUuid: string, eventUuid: string, hold: ClaimHold): Promise<void> {
    const key = `claim:${userUuid}:${eventUuid}`
    await this.kv.put(key, JSON.stringify(hold), { expirationTtl: 600 })
  }

  async getClaimHold(userUuid: string, eventUuid: string): Promise<ClaimHold | null> {
    const key = `claim:${userUuid}:${eventUuid}`
    const val = await this.kv.get(key)
    return val ? JSON.parse(val) : null
  }

  async deleteClaimHold(userUuid: string, eventUuid: string): Promise<void> {
    const key = `claim:${userUuid}:${eventUuid}`
    await this.kv.delete(key)
  }

  // ─── Payment Lock ────────────────────────────────

  async setPaymentLock(ticketUuid: string): Promise<void> {
    const key = `payment_lock:${ticketUuid}`
    await this.kv.put(key, '1', { expirationTtl: 600 })
  }

  async getPaymentLock(ticketUuid: string): Promise<boolean> {
    const key = `payment_lock:${ticketUuid}`
    const val = await this.kv.get(key)
    return val === '1'
  }

  async deletePaymentLock(ticketUuid: string): Promise<void> {
    const key = `payment_lock:${ticketUuid}`
    await this.kv.delete(key)
  }

  // ─── Moderation Cache ────────────────────────────

  async getModerationCache(eventUuid: string): Promise<any[] | null> {
    const key = `mod_cache:${eventUuid}`
    const val = await this.kv.get(key)
    return val ? JSON.parse(val) : null
  }

  async setModerationCache(eventUuid: string, data: any[]): Promise<void> {
    const key = `mod_cache:${eventUuid}`
    await this.kv.put(key, JSON.stringify(data), { expirationTtl: 300 })
  }

  async invalidateModerationCache(eventUuid: string): Promise<void> {
    const key = `mod_cache:${eventUuid}`
    await this.kv.delete(key)
  }

  // ─── Ticket Sequence ─────────────────────────────

  /**
   * Atomically increments and returns next ticket number for an event.
   * Format: EVT-0001, EVT-0002, ...
   */
  async nextTicketNumber(eventUuid: string): Promise<string> {
    const key = `ticket_seq:${eventUuid}`
    const current = await this.kv.get(key)
    const next = current ? parseInt(current, 10) + 1 : 1
    await this.kv.put(key, String(next))
    return `EVT-${String(next).padStart(4, '0')}`
  }
}
