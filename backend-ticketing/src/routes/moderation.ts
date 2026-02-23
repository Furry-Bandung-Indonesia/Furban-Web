/**
 * Moderation Routes v4
 *
 * Four-tab moderation dashboard:
 * TAB 1 — Keyword List: Admin-defined keywords (BAN/WATCH per person)
 * TAB 2 — Account Suspects: Pending detections requiring admin confirmation
 * TAB 3 — Confirmed: Admin-confirmed BAN/WATCH accounts
 * TAB 4 — Attempt Logs: Actual blocked purchases & scanner flags for confirmed accounts
 *
 * Key principles:
 * - Never auto-ban based on name similarity alone
 * - Email/phone = high confidence but still require admin confirmation
 * - Every action requires reason + issuer
 * - Watchlist status never exposed in public APIs
 * - False recognition persists permanently
 * - Keywords apply GLOBALLY across ALL events (cross-event enforcement)
 */
import { Hono } from 'hono'
import type { Bindings, Variables, JWTPayload, ModerationRow, ModerationAttemptRow } from '../types'
import { authMiddleware, eventPermission } from '../middleware/auth'
import { KVService } from '../services/kv'
import { maskName } from '../services/masking'
import { similarityScore, SIMILARITY_THRESHOLD } from '../services/moderation'

const moderation = new Hono<{ Bindings: Bindings; Variables: Variables }>()

moderation.use('*', authMiddleware)

// ═══════════════════════════════════════════════════
// SHARED MATCHING UTILITY
// ═══════════════════════════════════════════════════

interface MatchDetail { field: string; score: number; type: 'EXACT' | 'SIMILAR' }

/**
 * Match a person's fields against a single keyword entry.
 * Returns array of matched fields (empty = no match).
 * Works for both attendees (tickets) and website users (auth DB).
 */
function matchPersonAgainstKeyword(
  person: { first_name?: string; last_name?: string; nickname?: string; phone_number?: string; email?: string },
  kw: { legal_name?: string; first_name?: string; last_name?: string; nickname?: string; email?: string; phone_number?: string },
): MatchDetail[] {
  const kwLegal = (kw.legal_name || '').trim().toLowerCase()
  const kwFirst = (kw.first_name || '').trim().toLowerCase()
  const kwLast = (kw.last_name || '').trim().toLowerCase()
  const kwNick = (kw.nickname || '').trim().toLowerCase()
  const kwPhone = (kw.phone_number || '').replace(/\D/g, '')
  const kwEmail = (kw.email || '').trim().toLowerCase()

  const attFirst = (person.first_name || '').trim().toLowerCase()
  const attLast = (person.last_name || '').trim().toLowerCase()
  const attNick = (person.nickname || '').trim().toLowerCase()
  const attPhone = (person.phone_number || '').replace(/\D/g, '')
  const attEmail = (person.email || '').trim().toLowerCase()
  const attFullName = [attFirst, attLast].filter(Boolean).join(' ')

  const matchDetails: MatchDetail[] = []

  // Email exact match (high confidence)
  if (kwEmail && attEmail && kwEmail === attEmail) {
    matchDetails.push({ field: 'email', score: 100, type: 'EXACT' })
  }

  // Phone exact match
  if (kwPhone && attPhone && kwPhone === attPhone) {
    matchDetails.push({ field: 'phone_number', score: 100, type: 'EXACT' })
  }

  // Legal name vs full name
  if (kwLegal && attFullName) {
    const score = similarityScore(kwLegal, attFullName)
    if (score >= SIMILARITY_THRESHOLD) {
      matchDetails.push({ field: 'legal_name', score, type: score === 100 ? 'EXACT' : 'SIMILAR' })
    }
  }

  // First name
  if (kwFirst && attFirst) {
    const score = similarityScore(kwFirst, attFirst)
    if (score >= SIMILARITY_THRESHOLD) {
      matchDetails.push({ field: 'first_name', score, type: score === 100 ? 'EXACT' : 'SIMILAR' })
    }
  }

  // Last name
  if (kwLast && attLast) {
    const score = similarityScore(kwLast, attLast)
    if (score >= SIMILARITY_THRESHOLD) {
      matchDetails.push({ field: 'last_name', score, type: score === 100 ? 'EXACT' : 'SIMILAR' })
    }
  }

  // Nickname
  if (kwNick && attNick) {
    const score = similarityScore(kwNick, attNick)
    if (score >= SIMILARITY_THRESHOLD) {
      matchDetails.push({ field: 'nickname', score, type: score === 100 ? 'EXACT' : 'SIMILAR' })
    }
  }

  // Cross: keyword nickname vs person full name
  if (kwNick && attFullName && !matchDetails.find(d => d.field === 'nickname')) {
    const score = similarityScore(kwNick, attFullName)
    if (score >= SIMILARITY_THRESHOLD) {
      matchDetails.push({ field: 'nickname_vs_legal', score, type: score === 100 ? 'EXACT' : 'SIMILAR' })
    }
  }

  return matchDetails
}

// Backward-compat alias
const matchAttendeeAgainstKeyword = matchPersonAgainstKeyword

/**
 * Create a PENDING suspect record for a matched person.
 * Works for both attendees (with ticket_uuid) and website users (without ticket_uuid).
 */
