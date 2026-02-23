<template>
  <div class="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold text-white">My Tickets</h2>
      <p class="text-slate-400 text-sm mt-1">View your event tickets and QR codes.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0df2f2] mx-auto"></div>
      <p class="text-slate-500 mt-4 text-sm">Loading tickets...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="tickets.length === 0" class="text-center py-16 bg-[#111318] border border-slate-800 rounded-xl">
      <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
      <p class="text-slate-400 font-medium">No tickets yet</p>
      <p class="text-slate-500 text-sm mt-1">Browse events and claim your first ticket.</p>
      <router-link to="/event" class="inline-block mt-4 px-5 py-2 bg-[#0df2f2] text-[#101622] font-bold text-sm rounded-lg hover:bg-[#0bd8d8] transition-colors shadow-lg shadow-[#0df2f2]/20">
        Browse Events
      </router-link>
    </div>

    <!-- Ticket Cards -->
    <div v-else class="space-y-4">
      <div v-for="ticket in tickets" :key="ticket.ticket_uuid"
        class="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all">
        <div class="flex flex-col md:flex-row">
          <!-- Event Banner -->
          <div class="md:w-48 h-36 md:h-auto bg-slate-800 flex-shrink-0">
            <img v-if="ticket.banner_filename" :src="getTicketImageUrl(ticket.banner_filename)" class="w-full h-full object-cover"
              @error="(e) => e.target.style.display='none'" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>

          <!-- Ticket Info -->
          <div class="flex-1 p-5">
            <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h3 class="text-lg font-bold text-white">{{ ticket.event_name }}</h3>
                <p class="text-slate-400 text-sm mt-0.5">{{ ticket.tier_name }}</p>
              </div>
              <span :class="getStatusClass(ticket.purchase_status)" class="px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider flex-shrink-0">
                {{ getStatusLabel(ticket.purchase_status) }}
              </span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span class="text-slate-500 text-xs uppercase tracking-wider">Date</span>
                <p class="text-white font-medium mt-0.5">{{ formatDate(ticket.start_time) }}</p>
              </div>
              <div>
                <span class="text-slate-500 text-xs uppercase tracking-wider">Location</span>
                <p class="text-white font-medium mt-0.5">{{ ticket.location_name || 'TBA' }}</p>
              </div>
              <div>
                <span class="text-slate-500 text-xs uppercase tracking-wider">Ticket #</span>
                <p class="text-[#0df2f2] font-mono font-bold mt-0.5">{{ ticket.ticket_number }}</p>
              </div>
              <div>
                <span class="text-slate-500 text-xs uppercase tracking-wider">Price</span>
                <p class="text-white font-medium mt-0.5">{{ formatPrice(ticket.price_total) }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
              <button v-if="ticket.purchase_status === 'paid'" @click="viewTicketDetail(ticket)"
                class="px-4 py-1.5 bg-[#0df2f2]/10 text-[#0df2f2] rounded-lg text-sm font-bold hover:bg-[#0df2f2]/20 transition-colors">
                View QR Code
              </button>
              <button v-if="ticket.purchase_status === 'under_payment'" @click="goToPayment(ticket)"
                class="px-4 py-1.5 bg-amber-500/15 text-amber-400 rounded-lg text-sm font-bold hover:bg-amber-500/25 transition-colors">
                Complete Payment
              </button>
              <span v-if="ticket.is_redeemed" class="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                Checked In
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.total_pages > 1" class="flex justify-center gap-2 pt-4">
      <button @click="loadTickets(pagination.page - 1)" :disabled="pagination.page <= 1"
        class="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Previous
      </button>
      <span class="px-3 py-1.5 text-slate-400 text-sm">
        Page {{ pagination.page }} of {{ pagination.total_pages }}
      </span>
      <button @click="loadTickets(pagination.page + 1)" :disabled="pagination.page >= pagination.total_pages"
        class="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Next
      </button>
    </div>

    <!-- QR Code Modal -->
    <div v-if="showQRModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div class="bg-[#111318] border border-slate-700 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-bold text-white">Your Ticket</h3>
          <button @click="showQRModal = false" class="text-slate-400 hover:text-white p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div v-if="selectedTicket" class="space-y-4">
          <div class="bg-white p-6 rounded-xl inline-block mx-auto">
            <div class="w-48 h-48 flex items-center justify-center">
              <img v-if="selectedTicket.qr_code_url" :src="selectedTicket.qr_code_url" class="w-full h-full" />
              <div v-else class="text-center text-slate-500">
                <svg class="w-16 h-16 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                <p class="text-xs mt-2">QR code</p>
              </div>
            </div>
          </div>
          <div class="space-y-2">
            <p class="text-white font-bold text-lg">{{ selectedTicket.event_name }}</p>
            <p class="text-[#0df2f2] font-mono font-bold">{{ selectedTicket.ticket_number }}</p>
            <p class="text-slate-400 text-sm">{{ selectedTicket.tier_name }}</p>
            <p class="text-slate-500 text-sm">{{ formatDate(selectedTicket.start_time) }} &bull; {{ selectedTicket.location_name }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TicketApiService from '@/services/ticketApi'
import { getTicketImageUrl } from '@/config/api'

const router = useRouter()
const ticketApi = new TicketApiService()

const loading = ref(false)
const tickets = ref([])
const pagination = ref({ page: 1, limit: 20, total: 0, total_pages: 0 })
const showQRModal = ref(false)
const selectedTicket = ref(null)

const getStatusClass = (status) => {
  switch (status) {
    case 'paid': return 'bg-emerald-500/20 text-emerald-400'
    case 'under_payment': return 'bg-amber-500/20 text-amber-400'
    case 'expired': return 'bg-slate-700 text-slate-400'
    case 'failed': return 'bg-red-500/20 text-red-400'
    default: return 'bg-slate-700 text-slate-400'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'paid': return 'Paid'
    case 'under_payment': return 'Pending Payment'
    case 'expired': return 'Expired'
    case 'failed': return 'Failed'
    default: return status
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'TBA'
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

const formatPrice = (price) => {
  if (!price || price === 0) return 'Free'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
}

const viewTicketDetail = async (ticket) => {
  try {
    const detail = await ticketApi.getTicket(ticket.ticket_uuid)
    selectedTicket.value = detail
    showQRModal.value = true
  } catch (e) {
    selectedTicket.value = ticket
    showQRModal.value = true
  }
}

const goToPayment = (ticket) => {
  router.push(`/event/${ticket.event_uuid}/payment/${ticket.ticket_uuid}`)
}

const loadTickets = async (page = 1) => {
  loading.value = true
  try {
    const res = await ticketApi.getMyTickets({ page, limit: 20 })
    tickets.value = res.tickets || []
    pagination.value = res.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 }
  } catch (e) {
    console.error('Error loading tickets:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadTickets())
</script>
