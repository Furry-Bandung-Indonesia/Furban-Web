/**
 * Tickets Routes — Claim & Payment
 *
 * Implements the full ticket lifecycle:
 *   1. Claim: Turnstile → moderation check → KV hold (10 min) → ticket created
 *   2. Payment: Confirm payment within 10 min → ticket paid
 *   3. Expiry: Automatic on claim_expiry
 *
 * Also handles ticket retrieval for users (My Tickets / Purchase History).
 */
import { Hono } from 'hono'
import type { Bindings, Variables, JWTPayload, TicketRow, EventRow, TierRow, VoucherRow } from '../types'
import { authMiddleware } from '../middleware/auth'
import { rateLimiter } from '../middleware/rateLimiter'
import { KVService } from '../services/kv'
import { ModerationService } from '../services/moderation'
import { EmailService } from '../services/email'
import { expireStaleTickets } from '../services/ticketExpiry'

const tickets = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Helper: parse food_options supporting legacy string[], {name,price}[], and new {name,price,choices}[] format
interface FoodChoice { name: string; price: number }
interface FoodOption { name: string; price: number; choices: FoodChoice[] }
interface FoodSelectionItem { name: string; choice?: string; choice_price?: number }

function parseFoodOptions(raw: string | any[]): FoodOption[] {
  let arr: any[]
  if (typeof raw === 'string') {
    try { arr = JSON.parse(raw) } catch { return [] }
  } else if (Array.isArray(raw)) {
    arr = raw
  } else {
    return []
  }
  return arr.map((item: any) => {
    if (typeof item === 'string') return { name: item, price: 0, choices: [] }
    return {
      name: item.name || '',
      price: Number(item.price) || 0,
      choices: Array.isArray(item.choices)
        ? item.choices.map((c: any) => ({ name: c.name || '', price: Number(c.price) || 0 }))
        : [],
    }
  })
}

// Helper: normalize food_selection to new format [{name, choice?, choice_price?}]
function normalizeFoodSelection(raw: any): FoodSelectionItem[] {
  if (!raw) return []
  const arr = Array.isArray(raw) ? raw : [raw]
  return arr.map((item: any) => {
    if (typeof item === 'string') return { name: item }
    return { name: item.name || '', choice: item.choice || undefined, choice_price: Number(item.choice_price) || 0 }
  })
}

// Helper: calculate total add-on price for selected food items (menu price + choice price)
function calculateFoodTotal(selection: FoodSelectionItem[], foodOptions: FoodOption[]): number {
  return selection.reduce((sum, sel) => {
    const opt = foodOptions.find(o => o.name === sel.name)
    const menuPrice = opt?.price || 0
    const choicePrice = sel.choice_price || 0
    return sum + menuPrice + choicePrice
  }, 0)
}

// All ticket routes require auth
tickets.use('*', authMiddleware)

/**
 * POST /events/:eventId/claim
 * Claim a ticket for an event.
 *
 * Body: {
 *   tier_uuid, first_name, last_name, nickname, date_of_birth, social_link,
 *   is_fursuiter, food_selection, turnstile_token (verified by middleware or inline)
 * }
 *
 * Flow:
 *   1. Validate event is published
 *   2. Check rate limit (1 claim per 60s)
 *   3. Check no existing claim/ticket for this user+event
 *   4. Check moderation list (BAN → reject, FLAG → allow + silent log)
 *   5. Check tier quota
 *   6. Create KV claim hold (10 min TTL)
 *   7. Decrement quota_available
 *   8. Create ticket row (status: under_payment)
 *   9. Create payment lock in KV
 *   10. Return ticket info for payment page
 */
