/**
 * Attendees & Check-In Routes
 *
 * Attendee management and ticket redemption (check-in).
 * Admin & Host access via event permissions.
 */
import { Hono } from 'hono'
import type { Bindings, Variables, JWTPayload, TicketRow } from '../types'
import { authMiddleware, eventPermission } from '../middleware/auth'
import { EmailService } from '../services/email'

const attendees = new Hono<{ Bindings: Bindings; Variables: Variables }>()

attendees.use('*', authMiddleware)

function isProfileComplete(profile: any): boolean {
  const firstName = typeof profile?.first_name === 'string' ? profile.first_name.trim() : ''
  const lastName = typeof profile?.last_name === 'string' ? profile.last_name.trim() : ''
  const nickname = typeof profile?.nickname === 'string' ? profile.nickname.trim() : ''
  const socialLink = typeof profile?.social_link === 'string' ? profile.social_link.trim() : ''
  const dateOfBirth = typeof profile?.date_of_birth === 'string' ? profile.date_of_birth.trim() : ''
  return Boolean(firstName && lastName && nickname && socialLink && dateOfBirth)
}

/**
 * GET /manage/:eventId/attendees
 * List all attendees (tickets) for an event.
 * Supports filtering by status, tier, search, redeemed status.
 */
attendees.get('/:eventId/attendees', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200)
  const offset = (page - 1) * limit
  const status = c.req.query('status')       // under_payment, paid, expired, failed
  const tierId = c.req.query('tier_uuid')
  const search = c.req.query('search')
  const redeemed = c.req.query('redeemed')    // '1' or '0'

  // Only show moderation status from CONFIRMED attempts (admin-verified enforcement).
  // Raw keyword matches are NOT shown — they go to Account Suspects first.
  // Check ALL events — moderation is global (a ban in event A shows in event B).
  let query = `
    SELECT t.*, tt.tier_name, tt.price_total as tier_price,
           MAX(0, (CASE WHEN t.bid_price IS NOT NULL
               THEN MAX(t.bid_price, tt.price_total + COALESCE(t.food_total, 0) + COALESCE(t.drink_total, 0))
               ELSE (tt.price_total + COALESCE(t.food_total, 0) + COALESCE(t.drink_total, 0))
           END) - COALESCE(t.discount_amount, 0)) as price_total,
           (SELECT CASE WHEN mal.attempt_type = 'BAN_BLOCKED' THEN 'BAN' ELSE 'WATCH' END
            FROM moderation_attempt_log mal
            WHERE mal.user_uuid = t.user_uuid
              AND mal.resolution = 'CONFIRMED'
            ORDER BY mal.attempt_time DESC LIMIT 1
           ) as moderation_status
    FROM tickets t
    JOIN ticket_tiers tt ON t.tier_uuid = tt.tier_uuid
    WHERE t.event_uuid = ?`
  const params: any[] = [eventId]

  if (status) {
    query += ` AND t.purchase_status = ?`
    params.push(status)
  }
  if (tierId) {
    query += ` AND t.tier_uuid = ?`
    params.push(tierId)
  }
  if (search) {
    query += ` AND (t.first_name LIKE ? OR t.last_name LIKE ? OR t.nickname LIKE ? OR t.ticket_number LIKE ?)`
    const s = `%${search}%`
    params.push(s, s, s, s)
  }
  if (redeemed === '1') {
    query += ` AND t.is_redeemed = 1`
  } else if (redeemed === '0') {
    query += ` AND t.is_redeemed = 0`
  }

  query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  // Count total
  let countQuery = `SELECT COUNT(*) as count FROM tickets t WHERE t.event_uuid = ?`
  const countParams: any[] = [eventId]
  if (status) { countQuery += ` AND t.purchase_status = ?`; countParams.push(status) }
  if (tierId) { countQuery += ` AND t.tier_uuid = ?`; countParams.push(tierId) }
  if (search) {
    countQuery += ` AND (t.first_name LIKE ? OR t.last_name LIKE ? OR t.nickname LIKE ? OR t.ticket_number LIKE ?)`
    const s = `%${search}%`; countParams.push(s, s, s, s)
  }
  if (redeemed === '1') countQuery += ` AND t.is_redeemed = 1`
  else if (redeemed === '0') countQuery += ` AND t.is_redeemed = 0`

  const total = await c.env.DB.prepare(countQuery).bind(...countParams).first() as { count: number } | null

  return c.json({
    attendees: results || [],
    pagination: { page, limit, total: total?.count || 0, total_pages: Math.ceil((total?.count || 0) / limit) },
  })
})

/**
 * GET /manage/:eventId/attendees/transfer/senders
 * Search sender candidates (ticket holders) for transfer modal.
 * Search supports ticket fields and account email/name from AUTH_DB.
 */
