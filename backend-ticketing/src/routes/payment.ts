/**
 * Payment Routes
 *
 * Manages:
 * 1. Payment Channels — Admin enable/disable, sync from WijayaPay
 * 2. Payment Generation — Create transactions via WijayaPay API
 * 3. Payment Status — Check transaction status
 * 4. Callback/Webhook — WijayaPay notifies payment completion
 * 5. Event Financials — Income tracking, admin/host split, payout management
 */
import { Hono } from 'hono'
import type { Bindings, Variables, JWTPayload, PaymentChannelRow, PaymentTransactionRow, EventFinancialRow } from '../types'
import { authMiddleware, eventPermission } from '../middleware/auth'
import { expireSingleTicket } from '../services/ticketExpiry'

const payment = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ═══════════════════════════════════════════════════
// HELPER: WijayaPay API calls
// ═══════════════════════════════════════════════════

async function wijayapayGetPayments(merchantCode: string, apiKey: string) {
  const url = `https://wijayapay.com/api/get-payment?code_merchant=${merchantCode}&api_key=${apiKey}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Furban-Ticketing/1.0' },
  })
  return res.json() as Promise<{ success: boolean; data?: any[]; message?: string }>
}

async function wijayapayCreateTransaction(
  merchantCode: string,
  apiKey: string,
  refId: string,
  codePayment: string,
  nominal: number,
) {
  const signature = await md5(`${merchantCode}${apiKey}${refId}`)
  const body = new URLSearchParams({
    code_merchant: merchantCode,
    api_key: apiKey,
    code_payment: codePayment,
    ref_id: refId,
    nominal: nominal.toString(),
  })

  const res = await fetch('https://wijayapay.com/api/transaction/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Furban-Ticketing/1.0',
      'X-Signature': signature,
    },
    body: body.toString(),
  })
  return res.json() as Promise<{ success: boolean; data?: any; message?: string }>
}

async function wijayapayCheckStatus(merchantCode: string, apiKey: string, refId: string) {
  const url = `https://wijayapay.com/api/get-status?code_merchant=${merchantCode}&api_key=${apiKey}&ref_id=${refId}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Furban-Ticketing/1.0' },
  })
  return res.json() as Promise<{ data?: any; status_pembayaran?: string }>
}

/** MD5 hash using Cloudflare Workers Web Crypto API (supports MD5) */
async function md5(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('MD5', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ═══════════════════════════════════════════════════
// ADMIN: PAYMENT CHANNEL MANAGEMENT (Global)
// ═══════════════════════════════════════════════════

payment.use('*', authMiddleware)

/**
 * GET /manage/:eventId/payment/channels
 * List all payment channels (admin view — shows enable/disable state).
 */
payment.get('/:eventId/payment/channels', eventPermission('eventId'), async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM payment_channels ORDER BY sort_order ASC, group_name ASC, name ASC'
  ).all()

  return c.json({ channels: results || [] })
})

/**
 * POST /manage/:eventId/payment/channels/sync
 * Sync payment channels from WijayaPay API.
 * Fetches live channel list and upserts into local DB.
 */