tickets.post('/events/:eventId/claim', rateLimiter('claim', 10, 60), async (c) => {
  const user = c.get('user') as JWTPayload
  const eventId = c.req.param('eventId')
  const body = await c.req.json()

  const { tier_uuid, first_name, last_name, nickname, date_of_birth, social_link, is_fursuiter, food_selection, drink_selection, food_notes, turnstile_token, voucher_code } = body

  // ─── Validate input ──────────────────────────────
  if (!tier_uuid || !first_name) {
    return c.json({ message: 'tier_uuid and first_name are required' }, 400)
  }

  // ─── Turnstile verification (inline) ─────────────
  const turnstileSecret = c.env.TURNSTILE_SECRET
  const turnstileBypass = (c.env as any).TURNSTILE_BYPASS === 'true'
  if (turnstileSecret && !turnstileBypass) {
    if (!turnstile_token) {
      return c.json({ message: 'Turnstile captcha token is required' }, 400)
    }
    const formData = new FormData()
    formData.append('secret', turnstileSecret)
    formData.append('response', turnstile_token)
    const ip = c.req.header('CF-Connecting-IP')
    if (ip) formData.append('remoteip', ip)

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })
    const outcome = await result.json<{ success: boolean }>()
    if (!outcome.success) {
      return c.json({ message: 'Captcha verification failed' }, 403)
    }
  }

  // ─── Validate event ──────────────────────────────
  const event = await c.env.DB.prepare(
    'SELECT * FROM events WHERE event_uuid = ? AND status = ?'
  ).bind(eventId, 'published').first() as EventRow | null

  if (!event) {
    return c.json({ message: 'Event not found or not available' }, 404)
  }

  // Check event hasn't ended
  if (new Date(event.end_time) < new Date()) {
    return c.json({ message: 'Event has already ended' }, 400)
  }

  // ─── Check ticket sales status ───────────────────
  const salesStatus = event.sales_status || 'available'
  const currentTime = new Date()
  if (salesStatus === 'sold_out') {
    return c.json({ message: 'Tickets are sold out' }, 403)
  }
  if (salesStatus === 'coming_soon') {
    if (!event.sales_open_time || currentTime < new Date(event.sales_open_time)) {
      const opensAt = event.sales_open_time ? new Date(event.sales_open_time).toISOString() : null
      return c.json({ message: 'Ticket sales have not opened yet', sales_open_time: opensAt }, 403)
    }
  }
  if (salesStatus === 'unavailable') {
    return c.json({ message: 'Ticket sales are currently unavailable' }, 403)
  }
  // Also check sales_close_time even if status is 'available'
  if (event.sales_close_time && currentTime >= new Date(event.sales_close_time)) {
    return c.json({ message: 'Ticket sales have closed' }, 403)
  }

  // ─── Check existing claim/ticket ─────────────────
  const kvService = new KVService(c.env.KV)

  const existingClaim = await kvService.getClaimHold(user.sub, eventId)
  if (existingClaim) {
    return c.json({
      message: 'You already have an active claim for this event',
      ticket_uuid: existingClaim.ticket_uuid,
    }, 409)
  }

  const existingTicket = await c.env.DB.prepare(
    `SELECT * FROM tickets
     WHERE event_uuid = ? AND user_uuid = ? AND purchase_status IN ('under_payment', 'paid')`
  ).bind(eventId, user.sub).first() as TicketRow | null

  if (existingTicket) {
    // If the existing ticket is under_payment but claim has expired, expire it now
    if (
      existingTicket.purchase_status === 'under_payment' &&
      existingTicket.claim_expiry &&
      new Date(existingTicket.claim_expiry) < new Date()
    ) {
      await expireTicket(c.env.DB, c.env.KV, existingTicket)
      // Fall through — the expired ticket will be cleaned up below
    } else {
      return c.json({
        message: existingTicket.purchase_status === 'paid'
          ? 'You already have a ticket for this event'
          : 'You already have a pending payment for this event',
        ticket_uuid: existingTicket.ticket_uuid,
      }, 409)
    }
  }

  // ─── Remove old expired/failed tickets so re-claim is possible ──
  await c.env.DB.prepare(
    `DELETE FROM tickets
     WHERE event_uuid = ? AND user_uuid = ? AND purchase_status IN ('expired', 'failed')`
  ).bind(eventId, user.sub).run()

  // ─── Moderation check ────────────────────────────
  // STEP 1: Check if user has been CONFIRMED banned by admin for this event.
  // Only admin-confirmed enforcement can block purchases.
  // Check ALL events — moderation is global, not per-event.
  const confirmedBan = await c.env.DB.prepare(
    `SELECT attempt_uuid FROM moderation_attempt_log
     WHERE user_uuid = ?
     AND attempt_type = 'BAN_BLOCKED' AND resolution = 'CONFIRMED'
     LIMIT 1`
  ).bind(user.sub).first()

  if (confirmedBan) {
    // Log this blocked purchase attempt to enforcement log
    await c.env.DB.prepare(
      `INSERT INTO moderation_enforcement_log
       (log_uuid, event_uuid, user_uuid, attempt_uuid, action_type, moderation_type, details, user_name, user_email)
       VALUES (?, ?, ?, ?, 'PURCHASE_BLOCKED', 'BAN', ?, ?, ?)`
    ).bind(
      crypto.randomUUID(), eventId, user.sub,
      (confirmedBan as any).attempt_uuid,
      JSON.stringify({ tier_uuid: tier_uuid, first_name, last_name, nickname }),
      `${first_name} ${last_name || ''}`.trim(),
      user.email || null,
    ).run()

    return c.json({ message: 'Unable to process your request. Please contact support.' }, 403)
  }

  // STEP 2: Run keyword detection — creates suspect record only.
  // Detection NEVER auto-blocks or auto-flags. Only creates PENDING suspect.
  const modService = new ModerationService(c.env.DB, kvService)
  const fullName = `${first_name} ${last_name || ''}`.trim()
  const modResult = await modService.check(eventId, {
    firstName: first_name,
    lastName: last_name || '',
    nickname: nickname || '',
    email: user.email || '',
    socialLink: social_link || '',
  }, user.sub)

  if (modResult.match) {
    // Check if this user+keyword combo already has a record (avoid duplicates)
    const existingAttempt = await c.env.DB.prepare(
      `SELECT attempt_uuid FROM moderation_attempt_log
       WHERE event_uuid = ? AND user_uuid = ? AND moderation_uuid = ?
       LIMIT 1`
    ).bind(eventId, user.sub, modResult.match.moderation_uuid).first()

    if (!existingAttempt) {
      // Create PENDING suspect record — admin must confirm before enforcement
      await modService.logAttempt(
        eventId, modResult.match.moderation_uuid, fullName, nickname || '',
        modResult.blocked ? 'BAN_BLOCKED' : 'WATCH_DETECTED',
        modResult.detection_type, modResult.similarity_score,
        user.sub, undefined, modResult.matchedFields,
        user.email || '', social_link || '',
      )
    }
    // User continues normally — no blocking based on detection alone
  }

  // ─── Expire stale tickets before checking quota ──
  await expireStaleTickets(c.env.DB, c.env.KV, eventId)

  // ─── Validate tier and quota ─────────────────────
  const tier = await c.env.DB.prepare(
    'SELECT * FROM ticket_tiers WHERE tier_uuid = ? AND event_uuid = ?'
  ).bind(tier_uuid, eventId).first() as TierRow | null

  if (!tier) return c.json({ message: 'Ticket tier not found' }, 404)

  if (tier.quota_available <= 0) {
    return c.json({ message: 'This tier is sold out' }, 409)
  }

  // ─── Validate food selection ─────────────────────
  let foodSelNorm: FoodSelectionItem[] = []
  let foodTotal = 0
  let drinkSelNorm: FoodSelectionItem[] = []
  let drinkTotal = 0
  if (event.food_enabled && food_selection) {
    foodSelNorm = normalizeFoodSelection(food_selection)
    const foodOpts = parseFoodOptions(event.food_options || '[]')
    const validNames = foodOpts.map(o => o.name)
    const invalidOptions = foodSelNorm.filter(f => !validNames.includes(f.name))
    if (invalidOptions.length > 0) {
      return c.json({ message: `Invalid food option(s): ${invalidOptions.map(f => f.name).join(', ')}` }, 400)
    }
    if (!event.food_multi_select && foodSelNorm.length > 1) {
      return c.json({ message: 'Only one food option allowed for this event' }, 400)
    }
    // Validate choices
    for (const sel of foodSelNorm) {
      const opt = foodOpts.find(o => o.name === sel.name)
      if (sel.choice && opt?.choices?.length) {
        const validChoice = opt.choices.find(c => c.name === sel.choice)
        if (!validChoice) {
          return c.json({ message: `Invalid choice "${sel.choice}" for "${sel.name}"` }, 400)
        }
        sel.choice_price = validChoice.price || 0
      }
    }
    foodTotal = calculateFoodTotal(foodSelNorm, foodOpts)
  }

  // ─── Validate drink selection ────────────────────
  if (event.drinks_enabled && drink_selection) {
    drinkSelNorm = normalizeFoodSelection(drink_selection)
    // We can parse drinks same as food with parseFoodOptions
    const drinkOpts = parseFoodOptions(event.drink_options || '[]')
    const validNames = drinkOpts.map(o => o.name)
    const invalidOptions = drinkSelNorm.filter(f => !validNames.includes(f.name))
    if (invalidOptions.length > 0) {
      return c.json({ message: `Invalid drink option(s): ${invalidOptions.map(f => f.name).join(', ')}` }, 400)
    }
    // Validate choices
    for (const sel of drinkSelNorm) {
      const opt = drinkOpts.find(o => o.name === sel.name)
      if (sel.choice && opt?.choices?.length) {
        const validChoice = opt.choices.find(ch => ch.name === sel.choice)
        if (!validChoice) {
          return c.json({ message: `Invalid choice "${sel.choice}" for "${sel.name}"` }, 400)
        }
        sel.choice_price = validChoice.price || 0
      }
    }
    drinkTotal = calculateFoodTotal(drinkSelNorm, drinkOpts)
  }

  // ─── Create ticket + hold ────────────────────────
  const ticketUuid = crypto.randomUUID()
  // NOTE: ticket_number is NOT assigned here — it is issued only upon successful payment
  // to prevent wasted sequence numbers from expired/cancelled claims.
  const claimExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
  const now = new Date().toISOString()

  // Decrement quota
  await c.env.DB.prepare(
    'UPDATE ticket_tiers SET quota_available = quota_available - 1, updated_at = ? WHERE tier_uuid = ?'
  ).bind(now, tier_uuid).run()

  // ─── Name Your Price: validate and compute total ──
  let bidPrice: number | null = null
  let totalAmount = tier.price_total + foodTotal + drinkTotal

  if ((tier as any).name_your_price) {
    if (body.bid_price) {
      const rawBid = Number(body.bid_price)
      if (isNaN(rawBid) || rawBid < tier.price_total) {
        return c.json({ message: `bid_price must be at least ${tier.price_total}` }, 400)
      }
      bidPrice = rawBid
      // Formula: final = max(bid_price, tier_price + food_total + drink_total)
      totalAmount = Math.max(0, Math.max(bidPrice, tier.price_total + foodTotal + drinkTotal))
    }
    // If no bid_price provided, it will be set on the fill page
  }

  // Create ticket (ticket_number = NULL until payment)
  await c.env.DB.prepare(
    `INSERT INTO tickets
     (ticket_uuid, event_uuid, tier_uuid, user_uuid, ticket_number,
      first_name, last_name, nickname, date_of_birth, social_link,
      is_fursuiter, food_selection, food_total, drink_selection, drink_total, bid_price, food_notes,
      voucher_uuid, discount_amount,
      purchase_status, claim_expiry, created_at, updated_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'under_payment', ?, ?, ?)`
  ).bind(
    ticketUuid, eventId, tier_uuid, user.sub,
    first_name, last_name || null, nickname || null,
    date_of_birth || null, social_link || null,
    is_fursuiter ? 1 : 0, JSON.stringify(foodSelNorm), foodTotal, JSON.stringify(drinkSelNorm), drinkTotal,
    bidPrice,
    food_notes?.trim() || null,
    null, 0, // voucher_uuid, discount_amount (initially null/0, set later during updateMyTicket)
    claimExpiry, now, now,
  ).run()

  // Create purchase log
  await c.env.DB.prepare(
    `INSERT INTO purchase_log
     (purchase_uuid, ticket_uuid, event_uuid, user_uuid, payment_status, amount_paid, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'under_payment', ?, ?, ?)`
  ).bind(crypto.randomUUID(), ticketUuid, eventId, user.sub, totalAmount, now, now).run()

  // Set KV claim hold
  await kvService.setClaimHold(user.sub, eventId, {
    ticket_uuid: ticketUuid,
    tier_uuid: tier_uuid,
    timestamp: Date.now(),
  })

  // Set payment lock
  await kvService.setPaymentLock(ticketUuid)

  return c.json({
    message: 'Ticket claimed. Complete payment within 10 minutes.',
    ticket: {
      ticket_uuid: ticketUuid,
      ticket_number: null, // Not yet issued — assigned on payment
      event_uuid: eventId,
      tier_name: tier.tier_name,
      price_total: totalAmount,
      food_total: foodTotal,
      bid_price: bidPrice,
      voucher_code: null,
      discount_amount: 0,
      first_name,
      last_name,
      nickname,
      claim_expiry: claimExpiry,
      purchase_status: 'under_payment',
    },
  }, 201)
})