attendees.get('/:eventId/attendees/transfer/senders', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const q = (c.req.query('q') || '').trim()
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 50)

  const ticketParams: any[] = [eventId]
  let senderUuids: string[] = []

  if (q.length >= 2) {
    const pattern = `%${q}%`
    const userMatches = await c.env.AUTH_DB.prepare(`
      SELECT uuid
      FROM users
      WHERE is_active = 1
        AND (
          email LIKE ? OR
          nickname LIKE ? OR
          legal_name LIKE ? OR
          first_name LIKE ? OR
          last_name LIKE ?
        )
      LIMIT 100
    `).bind(pattern, pattern, pattern, pattern, pattern).all()

    senderUuids = (userMatches.results || []).map((u: any) => u.uuid).filter(Boolean)

    let where = `
      t.event_uuid = ?
      AND (
        t.ticket_number LIKE ? OR
        t.first_name LIKE ? OR
        t.last_name LIKE ? OR
        t.nickname LIKE ?`
    ticketParams.push(pattern, pattern, pattern, pattern)

    if (senderUuids.length > 0) {
      where += ` OR t.user_uuid IN (${senderUuids.map(() => '?').join(', ')})`
      ticketParams.push(...senderUuids)
    }
    where += `)`

    const { results } = await c.env.DB.prepare(`
      SELECT t.ticket_uuid, t.ticket_number, t.user_uuid, t.first_name, t.last_name, t.nickname,
             t.date_of_birth, t.social_link, t.tier_uuid, t.food_selection, t.food_total, t.drink_selection, t.drink_total,
             t.purchase_status, t.created_at, tt.tier_name, tt.price_total as tier_price
      FROM tickets t
      JOIN ticket_tiers tt ON tt.tier_uuid = t.tier_uuid
      WHERE ${where}
      ORDER BY t.created_at DESC
      LIMIT ?
    `).bind(...ticketParams, limit).all()

    const candidates = (results || []) as any[]
    const candidateUserIds = [...new Set(candidates.map(r => r.user_uuid).filter(Boolean))]

    const profileMap: Record<string, any> = {}
    if (candidateUserIds.length > 0) {
      const placeholders = candidateUserIds.map(() => '?').join(', ')
      const { results: profiles } = await c.env.AUTH_DB.prepare(`
        SELECT uuid, email, legal_name, nickname, first_name, last_name,
               date_of_birth, social_link, profile_image_url, is_active
        FROM users
        WHERE uuid IN (${placeholders})
      `).bind(...candidateUserIds).all()

      for (const p of (profiles || []) as any[]) {
        profileMap[p.uuid] = {
          uuid: p.uuid,
          email: p.email,
          legal_name: p.legal_name,
          nickname: p.nickname,
          first_name: p.first_name,
          last_name: p.last_name,
          date_of_birth: p.date_of_birth,
          social_link: p.social_link,
          profile_image_url: p.profile_image_url,
          is_active: p.is_active === 1,
          complete_profile: isProfileComplete(p),
        }
      }
    }

    return c.json({
      senders: candidates.map((row: any) => ({
        ...row,
        sender_profile: profileMap[row.user_uuid] || null,
      })),
    })
  }

  const { results } = await c.env.DB.prepare(`
    SELECT t.ticket_uuid, t.ticket_number, t.user_uuid, t.first_name, t.last_name, t.nickname,
           t.date_of_birth, t.social_link, t.tier_uuid, t.food_selection, t.food_total, t.drink_selection, t.drink_total,
           t.purchase_status, t.created_at, tt.tier_name, tt.price_total as tier_price
    FROM tickets t
    JOIN ticket_tiers tt ON tt.tier_uuid = t.tier_uuid
    WHERE t.event_uuid = ?
    ORDER BY t.created_at DESC
    LIMIT ?
  `).bind(eventId, limit).all()

  const candidates = (results || []) as any[]
  const candidateUserIds = [...new Set(candidates.map(r => r.user_uuid).filter(Boolean))]
  const profileMap: Record<string, any> = {}

  if (candidateUserIds.length > 0) {
    const placeholders = candidateUserIds.map(() => '?').join(', ')
    const { results: profiles } = await c.env.AUTH_DB.prepare(`
      SELECT uuid, email, legal_name, nickname, first_name, last_name,
             date_of_birth, social_link, profile_image_url, is_active
      FROM users
      WHERE uuid IN (${placeholders})
    `).bind(...candidateUserIds).all()

    for (const p of (profiles || []) as any[]) {
      profileMap[p.uuid] = {
        uuid: p.uuid,
        email: p.email,
        legal_name: p.legal_name,
        nickname: p.nickname,
        first_name: p.first_name,
        last_name: p.last_name,
        date_of_birth: p.date_of_birth,
        social_link: p.social_link,
        profile_image_url: p.profile_image_url,
        is_active: p.is_active === 1,
        complete_profile: isProfileComplete(p),
      }
    }
  }

  return c.json({
    senders: candidates.map((row: any) => ({
      ...row,
      sender_profile: profileMap[row.user_uuid] || null,
    })),
  })
})