async function createSuspect(
  db: D1Database,
  eventUuid: string,
  moderationUuid: string,
  moderationType: string,
  person: { first_name?: string; last_name?: string; nickname?: string; phone_number?: string; email?: string; user_uuid: string; ticket_uuid?: string | null },
  matchDetails: MatchDetail[],
): Promise<void> {
  const highestScore = Math.max(...matchDetails.map(d => d.score))
  const hasExact = matchDetails.some(d => d.type === 'EXACT')
  const detectionType = hasExact ? 'EXACT' : 'SIMILAR'
  const attemptType = moderationType === 'BAN' ? 'BAN_BLOCKED' : 'WATCH_DETECTED'
  const fullName = [person.first_name, person.last_name].filter(Boolean).join(' ') || 'Unknown'
  const masked = maskName(fullName)

  await db.prepare(
    `INSERT INTO moderation_attempt_log
     (attempt_uuid, event_uuid, moderation_uuid, masked_name, attempt_type,
      detection_type, similarity_score,
      raw_legal_name, raw_nickname, raw_email, raw_phone,
      user_uuid, ticket_uuid, matched_fields, resolution)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`
  ).bind(
    crypto.randomUUID(), eventUuid, moderationUuid, masked, attemptType,
    detectionType, highestScore,
    fullName, person.nickname || null, person.email || null, person.phone_number || null,
    person.user_uuid, person.ticket_uuid || null,
    JSON.stringify(matchDetails.map(d => d.field)),
  ).run()
}

// ═══════════════════════════════════════════════════
// TAB 1 — KEYWORD LIST
// ═══════════════════════════════════════════════════

/**
 * GET /manage/:eventId/moderation
 * List all keyword entries (paginated, searchable, filterable).
 */
moderation.get('/:eventId/moderation', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200)
  const offset = (page - 1) * limit
  const typeFilter = c.req.query('type')       // BAN, WATCH
  const statusFilter = c.req.query('status')   // ACTIVE, APPEALED
  const enabledFilter = c.req.query('enabled')  // 1, 0
  const search = c.req.query('search')

  let query = `SELECT * FROM moderation_list WHERE event_uuid = ?`
  const params: any[] = [eventId]

  if (typeFilter && ['BAN', 'WATCH'].includes(typeFilter)) {
    query += ` AND moderation_type = ?`
    params.push(typeFilter)
  }

  if (statusFilter && ['ACTIVE', 'APPEALED'].includes(statusFilter)) {
    query += ` AND status = ?`
    params.push(statusFilter)
  }

  if (enabledFilter !== undefined && enabledFilter !== null && enabledFilter !== '') {
    query += ` AND is_enabled = ?`
    params.push(parseInt(enabledFilter, 10))
  }

  if (search) {
    query += ` AND (
      legal_name LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR
      nickname LIKE ? OR email LIKE ? OR phone_number LIKE ?
    )`
    const s = `%${search}%`
    params.push(s, s, s, s, s, s)
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count')
  const total = await c.env.DB.prepare(countQuery).bind(...params).first() as { count: number } | null

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  return c.json({
    moderation: results || [],
    pagination: {
      page,
      limit,
      total: total?.count || 0,
      total_pages: Math.ceil((total?.count || 0) / limit),
    },
  })
})

/**
 * GET /manage/:eventId/moderation/:modId/detail
 * Get single keyword entry with appeal history, related attempts, dismissals.
 */
moderation.get('/:eventId/moderation/:modId/detail', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const modId = c.req.param('modId')

  const entry = await c.env.DB.prepare(
    'SELECT * FROM moderation_list WHERE moderation_uuid = ? AND event_uuid = ?'
  ).bind(modId, eventId).first()

  if (!entry) return c.json({ message: 'Moderation entry not found' }, 404)

  const { results: appeals } = await c.env.DB.prepare(
    'SELECT * FROM moderation_appeals WHERE moderation_uuid = ? ORDER BY created_at DESC'
  ).bind(modId).all()

  const { results: attempts } = await c.env.DB.prepare(
    `SELECT * FROM moderation_attempt_log WHERE moderation_uuid = ? AND event_uuid = ?
     ORDER BY attempt_time DESC LIMIT 20`
  ).bind(modId, eventId).all()

  const { results: dismissals } = await c.env.DB.prepare(
    'SELECT * FROM moderation_dismissals WHERE moderation_uuid = ? AND event_uuid = ?'
  ).bind(modId, eventId).all()

  return c.json({
    ...(entry as any),
    appeals: appeals || [],
    attempts: attempts || [],
    dismissals: dismissals || [],
  })
})

/**
 * POST /manage/:eventId/moderation
 * Add a person to the keyword list.
 *
 * Body: { legal_name, first_name?, last_name?, nickname?, email?, phone_number?,
 *         moderation_type: 'BAN'|'WATCH', notes }
 */
