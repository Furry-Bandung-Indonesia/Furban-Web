/**
 * Furban Ticketing — Type Definitions
 */

// ─── Cloudflare Bindings ───────────────────────────
export type Bindings = {
  DB: D1Database
  AUTH_DB: D1Database
  BUCKET: R2Bucket
  KV: KVNamespace
  // EMAIL_QUEUE: Queue  // uncomment when queue is provisioned
  JWT_SECRET: string
  TURNSTILE_SECRET: string
  WIJAYAPAY_MERCHANT_CODE: string
  WIJAYAPAY_API_KEY: string
  WIJAYAPAY_CALLBACK_WHITELIST: string
}

// ─── JWT Payload (shared with backend-auth) ────────
export interface JWTPayload {
  sub: string       // user uuid
  email: string
  role: string       // CSV roles e.g. "admin,publisher"
  pending_profile: boolean
  exp: number
  iat: number
}

// ─── App Variables in Hono Context ─────────────────
export type Variables = {
  user: JWTPayload
  eventRole: 'ADMIN' | 'HOST' | null
}

// ─── DB Row Types ──────────────────────────────────
export interface EventRow {
  event_uuid: string
  creator_uuid: string
  event_name: string
  description: string | null
  banner_filename: string | null
  tos_text: string | null
  location_lat: number | null
  location_long: number | null
  location_name: string | null
  start_time: string
  end_time: string
  food_enabled: number
  food_multi_select: number
  food_options: string
  drinks_enabled: number
  drinks_multi_select: number
  drink_options: string
  status: 'draft' | 'published' | 'closed'
  sales_status: 'available' | 'sold_out' | 'coming_soon' | 'unavailable'
  sales_open_time: string | null
  sales_close_time: string | null
  created_at: string
  updated_at: string
}

export interface TierRow {
  tier_uuid: string
  event_uuid: string
  tier_name: string
  tier_description: string | null
  price_total: number
  admin_fee_internal: number
  quota_total: number
  quota_available: number
  sort_order: number
  name_your_price: number
  created_at: string
  updated_at: string
}

export interface TicketRow {
  ticket_uuid: string
  event_uuid: string
  tier_uuid: string
  user_uuid: string
  ticket_number: string | null  // Assigned only after payment
  first_name: string | null
  last_name: string | null
  nickname: string | null
  date_of_birth: string | null
  phone_number: string | null
  is_fursuiter: number
  food_selection: string
  food_total: number
  food_notes: string | null
  food_received: number
  food_received_at: string | null
  food_received_by: string | null
  drink_selection: string
  drink_total: number
  drink_received: number
  drink_received_at: string | null
  drink_received_by: string | null
  purchase_status: 'under_payment' | 'paid' | 'expired' | 'failed' | 'revoked'
  claim_expiry: string | null
  is_redeemed: number
  redeemed_at: string | null
  redeemed_by: string | null
  revoke_reason: string | null
  revoked_by: string | null
  revoked_at: string | null
  created_at: string
  updated_at: string
}

// ─── Moderation: Tab 1 — Keyword List ──────────────
export interface ModerationRow {
  moderation_uuid: string
  event_uuid: string
  legal_name: string
  first_name: string | null
  last_name: string | null
  nickname: string | null
  email: string | null
  phone_number: string | null
  moderation_type: 'BAN' | 'WATCH'
  status: 'ACTIVE' | 'APPEALED'
  is_enabled: number        // 1=enabled, 0=disabled
  notes: string | null
  added_by: string
  created_at: string
  updated_at: string
}

// ─── Moderation: Tab 2 — Account Suspects & Tab 3 — Attempt Logs ──
export interface ModerationAttemptRow {
  attempt_uuid: string
  event_uuid: string
  moderation_uuid: string | null
  masked_name: string
  attempt_type: 'BAN_BLOCKED' | 'WATCH_DETECTED'
  detection_type: 'EXACT' | 'SIMILAR'
  similarity_score: number | null  // 0-100, null for exact matches
  raw_legal_name: string | null
  raw_nickname: string | null
  raw_email: string | null
  raw_phone: string | null
  user_uuid: string | null
  ticket_uuid: string | null
  matched_fields: string | null    // JSON array of field names
  resolution: 'PENDING' | 'FALSE_RECOGNITION' | 'CONFIRMED' | 'SUSPENDED'
  resolved_by: string | null
  resolved_at: string | null
  resolution_notes: string | null
  attempt_time: string
}

// ─── Moderation: Appeal History ────────────────────
export interface ModerationAppealRow {
  appeal_uuid: string
  moderation_uuid: string
  event_uuid: string
  previous_type: string
  previous_status: string
  new_status: string
  appeal_reason: string
  appealed_by: string
  created_at: string
}

// ─── Moderation: False Recognition Exclusions ──────
export interface ModerationDismissalRow {
  dismissal_uuid: string
  moderation_uuid: string
  event_uuid: string
  user_uuid: string
  dismissed_by: string
  reason: string | null
  created_at: string
}

export interface PermissionRow {
  permission_uuid: string
  event_uuid: string
  user_uuid: string
  role: 'ADMIN' | 'HOST'
  granted_by: string
  created_at: string
}

export interface PurchaseLogRow {
  purchase_uuid: string
  ticket_uuid: string
  event_uuid: string
  user_uuid: string
  payment_status: 'under_payment' | 'paid' | 'expired' | 'failed'
  payment_reference: string | null
  amount_paid: number
  created_at: string
  updated_at: string
}

// ─── Payment Channel ───────────────────────────────
export interface PaymentChannelRow {
  channel_uuid: string
  code: string
  name: string
  group_name: string
  image_url: string | null
  fee_amount: number
  fee_percent: number
  type_fee: 'customer' | 'merchant'
  min_trx: number
  max_trx: number
  tutorial: string | null
  is_enabled: number
  gateway_status: string
  sort_order: number
  synced_at: string | null
  created_at: string
  updated_at: string
}

// ─── Payment Transaction ──────────────────────────
export interface PaymentTransactionRow {
  transaction_uuid: string
  event_uuid: string
  ticket_uuid: string | null
  user_uuid: string
  ref_id: string
  trx_reference: string | null
  channel_code: string
  payment_name: string | null
  payment_method: string | null
  payment_image: string | null
  nominal: number
  total_bayar: number | null
  total_fee: number | null
  total_diterima: number | null
  nomor_va: string | null
  nomor_pembayaran: string | null
  qr_image: string | null
  qr_string: string | null
  tutorial: string | null
  expired_at: string | null
  status: 'pending' | 'paid' | 'expired' | 'failed'
  paid_at: string | null
  callback_data: string | null
  created_at: string
  updated_at: string
}

// ─── Event Financial Settings ─────────────────────
export interface EventFinancialRow {
  financial_uuid: string
  event_uuid: string
  admin_fee_percent: number
  admin_fee_fixed: number
  host_payout_total: number
  host_payout_status: 'pending' | 'partial' | 'completed'
  host_payout_notes: string | null
  host_payout_at: string | null
  created_at: string
  updated_at: string
}

// ─── KV Value Types ────────────────────────────────
export interface ClaimHold {
  ticket_uuid: string
  tier_uuid: string
  timestamp: number
}

// ─── Queue Message Types ───────────────────────────
export interface EmailQueueMessage {
  type: 'purchase_receipt' | 'redeem_confirmation'
  ticket_uuid: string
  event_uuid: string
  to_email: string
  data: Record<string, any>
}