/**
 * POST /manage/:eventId/attendees/:ticketId/transfer
 * Transfer ticket ownership to another user with complete profile data.
 */
attendees.post('/:eventId/attendees/:ticketId/transfer', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const ticketId = c.req.param('ticketId')
  const body = await c.req.json().catch(() => ({}))
  const receiverUserUuid = (body.receiver_user_uuid || '').toString().trim()

  if (!receiverUserUuid) {
    return c.json({ message: 'receiver_user_uuid is required' }, 400)
  }

  const ticket = await c.env.DB.prepare(
    `SELECT t.*, tt.tier_name, tt.price_total as tier_price
     FROM tickets t
     JOIN ticket_tiers tt ON t.tier_uuid = tt.tier_uuid
     WHERE t.ticket_uuid = ? AND t.event_uuid = ?`
  ).bind(ticketId, eventId).first() as (TicketRow & { tier_name: string; tier_price: number }) | null

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  if (!['paid', 'under_payment', 'revoked'].includes(ticket.purchase_status)) {
    return c.json({ message: `Ticket with status ${ticket.purchase_status} cannot be transferred` }, 400)
  }

  if (ticket.user_uuid === receiverUserUuid) {
    return c.json({ message: 'Sender and receiver cannot be the same user' }, 400)
  }

  const senderProfile = await c.env.AUTH_DB.prepare(
    `SELECT uuid, email, legal_name, nickname, first_name, last_name,
            date_of_birth, social_link, profile_image_url, is_active
     FROM users WHERE uuid = ?`
  ).bind(ticket.user_uuid).first() as any

  const receiverProfile = await c.env.AUTH_DB.prepare(
    `SELECT uuid, email, legal_name, nickname, first_name, last_name,
            date_of_birth, social_link, profile_image_url, is_active
     FROM users WHERE uuid = ?`
  ).bind(receiverUserUuid).first() as any

  if (!receiverProfile) return c.json({ message: 'Receiver user not found' }, 404)
  if (receiverProfile.is_active !== 1) return c.json({ message: 'Receiver user is not active' }, 400)

  if (!isProfileComplete(receiverProfile)) {
    return c.json({
      message: 'Receiver profile is incomplete. Required: first_name, last_name, nickname, social_link, date_of_birth.',
      required_fields: ['first_name', 'last_name', 'nickname', 'social_link', 'date_of_birth'],
      receiver_profile: {
        uuid: receiverProfile.uuid,
        email: receiverProfile.email,
        nickname: receiverProfile.nickname,
        first_name: receiverProfile.first_name,
        last_name: receiverProfile.last_name,
        date_of_birth: receiverProfile.date_of_birth,
        social_link: receiverProfile.social_link,
        profile_image_url: receiverProfile.profile_image_url,
      },
    }, 400)
  }

  const receiverExisting = await c.env.DB.prepare(
    `SELECT ticket_uuid, purchase_status
     FROM tickets
     WHERE event_uuid = ? AND user_uuid = ? AND ticket_uuid <> ?
       AND purchase_status IN ('under_payment', 'paid', 'revoked')
     LIMIT 1`
  ).bind(eventId, receiverUserUuid, ticketId).first() as { ticket_uuid: string; purchase_status: string } | null

  if (receiverExisting) {
    return c.json({
      message: 'Receiver already has an active ticket in this event',
      existing_ticket_uuid: receiverExisting.ticket_uuid,
      existing_ticket_status: receiverExisting.purchase_status,
    }, 409)
  }

  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `UPDATE tickets
     SET user_uuid = ?, first_name = ?, last_name = ?, nickname = ?, date_of_birth = ?, social_link = ?, updated_at = ?
     WHERE ticket_uuid = ? AND event_uuid = ?`
  ).bind(
    receiverUserUuid,
    receiverProfile.first_name,
    receiverProfile.last_name,
    receiverProfile.nickname,
    receiverProfile.date_of_birth,
    receiverProfile.social_link,
    now,
    ticketId,
    eventId,
  ).run()

  await c.env.DB.prepare(
    `UPDATE purchase_log SET user_uuid = ?, updated_at = ? WHERE ticket_uuid = ?`
  ).bind(receiverUserUuid, now, ticketId).run()

  return c.json({
    message: 'Ticket transferred successfully',
    transfer: {
      ticket_uuid: ticket.ticket_uuid,
      ticket_number: ticket.ticket_number,
      tier_uuid: ticket.tier_uuid,
      tier_name: ticket.tier_name,
      food_selection: ticket.food_selection,
      food_total: ticket.food_total,
      drink_selection: ticket.drink_selection,
      drink_total: ticket.drink_total,
      price_total: (ticket.tier_price || 0) + (ticket.food_total || 0) + (ticket.drink_total || 0),
      transferred_at: now,
      sender: senderProfile ? {
        uuid: senderProfile.uuid,
        email: senderProfile.email,
        nickname: senderProfile.nickname,
        first_name: senderProfile.first_name,
        last_name: senderProfile.last_name,
        date_of_birth: senderProfile.date_of_birth,
        social_link: senderProfile.social_link,
        profile_image_url: senderProfile.profile_image_url,
        complete_profile: isProfileComplete(senderProfile),
      } : null,
      receiver: {
        uuid: receiverProfile.uuid,
        email: receiverProfile.email,
        nickname: receiverProfile.nickname,
        first_name: receiverProfile.first_name,
        last_name: receiverProfile.last_name,
        date_of_birth: receiverProfile.date_of_birth,
        social_link: receiverProfile.social_link,
        profile_image_url: receiverProfile.profile_image_url,
        complete_profile: true,
      },
    },
  })
})