moderation.post('/:eventId/moderation', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()

  if (!body.legal_name || !body.moderation_type) {
    return c.json({ message: 'legal_name and moderation_type are required' }, 400)
  }

  if (!['BAN', 'WATCH'].includes(body.moderation_type)) {
    return c.json({ message: 'moderation_type must be BAN or WATCH' }, 400)
  }

  if (!body.notes?.trim()) {
    return c.json({ message: 'Reason (notes) is mandatory' }, 400)
  }

  const uuid = crypto.randomUUID()
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `INSERT INTO moderation_list
     (moderation_uuid, event_uuid, legal_name, first_name, last_name, nickname,
      email, phone_number, moderation_type, status, is_enabled, notes, added_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?, ?)`
  ).bind(
    uuid, eventId,
    body.legal_name,
    body.first_name || null,
    body.last_name || null,
    body.nickname || null,
    body.email || null,
    body.phone_number || null,
    body.moderation_type,
    body.notes.trim(),
    user.email, now, now,
  ).run()

  // ─── Scan existing attendees against new keyword (cross-event) ──
  // Scan ALL attendees from ALL events against the new keyword.
  // Moderation is global — a banned person is flagged everywhere.
  const kvService = new KVService(c.env.KV)
  await kvService.invalidateModerationCache(eventId)

  // Fetch attendees from ALL events (global scope)
  const { results: allAttendees } = await c.env.DB.prepare(
    `SELECT ticket_uuid, event_uuid, user_uuid, first_name, last_name, nickname, phone_number
     FROM tickets WHERE purchase_status IN ('paid', 'under_payment')`
  ).all()

  let suspectsCreated = 0

  if (allAttendees && allAttendees.length > 0) {
    // Get ALL existing attempts for this keyword across events to avoid duplicates
    const { results: existingAttempts } = await c.env.DB.prepare(
      `SELECT user_uuid, event_uuid FROM moderation_attempt_log WHERE moderation_uuid = ?`
    ).bind(uuid).all()
    const alreadyFlagged = new Set((existingAttempts || []).map((a: any) => `${a.event_uuid}:${a.user_uuid}`))

    // Get dismissals for this keyword across events
    const { results: dismissals } = await c.env.DB.prepare(
      `SELECT user_uuid, event_uuid FROM moderation_dismissals WHERE moderation_uuid = ?`
    ).bind(uuid).all()
    const dismissedUsers = new Set((dismissals || []).map((d: any) => `${d.event_uuid}:${d.user_uuid}`))

    for (const att of allAttendees as any[]) {
      const key = `${att.event_uuid}:${att.user_uuid}`
      if (alreadyFlagged.has(key)) continue
      if (dismissedUsers.has(key)) continue

      const matchDetails = matchPersonAgainstKeyword(att, body)
      if (matchDetails.length > 0) {
        await createSuspect(c.env.DB, att.event_uuid, uuid, body.moderation_type, att, matchDetails)
        alreadyFlagged.add(key)
        suspectsCreated++
      }
    }
  }

  // ─── Also scan ALL website users from auth DB (pre-screen non-attendees) ──
  // Catches users who haven't bought tickets yet but match ban keywords.
  let usersScanned = 0
  const attendeeUserUuids = new Set((allAttendees || []).map((a: any) => a.user_uuid))

  if (c.env.AUTH_DB) {
    const { results: allUsers } = await c.env.AUTH_DB.prepare(
      `SELECT uuid, email, first_name, last_name, nickname, phone_number
       FROM users WHERE is_active = 1`
    ).all()

    if (allUsers && allUsers.length > 0) {
      // Get existing attempts for this keyword keyed by eventId:userUuid
      const { results: existingAttempts } = await c.env.DB.prepare(
        `SELECT user_uuid, event_uuid FROM moderation_attempt_log WHERE moderation_uuid = ?`
      ).bind(uuid).all()
      const alreadyFlaggedUsers = new Set((existingAttempts || []).map((a: any) => `${a.event_uuid}:${a.user_uuid}`))

      const { results: dismissals } = await c.env.DB.prepare(
        `SELECT user_uuid, event_uuid FROM moderation_dismissals WHERE moderation_uuid = ?`
      ).bind(uuid).all()
      const dismissedUserSet = new Set((dismissals || []).map((d: any) => `${d.event_uuid}:${d.user_uuid}`))

      for (const u of allUsers as any[]) {
        if (attendeeUserUuids.has(u.uuid)) continue  // Already scanned as attendee
        usersScanned++

        const key = `${eventId}:${u.uuid}`
        if (alreadyFlaggedUsers.has(key)) continue
        if (dismissedUserSet.has(key)) continue

        const person = {
          first_name: u.first_name || undefined,
          last_name: u.last_name || undefined,
          nickname: u.nickname || undefined,
          phone_number: u.phone_number || undefined,
          email: u.email || undefined,
          user_uuid: u.uuid,
          ticket_uuid: null as string | null,
        }

        const matchDetails = matchPersonAgainstKeyword(person, body)
        if (matchDetails.length > 0) {
          await createSuspect(c.env.DB, eventId, uuid, body.moderation_type, person, matchDetails)
          suspectsCreated++
        }
      }
    }
  }

  return c.json({
    message: `${body.moderation_type} entry added` + (suspectsCreated > 0 ? `. ${suspectsCreated} suspect(s) flagged (attendees + users).` : ''),
    moderation_uuid: uuid,
    suspects_created: suspectsCreated,
    users_scanned: usersScanned,
  }, 201)
})

/**
 * PUT /manage/:eventId/moderation/:modId
 * Update a keyword entry.
 */
moderation.put('/:eventId/moderation/:modId', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const modId = c.req.param('modId')
  const body = await c.req.json()

  const existing = await c.env.DB.prepare(
    'SELECT * FROM moderation_list WHERE moderation_uuid = ? AND event_uuid = ?'
  ).bind(modId, eventId).first()

  if (!existing) return c.json({ message: 'Moderation entry not found' }, 404)

  const updates: string[] = []
  const values: any[] = []

  if (body.legal_name !== undefined) { updates.push('legal_name = ?'); values.push(body.legal_name) }
  if (body.first_name !== undefined) { updates.push('first_name = ?'); values.push(body.first_name || null) }
  if (body.last_name !== undefined) { updates.push('last_name = ?'); values.push(body.last_name || null) }
  if (body.nickname !== undefined) { updates.push('nickname = ?'); values.push(body.nickname || null) }
  if (body.email !== undefined) { updates.push('email = ?'); values.push(body.email || null) }
  if (body.phone_number !== undefined) { updates.push('phone_number = ?'); values.push(body.phone_number || null) }
  if (body.moderation_type !== undefined) {
    if (!['BAN', 'WATCH'].includes(body.moderation_type)) {
      return c.json({ message: 'moderation_type must be BAN or WATCH' }, 400)
    }
    updates.push('moderation_type = ?'); values.push(body.moderation_type)
  }
  if (body.notes !== undefined) { updates.push('notes = ?'); values.push(body.notes) }

  if (updates.length === 0) return c.json({ message: 'No fields to update' }, 400)

  updates.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(modId)
  values.push(eventId)

  await c.env.DB.prepare(
    `UPDATE moderation_list SET ${updates.join(', ')} WHERE moderation_uuid = ? AND event_uuid = ?`
  ).bind(...values).run()

  const kvService = new KVService(c.env.KV)
  await kvService.invalidateModerationCache(eventId)

  return c.json({ message: 'Moderation entry updated' })
})

/**
 * PUT /manage/:eventId/moderation/:modId/toggle
 * Enable or disable a keyword entry without deleting it.
 *
 * Body: { enabled: boolean }
 */
