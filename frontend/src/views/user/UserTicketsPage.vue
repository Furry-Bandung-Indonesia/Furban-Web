<template>
  <div class="min-h-screen bg-[#101622] pt-20 pb-12">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white">My Tickets</h1>
          <p class="text-slate-400 text-sm mt-1">View and manage your event tickets</p>
        </div>
        <router-link to="/event" class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0df2f2] hover:bg-[#0bd8d8] text-[#101622] font-bold text-sm rounded-lg transition-colors shadow-lg shadow-[#0df2f2]/20">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Browse Events
        </router-link>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0df2f2]"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="activeTickets.length === 0" class="text-center py-20">
        <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">No active tickets</h3>
        <p class="text-slate-400 mb-6">Your upcoming valid tickets will appear here.</p>
        <router-link to="/event" class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0df2f2] hover:bg-[#0bd8d8] text-[#101622] font-bold rounded-lg transition-colors">
          Explore Events
        </router-link>
      </div>

      <!-- Ticket Cards List -->
      <div v-else class="space-y-5">
        <div v-for="ticket in activeTickets" :key="ticket.ticket_uuid" class="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors group">
          <!-- Event Banner -->
          <div class="relative h-44 md:h-52 overflow-hidden bg-gradient-to-r from-slate-800 to-slate-700">
            <img v-if="ticket.banner_filename || ticket.banner_url" :src="getTicketImageUrl(ticket.banner_filename || ticket.banner_url)" alt="" class="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
            <div class="absolute inset-0 bg-gradient-to-t from-[#111318] via-transparent to-transparent"></div>
            <!-- Status Badge -->
            <div class="absolute top-3 right-3">
              <span :class="getStatusClass(ticket)" class="px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
                {{ getStatusLabel(ticket) }}
              </span>
            </div>
          </div>

          <!-- Info -->
          <div class="p-5 space-y-4">
            <h3 class="text-white text-xl md:text-2xl font-bold leading-tight">{{ ticket.event_name || 'Event' }}</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div class="bg-[#0d0f13] rounded-lg p-2.5">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Date</p>
                <p class="text-white text-xs mt-0.5">{{ formatDate(ticket.start_time || ticket.event_date || ticket.created_at) }}</p>
              </div>
              <div class="bg-[#0d0f13] rounded-lg p-2.5">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tier</p>
                <p class="text-[#0df2f2] text-xs font-medium mt-0.5">{{ ticket.tier_name || 'General' }}</p>
              </div>
              <div class="bg-[#0d0f13] rounded-lg p-2.5">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Ticket #</p>
                <p class="text-white text-xs font-mono mt-0.5">{{ ticket.ticket_number || ticket.ticket_uuid?.slice(0, 8) }}</p>
              </div>
              <div class="bg-[#0d0f13] rounded-lg p-2.5">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Price</p>
                <p class="text-white text-xs mt-0.5">{{ formatCurrency(ticket.price_total || ticket.tier_price) }}</p>
              </div>
            </div>
            <!-- Actions -->
            <div class="flex gap-2 pt-1">
              <button v-if="ticket.purchase_status === 'paid'" @click="showQR(ticket)" class="flex-1 px-3 py-2 bg-[#0df2f2]/10 text-[#0df2f2] text-xs font-bold rounded-lg hover:bg-[#0df2f2]/20 transition-colors text-center">
                Show QR Code
              </button>
              <router-link v-if="ticket.purchase_status === 'under_payment'" :to="`/event/payment/${ticket.ticket_uuid}`" class="flex-1 px-3 py-2 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/20 transition-colors text-center">
                Complete Payment
              </router-link>
              <router-link :to="`/event/ticket/${ticket.ticket_uuid}`" class="px-3 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors">
                Details
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-8">
        <button @click="loadTickets(page - 1)" :disabled="page <= 1" class="px-4 py-2 rounded-lg text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Prev</button>
        <span class="text-sm text-slate-400">Page {{ page }} of {{ totalPages }}</span>
        <button @click="loadTickets(page + 1)" :disabled="page >= totalPages" class="px-4 py-2 rounded-lg text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Next</button>
      </div>
    </div>

    <!-- QR Code Modal -->
    <div v-if="qrTicket" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="qrTicket = null">
      <div class="bg-[#111318] border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
        <h3 class="text-lg font-bold text-white mb-4">{{ qrTicket.event_name }}</h3>
        <div class="bg-white rounded-xl p-4 inline-block mb-4">
          <canvas ref="qrCanvas" class="w-48 h-48"></canvas>
        </div>
        <p class="text-sm text-slate-400 mb-1">Ticket #{{ qrTicket.ticket_number }}</p>
        <p class="text-xs text-slate-500">{{ qrTicket.tier_name }}</p>
        <button @click="qrTicket = null" class="mt-4 w-full px-4 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm font-medium transition-colors">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import QRCode from 'qrcode'
import ticketApi from '@/services/ticketApi'
import { getTicketImageUrl } from '@/config/api'

const loading = ref(true)
const tickets = ref([])
const page = ref(1)
const totalPages = ref(1)
const qrTicket = ref(null)
const qrCanvas = ref(null)

const activeTickets = computed(() => {
  const now = Date.now()
  return tickets.value.filter((ticket) => {
    const isAllowedStatus = ticket.purchase_status === 'paid' || ticket.purchase_status === 'under_payment'
    const isNotRedeemed = !ticket.is_redeemed
    const endDateRaw = ticket.end_time || ticket.event_end_time || ticket.event_date || ticket.start_time
    const hasNotEnded = !endDateRaw || new Date(endDateRaw).getTime() >= now
    return isAllowedStatus && isNotRedeemed && hasNotEnded
  })
})

const getStatusClass = (ticket) => {
  if (ticket.purchase_status === 'paid' && ticket.is_redeemed) return 'bg-blue-500/20 text-blue-400'
  switch (ticket.purchase_status) {
    case 'paid': return 'bg-emerald-500/20 text-emerald-400'
    case 'under_payment': return 'bg-amber-500/20 text-amber-400'
    case 'expired': return 'bg-slate-700 text-slate-400'
    case 'failed': return 'bg-red-500/20 text-red-400'
    default: return 'bg-slate-700 text-slate-400'
  }
}

const getStatusLabel = (ticket) => {
  if (ticket.purchase_status === 'paid' && ticket.is_redeemed) return 'Checked In'
  switch (ticket.purchase_status) {
    case 'paid': return 'Paid'
    case 'under_payment': return 'Pending'
    case 'expired': return 'Expired'
    case 'failed': return 'Failed'
    default: return ticket.purchase_status || 'Unknown'
  }
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0)
}

const showQR = async (ticket) => {
  qrTicket.value = ticket
  await nextTick()
  if (qrCanvas.value && ticket.ticket_uuid) {
    try {
      await QRCode.toCanvas(qrCanvas.value, ticket.ticket_uuid, {
        width: 200,
        margin: 0,
        color: { dark: '#000000', light: '#ffffff' },
      })
    } catch (err) {
      console.error('QR generation failed:', err)
    }
  }
}

const loadTickets = async (p = 1) => {
  loading.value = true
  try {
    const res = await ticketApi.getMyTickets({ page: p, limit: 20 })
    tickets.value = res.tickets || []
    if (res.pagination) {
      page.value = res.pagination.page
      totalPages.value = res.pagination.total_pages
    }
  } catch (e) {
    console.error('Failed to load tickets:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadTickets())
</script>