/**
 * GET /manage/:eventId/attendees/:ticketId
 * Get single attendee detail.
 */
attendees.get('/:eventId/attendees/:ticketId', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const ticketId = c.req.param('ticketId')

  const ticket = await c.env.DB.prepare(
    `SELECT t.*, tt.tier_name, tt.price_total as tier_price,
            MAX(0, (CASE WHEN t.bid_price IS NOT NULL
                THEN MAX(t.bid_price, tt.price_total + COALESCE(t.food_total, 0) + COALESCE(t.drink_total, 0))
                ELSE (tt.price_total + COALESCE(t.food_total, 0) + COALESCE(t.drink_total, 0))
            END) - COALESCE(t.discount_amount, 0)) as price_total
     FROM tickets t
     JOIN ticket_tiers tt ON t.tier_uuid = tt.tier_uuid
     WHERE t.ticket_uuid = ? AND t.event_uuid = ?`
  ).bind(ticketId, eventId).first()

  if (!ticket) return c.json({ message: 'Attendee not found' }, 404)

  // Get event food_options for price lookup
  const event = await c.env.DB.prepare(
    'SELECT food_enabled, food_options FROM events WHERE event_uuid = ?'
  ).bind(eventId).first() as { food_enabled: number; food_options: string } | null

  // Get purchase log
  const { results: purchaseLogs } = await c.env.DB.prepare(
    'SELECT * FROM purchase_log WHERE ticket_uuid = ? ORDER BY created_at DESC'
  ).bind(ticketId).all()

  return c.json({ ...(ticket as any), purchase_logs: purchaseLogs || [], event_food_options: event?.food_options || '[]' })
})

/**
 * PUT /manage/:eventId/attendees/:ticketId
 * Update attendee info (admin can edit attendee details).
 * Only editable if ticket is NOT paid (data immutability post-payment).
 */
attendees.put('/:eventId/attendees/:ticketId', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const ticketId = c.req.param('ticketId')
  const body = await c.req.json()

  const ticket = await c.env.DB.prepare(
    'SELECT * FROM tickets WHERE ticket_uuid = ? AND event_uuid = ?'
  ).bind(ticketId, eventId).first() as TicketRow | null

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  // Data immutability: cannot edit first_name/last_name/nickname after payment
  if (ticket.purchase_status === 'paid') {
    const mutableFields = ['food_selection', 'drink_selection', 'is_fursuiter']
    const immutableAttempts = Object.keys(body).filter(k => !mutableFields.includes(k))
    if (immutableAttempts.length > 0) {
      return c.json({
        message: `Cannot modify ${immutableAttempts.join(', ')} after payment. Only food_selection, drink_selection, and is_fursuiter can be updated.`,
      }, 400)
    }
  }

  const updates: string[] = []
  const values: any[] = []

  if (body.first_name !== undefined) { updates.push('first_name = ?'); values.push(body.first_name) }
  if (body.last_name !== undefined) { updates.push('last_name = ?'); values.push(body.last_name) }
  if (body.nickname !== undefined) { updates.push('nickname = ?'); values.push(body.nickname) }
  if (body.is_fursuiter !== undefined) { updates.push('is_fursuiter = ?'); values.push(body.is_fursuiter ? 1 : 0) }
  if (body.food_selection !== undefined) {
    updates.push('food_selection = ?')
    values.push(JSON.stringify(Array.isArray(body.food_selection) ? body.food_selection : [body.food_selection]))
  }
  if (body.drink_selection !== undefined) {
    updates.push('drink_selection = ?')
    values.push(JSON.stringify(Array.isArray(body.drink_selection) ? body.drink_selection : [body.drink_selection]))
  }

  if (updates.length === 0) return c.json({ message: 'No fields to update' }, 400)

  updates.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(ticketId)
  values.push(eventId)

  await c.env.DB.prepare(
    `UPDATE tickets SET ${updates.join(', ')} WHERE ticket_uuid = ? AND event_uuid = ?`
  ).bind(...values).run()

  return c.json({ message: 'Attendee updated' })
})