moderation.put('/:eventId/moderation/:modId/toggle', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const modId = c.req.param('modId')
  const body = await c.req.json()

  if (body.enabled === undefined) {
    return c.json({ message: 'enabled field is required' }, 400)
  }

  const result = await c.env.DB.prepare(
    `UPDATE moderation_list SET is_enabled = ?, updated_at = ? WHERE moderation_uuid = ? AND event_uuid = ?`
  ).bind(body.enabled ? 1 : 0, new Date().toISOString(), modId, eventId).run()

  if (!result.meta.changes) return c.json({ message: 'Moderation entry not found' }, 404)

  const kvService = new KVService(c.env.KV)
  await kvService.invalidateModerationCache(eventId)

  return c.json({ message: body.enabled ? 'Entry enabled' : 'Entry disabled' })
})

/**
 * DELETE /manage/:eventId/moderation/:modId
 * Permanently remove a keyword entry.
 */
moderation.delete('/:eventId/moderation/:modId', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const modId = c.req.param('modId')

  const result = await c.env.DB.prepare(
    'DELETE FROM moderation_list WHERE moderation_uuid = ? AND event_uuid = ?'
  ).bind(modId, eventId).run()

  if (!result.meta.changes) return c.json({ message: 'Moderation entry not found' }, 404)

  const kvService = new KVService(c.env.KV)
  await kvService.invalidateModerationCache(eventId)

  return c.json({ message: 'Moderation entry removed' })
})

// ═══════════════════════════════════════════════════
// FULL SCAN — Scan all attendees across all events
// against all active keywords from all events.
// ═══════════════════════════════════════════════════

/**
 * POST /manage/:eventId/moderation/scan
 * Full scan: all active keywords (from ALL events) × all attendees (from ALL events)
 * PLUS all registered website users (from auth DB).
 *
 * Creates PENDING suspect records for new matches.
 * Skips already-flagged, dismissed, and confirmed records.
 *
 * This is a global operation — keywords apply across ALL events, all roles, all users.
 * The eventId in the URL is used only for permission check.
 *
 * User scan rationale: banned users shouldn't be able to buy tickets in the first place,
 * so we pre-screen all registered users, not just existing attendees.
 */
moderation.post('/:eventId/moderation/scan', eventPermission('eventId'), async (c) => {
  // 1. Get ALL active keywords from ALL events
  const { results: allKeywords } = await c.env.DB.prepare(
    `SELECT * FROM moderation_list WHERE status = 'ACTIVE' AND is_enabled = 1`
  ).all()

  if (!allKeywords || allKeywords.length === 0) {
    return c.json({ message: 'No active keywords to scan against', suspects_created: 0, attendees_scanned: 0, users_scanned: 0 })
  }

  // 2. Get ALL active attendees from ALL events
  const { results: allAttendees } = await c.env.DB.prepare(
    `SELECT ticket_uuid, event_uuid, user_uuid, first_name, last_name, nickname, phone_number
     FROM tickets WHERE purchase_status IN ('paid', 'under_payment')`
  ).all()

  // 3. Get ALL existing attempts (to avoid duplicates) — keyed by event:user:keyword
  const { results: existingAttempts } = await c.env.DB.prepare(
    `SELECT event_uuid, user_uuid, moderation_uuid FROM moderation_attempt_log`
  ).all()
  const flaggedSet = new Set(
    (existingAttempts || []).map((a: any) => `${a.event_uuid}:${a.user_uuid}:${a.moderation_uuid}`)
  )

  // 4. Get ALL dismissals — keyed by event:user:keyword
  const { results: allDismissals } = await c.env.DB.prepare(
    `SELECT event_uuid, user_uuid, moderation_uuid FROM moderation_dismissals`
  ).all()
  const dismissedSet = new Set(
    (allDismissals || []).map((d: any) => `${d.event_uuid}:${d.user_uuid}:${d.moderation_uuid}`)
  )

  let suspectsCreated = 0
  const affectedEventIds = new Set<string>()

  // 5. Cross-match: every attendee × every keyword
  if (allAttendees && allAttendees.length > 0) {
    for (const att of allAttendees as any[]) {
      for (const kw of allKeywords as any[]) {
        const key = `${att.event_uuid}:${att.user_uuid}:${kw.moderation_uuid}`
        if (flaggedSet.has(key)) continue
        if (dismissedSet.has(key)) continue

        const matchDetails = matchPersonAgainstKeyword(att, kw)
        if (matchDetails.length > 0) {
          await createSuspect(c.env.DB, att.event_uuid, kw.moderation_uuid, kw.moderation_type, att, matchDetails)
          flaggedSet.add(key)
          affectedEventIds.add(att.event_uuid)
          suspectsCreated++
        }
      }
    }
  }

  // 6. Scan ALL website users from auth DB (pre-screen non-attendees)
  // This catches banned users BEFORE they attempt to buy tickets.
  let usersScanned = 0
  const attendeeUserUuids = new Set((allAttendees || []).map((a: any) => a.user_uuid))

  if (c.env.AUTH_DB) {
    const { results: allUsers } = await c.env.AUTH_DB.prepare(
      `SELECT uuid, email, first_name, last_name, nickname, phone_number
       FROM users WHERE is_active = 1`
    ).all()

    if (allUsers && allUsers.length > 0) {
      // Group keywords by event_uuid for efficient suspect creation
      const keywordsByEvent = new Map<string, any[]>()
      for (const kw of allKeywords as any[]) {
        const list = keywordsByEvent.get(kw.event_uuid) || []
        list.push(kw)
        keywordsByEvent.set(kw.event_uuid, list)
      }

      for (const user of allUsers as any[]) {
        // Skip users who already have tickets — they were scanned above as attendees
        if (attendeeUserUuids.has(user.uuid)) continue
        // Skip admin users — they manage the system, not attendees
        // (commented out: admins could be banned too if needed)
        usersScanned++

        const person = {
          first_name: user.first_name || undefined,
          last_name: user.last_name || undefined,
          nickname: user.nickname || undefined,
          phone_number: user.phone_number || undefined,
          email: user.email || undefined,
          user_uuid: user.uuid,
          ticket_uuid: null as string | null,
        }

        // Match against each keyword, grouping by the keyword's event
        for (const [eventUuid, keywords] of keywordsByEvent) {
          for (const kw of keywords) {
            const key = `${eventUuid}:${user.uuid}:${kw.moderation_uuid}`
            if (flaggedSet.has(key)) continue
            if (dismissedSet.has(key)) continue

            const matchDetails = matchPersonAgainstKeyword(person, kw)
            if (matchDetails.length > 0) {
              await createSuspect(c.env.DB, eventUuid, kw.moderation_uuid, kw.moderation_type, person, matchDetails)
              flaggedSet.add(key)
              affectedEventIds.add(eventUuid)
              suspectsCreated++
            }
          }
        }
      }
    }
  }

  // Invalidate caches for all affected events
  const kvService = new KVService(c.env.KV)
  for (const eid of affectedEventIds) {
    await kvService.invalidateModerationCache(eid)
  }

  return c.json({
    message: suspectsCreated > 0
      ? `Scan complete. ${suspectsCreated} new suspect(s) found across ${affectedEventIds.size} event(s).`
      : 'Scan complete. No new suspects found.',
    suspects_created: suspectsCreated,
    attendees_scanned: (allAttendees || []).length,
    users_scanned: usersScanned,
    keywords_checked: allKeywords.length,
  })
})