payment.post('/:eventId/payment/channels/sync', eventPermission('eventId'), async (c) => {
  const merchantCode = c.env.WIJAYAPAY_MERCHANT_CODE
  const apiKey = c.env.WIJAYAPAY_API_KEY

  if (!merchantCode || !apiKey) {
    return c.json({ message: 'WijayaPay credentials not configured' }, 500)
  }

  const result = await wijayapayGetPayments(merchantCode, apiKey)
  if (!result.success || !result.data) {
    return c.json({ message: result.message || 'Failed to fetch channels from WijayaPay' }, 502)
  }

  const now = new Date().toISOString()
  let synced = 0, created = 0

  for (const ch of result.data) {
    const existing = await c.env.DB.prepare(
      'SELECT channel_uuid, is_enabled FROM payment_channels WHERE code = ?'
    ).bind(ch.code).first() as PaymentChannelRow | null

    if (existing) {
      // Update gateway data but preserve admin's is_enabled toggle
      await c.env.DB.prepare(
        `UPDATE payment_channels SET
         name = ?, group_name = ?, image_url = ?, fee_amount = ?, fee_percent = ?,
         type_fee = ?, min_trx = ?, max_trx = ?, tutorial = ?,
         gateway_status = ?, synced_at = ?, updated_at = ?
         WHERE code = ?`
      ).bind(
        ch.name, ch.group, ch.image, parseFloat(ch.fee_amount) || 0, parseFloat(ch.fee_percent) || 0,
        ch.type_fee || 'merchant', parseFloat(ch.min_trx) || 0, parseFloat(ch.max_trx) || 0,
        ch.tutorial_pembayaran || null,
        ch.status, now, now, ch.code,
      ).run()
      synced++
    } else {
      await c.env.DB.prepare(
        `INSERT INTO payment_channels
         (channel_uuid, code, name, group_name, image_url, fee_amount, fee_percent,
          type_fee, min_trx, max_trx, tutorial, is_enabled, gateway_status,
          sort_order, synced_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(), ch.code, ch.name, ch.group, ch.image,
        parseFloat(ch.fee_amount) || 0, parseFloat(ch.fee_percent) || 0,
        ch.type_fee || 'merchant', parseFloat(ch.min_trx) || 0, parseFloat(ch.max_trx) || 0,
        ch.tutorial_pembayaran || null,
        ch.status, synced + created, now, now, now,
      ).run()
      created++
    }
  }

  return c.json({
    message: `Sync complete: ${created} new, ${synced} updated`,
    total: result.data.length,
    created,
    updated: synced,
  })
})

/**
 * PUT /manage/:eventId/payment/channels/:code/toggle
 * Toggle a payment channel enabled/disabled.
 */
payment.put('/:eventId/payment/channels/:code/toggle', eventPermission('eventId'), async (c) => {
  const code = c.req.param('code')

  const channel = await c.env.DB.prepare(
    'SELECT * FROM payment_channels WHERE code = ?'
  ).bind(code).first() as PaymentChannelRow | null

  if (!channel) return c.json({ message: 'Channel not found' }, 404)

  const newState = channel.is_enabled ? 0 : 1
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    'UPDATE payment_channels SET is_enabled = ?, updated_at = ? WHERE code = ?'
  ).bind(newState, now, code).run()

  return c.json({
    message: `Channel ${code} ${newState ? 'enabled' : 'disabled'}`,
    is_enabled: newState,
  })
})

/**
 * PUT /manage/:eventId/payment/channels/reorder
 * Update sort order for all channels.
 *
 * Body: { orders: [{ code: 'BCAVA', sort_order: 0 }, ...] }
 */
payment.put('/:eventId/payment/channels/reorder', eventPermission('eventId'), async (c) => {
  const body = await c.req.json()
  if (!body.orders || !Array.isArray(body.orders)) {
    return c.json({ message: 'orders array is required' }, 400)
  }

  const now = new Date().toISOString()
  for (const { code, sort_order } of body.orders) {
    await c.env.DB.prepare(
      'UPDATE payment_channels SET sort_order = ?, updated_at = ? WHERE code = ?'
    ).bind(sort_order, now, code).run()
  }

  return c.json({ message: 'Sort order updated' })
})

// ═══════════════════════════════════════════════════
// PUBLIC: AVAILABLE PAYMENT CHANNELS (User view)
// ═══════════════════════════════════════════════════

/**
 * GET /payment/channels/public
 * List enabled payment channels for users.
 * No tutorial included (per requirement).
 */
payment.get('/channels/public', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT code, name, group_name, image_url
     FROM payment_channels
     WHERE is_enabled = 1 AND gateway_status = 'active'
     ORDER BY sort_order ASC, group_name ASC, name ASC`
  ).all()

  return c.json({ channels: results || [] })
})

// ═══════════════════════════════════════════════════
// PAYMENT GENERATION
// ═══════════════════════════════════════════════════

/**
 * POST /payment/generate
 * Generate a payment via WijayaPay.
 *
 * Body: { event_uuid, ticket_uuid, channel_code, nominal }
 */
payment.post('/generate', authMiddleware, async (c) => {
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()

  const { event_uuid, ticket_uuid, channel_code, nominal } = body

  if (!event_uuid || !channel_code || !nominal) {
    return c.json({ message: 'event_uuid, channel_code, and nominal are required' }, 400)
  }

  // If a ticket is attached, verify it hasn't expired by time
  if (ticket_uuid) {
    const ticket = await c.env.DB.prepare(
      `SELECT ticket_uuid, purchase_status, claim_expiry FROM tickets WHERE ticket_uuid = ?`
    ).bind(ticket_uuid).first() as any

    if (!ticket) {
      return c.json({ message: 'Ticket not found' }, 404)
    }
    if (ticket.purchase_status !== 'under_payment') {
      return c.json({ message: `Ticket is already ${ticket.purchase_status}` }, 400)
    }
    if (ticket.claim_expiry && new Date(ticket.claim_expiry) < new Date()) {
      await expireSingleTicket(c.env.DB, c.env.KV, ticket_uuid)
      return c.json({ message: 'Ticket claim has expired. Please claim a new ticket.' }, 410)
    }
  }

  // Verify channel is enabled
  const channel = await c.env.DB.prepare(
    'SELECT * FROM payment_channels WHERE code = ? AND is_enabled = 1 AND gateway_status = ?'
  ).bind(channel_code, 'active').first() as PaymentChannelRow | null

  if (!channel) {
    return c.json({ message: 'Payment channel not available' }, 400)
  }

  // Check transaction limits
  if (nominal < channel.min_trx) {
    return c.json({ message: `Minimum transaction: Rp ${channel.min_trx.toLocaleString()}` }, 400)
  }
  if (nominal > channel.max_trx) {
    return c.json({ message: `Maximum transaction: Rp ${channel.max_trx.toLocaleString()}` }, 400)
  }

  const merchantCode = c.env.WIJAYAPAY_MERCHANT_CODE
  const apiKey = c.env.WIJAYAPAY_API_KEY

  // Generate unique ref_id
  const refId = `FRB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const txnUuid = crypto.randomUUID()

  // Call WijayaPay
  const result = await wijayapayCreateTransaction(merchantCode, apiKey, refId, channel_code, nominal)

  if (!result.success || !result.data) {
    return c.json({ message: result.message || 'Payment gateway error' }, 502)
  }

  const d = result.data
  const now = new Date().toISOString()

  // Store transaction
  await c.env.DB.prepare(
    `INSERT INTO payment_transactions
     (transaction_uuid, event_uuid, ticket_uuid, user_uuid, ref_id, trx_reference,
      channel_code, payment_name, payment_method, payment_image,
      nominal, total_bayar, total_fee, total_diterima,
      nomor_va, nomor_pembayaran, qr_image, qr_string,
      tutorial, expired_at, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  ).bind(
    txnUuid, event_uuid, ticket_uuid || null, user.sub,
    refId, d.trx_reference || null,
    channel_code, d.payment_name || null, d.payment_method || null, d.payment_image || null,
    nominal, d.total_bayar || null, d.total_fee || null, d.total_diterima || null,
    d.nomor_va || null, d.nomor_pembayaran || null, d.qr_image || null, d.qr_string || null,
    d.tutorial_pembayaran || null, d.expired || null,
    now, now,
  ).run()

  return c.json({
    transaction_uuid: txnUuid,
    ref_id: refId,
    trx_reference: d.trx_reference,
    payment_name: d.payment_name,
    payment_method: d.payment_method,
    payment_image: d.payment_image,
    nominal: nominal,
    expired: d.expired,
    // Channel-specific data
    nomor_va: d.nomor_va || null,
    nomor_pembayaran: d.nomor_pembayaran || null,
    qr_image: d.qr_image || null,
    qr_string: d.qr_string || null,
    tutorial: d.tutorial_pembayaran || null,
  })
})

// ═══════════════════════════════════════════════════
// PAYMENT STATUS CHECK
// ═══════════════════════════════════════════════════

/**
 * GET /payment/status/:refId
 * Check payment status from WijayaPay + local DB.
 */
payment.get('/status/:refId', authMiddleware, async (c) => {
  const refId = c.req.param('refId')
  const user = c.get('user') as JWTPayload

  // Get local record
  const txn = await c.env.DB.prepare(
    'SELECT * FROM payment_transactions WHERE ref_id = ? AND user_uuid = ?'
  ).bind(refId, user.sub).first() as PaymentTransactionRow | null

  if (!txn) return c.json({ message: 'Transaction not found' }, 404)

  // If already paid or expired, return from DB
  if (txn.status === 'paid' || txn.status === 'expired') {
    return c.json({
      status: txn.status,
      transaction: txn,
    })
  }

  // Check live status from WijayaPay
  const merchantCode = c.env.WIJAYAPAY_MERCHANT_CODE
  const apiKey = c.env.WIJAYAPAY_API_KEY
  const result = await wijayapayCheckStatus(merchantCode, apiKey, refId)

  const gatewayStatus = result.status_pembayaran || 'pending'
  const now = new Date().toISOString()

  // Update local status if changed
  if (gatewayStatus !== txn.status && ['paid', 'expired'].includes(gatewayStatus)) {
    await c.env.DB.prepare(
      `UPDATE payment_transactions SET status = ?, paid_at = ?, callback_data = ?, updated_at = ?
       WHERE ref_id = ?`
    ).bind(
      gatewayStatus,
      gatewayStatus === 'paid' ? now : null,
      JSON.stringify(result.data || {}),
      now, refId,
    ).run()

    // If paid, update ticket
    if (gatewayStatus === 'paid' && txn.ticket_uuid) {
      await markTicketPaid(c.env.DB, txn.ticket_uuid, txn.event_uuid, refId, now)
    }

    // If expired, release the ticket slot
    if (gatewayStatus === 'expired' && txn.ticket_uuid) {
      await expireSingleTicket(c.env.DB, c.env.KV, txn.ticket_uuid)
    }
  }

  return c.json({
    status: gatewayStatus,
    transaction: { ...txn, status: gatewayStatus },
  })
})

// ═══════════════════════════════════════════════════
// CALLBACK / WEBHOOK
// ═══════════════════════════════════════════════════

/**
 * POST /payment/callback
 * WijayaPay webhook — called when payment status changes.
 * Whitelist IP: 72.61.141.189
 * X-Signature: md5(code_merchant + api_key + ref_id)
 */
payment.post('/callback', async (c) => {
  // ── IP Whitelist Check ──
  const whitelist = (c.env.WIJAYAPAY_CALLBACK_WHITELIST || '72.61.141.189').split(',')
  const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || ''
  if (clientIP && !whitelist.includes(clientIP)) {
    console.error('Callback rejected — IP not whitelisted:', clientIP)
    return c.json({ status: false, message: 'Unauthorized IP' }, 403)
  }

  const body = await c.req.json()

  const refId = body.data?.ref_id
  if (!refId) {
    return c.json({ status: true }) // Always return success to gateway
  }

  // Verify X-Signature: md5(code_merchant.api_key.ref_id)
  const signature = c.req.header('X-Signature')
  const merchantCode = c.env.WIJAYAPAY_MERCHANT_CODE
  const apiKey = c.env.WIJAYAPAY_API_KEY
  const expectedSig = await md5(`${merchantCode}${apiKey}${refId}`)

  if (!signature || signature !== expectedSig) {
    console.error('Callback signature invalid:', { expected: expectedSig, received: signature, ref_id: refId })
    return c.json({ status: true }) // Return true to avoid retries but don't process
  }

  const now = new Date().toISOString()
  const status = body.status || 'pending'

  // Get the transaction
  const txn = await c.env.DB.prepare(
    'SELECT * FROM payment_transactions WHERE ref_id = ?'
  ).bind(refId).first() as PaymentTransactionRow | null

  if (!txn) {
    console.error('Callback for unknown ref_id:', refId)
    return c.json({ status: true })
  }

  // Update transaction status
  await c.env.DB.prepare(
    `UPDATE payment_transactions SET
     status = ?,
     paid_at = ?,
     total_bayar = COALESCE(?, total_bayar),
     total_fee = COALESCE(?, total_fee),
     total_diterima = COALESCE(?, total_diterima),
     callback_data = ?,
     updated_at = ?
     WHERE ref_id = ?`
  ).bind(
    status,
    status === 'paid' ? now : null,
    body.data?.total_dibayar || null,
    body.data?.total_fee || null,
    body.data?.amount_received || null,
    JSON.stringify(body),
    now, refId,
  ).run()

  // If paid, update ticket status and issue ticket number
  if (status === 'paid' && txn.ticket_uuid) {
    await markTicketPaid(c.env.DB, txn.ticket_uuid, txn.event_uuid, refId, now)
  }

  // If expired, release the ticket slot
  if (status === 'expired' && txn.ticket_uuid) {
    await expireSingleTicket(c.env.DB, c.env.KV, txn.ticket_uuid)
  }

  return c.json({ status: true })
})

/** Helper: Mark ticket as paid + issue ticket number */
async function markTicketPaid(db: D1Database, ticketUuid: string, eventUuid: string, paymentRef: string, now: string) {
  // Issue ticket number atomically
  await db.prepare(
    `UPDATE tickets
     SET purchase_status = 'paid',
         ticket_number = 'EVT-' || SUBSTR('0000' || (
           (SELECT COUNT(*) FROM tickets
            WHERE event_uuid = ? AND ticket_number IS NOT NULL) + 1
         ), -4),
         updated_at = ?
     WHERE ticket_uuid = ? AND purchase_status = 'under_payment'`
  ).bind(eventUuid, now, ticketUuid).run()

  // Update purchase log
  await db.prepare(
    `UPDATE purchase_log SET payment_status = 'paid', payment_reference = ?, updated_at = ?
     WHERE ticket_uuid = ?`
  ).bind(paymentRef, now, ticketUuid).run()
}

// ═══════════════════════════════════════════════════
// EVENT FINANCIALS
// ═══════════════════════════════════════════════════

/**
 * GET /manage/:eventId/payment/financials
 * Get financial summary for an event.
 * Includes: total income, gateway fees, admin fee, host payout.
 */
payment.get('/:eventId/payment/financials', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')

  // Get or create financial settings
  let settings = await c.env.DB.prepare(
    'SELECT * FROM event_financials WHERE event_uuid = ?'
  ).bind(eventId).first() as EventFinancialRow | null

  if (!settings) {
    const uuid = crypto.randomUUID()
    const now = new Date().toISOString()
    await c.env.DB.prepare(
      `INSERT INTO event_financials (financial_uuid, event_uuid, created_at, updated_at)
       VALUES (?, ?, ?, ?)`
    ).bind(uuid, eventId, now, now).run()
    settings = await c.env.DB.prepare(
      'SELECT * FROM event_financials WHERE event_uuid = ?'
    ).bind(eventId).first() as EventFinancialRow
  }

  // Calculate totals from paid transactions
  const totals = await c.env.DB.prepare(
    `SELECT
       COUNT(*) as total_transactions,
       COALESCE(SUM(nominal), 0) as total_nominal,
       COALESCE(SUM(total_bayar), 0) as total_bayar,
       COALESCE(SUM(total_fee), 0) as total_gateway_fees,
       COALESCE(SUM(total_diterima), 0) as total_received
     FROM payment_transactions
     WHERE event_uuid = ? AND status = 'paid'`
  ).bind(eventId).first() as any

  // Calculate admin take and host payout
  const totalReceived = totals?.total_received || 0
  const adminFeeFromPercent = totalReceived * (settings.admin_fee_percent / 100)
  const adminFeeFromFixed = (totals?.total_transactions || 0) * settings.admin_fee_fixed
  const adminTotal = adminFeeFromPercent + adminFeeFromFixed
  const hostPayout = Math.max(0, totalReceived - adminTotal)

  // Per-channel breakdown
  const { results: channelBreakdown } = await c.env.DB.prepare(
    `SELECT
       channel_code,
       payment_name,
       COUNT(*) as count,
       COALESCE(SUM(nominal), 0) as total_nominal,
       COALESCE(SUM(total_fee), 0) as total_fees,
       COALESCE(SUM(total_diterima), 0) as total_received
     FROM payment_transactions
     WHERE event_uuid = ? AND status = 'paid'
     GROUP BY channel_code
     ORDER BY total_received DESC`
  ).bind(eventId).all()

  return c.json({
    settings: {
      admin_fee_percent: settings.admin_fee_percent,
      admin_fee_fixed: settings.admin_fee_fixed,
      host_payout_status: settings.host_payout_status,
      host_payout_total: settings.host_payout_total || 0,
      host_payout_notes: settings.host_payout_notes,
      host_payout_at: settings.host_payout_at,
    },
    summary: {
      total_transactions: totals?.total_transactions || 0,
      total_nominal: totals?.total_nominal || 0,
      total_bayar: totals?.total_bayar || 0,
      total_gateway_fees: totals?.total_gateway_fees || 0,
      total_received: totalReceived,
      admin_total: Math.round(adminTotal),
      host_payout: Math.round(hostPayout),
    },
    channel_breakdown: channelBreakdown || [],
  })
})

/**
 * PUT /manage/:eventId/payment/financials/settings
 * Update financial settings (admin fee).
 *
 * Body: { admin_fee_percent?, admin_fee_fixed? }
 */
payment.put('/:eventId/payment/financials/settings', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const body = await c.req.json()
  const now = new Date().toISOString()

  // Ensure record exists
  const existing = await c.env.DB.prepare(
    'SELECT financial_uuid FROM event_financials WHERE event_uuid = ?'
  ).bind(eventId).first()

  if (!existing) {
    await c.env.DB.prepare(
      `INSERT INTO event_financials (financial_uuid, event_uuid, admin_fee_percent, admin_fee_fixed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(), eventId,
      body.admin_fee_percent ?? 0, body.admin_fee_fixed ?? 0,
      now, now,
    ).run()
  } else {
    const updates: string[] = []
    const params: any[] = []

    if (body.admin_fee_percent !== undefined) {
      updates.push('admin_fee_percent = ?')
      params.push(body.admin_fee_percent)
    }
    if (body.admin_fee_fixed !== undefined) {
      updates.push('admin_fee_fixed = ?')
      params.push(body.admin_fee_fixed)
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?')
      params.push(now, eventId)
      await c.env.DB.prepare(
        `UPDATE event_financials SET ${updates.join(', ')} WHERE event_uuid = ?`
      ).bind(...params).run()
    }
  }

  return c.json({ message: 'Financial settings updated' })
})

/**
 * PUT /manage/:eventId/payment/financials/payout
 * Record host payout status update.
 *
 * Body: { status: 'pending'|'partial'|'completed', notes?, payout_total? }
 */
payment.put('/:eventId/payment/financials/payout', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const body = await c.req.json()

  if (!body.status || !['pending', 'partial', 'completed'].includes(body.status)) {
    return c.json({ message: 'status must be pending, partial, or completed' }, 400)
  }

  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `UPDATE event_financials SET
     host_payout_status = ?,
     host_payout_total = COALESCE(?, host_payout_total),
     host_payout_notes = COALESCE(?, host_payout_notes),
     host_payout_at = ?,
     updated_at = ?
     WHERE event_uuid = ?`
  ).bind(
    body.status,
    body.payout_total || null,
    body.notes || null,
    body.status === 'completed' ? now : null,
    now, eventId,
  ).run()

  return c.json({ message: `Payout status updated to ${body.status}` })
})

/**
 * GET /manage/:eventId/payment/transactions
 * List payment transactions for an event (with pagination & filters).
 */
payment.get('/:eventId/payment/transactions', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200)
  const offset = (page - 1) * limit
  const statusFilter = c.req.query('status')
  const channelFilter = c.req.query('channel')

  let query = 'SELECT * FROM payment_transactions WHERE event_uuid = ?'
  const params: any[] = [eventId]

  if (statusFilter && ['pending', 'paid', 'expired', 'failed'].includes(statusFilter)) {
    query += ' AND status = ?'
    params.push(statusFilter)
  }
  if (channelFilter) {
    query += ' AND channel_code = ?'
    params.push(channelFilter)
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count')
  const total = await c.env.DB.prepare(countQuery).bind(...params).first() as { count: number } | null

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  return c.json({
    transactions: results || [],
    pagination: {
      page,
      limit,
      total: total?.count || 0,
      total_pages: Math.ceil((total?.count || 0) / limit),
    },
  })
})

export { payment }
