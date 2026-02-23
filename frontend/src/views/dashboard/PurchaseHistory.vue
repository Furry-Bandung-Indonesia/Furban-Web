<template>
  <div class="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold text-white">Purchase History</h2>
      <p class="text-slate-400 text-sm mt-1">Track all your ticket transactions and payment status.</p>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-[#111318] border border-slate-800 rounded-xl p-4 text-center">
        <p class="text-2xl font-bold text-white">{{ summary.total }}</p>
        <p class="text-xs text-slate-500 mt-1 uppercase tracking-wider">Total Orders</p>
      </div>
      <div class="bg-[#111318] border border-slate-800 rounded-xl p-4 text-center">
        <p class="text-2xl font-bold text-emerald-400">{{ summary.paid }}</p>
        <p class="text-xs text-slate-500 mt-1 uppercase tracking-wider">Paid</p>
      </div>
      <div class="bg-[#111318] border border-slate-800 rounded-xl p-4 text-center">
        <p class="text-2xl font-bold text-amber-400">{{ summary.pending }}</p>
        <p class="text-xs text-slate-500 mt-1 uppercase tracking-wider">Pending</p>
      </div>
      <div class="bg-[#111318] border border-slate-800 rounded-xl p-4 text-center">
        <p class="text-2xl font-bold text-slate-400">{{ summary.expired }}</p>
        <p class="text-xs text-slate-500 mt-1 uppercase tracking-wider">Expired</p>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex-1 min-w-[200px] relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="searchQuery" placeholder="Search by event name..." class="w-full pl-10 pr-4 py-2.5 bg-[#111318] border border-slate-800 rounded-lg text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none" />
      </div>
      <select v-model="statusFilter" class="bg-[#111318] border border-slate-800 rounded-lg text-slate-300 text-sm px-4 py-2.5 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none">
        <option value="">All Status</option>
        <option value="paid">Paid</option>
        <option value="under_payment">Pending</option>
        <option value="expired">Expired</option>
        <option value="failed">Failed</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0df2f2] mx-auto"></div>
      <p class="text-slate-500 mt-4 text-sm">Loading history...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredTickets.length === 0" class="text-center py-16 bg-[#111318] border border-slate-800 rounded-xl">
      <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
      <p class="text-slate-400">No purchase history found</p>
    </div>

    <!-- Transaction List -->
    <div v-else class="space-y-3">
      <div v-for="ticket in filteredTickets" :key="ticket.ticket_uuid"
        class="bg-[#111318] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
        <div class="flex items-start gap-4">
          <!-- Date Box -->
          <div class="hidden sm:flex flex-col items-center justify-center bg-[#101622] border border-slate-800 rounded-lg p-3 min-w-[60px]">
            <span class="text-xs text-slate-500 uppercase">{{ getMonthShort(ticket.created_at) }}</span>
            <span class="text-xl font-bold text-white leading-tight">{{ getDay(ticket.created_at) }}</span>
            <span class="text-xs text-slate-500">{{ getYear(ticket.created_at) }}</span>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <h4 class="text-white font-bold truncate">{{ ticket.event_name }}</h4>
              <span :class="getStatusClass(ticket.purchase_status)" class="px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider flex-shrink-0">
                {{ getStatusLabel(ticket.purchase_status) }}
              </span>
            </div>
            <p class="text-slate-400 text-sm">{{ ticket.tier_name }} &bull; {{ ticket.ticket_number }}</p>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
              <span>{{ formatDateTime(ticket.created_at) }}</span>
              <span v-if="ticket.location_name">{{ ticket.location_name }}</span>
            </div>
          </div>

          <!-- Price -->
          <div class="text-right flex-shrink-0">
            <p class="text-white font-bold">{{ formatPrice(ticket.price_total) }}</p>
            <p v-if="ticket.is_redeemed" class="text-emerald-400 text-xs font-bold mt-1">Checked In</p>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TicketApiService from '@/services/ticketApi'

const ticketApi = new TicketApiService()

const loading = ref(false)
const tickets = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const pagination = ref({ page: 1, limit: 50, total: 0, total_pages: 0 })

const summary = computed(() => {
  const all = tickets.value
  return {
    total: all.length,
    paid: all.filter(t => t.purchase_status === 'paid').length,
    pending: all.filter(t => t.purchase_status === 'under_payment').length,
    expired: all.filter(t => t.purchase_status === 'expired' || t.purchase_status === 'failed').length
  }
})

const filteredTickets = computed(() => {
  let list = tickets.value
  if (statusFilter.value) {
    list = list.filter(t => t.purchase_status === statusFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(t => (t.event_name || '').toLowerCase().includes(q) || (t.ticket_number || '').toLowerCase().includes(q))
  }
  return list
})

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
    case 'under_payment': return 'Pending'
    case 'expired': return 'Expired'
    case 'failed': return 'Failed'
    default: return status
  }
}

const getMonthShort = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' })
}

const getDay = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).getDate()
}

const getYear = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).getFullYear()
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

const formatPrice = (price) => {
  if (!price || price === 0) return 'Free'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
}

const loadTickets = async (page = 1) => {
  loading.value = true
  try {
    const res = await ticketApi.getMyTickets({ page, limit: 50 })
    tickets.value = res.tickets || []
    pagination.value = res.pagination || { page: 1, limit: 50, total: 0, total_pages: 0 }
  } catch (e) {
    console.error('Error loading purchase history:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadTickets())
</script>