/**
 * PUT /tickets/:ticketId
 * Update personal info on a ticket the user owns.
 * Only allowed while purchase_status = 'under_payment'.
 *
 * Body: { first_name?, last_name?, nickname?, date_of_birth?, social_link?, is_fursuiter?, bid_price?, food_selection? }
 */
tickets.put('/tickets/:ticketId', async (c) => {
  const user = c.get('user') as JWTPayload
  const ticketId = c.req.param('ticketId')
  const body = await c.req.json()

  const ticket = await c.env.DB.prepare(
    'SELECT * FROM tickets WHERE ticket_uuid = ? AND user_uuid = ?'
  ).bind(ticketId, user.sub).first() as TicketRow | null

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  if (ticket.purchase_status !== 'under_payment') {
    return c.json({ message: 'Can only update tickets that are under payment' }, 400)
  }

  // Check if claim has expired
  if (ticket.claim_expiry && new Date(ticket.claim_expiry) < new Date()) {
    await expireTicket(c.env.DB, c.env.KV, ticket)
    return c.json({ message: 'Payment window expired. Please claim again.' }, 410)
  }

  const updates: string[] = []
  const values: any[] = []

  if (body.first_name !== undefined && body.first_name?.trim()) {
    const firstName = body.first_name.trim()
    if (firstName.toLowerCase() === 'attendee') {
      return c.json({ message: 'Please update your first name. "Attendee" is not allowed.' }, 400)
    }
    updates.push('first_name = ?'); values.push(firstName)
  }
  if (body.last_name !== undefined) {
    updates.push('last_name = ?'); values.push(body.last_name?.trim() || null)
  }
  if (body.nickname !== undefined) {
    updates.push('nickname = ?'); values.push(body.nickname?.trim() || null)
  }
  if (body.date_of_birth !== undefined) {
    updates.push('date_of_birth = ?'); values.push(body.date_of_birth || null)
  }
  if (body.social_link !== undefined) {
    updates.push('social_link = ?'); values.push(body.social_link?.trim() || null)
  }
  if (body.is_fursuiter !== undefined) {
    updates.push('is_fursuiter = ?'); values.push(body.is_fursuiter ? 1 : 0)
  }
  // Name Your Price: accept bid_price update
  if (body.bid_price !== undefined && body.bid_price !== null) {
    const tier = await c.env.DB.prepare(
      'SELECT price_total, name_your_price FROM ticket_tiers WHERE tier_uuid = ?'
    ).bind(ticket.tier_uuid).first() as { price_total: number; name_your_price: number } | null
    if (!tier?.name_your_price) {
      return c.json({ message: 'Name Your Price is not enabled for this tier' }, 400)
    }
    const bidPrice = Number(body.bid_price)
    if (isNaN(bidPrice) || bidPrice < tier.price_total) {
      return c.json({ message: `Bid price must be at least ${tier.price_total}` }, 400)
    }
    updates.push('bid_price = ?'); values.push(bidPrice)
  }
  if (body.food_selection !== undefined) {
    // Validate food selection against event
    const event = await c.env.DB.prepare(
      'SELECT food_enabled, food_multi_select, food_options FROM events WHERE event_uuid = ?'
    ).bind(ticket.event_uuid).first() as EventRow | null

    if (event?.food_enabled) {
      const foodSelNorm = normalizeFoodSelection(body.food_selection)
      const foodOpts = parseFoodOptions(event.food_options || '[]')
      const validNames = foodOpts.map(o => o.name)
      const invalidOptions = foodSelNorm.filter(f => !validNames.includes(f.name))
      if (invalidOptions.length > 0) {
        return c.json({ message: `Invalid food option(s): ${invalidOptions.map(f => f.name).join(', ')}` }, 400)
      }
      if (!event.food_multi_select && foodSelNorm.length > 1) {
        return c.json({ message: 'Only one food option allowed for this event' }, 400)
      }
      // Validate choices
      for (const sel of foodSelNorm) {
        const opt = foodOpts.find(o => o.name === sel.name)
        if (sel.choice && opt?.choices?.length) {
          const validChoice = opt.choices.find(ch => ch.name === sel.choice)
          if (!validChoice) {
            return c.json({ message: `Invalid choice "${sel.choice}" for "${sel.name}"` }, 400)
          }
          sel.choice_price = validChoice.price || 0
        }
      }
      const newFoodTotal = calculateFoodTotal(foodSelNorm, foodOpts)
      updates.push('food_selection = ?'); values.push(JSON.stringify(foodSelNorm))
      updates.push('food_total = ?'); values.push(newFoodTotal)
    }
  }
  if (body.drink_selection !== undefined) {
    const event = await c.env.DB.prepare(
      'SELECT drinks_enabled, drink_options FROM events WHERE event_uuid = ?'
    ).bind(ticket.event_uuid).first() as any | null

    if (event?.drinks_enabled) {
      const drinkSelNorm = normalizeFoodSelection(body.drink_selection)
      const drinkOpts = parseFoodOptions(event.drink_options || '[]')
      const validNames = drinkOpts.map(o => o.name)
      const invalidOptions = drinkSelNorm.filter(f => !validNames.includes(f.name))
      if (invalidOptions.length > 0) {
        return c.json({ message: `Invalid drink option(s): ${invalidOptions.map(f => f.name).join(', ')}` }, 400)
      }
      for (const sel of drinkSelNorm) {
        const opt = drinkOpts.find(o => o.name === sel.name)
        if (sel.choice && opt?.choices?.length) {
          const validChoice = opt.choices.find(ch => ch.name === sel.choice)
          if (!validChoice) {
            return c.json({ message: `Invalid choice "${sel.choice}" for "${sel.name}"` }, 400)
          }
          sel.choice_price = validChoice.price || 0
        }
      }
      const newDrinkTotal = calculateFoodTotal(drinkSelNorm, drinkOpts)
      updates.push('drink_selection = ?'); values.push(JSON.stringify(drinkSelNorm))
      updates.push('drink_total = ?'); values.push(newDrinkTotal)
    }
  }

  if (body.food_notes !== undefined) {
    updates.push('food_notes = ?'); values.push(body.food_notes?.trim() || null)
  }

  // ─── Voucher handling ──────────────────────────────────────────
  let finalVoucherUuid = ticket.voucher_uuid
  let currentDiscount = ticket.discount_amount || 0

  if (body.voucher_code !== undefined) {
    if (!body.voucher_code) {
      // Remove voucher
      if (ticket.voucher_uuid) {
        await c.env.DB.prepare(
          'UPDATE event_vouchers SET uses_count = MAX(0, uses_count - 1), updated_at = ? WHERE voucher_uuid = ?'
        ).bind(new Date().toISOString(), ticket.voucher_uuid).run()
        updates.push('voucher_uuid = NULL')
        updates.push('discount_amount = 0')
        finalVoucherUuid = null
        currentDiscount = 0
      }
    } else {
      const rawCode = String(body.voucher_code).trim()
      const voucher = await c.env.DB.prepare(
        `SELECT * FROM event_vouchers WHERE event_uuid = ? AND UPPER(code) = UPPER(?) AND is_active = 1`
      ).bind(ticket.event_uuid, rawCode).first() as VoucherRow | null

      if (!voucher) {
        return c.json({ message: 'Invalid or inactive voucher code' }, 400)
      }

      if (ticket.voucher_uuid !== voucher.voucher_uuid) {
        if (voucher.uses_count >= voucher.max_uses) {
          return c.json({ message: 'This voucher has already been fully redeemed' }, 400)
        }

        // Refund old voucher if it existed
        if (ticket.voucher_uuid) {
          await c.env.DB.prepare(
            'UPDATE event_vouchers SET uses_count = MAX(0, uses_count - 1), updated_at = ? WHERE voucher_uuid = ?'
          ).bind(new Date().toISOString(), ticket.voucher_uuid).run()
        }

        // Consume new voucher
        await c.env.DB.prepare(
          'UPDATE event_vouchers SET uses_count = uses_count + 1, updated_at = ? WHERE voucher_uuid = ? AND uses_count < max_uses'
        ).bind(new Date().toISOString(), voucher.voucher_uuid).run()
        
        updates.push('voucher_uuid = ?'); values.push(voucher.voucher_uuid)
        finalVoucherUuid = voucher.voucher_uuid
      }
    }
  }

  // ─── Total Amount Calculation ──────────────────────────────────
  let requireTotalUpdate = false
  if (body.food_selection !== undefined || body.drink_selection !== undefined || body.bid_price !== undefined || body.voucher_code !== undefined) {
    requireTotalUpdate = true
  }

  if (updates.length > 0) {
    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(ticketId)
    values.push(user.sub)

    await c.env.DB.prepare(
      `UPDATE tickets SET ${updates.join(', ')} WHERE ticket_uuid = ? AND user_uuid = ?`
    ).bind(...values).run()
  }

  // Calculate new total and set in purchase log & tickets (discount_amount)
  if (requireTotalUpdate) {
    const tier = await c.env.DB.prepare(
      'SELECT price_total FROM ticket_tiers WHERE tier_uuid = ?'
    ).bind(ticket.tier_uuid).first() as { price_total: number } | null

    const updatedTicket = await c.env.DB.prepare(
      'SELECT food_total, drink_total, bid_price FROM tickets WHERE ticket_uuid = ?'
    ).bind(ticketId).first() as { food_total: number; drink_total: number; bid_price: number | null } | null

    const tierPrice = tier?.price_total || 0
    const foodTotal = updatedTicket?.food_total || 0
    const drinkTotal = updatedTicket?.drink_total || 0
    const bidPrice = updatedTicket?.bid_price
    
    // Name Your Price: max(bid_price, tier_price + food_total + drink_total)
    let subtotal = tierPrice + foodTotal + drinkTotal
    if (bidPrice) {
      subtotal = Math.max(bidPrice, subtotal)
    }

    // Apply voucher discount if present
    let newDiscount = 0
    if (finalVoucherUuid) {
      const voucher = await c.env.DB.prepare(
        'SELECT discount_type, discount_value FROM event_vouchers WHERE voucher_uuid = ?'
      ).bind(finalVoucherUuid).first() as { discount_type: string, discount_value: number } | null

      if (voucher) {
        if (voucher.discount_type === 'fixed') {
          newDiscount = Math.min(voucher.discount_value, subtotal)
        } else {
          newDiscount = Math.floor((voucher.discount_value / 100) * subtotal)
        }
      }
    }

    const newAmount = Math.max(0, subtotal - newDiscount)

    await c.env.DB.prepare(
      `UPDATE tickets SET discount_amount = ?, updated_at = ? WHERE ticket_uuid = ?`
    ).bind(newDiscount, new Date().toISOString(), ticketId).run()

    await c.env.DB.prepare(
      `UPDATE purchase_log SET amount_paid = ?, updated_at = ? WHERE ticket_uuid = ? AND user_uuid = ?`
    ).bind(newAmount, new Date().toISOString(), ticketId, user.sub).run()
  }

  return c.json({ message: 'Ticket updated successfully' })
})

