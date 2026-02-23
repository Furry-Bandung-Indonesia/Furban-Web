import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import ticketApi from '../services/ticketApi'

export const useTicketStore = defineStore('ticketing', () => {
  // ═══════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════
  const events = ref([])
  const currentEvent = ref(null)
  const currentTicket = ref(null)
  const myTickets = ref([])
  const pagination = ref({ page: 1, limit: 20, total: 0, total_pages: 0 })
  const isLoading = ref(false)
  const error = ref(null)

  // ═══════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════
  const eventTiers = computed(() => currentEvent.value?.tiers || [])
  const availableTiers = computed(() => eventTiers.value.filter(t => t.quota_available > 0))
  const hasEvents = computed(() => events.value.length > 0)

  // ═══════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════

  async function fetchEvents(params = {}) {
    isLoading.value = true
    error.value = null
    try {
      const data = await ticketApi.getEvents(params)
      events.value = data.events || []
      pagination.value = data.pagination || pagination.value
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEvent(eventId) {
    isLoading.value = true
    error.value = null
    try {
      const data = await ticketApi.getEvent(eventId)
      currentEvent.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function claimTicket(eventId, body) {
    isLoading.value = true
    error.value = null
    try {
      const data = await ticketApi.claimTicket(eventId, body)
      currentTicket.value = data.ticket || data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function payTicket(ticketId, body = {}) {
    isLoading.value = true
    error.value = null
    try {
      const data = await ticketApi.payTicket(ticketId, body)
      if (currentTicket.value && currentTicket.value.ticket_uuid === ticketId) {
        currentTicket.value.purchase_status = 'paid'
      }
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function cancelTicket(ticketId) {
    isLoading.value = true
    error.value = null
    try {
      const data = await ticketApi.cancelTicket(ticketId)
      if (currentTicket.value && currentTicket.value.ticket_uuid === ticketId) {
        currentTicket.value.purchase_status = 'expired'
      }
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMyTickets(params = {}) {
    isLoading.value = true
    error.value = null
    try {
      const data = await ticketApi.getMyTickets(params)
      myTickets.value = data.tickets || []
      pagination.value = data.pagination || pagination.value
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTicket(ticketId) {
    isLoading.value = true
    error.value = null
    try {
      const data = await ticketApi.getTicket(ticketId)
      currentTicket.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearCurrentEvent() {
    currentEvent.value = null
  }

  function clearCurrentTicket() {
    currentTicket.value = null
  }

  return {
    // State
    events, currentEvent, currentTicket, myTickets, pagination, isLoading, error,
    // Getters
    eventTiers, availableTiers, hasEvents,
    // Actions
    fetchEvents, fetchEvent, claimTicket, payTicket, cancelTicket,
    fetchMyTickets, fetchTicket, clearCurrentEvent, clearCurrentTicket,
  }
})
