/**
 * Ticketing API Service
 * 
 * Communicates with backend-ticketing (port 8789).
 * Uses the same JWT token from authApi (shared secret).
 */
import config from '../config/api'

class TicketApiService {
  constructor() {
    this.baseURL = config.ticketURL || 'http://localhost:8789'
  }

  getToken() {
    return localStorage.getItem('authToken')
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      ...(options.headers || {}),
    }

    // Add auth token if available (don't set Content-Type for FormData)
    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Set Content-Type for JSON bodies
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}`)
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  }

  // ═══════════════════════════════════════════════════
  // PUBLIC - Events
  // ═══════════════════════════════════════════════════

  /**
   * List published events
   * @param {Object} params - { page, limit, search }
   */
  async getEvents(params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page.toString())
    if (params.limit) query.set('limit', params.limit.toString())
    if (params.search) query.set('search', params.search)
    const qs = query.toString()
    return this.request(`/api/events${qs ? '?' + qs : ''}`)
  }

  /**
   * Get single event detail (with tiers)
   */
  async getEvent(eventId) {
    return this.request(`/api/events/${eventId}`)
  }

  // ═══════════════════════════════════════════════════
  // AUTH REQUIRED - Tickets
  // ═══════════════════════════════════════════════════

  /**
   * Claim a ticket for an event
   * @param {string} eventId
   * @param {Object} body - { tier_uuid, first_name, last_name, nickname, date_of_birth, social_link, is_fursuiter, food_selection, turnstile_token }
   */
  async claimTicket(eventId, body) {
    return this.request(`/api/events/${eventId}/claim`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * Pay for a ticket (auto-succeeds in dev)
   * @param {string} ticketId
   * @param {Object} body - { payment_reference? }
   */
  async payTicket(ticketId, body = {}) {
    return this.request(`/api/tickets/${ticketId}/pay`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * Cancel a pending ticket
   */
  async cancelTicket(ticketId) {
    return this.request(`/api/tickets/${ticketId}/cancel`, {
      method: 'POST',
    })
  }

  /**
   * Get user's purchase history
   */
  async getMyTickets(params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page.toString())
    if (params.limit) query.set('limit', params.limit.toString())
    const qs = query.toString()
    return this.request(`/api/tickets/my${qs ? '?' + qs : ''}`)
  }

  /**
   * Get single ticket detail
   */
  async getTicket(ticketId) {
    return this.request(`/api/tickets/${ticketId}`)
  }

  /**
   * Update personal info on a ticket (while under_payment)
   * @param {string} ticketId
   * @param {Object} body - { first_name?, last_name?, nickname?, date_of_birth?, social_link?, is_fursuiter?, food_selection? }
   */
  async updateMyTicket(ticketId, body) {
    return this.request(`/api/tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  // ═══════════════════════════════════════════════════
  // ADMIN / HOST — Manage Events
  // ═══════════════════════════════════════════════════

  /** List events the current user can manage (admin=all, host=permitted) */
  async getManageableEvents() {
    return this.request('/api/manage')
  }

  /** Get full event management detail (with tiers, stats, host count) */
  async getManageEvent(eventId) {
    return this.request(`/api/manage/${eventId}`)
  }

  /** Create a new event (admin only). Accepts FormData with banner. */
  async createEvent(formData) {
    return this.request('/api/events', {
      method: 'POST',
      body: formData, // FormData — no Content-Type header set manually
    })
  }

  /** Update an event. Accepts FormData with optional banner. */
  async updateEvent(eventId, formData) {
    return this.request(`/api/events/${eventId}`, {
      method: 'PUT',
      body: formData,
    })
  }

  /** Delete an event (cascades all data). */
  async deleteEvent(eventId) {
    return this.request(`/api/events/${eventId}`, { method: 'DELETE' })
  }

  /** Change event status (draft → published → closed). */
  async updateEventStatus(eventId, status) {
    return this.request(`/api/events/${eventId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  // ═══════════════════════════════════════════════════
  // ADMIN / HOST — Tiers
  // ═══════════════════════════════════════════════════

  /** List tiers for an event (admin sees admin_fee) */
  async getTiers(eventId) {
    return this.request(`/api/events/${eventId}/tiers`)
  }

  /** Create a tier */
  async createTier(eventId, body) {
    return this.request(`/api/events/${eventId}/tiers`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /** Update a tier */
  async updateTier(eventId, tierId, body) {
    return this.request(`/api/events/${eventId}/tiers/${tierId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  /** Delete a tier (only if no paid tickets) */
  async deleteTier(eventId, tierId) {
    return this.request(`/api/events/${eventId}/tiers/${tierId}`, { method: 'DELETE' })
  }

  // ═══════════════════════════════════════════════════
  // ADMIN / HOST — Attendees & Check-In
  // ═══════════════════════════════════════════════════

  /** List attendees with filters */
  async getAttendees(eventId, params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page.toString())
    if (params.limit) query.set('limit', params.limit.toString())
    if (params.search) query.set('search', params.search)
    if (params.status) query.set('status', params.status)
    if (params.tier) query.set('tier', params.tier)
    if (params.redeemed) query.set('redeemed', params.redeemed)
    const qs = query.toString()
    return this.request(`/api/manage/${eventId}/attendees${qs ? '?' + qs : ''}`)
  }

  /** Get single attendee detail */
  async getAttendee(eventId, ticketId) {
    return this.request(`/api/manage/${eventId}/attendees/${ticketId}`)
  }

  /** Update attendee info */
  async updateAttendee(eventId, ticketId, body) {
    return this.request(`/api/manage/${eventId}/attendees/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  /** Search sender candidates (ticket holders) for ticket transfer */
  async searchTransferSenders(eventId, params = {}) {
    const query = new URLSearchParams()
    if (params.q) query.set('q', params.q)
    if (params.limit) query.set('limit', params.limit.toString())
    const qs = query.toString()
    return this.request(`/api/manage/${eventId}/attendees/transfer/senders${qs ? '?' + qs : ''}`)
  }

  /** Transfer a ticket to another user */
  async transferTicket(eventId, ticketId, receiverUserUuid) {
    return this.request(`/api/manage/${eventId}/attendees/${ticketId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ receiver_user_uuid: receiverUserUuid }),
    })
  }

  /** Manual override: mark under_payment ticket as paid */
  async manualPayTicket(eventId, ticketId) {
    return this.request(`/api/manage/${eventId}/attendees/${ticketId}/manual-pay`, {
      method: 'POST',
    })
  }

  /** Revoke a paid ticket */
  async revokeTicket(eventId, ticketId, reason = '') {
    return this.request(`/api/manage/${eventId}/attendees/${ticketId}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  /** Restore a revoked ticket back to paid */
  async unrevokeTicket(eventId, ticketId) {
    return this.request(`/api/manage/${eventId}/attendees/${ticketId}/unrevoke`, {
      method: 'POST',
    })
  }

  /** Verify ticket for check-in (QR code or manual) */
  async verifyCheckin(eventId, body) {
    return this.request(`/api/manage/${eventId}/checkin/verify`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /** Redeem (check-in) a ticket */
  async redeemTicket(eventId, body) {
    return this.request(`/api/manage/${eventId}/checkin/redeem`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /** Un-redeem a ticket */
  async unredeemTicket(eventId, body) {
    return this.request(`/api/manage/${eventId}/checkin/unredeem`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /** Check-in statistics */
  async getCheckinStats(eventId) {
    return this.request(`/api/manage/${eventId}/checkin/stats`)
  }

  /** Mark food as received/not received for a ticket */
  async markFoodReceived(eventId, body) {
    return this.request(`/api/manage/${eventId}/checkin/food-received`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /** Mark drink as received/not received for a ticket */
  async markDrinkReceived(eventId, body) {
    return this.request(`/api/manage/${eventId}/checkin/drink-received`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // ═══════════════════════════════════════════════════
  // ADMIN / HOST — Moderation v3
  // Tab 1: Keyword List  |  Tab 2: Account Suspects  |  Tab 3: Attempt Logs
  // ═══════════════════════════════════════════════════

  // ─── Tab 1: Keyword List ───

  /** List moderation keyword entries (paginated, searchable, filterable) */
  async getModerationList(eventId, params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page.toString())
    if (params.limit) query.set('limit', params.limit.toString())
    if (params.type) query.set('type', params.type)
    if (params.status) query.set('status', params.status)
    if (params.enabled !== undefined && params.enabled !== '') query.set('enabled', params.enabled.toString())
    if (params.search) query.set('search', params.search)
    const qs = query.toString()
    return this.request(`/api/manage/${eventId}/moderation${qs ? '?' + qs : ''}`)
  }

  /** Get keyword entry detail with appeals, attempts, dismissals */
  async getModerationDetail(eventId, modId) {
    return this.request(`/api/manage/${eventId}/moderation/${modId}/detail`)
  }

  /** Add a BAN or WATCH keyword entry */
  async addModeration(eventId, body) {
    return this.request(`/api/manage/${eventId}/moderation`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /** Update a keyword entry */
  async updateModeration(eventId, modId, body) {
    return this.request(`/api/manage/${eventId}/moderation/${modId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  /** Toggle keyword entry enabled/disabled */
  async toggleModerationEnabled(eventId, modId, enabled) {
    return this.request(`/api/manage/${eventId}/moderation/${modId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    })
  }

  /** Remove a keyword entry permanently */
  async removeModeration(eventId, modId) {
    return this.request(`/api/manage/${eventId}/moderation/${modId}`, { method: 'DELETE' })
  }

  /** File an appeal for a keyword entry */
  async appealModeration(eventId, modId, body) {
    return this.request(`/api/manage/${eventId}/moderation/${modId}/appeal`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /** Reinstate an appealed keyword entry */
  async reinstateModeration(eventId, modId, body) {
    return this.request(`/api/manage/${eventId}/moderation/${modId}/reinstate`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /** Get appeal history for a keyword entry */
  async getModerationAppeals(eventId, modId) {
    return this.request(`/api/manage/${eventId}/moderation/${modId}/appeals`)
  }

  // ─── Tab 2: Account Suspects ───

  /** List pending suspects (unresolved detections) */
  async getSuspects(eventId, params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page.toString())
    if (params.limit) query.set('limit', params.limit.toString())
    if (params.type) query.set('type', params.type)
    if (params.detection) query.set('detection', params.detection)
    const qs = query.toString()
    return this.request(`/api/manage/${eventId}/moderation/suspects${qs ? '?' + qs : ''}`)
  }

  /** Get suspect count for badge */
  async getSuspectCount(eventId) {
    return this.request(`/api/manage/${eventId}/moderation/suspects/count`)
  }

  /** Confirm a suspect as same person */
  async confirmSuspect(eventId, attemptId, body = {}) {
    return this.request(`/api/manage/${eventId}/moderation/suspects/${attemptId}/confirm`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  /** Dismiss a suspect as false recognition */
  async dismissSuspect(eventId, attemptId, body = {}) {
    return this.request(`/api/manage/${eventId}/moderation/suspects/${attemptId}/dismiss`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  /** Change suspect type (BAN_BLOCKED ↔ WATCH_DETECTED) */
  async updateSuspectType(eventId, attemptId, type, notes = '') {
    return this.request(`/api/manage/${eventId}/moderation/suspects/${attemptId}/type`, {
      method: 'PUT',
      body: JSON.stringify({ type, notes }),
    })
  }

  /** Delete a pending suspect record */
  async deleteSuspect(eventId, attemptId) {
    return this.request(`/api/manage/${eventId}/moderation/suspects/${attemptId}`, {
      method: 'DELETE',
    })
  }

  // ─── Tab 3: Confirmed Accounts ───

  /** List confirmed BAN/WATCH accounts */
  async getConfirmedAccounts(eventId, params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page.toString())
    if (params.limit) query.set('limit', params.limit.toString())
    if (params.type) query.set('type', params.type)
    if (params.status) query.set('status', params.status)
    const qs = query.toString()
    return this.request(`/api/manage/${eventId}/moderation/confirmed${qs ? '?' + qs : ''}`)
  }

  /** Get confirmed accounts count */
  async getConfirmedCount(eventId) {
    return this.request(`/api/manage/${eventId}/moderation/confirmed/count`)
  }

  /** Change confirmed account type (BAN_BLOCKED ↔ WATCH_DETECTED) */
  async updateConfirmedType(eventId, attemptId, type, notes = '') {
    return this.request(`/api/manage/${eventId}/moderation/confirmed/${attemptId}/type`, {
      method: 'PUT',
      body: JSON.stringify({ type, notes }),
    })
  }

  /** Toggle confirmed account enforcement (CONFIRMED ↔ SUSPENDED) */
  async toggleConfirmedActive(eventId, attemptId) {
    return this.request(`/api/manage/${eventId}/moderation/confirmed/${attemptId}/toggle`, {
      method: 'PUT',
    })
  }

  /** Revoke confirmed account back to pending */
  async revokeConfirmed(eventId, attemptId, notes = '') {
    return this.request(`/api/manage/${eventId}/moderation/confirmed/${attemptId}/revoke`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    })
  }

  // ─── Tab 4: Attempt Logs (Enforcement) ───

  /** View enforcement log: blocked purchases and scanner flags */
  async getModerationAttempts(eventId, params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page.toString())
    if (params.limit) query.set('limit', params.limit.toString())
    if (params.action_type) query.set('action_type', params.action_type)
    const qs = query.toString()
    return this.request(`/api/manage/${eventId}/moderation/attempts${qs ? '?' + qs : ''}`)
  }

  /** Get pending moderation count (legacy compat) */
  async getModerationPendingCount(eventId) {
    return this.request(`/api/manage/${eventId}/moderation/pending-count`)
  }

  /** Manual moderation check */
  async checkModeration(eventId, body) {
    return this.request(`/api/manage/${eventId}/moderation/check`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /** Full scan: all keywords × all attendees across all events */
  async scanModeration(eventId) {
    return this.request(`/api/manage/${eventId}/moderation/scan`, {
      method: 'POST',
    })
  }

  // ═══════════════════════════════════════════════════
  // ADMIN — Permissions (Host Management)
  // ═══════════════════════════════════════════════════

  /** List all hosts/permissions for an event */
  async getPermissions(eventId) {
    return this.request(`/api/manage/${eventId}/permissions`)
  }

  /** Add a host */
  async addPermission(eventId, body) {
    return this.request(`/api/manage/${eventId}/permissions`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /** Update a permission */
  async updatePermission(eventId, permId, body) {
    return this.request(`/api/manage/${eventId}/permissions/${permId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  /** Remove a host */
  async removePermission(eventId, permId) {
    return this.request(`/api/manage/${eventId}/permissions/${permId}`, { method: 'DELETE' })
  }

  // ═══════════════════════════════════════════════════
  // ADMIN — Revenue
  // ═══════════════════════════════════════════════════

  /** Revenue breakdown for an event */
  async getRevenue(eventId) {
    return this.request(`/api/manage/${eventId}/revenue`)
  }

  // ═══════════════════════════════════════════════════
  // ADMIN — Payment Channel Management (Global)
  // ═══════════════════════════════════════════════════

  /** List all payment channels (admin view, includes enable/disable state) */
  async getPaymentChannels(eventId) {
    return this.request(`/api/manage/${eventId}/payment/channels`)
  }

  /** Sync channels from WijayaPay API */
  async syncPaymentChannels(eventId) {
    return this.request(`/api/manage/${eventId}/payment/channels/sync`, { method: 'POST' })
  }

  /** Toggle a payment channel enabled/disabled */
  async togglePaymentChannel(eventId, code) {
    return this.request(`/api/manage/${eventId}/payment/channels/${code}/toggle`, { method: 'PUT' })
  }

  /** Update sort order for all channels */
  async reorderPaymentChannels(eventId, orders) {
    return this.request(`/api/manage/${eventId}/payment/channels/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orders }),
    })
  }

  // ═══════════════════════════════════════════════════
  // PUBLIC — Payment Channels (User view)
  // ═══════════════════════════════════════════════════

  /** Get enabled payment channels for users (no tutorial) */
  async getPublicPaymentChannels() {
    return this.request('/api/payment/channels/public')
  }

  // ═══════════════════════════════════════════════════
  // PAYMENT PROCESSING
  // ═══════════════════════════════════════════════════

  /** Generate a payment via WijayaPay */
  async generatePayment(body) {
    return this.request('/api/payment/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /** Check payment status */
  async checkPaymentStatus(refId) {
    return this.request(`/api/payment/status/${refId}`)
  }

  /** Get existing payment transaction for a ticket (for restoring state after refresh) */
  async getPaymentForTicket(ticketId) {
    return this.request(`/api/payment/for-ticket/${ticketId}`)
  }
  // ═══════════════════════════════════════════════════

  /** Get financial summary for an event */
  async getEventFinancials(eventId) {
    return this.request(`/api/manage/${eventId}/payment/financials`)
  }

  /** Update financial settings (admin fee) */
  async updateFinancialSettings(eventId, body) {
    return this.request(`/api/manage/${eventId}/payment/financials/settings`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  /** Record host payout */
  async recordHostPayout(eventId, body) {
    return this.request(`/api/manage/${eventId}/payment/financials/payout`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  /** List transactions for an event */
  async getEventTransactions(eventId, params = {}) {
    const qs = new URLSearchParams(params).toString()
    return this.request(`/api/manage/${eventId}/payment/transactions${qs ? '?' + qs : ''}`)
  }

  // ═══════════════════════════════════════════════════
  // VOUCHERS
  // ═══════════════════════════════════════════════════

  /**
   * Validate a voucher code for a specific tier — previews discount without consuming it.
   * @param {string} eventId
   * @param {Object} body - { code, tier_uuid }
   */
  async validateVoucher(eventId, body) {
    return this.request(`/api/events/${eventId}/vouchers/validate`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * List all vouchers for an event (ADMIN + HOST).
   * @param {string} eventId
   */
  async getVouchers(eventId) {
    return this.request(`/api/manage/${eventId}/vouchers`)
  }

  /**
   * Create a new voucher (ADMIN only).
   * @param {string} eventId
   * @param {Object} body - { code, discount_type, discount_value, max_uses, is_active? }
   */
  async createVoucher(eventId, body) {
    return this.request(`/api/manage/${eventId}/vouchers`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * Update a voucher (ADMIN only).
   * @param {string} eventId
   * @param {string} voucherId
   * @param {Object} body - { code?, discount_type?, discount_value?, max_uses?, is_active? }
   */
  async updateVoucher(eventId, voucherId, body) {
    return this.request(`/api/manage/${eventId}/vouchers/${voucherId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  /**
   * Delete a voucher (ADMIN only — only if uses_count = 0).
   * @param {string} eventId
   * @param {string} voucherId
   */
  async deleteVoucher(eventId, voucherId) {
    return this.request(`/api/manage/${eventId}/vouchers/${voucherId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Get usage details for a specific voucher (ADMIN only).
   * Returns list of tickets that used this voucher.
   * @param {string} eventId
   * @param {string} voucherId
   */
  async getVoucherUsages(eventId, voucherId) {
    return this.request(`/api/manage/${eventId}/vouchers/${voucherId}/usages`)
  }

  // ═══════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════

  /**
   * Upload a content image (description / TOS) for an event to R2.
   * Returns the public URL for the uploaded image.
   * @param {string} eventId
   * @param {File} file
   */
  async uploadEventContentImage(eventId, file) {
    const formData = new FormData()
    formData.append('file', file)
    return this.request(`/api/events/${eventId}/upload-image`, {
      method: 'POST',
      body: formData,
    })
  }

  /**
   * Get event banner image URL
   */
  getEventImageUrl(bannerFilename) {
    if (!bannerFilename) return null
    if (bannerFilename.startsWith('http')) return bannerFilename
    return `${this.baseURL}/images/${bannerFilename}`
  }
}

export default new TicketApiService()