// ═══════════════════════════════════════════════════
// TAB 2 — ACCOUNT SUSPECTS
// Pending detections that require admin confirmation.
// ═══════════════════════════════════════════════════

/**
 * GET /manage/:eventId/moderation/suspects
 * List pending suspects (unresolved detections) — admin review queue.
 */
moderation.get('/:eventId/moderation/suspects', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200)
  const offset = (page - 1) * limit
  const typeFilter = c.req.query('type')  // BAN_BLOCKED, WATCH_DETECTED
  const detectionFilter = c.req.query('detection')  // EXACT, SIMILAR

  let query = `SELECT a.*, m.legal_name as keyword_legal_name, m.moderation_type as keyword_type
     FROM moderation_attempt_log a
     LEFT JOIN moderation_list m ON a.moderation_uuid = m.moderation_uuid
     WHERE a.event_uuid = ? AND a.resolution = 'PENDING'`
  const params: any[] = [eventId]

  if (typeFilter && ['BAN_BLOCKED', 'WATCH_DETECTED'].includes(typeFilter)) {
    query += ` AND a.attempt_type = ?`
    params.push(typeFilter)
  }

  if (detectionFilter && ['EXACT', 'SIMILAR'].includes(detectionFilter)) {
    query += ` AND a.detection_type = ?`
    params.push(detectionFilter)
  }

  const countQuery = query.replace(/SELECT a\.\*, m\.legal_name as keyword_legal_name, m\.moderation_type as keyword_type/, 'SELECT COUNT(*) as count')
  const total = await c.env.DB.prepare(countQuery).bind(...params).first() as { count: number } | null

  query += ` ORDER BY a.attempt_time DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  return c.json({
    suspects: results || [],
    pagination: {
      page,
      limit,
      total: total?.count || 0,
      total_pages: Math.ceil((total?.count || 0) / limit),
    },
  })
})

/**
 * GET /manage/:eventId/moderation/suspects/count
 * Count of pending suspects for badge display.
 */
moderation.get('/:eventId/moderation/suspects/count', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')

  const result = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM moderation_attempt_log
     WHERE event_uuid = ? AND resolution = 'PENDING'`
  ).bind(eventId).first() as { count: number } | null

  return c.json({ suspect_count: result?.count || 0 })
})

/**
 * PUT /manage/:eventId/moderation/suspects/:attemptId/confirm
 * Admin confirms a suspect as the same person → apply Ban/Watchlist action.
 *
 * Body: { action: 'BAN'|'WATCH', reason?, notes? }
 *
 * If reason is not provided, uses the original keyword reason.
 */
moderation.put('/:eventId/moderation/suspects/:attemptId/confirm', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const attemptId = c.req.param('attemptId')
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()

  const attempt = await c.env.DB.prepare(
    'SELECT * FROM moderation_attempt_log WHERE attempt_uuid = ? AND event_uuid = ?'
  ).bind(attemptId, eventId).first() as ModerationAttemptRow | null

  if (!attempt) return c.json({ message: 'Suspect not found' }, 404)
  if (attempt.resolution !== 'PENDING') {
    return c.json({ message: 'Suspect already resolved' }, 400)
  }

  const now = new Date().toISOString()

  // Mark attempt as CONFIRMED
  await c.env.DB.prepare(
    `UPDATE moderation_attempt_log SET resolution = 'CONFIRMED', resolved_by = ?, resolved_at = ?, resolution_notes = ?
     WHERE attempt_uuid = ?`
  ).bind(user.email, now, body.notes || body.reason || null, attemptId).run()

  return c.json({ message: 'Suspect confirmed. Moderation action applied.' })
})

/**
 * PUT /manage/:eventId/moderation/suspects/:attemptId/dismiss
 * Admin marks suspect as False Recognition → create exclusion record.
 *
 * Body: { notes? }
 */
moderation.put('/:eventId/moderation/suspects/:attemptId/dismiss', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const attemptId = c.req.param('attemptId')
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()

  const attempt = await c.env.DB.prepare(
    'SELECT * FROM moderation_attempt_log WHERE attempt_uuid = ? AND event_uuid = ?'
  ).bind(attemptId, eventId).first() as ModerationAttemptRow | null

  if (!attempt) return c.json({ message: 'Suspect not found' }, 404)
  if (attempt.resolution !== 'PENDING') {
    return c.json({ message: 'Suspect already resolved' }, 400)
  }

  const now = new Date().toISOString()

  // Mark attempt as FALSE_RECOGNITION
  await c.env.DB.prepare(
    `UPDATE moderation_attempt_log SET resolution = 'FALSE_RECOGNITION', resolved_by = ?, resolved_at = ?, resolution_notes = ?
     WHERE attempt_uuid = ?`
  ).bind(user.email, now, body.notes || null, attemptId).run()

  // Create persistent exclusion record to prevent re-flagging
  if (attempt.user_uuid && attempt.moderation_uuid) {
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO moderation_dismissals
       (dismissal_uuid, moderation_uuid, event_uuid, user_uuid, dismissed_by, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(), attempt.moderation_uuid, eventId,
      attempt.user_uuid, user.email, body.notes || null, now,
    ).run()
  }

  return c.json({ message: 'Suspect dismissed as false recognition. Exclusion recorded.' })
})