/**
 * POST /tickets/:ticketId/pay
 * Confirm payment for a ticket.
 *
 * Body: { payment_reference? }
 *
 * In real production, this would integrate with a payment gateway.
 * For now, it directly marks the ticket as paid.
 */
tickets.post('/tickets/:ticketId/pay', async (c) => {
  const user = c.get('user') as JWTPayload
  const ticketId = c.req.param('ticketId')
  const body = await c.req.json().catch(() => ({}))

  const ticket = await c.env.DB.prepare(
    'SELECT * FROM tickets WHERE ticket_uuid = ? AND user_uuid = ?'
  ).bind(ticketId, user.sub).first() as TicketRow | null

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  if (ticket.purchase_status === 'paid') {
    return c.json({ message: 'Ticket already paid' }, 400)
  }

  if (ticket.purchase_status === 'expired' || ticket.purchase_status === 'failed') {
    return c.json({ message: `Ticket cannot be paid (status: ${ticket.purchase_status})` }, 400)
  }

  // Check if claim has expired
  if (ticket.claim_expiry && new Date(ticket.claim_expiry) < new Date()) {
    // Mark as expired
    await expireTicket(c.env.DB, c.env.KV, ticket)
    return c.json({ message: 'Payment window expired. Please claim again.' }, 410)
  }

  const now = new Date().toISOString()

  // ─── Issue ticket number atomically (race-condition safe) ────
  // Uses D1 sub-query to compute the next number in a single UPDATE,
  // so concurrent payments cannot produce duplicate numbers.
  await c.env.DB.prepare(
    `UPDATE tickets
     SET purchase_status = 'paid',
         ticket_number = 'EVT-' || SUBSTR('0000' || (
           (SELECT COUNT(*) FROM tickets
            WHERE event_uuid = ? AND ticket_number IS NOT NULL) + 1
         ), -4),
         updated_at = ?
     WHERE ticket_uuid = ? AND purchase_status = 'under_payment'`
  ).bind(ticket.event_uuid, now, ticketId).run()

  // Re-fetch to get the assigned ticket_number
  const updatedTicket = await c.env.DB.prepare(
    'SELECT ticket_number FROM tickets WHERE ticket_uuid = ?'
  ).bind(ticketId).first() as { ticket_number: string } | null

  const issuedTicketNumber = updatedTicket?.ticket_number || ticket.ticket_number

  // Update purchase log
  await c.env.DB.prepare(
    `UPDATE purchase_log SET payment_status = 'paid', payment_reference = ?, updated_at = ?
     WHERE ticket_uuid = ? AND user_uuid = ?`
  ).bind(body.payment_reference || null, now, ticketId, user.sub).run()

  // Clean up KV holds
  const kvService = new KVService(c.env.KV)
  await kvService.deleteClaimHold(user.sub, ticket.event_uuid)
  await kvService.deletePaymentLock(ticketId)

  // Send email receipt (async via queue)
  try {
    const event = await c.env.DB.prepare(
      'SELECT event_name FROM events WHERE event_uuid = ?'
    ).bind(ticket.event_uuid).first() as { event_name: string } | null

    const tier = await c.env.DB.prepare(
      'SELECT tier_name, price_total FROM ticket_tiers WHERE tier_uuid = ?'
    ).bind(ticket.tier_uuid).first() as { tier_name: string; price_total: number } | null

    const emailService = new EmailService((c.env as any).EMAIL_QUEUE)
    await emailService.sendPurchaseReceipt({
      ticketUuid: ticketId,
      eventUuid: ticket.event_uuid,
      toEmail: user.email,
      eventName: event?.event_name || 'Event',
      tierName: tier?.tier_name || 'Ticket',
      ticketNumber: issuedTicketNumber || 'N/A',
      legalName: `${ticket.first_name || ''} ${ticket.last_name || ''}`.trim() || 'Attendee',
      amountPaid: (tier?.price_total || 0) + (ticket.food_total || 0),
    })
  } catch (e) {
    console.error('Email queue error (non-blocking):', e)
  }

  return c.json({
    message: 'Payment confirmed. Your ticket is ready!',
    ticket: {
      ticket_uuid: ticketId,
      ticket_number: issuedTicketNumber,
      purchase_status: 'paid',
    },
  })
})

