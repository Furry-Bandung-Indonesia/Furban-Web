<template>
  <div class="min-h-screen bg-[#101622] pt-20 pb-12">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">Purchase History</h1>
        <p class="text-slate-400 text-sm mt-1">View all your past transactions</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0df2f2]"></div>
      </div>

      <div v-else>

        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-3 mb-6">
          <div class="flex-1 relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input v-model="search" type="text" placeholder="Search events..." class="block w-full border border-slate-700 py-2.5 pl-10 rounded-lg bg-[#111318] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none text-sm" />
          </div>
          <select v-model="statusFilter" class="border border-slate-700 bg-[#111318] text-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0df2f2]/40 outline-none">
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="under_payment">Pending</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <!-- Empty State -->
        <div v-if="filteredTickets.length === 0" class="text-center py-16">
          <p class="text-slate-500">No purchases match your search.</p>
        </div>

        <!-- Transaction List (same layout as /tickets) -->
        <div v-else class="space-y-5">
          <div v-for="ticket in filteredTickets" :key="ticket.ticket_uuid" class="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors group">
            <div class="relative h-44 md:h-52 overflow-hidden bg-gradient-to-r from-slate-800 to-slate-700">
              <img v-if="ticket.banner_filename || ticket.banner_url" :src="getTicketImageUrl(ticket.banner_filename || ticket.banner_url)" alt="" class="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
              <div class="absolute inset-0 bg-gradient-to-t from-[#111318] via-transparent to-transparent"></div>
              <div class="absolute top-3 right-3">
                <span :class="getStatusClass(ticket)" class="px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
                  {{ getStatusLabel(ticket) }}
                </span>
              </div>
            </div>

            <div class="p-5 space-y-4">
              <h3 class="text-white text-xl md:text-2xl font-bold leading-tight">{{ ticket.event_name || 'Event Ticket' }}</h3>
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

              <div class="flex gap-2 pt-1">
                <router-link :to="`/event/ticket/${ticket.ticket_uuid}`" class="flex-1 px-3 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors text-center">
                  Details
                </router-link>
                <router-link v-if="ticket.purchase_status === 'under_payment'" :to="`/event/payment/${ticket.ticket_uuid}`" class="flex-1 px-3 py-2 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/20 transition-colors text-center">
                  Complete Payment
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ticketApi from '@/services/ticketApi'
import { getTicketImageUrl } from '@/config/api'

const loading = ref(true)
const allTickets = ref([])
const search = ref('')
const statusFilter = ref('')

const filteredTickets = computed(() => {
  let list = allTickets.value
  if (statusFilter.value) list = list.filter(t => t.purchase_status === statusFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(t => (t.event_name || '').toLowerCase().includes(q) || (t.ticket_number || '').toLowerCase().includes(q))
  }
  return list
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

const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0)

onMounted(async () => {
  try {
    const res = await ticketApi.getMyTickets({ page: 1, limit: 100 })
    allTickets.value = res.tickets || []
  } catch (e) {
    console.error('Failed to load tickets:', e)
  } finally {
    loading.value = false
  }
})
</script>