// ═══════════════════════════════════════════════════
// CHECK-IN / REDEEM
// ═══════════════════════════════════════════════════

/**
 * POST /manage/:eventId/checkin/verify
 * Verify a ticket for check-in (QR scan or manual search).
 *
 * Body: { event_uuid, ticket_number } — from QR code payload
 *   OR: { search } — for manual lookup
 */
attendees.post('/:eventId/checkin/verify', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const body = await c.req.json()

  let ticket: TicketRow | null = null

  if (body.ticket_uuid) {
    // QR-based lookup by ticket UUID
    ticket = await c.env.DB.prepare(
      `SELECT * FROM tickets WHERE event_uuid = ? AND ticket_uuid = ?`
    ).bind(eventId, body.ticket_uuid).first() as TicketRow | null
  } else if (body.ticket_number) {
    // Lookup by ticket number
    ticket = await c.env.DB.prepare(
      `SELECT * FROM tickets WHERE event_uuid = ? AND ticket_number = ?`
    ).bind(body.event_uuid || eventId, body.ticket_number).first() as TicketRow | null
  } else if (body.search) {
    // Manual search by name or ticket number
    ticket = await c.env.DB.prepare(
      `SELECT * FROM tickets
       WHERE event_uuid = ? AND (
         ticket_number LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR nickname LIKE ?
       ) AND purchase_status = 'paid'
       LIMIT 1`
    ).bind(eventId, `%${body.search}%`, `%${body.search}%`, `%${body.search}%`, `%${body.search}%`).first() as TicketRow | null
  } else {
    return c.json({ message: 'Provide ticket_uuid (QR), ticket_number, or search (manual)' }, 400)
  }

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  if (ticket.purchase_status === 'revoked') {
    // Get tier info for the response
    const tier = await c.env.DB.prepare(
      'SELECT tier_name FROM ticket_tiers WHERE tier_uuid = ?'
    ).bind(ticket.tier_uuid).first() as { tier_name: string } | null

    return c.json({
      valid: false,
      revoked: true,
      message: 'This ticket has been revoked',
      ticket: {
        ...ticket,
        tier_name: tier?.tier_name || 'Unknown',
      },
    }, 403)
  }

  if (ticket.purchase_status !== 'paid') {
    return c.json({
      message: `Ticket is not paid (status: ${ticket.purchase_status})`,
      ticket,
    }, 400)
  }

  // Get tier info
  const tier = await c.env.DB.prepare(
    'SELECT tier_name, price_total as tier_price FROM ticket_tiers WHERE tier_uuid = ?'
  ).bind(ticket.tier_uuid).first() as { tier_name: string; tier_price: number } | null

  // Get event food_options for price lookup
  const event = await c.env.DB.prepare(
    'SELECT food_enabled, food_options, drinks_enabled, drink_options FROM events WHERE event_uuid = ?'
  ).bind(eventId).first() as { food_enabled: number; food_options: string; drinks_enabled: number; drink_options: string } | null

  // Check moderation status — ONLY from admin-CONFIRMED attempts, not raw keyword matches.
  // Global scope: a confirmed ban from ANY event applies everywhere.
  let moderationInfo: { moderation_type: string } | null = null
  const confirmedMod = await c.env.DB.prepare(
    `SELECT attempt_uuid, attempt_type FROM moderation_attempt_log
     WHERE user_uuid = ? AND resolution = 'CONFIRMED'
     ORDER BY attempt_time DESC LIMIT 1`
  ).bind(ticket.user_uuid).first() as { attempt_uuid: string; attempt_type: string } | null

  if (confirmedMod) {
    moderationInfo = {
      moderation_type: confirmedMod.attempt_type === 'BAN_BLOCKED' ? 'BAN' : 'WATCH',
    }

    // Log this scanner flag to enforcement log
    const fullName = [ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || 'Unknown'
    await c.env.DB.prepare(
      `INSERT INTO moderation_enforcement_log
       (log_uuid, event_uuid, user_uuid, attempt_uuid, action_type, moderation_type, details, user_name, user_email)
       VALUES (?, ?, ?, ?, 'SCAN_FLAGGED', ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(), eventId, ticket.user_uuid,
      confirmedMod.attempt_uuid || null,
      moderationInfo.moderation_type,
      JSON.stringify({ ticket_uuid: ticket.ticket_uuid, ticket_number: ticket.ticket_number, is_redeemed: ticket.is_redeemed }),
      fullName,
      null,
    ).run()
  }

  return c.json({
    valid: true,
    already_redeemed: ticket.is_redeemed === 1,
    food_received: ticket.food_received === 1,
    drink_received: ticket.drink_received === 1,
    moderation: moderationInfo,
    ticket: {
      ...ticket,
      tier_name: tier?.tier_name || 'Unknown',
      tier_price: tier?.tier_price || 0,
      price_total: (ticket as any).bid_price
        ? Math.max((ticket as any).bid_price, (tier?.tier_price || 0) + (ticket.food_total || 0) + (ticket.drink_total || 0))
        : (tier?.tier_price || 0) + (ticket.food_total || 0) + (ticket.drink_total || 0),
      bid_price: (ticket as any).bid_price || null,
      food_selection: JSON.parse(ticket.food_selection || '[]'),
      drink_selection: JSON.parse(ticket.drink_selection || '[]'),
      food_notes: ticket.food_notes || null,
      event_food_options: event?.food_options || '[]',
      event_drink_options: event?.drink_options || '[]',
    },
  })
})

/**
 * POST /manage/:eventId/checkin/redeem
 * Redeem (check-in) a ticket.
 *
 * Body: { ticket_uuid, food_received? }
 * When food_received is true, also marks food as received.
 */
attendees.post('/:eventId/checkin/redeem', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()
  const { ticket_uuid, food_received, drink_received } = body

  if (!ticket_uuid) return c.json({ message: 'ticket_uuid is required' }, 400)

  const ticket = await c.env.DB.prepare(
    'SELECT * FROM tickets WHERE ticket_uuid = ? AND event_uuid = ?'
  ).bind(ticket_uuid, eventId).first() as TicketRow | null

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  if (ticket.purchase_status !== 'paid') {
    return c.json({ message: 'Ticket is not paid' }, 400)
  }

  if (ticket.is_redeemed === 1) {
    return c.json({
      message: 'Ticket already redeemed',
      redeemed_at: ticket.redeemed_at,
      redeemed_by: ticket.redeemed_by,
    }, 409)
  }

  const now = new Date().toISOString()

  // Build update query — always redeem, optionally mark food received
  let updateSql = `UPDATE tickets SET is_redeemed = 1, redeemed_at = ?, redeemed_by = ?, updated_at = ?`
  const updateParams: any[] = [now, user.sub, now]

  if (food_received) {
    updateSql += `, food_received = 1, food_received_at = ?, food_received_by = ?`
    updateParams.push(now, user.sub)
  }

  if (drink_received) {
    updateSql += `, drink_received = 1, drink_received_at = ?, drink_received_by = ?`
    updateParams.push(now, user.sub)
  }

  updateSql += ` WHERE ticket_uuid = ?`
  updateParams.push(ticket_uuid)

  await c.env.DB.prepare(updateSql).bind(...updateParams).run()

  // Send redeem confirmation email (async)
  try {
    const event = await c.env.DB.prepare(
      'SELECT event_name FROM events WHERE event_uuid = ?'
    ).bind(eventId).first() as { event_name: string } | null

    const emailService = new EmailService((c.env as any).EMAIL_QUEUE)
    // We don't have user email from ticket, so this would need auth lookup
    // For now, log it
    console.log(`[CheckIn] Ticket ${ticket.ticket_number} redeemed by ${user.sub}`)
  } catch (e) {
    console.error('Redeem email error:', e)
  }

  return c.json({
    message: 'Ticket redeemed successfully',
    ticket_number: ticket.ticket_number,
    redeemed_at: now,
  })
})

/**
 * POST /manage/:eventId/checkin/unredeem
 * Un-redeem a ticket (re-register). Admin/Host action.
 *
 * Body: { ticket_uuid }
 */
attendees.post('/:eventId/checkin/unredeem', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const { ticket_uuid } = await c.req.json()

  if (!ticket_uuid) return c.json({ message: 'ticket_uuid is required' }, 400)

  const ticket = await c.env.DB.prepare(
    'SELECT * FROM tickets WHERE ticket_uuid = ? AND event_uuid = ? AND is_redeemed = 1'
  ).bind(ticket_uuid, eventId).first() as TicketRow | null

  if (!ticket) return c.json({ message: 'Ticket not found or not redeemed' }, 404)

  await c.env.DB.prepare(
    `UPDATE tickets SET is_redeemed = 0, redeemed_at = NULL, redeemed_by = NULL,
     food_received = 0, food_received_at = NULL, food_received_by = NULL,
     drink_received = 0, drink_received_at = NULL, drink_received_by = NULL, updated_at = ?
     WHERE ticket_uuid = ?`
  ).bind(new Date().toISOString(), ticket_uuid).run()

  return c.json({ message: 'Ticket un-redeemed. Can be scanned again.' })
})

/**
 * POST /manage/:eventId/attendees/:ticketId/revoke
 * Revoke a paid ticket. Admin/Host action.
 * Sets purchase_status to 'revoked' and records reason.
 *
 * Body: { reason? }
 */
attendees.post('/:eventId/attendees/:ticketId/revoke', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const ticketId = c.req.param('ticketId')
  const user = c.get('user') as JWTPayload
  const body = await c.req.json().catch(() => ({}))

  const ticket = await c.env.DB.prepare(
    'SELECT * FROM tickets WHERE ticket_uuid = ? AND event_uuid = ?'
  ).bind(ticketId, eventId).first() as TicketRow | null

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  if (ticket.purchase_status !== 'paid') {
    return c.json({ message: `Can only revoke paid tickets (current: ${ticket.purchase_status})` }, 400)
  }

  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `UPDATE tickets SET purchase_status = 'revoked', revoke_reason = ?, revoked_by = ?, revoked_at = ?, updated_at = ?
     WHERE ticket_uuid = ?`
  ).bind(body.reason || null, user.sub, now, now, ticketId).run()

  return c.json({
    message: 'Ticket revoked',
    ticket_uuid: ticketId,
    revoked_at: now,
  })
})

/**
 * POST /manage/:eventId/attendees/:ticketId/manual-pay
 * Admin/Host manual override: mark an under_payment ticket as paid.
 * Issues a ticket number atomically.
 */
attendees.post('/:eventId/attendees/:ticketId/manual-pay', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const ticketId = c.req.param('ticketId')
  const user = c.get('user') as JWTPayload

  const ticket = await c.env.DB.prepare(
    'SELECT * FROM tickets WHERE ticket_uuid = ? AND event_uuid = ?'
  ).bind(ticketId, eventId).first() as TicketRow | null

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  if (ticket.purchase_status !== 'under_payment') {
    return c.json({ message: `Can only override pending tickets (current: ${ticket.purchase_status})` }, 400)
  }

  const now = new Date().toISOString()

  // Issue ticket number atomically (same logic as payment flow)
  await c.env.DB.prepare(
    `UPDATE tickets
     SET purchase_status = 'paid',
         ticket_number = 'EVT-' || SUBSTR('0000' || (
           (SELECT COUNT(*) FROM tickets
            WHERE event_uuid = ? AND ticket_number IS NOT NULL) + 1
         ), -4),
         updated_at = ?
     WHERE ticket_uuid = ? AND purchase_status = 'under_payment'`
  ).bind(eventId, now, ticketId).run()

  // Update purchase log if exists
  await c.env.DB.prepare(
    `UPDATE purchase_log SET payment_status = 'paid', payment_reference = ?, updated_at = ?
     WHERE ticket_uuid = ?`
  ).bind(`MANUAL_OVERRIDE_BY_${user.sub}`, now, ticketId).run()

  const updated = await c.env.DB.prepare(
    'SELECT ticket_number FROM tickets WHERE ticket_uuid = ?'
  ).bind(ticketId).first() as { ticket_number: string } | null

  return c.json({
    message: 'Ticket manually marked as paid',
    ticket_uuid: ticketId,
    ticket_number: updated?.ticket_number || null,
  })
})

/**
 * POST /manage/:eventId/attendees/:ticketId/unrevoke
 * Restore a revoked ticket back to 'paid'. Admin/Host action.
 */
attendees.post('/:eventId/attendees/:ticketId/unrevoke', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const ticketId = c.req.param('ticketId')

  const ticket = await c.env.DB.prepare(
    'SELECT * FROM tickets WHERE ticket_uuid = ? AND event_uuid = ?'
  ).bind(ticketId, eventId).first() as TicketRow | null

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  if (ticket.purchase_status !== 'revoked') {
    return c.json({ message: 'Ticket is not revoked' }, 400)
  }

  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `UPDATE tickets SET purchase_status = 'paid', revoke_reason = NULL, revoked_by = NULL, revoked_at = NULL, updated_at = ?
     WHERE ticket_uuid = ?`
  ).bind(now, ticketId).run()

  return c.json({
    message: 'Ticket restored to paid',
    ticket_uuid: ticketId,
  })
})

/**
 * POST /manage/:eventId/checkin/food-received
 * Mark food as received for a checked-in ticket.
 * Can be called independently of check-in (e.g. food station scan).
 *
 * Body: { ticket_uuid, received }
 *   received: true = mark received, false = unmark
 */
attendees.post('/:eventId/checkin/food-received', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()
  const { ticket_uuid, received } = body

  if (!ticket_uuid) return c.json({ message: 'ticket_uuid is required' }, 400)

  const ticket = await c.env.DB.prepare(
    'SELECT * FROM tickets WHERE ticket_uuid = ? AND event_uuid = ?'
  ).bind(ticket_uuid, eventId).first() as TicketRow | null

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  if (ticket.purchase_status !== 'paid') {
    return c.json({ message: 'Ticket is not paid' }, 400)
  }

  const now = new Date().toISOString()

  if (received === false) {
    // Unmark food received
    await c.env.DB.prepare(
      `UPDATE tickets SET food_received = 0, food_received_at = NULL, food_received_by = NULL, updated_at = ?
       WHERE ticket_uuid = ?`
    ).bind(now, ticket_uuid).run()
    return c.json({ message: 'Food marked as not received', food_received: false })
  }

  // Mark food as received
  await c.env.DB.prepare(
    `UPDATE tickets SET food_received = 1, food_received_at = ?, food_received_by = ?, updated_at = ?
     WHERE ticket_uuid = ?`
  ).bind(now, user.sub, now, ticket_uuid).run()

  return c.json({
    message: 'Food marked as received',
    food_received: true,
    food_received_at: now,
  })
})

/**
 * POST /manage/:eventId/checkin/drink-received
 * Mark drink as received for a checked-in ticket.
 * Can be called independently of check-in (e.g. drink station scan).
 *
 * Body: { ticket_uuid, received }
 *   received: true = mark received, false = unmark
 */
attendees.post('/:eventId/checkin/drink-received', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()
  const { ticket_uuid, received } = body

  if (!ticket_uuid) return c.json({ message: 'ticket_uuid is required' }, 400)

  const ticket = await c.env.DB.prepare(
    'SELECT * FROM tickets WHERE ticket_uuid = ? AND event_uuid = ?'
  ).bind(ticket_uuid, eventId).first() as TicketRow | null

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  if (ticket.purchase_status !== 'paid') {
    return c.json({ message: 'Ticket is not paid' }, 400)
  }

  const now = new Date().toISOString()

  if (received === false) {
    // Unmark drink received
    await c.env.DB.prepare(
      `UPDATE tickets SET drink_received = 0, drink_received_at = NULL, drink_received_by = NULL, updated_at = ?
       WHERE ticket_uuid = ?`
    ).bind(now, ticket_uuid).run()
    return c.json({ message: 'Drink marked as not received', drink_received: false })
  }

  // Mark drink as received
  await c.env.DB.prepare(
    `UPDATE tickets SET drink_received = 1, drink_received_at = ?, drink_received_by = ?, updated_at = ?
     WHERE ticket_uuid = ?`
  ).bind(now, user.sub, now, ticket_uuid).run()

  return c.json({
    message: 'Drink marked as received',
    drink_received: true,
    drink_received_at: now,
  })
})

/**
 * GET /manage/:eventId/checkin/stats
 * Check-in statistics for the event.
 */
attendees.get('/:eventId/checkin/stats', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')

  const stats = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total_tickets,
      SUM(CASE WHEN purchase_status = 'paid' THEN 1 ELSE 0 END) as paid_tickets,
      SUM(CASE WHEN is_redeemed = 1 THEN 1 ELSE 0 END) as redeemed_tickets,
      SUM(CASE WHEN purchase_status = 'paid' AND is_redeemed = 0 THEN 1 ELSE 0 END) as pending_checkin
    FROM tickets WHERE event_uuid = ?
  `).bind(eventId).first()

  // Per-tier breakdown
  const { results: tierStats } = await c.env.DB.prepare(`
    SELECT
      tt.tier_uuid, tt.tier_name,
      COUNT(t.ticket_uuid) as total,
      SUM(CASE WHEN t.purchase_status = 'paid' THEN 1 ELSE 0 END) as paid,
      SUM(CASE WHEN t.is_redeemed = 1 THEN 1 ELSE 0 END) as redeemed
    FROM ticket_tiers tt
    LEFT JOIN tickets t ON tt.tier_uuid = t.tier_uuid
    WHERE tt.event_uuid = ?
    GROUP BY tt.tier_uuid, tt.tier_name
    ORDER BY tt.sort_order ASC
  `).bind(eventId).all()

  return c.json({
    summary: stats,
    by_tier: tierStats || [],
  })
})

export { attendees }