// ═══════════════════════════════════════════════════
// TAB 3 — CONFIRMED ACCOUNTS
// Admin-confirmed BAN/WATCH accounts.
// ═══════════════════════════════════════════════════

/**
 * GET /manage/:eventId/moderation/confirmed
 * List all confirmed BAN/WATCH accounts for this event.
 */
moderation.get('/:eventId/moderation/confirmed', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200)
  const offset = (page - 1) * limit
  const typeFilter = c.req.query('type')  // BAN_BLOCKED, WATCH_DETECTED

  let query = `SELECT a.*, m.legal_name as keyword_legal_name, m.moderation_type as keyword_type
     FROM moderation_attempt_log a
     LEFT JOIN moderation_list m ON a.moderation_uuid = m.moderation_uuid
     WHERE a.event_uuid = ? AND a.resolution IN ('CONFIRMED','SUSPENDED')`
  const params: any[] = [eventId]

  if (typeFilter && ['BAN_BLOCKED', 'WATCH_DETECTED'].includes(typeFilter)) {
    query += ` AND a.attempt_type = ?`
    params.push(typeFilter)
  }

  // Filter by status (active=CONFIRMED, suspended=SUSPENDED)
  const statusFilter = c.req.query('status')
  if (statusFilter === 'active') {
    query += ` AND a.resolution = 'CONFIRMED'`
  } else if (statusFilter === 'suspended') {
    query += ` AND a.resolution = 'SUSPENDED'`
  }

  const countQuery = query.replace(/SELECT a\.\*, m\.legal_name as keyword_legal_name, m\.moderation_type as keyword_type/, 'SELECT COUNT(*) as count')
  const total = await c.env.DB.prepare(countQuery).bind(...params).first() as { count: number } | null

  query += ` ORDER BY a.resolved_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  return c.json({
    confirmed: results || [],
    pagination: {
      page,
      limit,
      total: total?.count || 0,
      total_pages: Math.ceil((total?.count || 0) / limit),
    },
  })
})

/**
 * GET /manage/:eventId/moderation/confirmed/count
 * Count of confirmed accounts for badge display.
 */
moderation.get('/:eventId/moderation/confirmed/count', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')

  const result = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM moderation_attempt_log
     WHERE event_uuid = ? AND resolution IN ('CONFIRMED','SUSPENDED')`
  ).bind(eventId).first() as { count: number } | null

  return c.json({ confirmed_count: result?.count || 0 })
})

// ═══════════════════════════════════════════════════
// SUSPECT & CONFIRMED ACTIONS
// Change type, toggle, revoke, delete
// ═══════════════════════════════════════════════════

/**
 * PUT /manage/:eventId/moderation/suspects/:attemptId/type
 * Change suspect type from BAN_BLOCKED ↔ WATCH_DETECTED.
 *
 * Body: { type: 'BAN_BLOCKED'|'WATCH_DETECTED', notes? }
 */
moderation.put('/:eventId/moderation/suspects/:attemptId/type', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const attemptId = c.req.param('attemptId')
  const body = await c.req.json()

  if (!body.type || !['BAN_BLOCKED', 'WATCH_DETECTED'].includes(body.type)) {
    return c.json({ message: 'type must be BAN_BLOCKED or WATCH_DETECTED' }, 400)
  }

  const attempt = await c.env.DB.prepare(
    'SELECT * FROM moderation_attempt_log WHERE attempt_uuid = ? AND event_uuid = ?'
  ).bind(attemptId, eventId).first() as ModerationAttemptRow | null

  if (!attempt) return c.json({ message: 'Suspect not found' }, 404)
  if (attempt.resolution !== 'PENDING') {
    return c.json({ message: 'Only pending suspects can have their type changed' }, 400)
  }

  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `UPDATE moderation_attempt_log SET attempt_type = ?, resolution_notes = ?, resolved_at = ?
     WHERE attempt_uuid = ?`
  ).bind(body.type, body.notes || `Type changed to ${body.type}`, now, attemptId).run()

  return c.json({ message: `Suspect type changed to ${body.type}` })
})

/**
 * DELETE /manage/:eventId/moderation/suspects/:attemptId
 * Permanently remove a suspect record.
 */
moderation.delete('/:eventId/moderation/suspects/:attemptId', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const attemptId = c.req.param('attemptId')

  const attempt = await c.env.DB.prepare(
    'SELECT * FROM moderation_attempt_log WHERE attempt_uuid = ? AND event_uuid = ?'
  ).bind(attemptId, eventId).first() as ModerationAttemptRow | null

  if (!attempt) return c.json({ message: 'Suspect not found' }, 404)
  if (attempt.resolution !== 'PENDING') {
    return c.json({ message: 'Only pending suspects can be deleted' }, 400)
  }

  await c.env.DB.prepare(
    'DELETE FROM moderation_attempt_log WHERE attempt_uuid = ?'
  ).bind(attemptId).run()

  return c.json({ message: 'Suspect record deleted' })
})

/**
 * PUT /manage/:eventId/moderation/confirmed/:attemptId/type
 * Change confirmed account type BAN_BLOCKED ↔ WATCH_DETECTED.
 *
 * Body: { type: 'BAN_BLOCKED'|'WATCH_DETECTED', notes? }
 */
