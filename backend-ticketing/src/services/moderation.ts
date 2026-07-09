/**
 * Moderation Service v3
 *
 * Keyword-based moderation with:
 * - Exact matching for email, phone, username
 * - Similarity matching for names (Levenshtein, >80% threshold)
 * - Never auto-bans — creates suspects for admin review
 * - False recognition exclusions (persistent)
 * - BAN blocks ticket purchase; WATCH allows but logs silently
 *
 * Check runs during ticket claim to minimize CPU usage.
 */
import type { ModerationRow } from '../types'
import { maskName } from './masking'
import { KVService } from './kv'

// ─── Similarity Utilities ──────────────────────────

/**
 * Levenshtein distance between two strings (case-insensitive).
 */
function levenshtein(a: string, b: string): number {
  a = a.toLowerCase()
  b = b.toLowerCase()
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

/**
 * Similarity score (0–100) between two strings.
 * 100 = identical, 0 = completely different.
 */
function similarityScore(a: string, b: string): number {
  if (!a || !b) return 0
  a = a.trim().toLowerCase()
  b = b.trim().toLowerCase()
  if (a === b) return 100
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 100
  const dist = levenshtein(a, b)
  return Math.round(((maxLen - dist) / maxLen) * 100)
}

const SIMILARITY_THRESHOLD = 80  // % similarity required for name-based matching

export { similarityScore, SIMILARITY_THRESHOLD }

// ─── Check Result Types ────────────────────────────

export interface ModerationMatchDetail {
  field: string
  keyword_value: string
  input_value: string
  detection_type: 'EXACT' | 'SIMILAR'
  similarity_score: number
}

export interface ModerationCheckResult {
  blocked: boolean
  watched: boolean
  match: ModerationRow | null
  matchedFields: string[]
  matchDetails: ModerationMatchDetail[]
  detection_type: 'EXACT' | 'SIMILAR'
  similarity_score: number   // highest score among matches
}

// ─── Service Class ─────────────────────────────────

export class ModerationService {
  constructor(
    private db: D1Database,
    private kvService: KVService,
  ) {}

  /**
   * Check a person's details against the moderation list for a given event.
   * Uses KV cache with 5-min TTL.
   *
   * Matching logic:
   * - EXACT: email, social_link (high confidence)
   * - SIMILAR: legal_name, first_name, last_name, nickname (Levenshtein >= 80%)
   *
   * Skips entries that are disabled or dismissed for this specific user.
   */
  async check(
    eventUuid: string,
    details: {
      firstName: string
      lastName?: string
      nickname?: string
      email?: string
      phoneNumber?: string
    },
    userUuid?: string,
  ): Promise<ModerationCheckResult> {
    // Get moderation list (cached)
    let list = await this.kvService.getModerationCache(eventUuid)

    if (!list) {
      const { results } = await this.db
        .prepare(`SELECT * FROM moderation_list WHERE event_uuid = ? AND status = 'ACTIVE' AND is_enabled = 1`)
        .bind(eventUuid)
        .all()
      list = results || []
      await this.kvService.setModerationCache(eventUuid, list)
    }

    // If user has dismissals, get them to exclude
    let dismissedModIds: Set<string> = new Set()
    if (userUuid) {
      const { results: dismissals } = await this.db
        .prepare('SELECT moderation_uuid FROM moderation_dismissals WHERE event_uuid = ? AND user_uuid = ?')
        .bind(eventUuid, userUuid)
        .all()
      dismissedModIds = new Set((dismissals || []).map((d: any) => d.moderation_uuid))
    }

    const inputFirst = details.firstName?.trim().toLowerCase() || ''
    const inputLast = details.lastName?.trim().toLowerCase() || ''
    const inputNick = details.nickname?.trim().toLowerCase() || ''
    const inputEmail = details.email?.trim().toLowerCase() || ''
    const inputSocial = details.phoneNumber?.replace(/\D/g, '') || ''
    const inputFullName = [inputFirst, inputLast].filter(Boolean).join(' ')

    for (const entry of list) {
      const e = entry as any

      // Skip disabled or dismissed entries
      if (e.is_enabled === 0) continue
      if (dismissedModIds.has(e.moderation_uuid)) continue

      const matchDetails: ModerationMatchDetail[] = []

      // ── EXACT MATCHES (high confidence) ──

      // Email match (exact)
      const entryEmail = (e.email || '').trim().toLowerCase()
      if (entryEmail && inputEmail && entryEmail === inputEmail) {
        matchDetails.push({
          field: 'email', keyword_value: entryEmail, input_value: inputEmail,
          detection_type: 'EXACT', similarity_score: 100,
        })
      }

      // Phone match (exact, digits only)
      const entrySocial = (e.social_link || '').replace(/\D/g, '')
      if (entrySocial && inputSocial && entrySocial === inputSocial) {
        matchDetails.push({
          field: 'social_link', keyword_value: entrySocial, input_value: inputSocial,
          detection_type: 'EXACT', similarity_score: 100,
        })
      }

      // ── SIMILARITY MATCHES (names — threshold required) ──

      // Legal name vs full name
      const entryLegal = (e.legal_name || '').trim().toLowerCase()
      if (entryLegal && inputFullName) {
        const score = similarityScore(entryLegal, inputFullName)
        if (score >= SIMILARITY_THRESHOLD) {
          matchDetails.push({
            field: 'legal_name', keyword_value: entryLegal, input_value: inputFullName,
            detection_type: score === 100 ? 'EXACT' : 'SIMILAR', similarity_score: score,
          })
        }
      }

      // First name
      const entryFirst = (e.first_name || '').trim().toLowerCase()
      if (entryFirst && inputFirst) {
        const score = similarityScore(entryFirst, inputFirst)
        if (score >= SIMILARITY_THRESHOLD) {
          matchDetails.push({
            field: 'first_name', keyword_value: entryFirst, input_value: inputFirst,
            detection_type: score === 100 ? 'EXACT' : 'SIMILAR', similarity_score: score,
          })
        }
      }

      // Last name
      const entryLast = (e.last_name || '').trim().toLowerCase()
      if (entryLast && inputLast) {
        const score = similarityScore(entryLast, inputLast)
        if (score >= SIMILARITY_THRESHOLD) {
          matchDetails.push({
            field: 'last_name', keyword_value: entryLast, input_value: inputLast,
            detection_type: score === 100 ? 'EXACT' : 'SIMILAR', similarity_score: score,
          })
        }
      }

      // Nickname
      const entryNick = (e.nickname || '').trim().toLowerCase()
      if (entryNick && inputNick) {
        const score = similarityScore(entryNick, inputNick)
        if (score >= SIMILARITY_THRESHOLD) {
          matchDetails.push({
            field: 'nickname', keyword_value: entryNick, input_value: inputNick,
            detection_type: score === 100 ? 'EXACT' : 'SIMILAR', similarity_score: score,
          })
        }
      }

      // Cross-match: nickname vs legal name
      if (entryNick && inputFullName) {
        const score = similarityScore(entryNick, inputFullName)
        if (score >= SIMILARITY_THRESHOLD && !matchDetails.find(d => d.field === 'nickname')) {
          matchDetails.push({
            field: 'nickname_vs_legal', keyword_value: entryNick, input_value: inputFullName,
            detection_type: score === 100 ? 'EXACT' : 'SIMILAR', similarity_score: score,
          })
        }
      }

      if (matchDetails.length > 0) {
        const hasExact = matchDetails.some(d => d.detection_type === 'EXACT')
        const highestScore = Math.max(...matchDetails.map(d => d.similarity_score))
        const fields = matchDetails.map(d => d.field)

        return {
          blocked: e.moderation_type === 'BAN',
          watched: e.moderation_type === 'WATCH',
          match: e as ModerationRow,
          matchedFields: fields,
          matchDetails,
          detection_type: hasExact ? 'EXACT' : 'SIMILAR',
          similarity_score: highestScore,
        }
      }
    }

    return {
      blocked: false, watched: false, match: null,
      matchedFields: [], matchDetails: [],
      detection_type: 'EXACT', similarity_score: 0,
    }
  }

  /**
   * Log a moderation attempt (creates suspect entry for admin review).
   */
  async logAttempt(
    eventUuid: string,
    moderationUuid: string | null,
    legalName: string,
    nickname: string,
    type: 'BAN_BLOCKED' | 'WATCH_DETECTED',
    detectionType: 'EXACT' | 'SIMILAR',
    similarityScore: number | null,
    userUuid?: string,
    ticketUuid?: string,
    matchedFields?: string[],
    email?: string,
    phone?: string,
  ): Promise<void> {
    const masked = maskName(`${legalName} ${nickname || ''}`.trim())
    const uuid = crypto.randomUUID()

    await this.db
      .prepare(
        `INSERT INTO moderation_attempt_log
         (attempt_uuid, event_uuid, moderation_uuid, masked_name, attempt_type,
          detection_type, similarity_score,
          raw_legal_name, raw_nickname, raw_email, raw_social,
          user_uuid, ticket_uuid, matched_fields, resolution)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      )
      .bind(
        uuid, eventUuid, moderationUuid, masked, type,
        detectionType, similarityScore,
        legalName, nickname || null,
        email || null, phone || null,
        userUuid || null, ticketUuid || null,
        matchedFields ? JSON.stringify(matchedFields) : null,
      )
      .run()
  }
}