/**
 * POST /tickets/:ticketId/cancel
 * Cancel a pending ticket (before payment).
 */
tickets.post('/tickets/:ticketId/cancel', async (c) => {
  const user = c.get('user') as JWTPayload
  const ticketId = c.req.param('ticketId')

  const ticket = await c.env.DB.prepare(
    'SELECT * FROM tickets WHERE ticket_uuid = ? AND user_uuid = ?'
  ).bind(ticketId, user.sub).first() as TicketRow | null

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  if (ticket.purchase_status !== 'under_payment') {
    return c.json({ message: 'Can only cancel tickets that are under payment' }, 400)
  }

  await expireTicket(c.env.DB, c.env.KV, ticket)

  return c.json({ message: 'Ticket cancelled. Quota has been released.' })
})

/**
 * GET /tickets/my
 * Get all tickets for the current user (purchase history).
 */
tickets.get('/tickets/my', async (c) => {
  const user = c.get('user') as JWTPayload
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100)
  const offset = (page - 1) * limit

  const { results } = await c.env.DB.prepare(
    `SELECT t.*, e.event_name, e.start_time, e.end_time, e.location_name, e.banner_filename,
            tt.tier_name,
            CASE WHEN t.bid_price IS NOT NULL
                THEN MAX(t.bid_price, tt.price_total + COALESCE(t.food_total, 0) + COALESCE(t.drink_total, 0))
                ELSE (tt.price_total + COALESCE(t.food_total, 0) + COALESCE(t.drink_total, 0))
            END as price_total
     FROM tickets t
     JOIN events e ON t.event_uuid = e.event_uuid
     JOIN ticket_tiers tt ON t.tier_uuid = tt.tier_uuid
     WHERE t.user_uuid = ?
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(user.sub, limit, offset).all()

  const total = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM tickets WHERE user_uuid = ?'
  ).bind(user.sub).first() as { count: number } | null

  return c.json({
    tickets: results || [],
    pagination: {
      page,
      limit,
      total: total?.count || 0,
      total_pages: Math.ceil((total?.count || 0) / limit),
    },
  })
})

/**
 * GET /tickets/:ticketId
 * Get single ticket detail. Owner only (or admin/host via manage routes).
 */
tickets.get('/tickets/:ticketId', async (c) => {
  const user = c.get('user') as JWTPayload
  const ticketId = c.req.param('ticketId')

  const ticket = await c.env.DB.prepare(
    `SELECT t.*, e.event_name, e.start_time, e.end_time, e.location_name,
            e.banner_filename, e.tos_text, e.food_enabled, e.food_options as event_food_options, e.drinks_enabled, e.drink_options as event_drink_options,
            tt.tier_name, tt.price_total as tier_price, tt.name_your_price,
            CASE WHEN t.bid_price IS NOT NULL
                THEN MAX(t.bid_price, tt.price_total + COALESCE(t.food_total, 0) + COALESCE(t.drink_total, 0))
                ELSE (tt.price_total + COALESCE(t.food_total, 0) + COALESCE(t.drink_total, 0))
            END as price_total
     FROM tickets t
     JOIN events e ON t.event_uuid = e.event_uuid
     JOIN ticket_tiers tt ON t.tier_uuid = tt.tier_uuid
     WHERE t.ticket_uuid = ? AND t.user_uuid = ?`
  ).bind(ticketId, user.sub).first()

  if (!ticket) return c.json({ message: 'Ticket not found' }, 404)

  // Check if pending ticket has expired
  if ((ticket as any).purchase_status === 'under_payment' && (ticket as any).claim_expiry) {
    if (new Date((ticket as any).claim_expiry as string) < new Date()) {
      await expireTicket(c.env.DB, c.env.KV, ticket as any)
      ;(ticket as any).purchase_status = 'expired'
    }
  }

  return c.json(ticket)
})

// ═══════════════════════════════════════════════════
// HELPER: Expire a ticket (restore quota, clean KV)
// ═══════════════════════════════════════════════════
async function expireTicket(db: D1Database, kv: KVNamespace, ticket: TicketRow) {
  const now = new Date().toISOString()

  // Update ticket status
  await db.prepare(
    `UPDATE tickets SET purchase_status = 'expired', updated_at = ? WHERE ticket_uuid = ?`
  ).bind(now, ticket.ticket_uuid).run()

  // Restore quota
  await db.prepare(
    'UPDATE ticket_tiers SET quota_available = quota_available + 1, updated_at = ? WHERE tier_uuid = ?'
  ).bind(now, ticket.tier_uuid).run()

  // Update purchase log
  await db.prepare(
    `UPDATE purchase_log SET payment_status = 'expired', updated_at = ? WHERE ticket_uuid = ?`
  ).bind(now, ticket.ticket_uuid).run()

  // Restore voucher use
  if (ticket.voucher_uuid) {
    await db.prepare(
      'UPDATE event_vouchers SET uses_count = MAX(0, uses_count - 1), updated_at = ? WHERE voucher_uuid = ?'
    ).bind(now, ticket.voucher_uuid).run()
  }

  // Clean KV
  const kvService = new KVService(kv)
  await kvService.deleteClaimHold(ticket.user_uuid, ticket.event_uuid)
  await kvService.deletePaymentLock(ticket.ticket_uuid)
}

export { tickets }