moderation.put('/:eventId/moderation/confirmed/:attemptId/type', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const attemptId = c.req.param('attemptId')
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()

  if (!body.type || !['BAN_BLOCKED', 'WATCH_DETECTED'].includes(body.type)) {
    return c.json({ message: 'type must be BAN_BLOCKED or WATCH_DETECTED' }, 400)
  }

  const attempt = await c.env.DB.prepare(
    'SELECT * FROM moderation_attempt_log WHERE attempt_uuid = ? AND event_uuid = ?'
  ).bind(attemptId, eventId).first() as ModerationAttemptRow | null

  if (!attempt) return c.json({ message: 'Confirmed account not found' }, 404)
  if (attempt.resolution !== 'CONFIRMED' && attempt.resolution !== 'SUSPENDED') {
    return c.json({ message: 'Only confirmed/suspended accounts can have their type changed' }, 400)
  }

  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `UPDATE moderation_attempt_log SET attempt_type = ?, resolved_by = ?, resolved_at = ?,
     resolution_notes = ?
     WHERE attempt_uuid = ?`
  ).bind(body.type, user.email, now, body.notes || `Type changed to ${body.type}`, attemptId).run()

  return c.json({ message: `Account type changed to ${body.type}` })
})

/**
 * PUT /manage/:eventId/moderation/confirmed/:attemptId/toggle
 * Toggle a confirmed account between CONFIRMED (active enforcement) and SUSPENDED (paused).
 */
moderation.put('/:eventId/moderation/confirmed/:attemptId/toggle', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const attemptId = c.req.param('attemptId')
  const user = c.get('user') as JWTPayload

  const attempt = await c.env.DB.prepare(
    'SELECT * FROM moderation_attempt_log WHERE attempt_uuid = ? AND event_uuid = ?'
  ).bind(attemptId, eventId).first() as ModerationAttemptRow | null

  if (!attempt) return c.json({ message: 'Confirmed account not found' }, 404)
  if (attempt.resolution !== 'CONFIRMED' && attempt.resolution !== 'SUSPENDED') {
    return c.json({ message: 'Only confirmed/suspended accounts can be toggled' }, 400)
  }

  const newResolution = attempt.resolution === 'CONFIRMED' ? 'SUSPENDED' : 'CONFIRMED'
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `UPDATE moderation_attempt_log SET resolution = ?, resolved_by = ?, resolved_at = ?,
     resolution_notes = ?
     WHERE attempt_uuid = ?`
  ).bind(
    newResolution, user.email, now,
    `Enforcement ${newResolution === 'CONFIRMED' ? 'activated' : 'suspended'} by admin`,
    attemptId,
  ).run()

  return c.json({
    message: `Enforcement ${newResolution === 'CONFIRMED' ? 'activated' : 'suspended'}`,
    new_status: newResolution,
  })
})

/**
 * PUT /manage/:eventId/moderation/confirmed/:attemptId/revoke
 * Revoke a confirmed account back to PENDING for re-review.
 *
 * Body: { notes? }
 */
moderation.put('/:eventId/moderation/confirmed/:attemptId/revoke', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const attemptId = c.req.param('attemptId')
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()

  const attempt = await c.env.DB.prepare(
    'SELECT * FROM moderation_attempt_log WHERE attempt_uuid = ? AND event_uuid = ?'
  ).bind(attemptId, eventId).first() as ModerationAttemptRow | null

  if (!attempt) return c.json({ message: 'Confirmed account not found' }, 404)
  if (attempt.resolution !== 'CONFIRMED' && attempt.resolution !== 'SUSPENDED') {
    return c.json({ message: 'Only confirmed/suspended accounts can be revoked' }, 400)
  }

  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `UPDATE moderation_attempt_log SET resolution = 'PENDING', resolved_by = ?, resolved_at = ?,
     resolution_notes = ?
     WHERE attempt_uuid = ?`
  ).bind(user.email, now, body.notes || 'Revoked by admin — returned to pending review', attemptId).run()

  return c.json({ message: 'Account revoked. Moved back to pending suspects.' })
})

// ═══════════════════════════════════════════════════
// TAB 4 — ATTEMPT LOGS (enforcement actions)
// Actual blocked purchases and scanner flags for
// confirmed BAN/WATCH accounts.
// ═══════════════════════════════════════════════════

/**
 * GET /manage/:eventId/moderation/attempts
 * Enforcement log: blocked purchase attempts and scanner flags.
 */
moderation.get('/:eventId/moderation/attempts', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200)
  const offset = (page - 1) * limit
  const actionType = c.req.query('action_type')  // PURCHASE_BLOCKED, SCAN_FLAGGED

  let query = `SELECT * FROM moderation_enforcement_log WHERE event_uuid = ?`
  const params: any[] = [eventId]

  if (actionType && ['PURCHASE_BLOCKED', 'SCAN_FLAGGED'].includes(actionType)) {
    query += ` AND action_type = ?`
    params.push(actionType)
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count')
  const total = await c.env.DB.prepare(countQuery).bind(...params).first() as { count: number } | null

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  return c.json({
    attempts: results || [],
    pagination: {
      page,
      limit,
      total: total?.count || 0,
      total_pages: Math.ceil((total?.count || 0) / limit),
    },
  })
})

// ═══════════════════════════════════════════════════
// APPEAL SYSTEM
// Admin-initiated status changes with full history.
// ═══════════════════════════════════════════════════

/**
 * POST /manage/:eventId/moderation/:modId/appeal
 * File an appeal to restore a banned/watched person to normal.
 * History is preserved — moderation entry set to APPEALED status.
 *
 * Body: { appeal_reason }
 */
moderation.post('/:eventId/moderation/:modId/appeal', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const modId = c.req.param('modId')
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()

  if (!body.appeal_reason?.trim()) {
    return c.json({ message: 'appeal_reason is required' }, 400)
  }

  const entry = await c.env.DB.prepare(
    'SELECT * FROM moderation_list WHERE moderation_uuid = ? AND event_uuid = ?'
  ).bind(modId, eventId).first() as ModerationRow | null

  if (!entry) return c.json({ message: 'Moderation entry not found' }, 404)

  if (entry.status === 'APPEALED') {
    return c.json({ message: 'This entry has already been appealed' }, 400)
  }

  const now = new Date().toISOString()
  const appealUuid = crypto.randomUUID()

  // Create appeal record (full history)
  await c.env.DB.prepare(
    `INSERT INTO moderation_appeals
     (appeal_uuid, moderation_uuid, event_uuid, previous_type, previous_status, new_status,
      appeal_reason, appealed_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    appealUuid, modId, eventId,
    entry.moderation_type, 'ACTIVE', 'APPEALED',
    body.appeal_reason.trim(), user.email, now,
  ).run()

  // Update to APPEALED
  await c.env.DB.prepare(
    `UPDATE moderation_list SET status = 'APPEALED', updated_at = ? WHERE moderation_uuid = ?`
  ).bind(now, modId).run()

  const kvService = new KVService(c.env.KV)
  await kvService.invalidateModerationCache(eventId)

  return c.json({
    message: 'Appeal filed. Person is no longer flagged.',
    appeal_uuid: appealUuid,
  })
})

/**
 * POST /manage/:eventId/moderation/:modId/reinstate
 * Re-activate a previously appealed moderation entry.
 *
 * Body: { moderation_type: 'BAN'|'WATCH', notes? }
 */
moderation.post('/:eventId/moderation/:modId/reinstate', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const modId = c.req.param('modId')
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()

  if (!body.moderation_type || !['BAN', 'WATCH'].includes(body.moderation_type)) {
    return c.json({ message: 'moderation_type (BAN or WATCH) is required' }, 400)
  }

  const entry = await c.env.DB.prepare(
    'SELECT * FROM moderation_list WHERE moderation_uuid = ? AND event_uuid = ?'
  ).bind(modId, eventId).first() as ModerationRow | null

  if (!entry) return c.json({ message: 'Moderation entry not found' }, 404)

  const now = new Date().toISOString()

  // Log the reinstatement as an appeal record (reverse appeal)
  await c.env.DB.prepare(
    `INSERT INTO moderation_appeals
     (appeal_uuid, moderation_uuid, event_uuid, previous_type, previous_status, new_status,
      appeal_reason, appealed_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    crypto.randomUUID(), modId, eventId,
    entry.moderation_type, entry.status, 'ACTIVE',
    body.notes || 'Reinstated by admin', user.email, now,
  ).run()

  await c.env.DB.prepare(
    `UPDATE moderation_list SET status = 'ACTIVE', moderation_type = ?, is_enabled = 1,
     notes = COALESCE(?, notes), updated_at = ?
     WHERE moderation_uuid = ?`
  ).bind(body.moderation_type, body.notes || null, now, modId).run()

  const kvService = new KVService(c.env.KV)
  await kvService.invalidateModerationCache(eventId)

  return c.json({ message: 'Moderation entry reinstated' })
})

/**
 * GET /manage/:eventId/moderation/:modId/appeals
 * Get appeal history for a keyword entry.
 */
moderation.get('/:eventId/moderation/:modId/appeals', eventPermission('eventId'), async (c) => {
  const modId = c.req.param('modId')

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM moderation_appeals WHERE moderation_uuid = ? ORDER BY created_at DESC'
  ).bind(modId).all()

  return c.json({ appeals: results || [] })
})

// ═══════════════════════════════════════════════════
// MODERATION CHECK (for scanner / ticket verify)
// ═══════════════════════════════════════════════════

/**
 * POST /manage/:eventId/moderation/check
 * Manual moderation check. Returns match status without logging an attempt.
 *
 * Body: { first_name?, last_name?, nickname?, email?, phone_number? }
 */
moderation.post('/:eventId/moderation/check', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const body = await c.req.json()

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM moderation_list WHERE event_uuid = ? AND status = 'ACTIVE' AND is_enabled = 1`
  ).bind(eventId).all()

  const matches: any[] = []

  for (const entry of (results || [])) {
    const matchedFields: string[] = []
    const e = entry as any

    if (body.first_name && e.first_name && body.first_name.toLowerCase().trim() === e.first_name.toLowerCase().trim()) {
      matchedFields.push('first_name')
    }
    if (body.last_name && e.last_name && body.last_name.toLowerCase().trim() === e.last_name.toLowerCase().trim()) {
      matchedFields.push('last_name')
    }
    if (body.nickname && e.nickname && body.nickname.toLowerCase().trim() === e.nickname.toLowerCase().trim()) {
      matchedFields.push('nickname')
    }
    if (body.email && e.email && body.email.toLowerCase().trim() === e.email.toLowerCase().trim()) {
      matchedFields.push('email')
    }
    if (body.phone_number && e.phone_number && body.phone_number.replace(/\D/g, '') === e.phone_number.replace(/\D/g, '')) {
      matchedFields.push('phone_number')
    }

    const fullName = [body.first_name, body.last_name].filter(Boolean).join(' ').toLowerCase().trim()
    if (fullName && e.legal_name && (
      fullName === e.legal_name.toLowerCase().trim() ||
      e.legal_name.toLowerCase().trim().includes(fullName) ||
      fullName.includes(e.legal_name.toLowerCase().trim())
    )) {
      matchedFields.push('legal_name')
    }

    if (matchedFields.length > 0) {
      matches.push({
        moderation_uuid: e.moderation_uuid,
        moderation_type: e.moderation_type,
        legal_name: e.legal_name,
        matched_fields: matchedFields,
      })
    }
  }

  return c.json({
    has_match: matches.length > 0,
    matches,
  })
})

// ─── Legacy compatibility: pending-count → suspects/count ───
moderation.get('/:eventId/moderation/pending-count', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const result = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM moderation_attempt_log
     WHERE event_uuid = ? AND resolution = 'PENDING'`
  ).bind(eventId).first() as { count: number } | null
  return c.json({ pending_count: result?.count || 0 })
})

export { moderation }
