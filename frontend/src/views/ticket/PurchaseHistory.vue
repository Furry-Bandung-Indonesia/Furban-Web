<template>
  <div class="min-h-screen bg-[#0a0e17] text-white font-display">
    <!-- Navigation -->
    <nav class="fixed top-0 w-full z-50 bg-[#0a0e17]/80 backdrop-blur-md border-b border-white/5">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <router-link to="/event" class="flex items-center gap-2 text-[#94a3b8] hover:text-[#0df2f2] transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="text-sm font-medium">Browse Events</span>
        </router-link>
        <h1 class="text-sm font-bold text-white">My Tickets</h1>
        <router-link to="/dashboard" class="text-sm font-medium text-[#94a3b8] hover:text-white transition-colors">
          Dashboard
        </router-link>
      </div>
    </nav>

    <div class="max-w-4xl mx-auto px-4 pt-24 pb-20">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold mb-2">Purchase History</h1>
        <p class="text-[#94a3b8]">View all your event tickets and their statuses</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-12 h-12 border-4 border-[#0df2f2]/20 border-t-[#0df2f2] rounded-full animate-spin"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="tickets.length === 0" class="text-center py-20">
        <div class="w-20 h-20 bg-[#111827] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <h2 class="text-xl font-bold mb-2">No tickets yet</h2>
        <p class="text-[#94a3b8] mb-6">You haven't purchased any event tickets.</p>
        <router-link
          to="/event"
          class="inline-flex items-center gap-2 bg-[#0df2f2] hover:bg-[#00dada] text-[#0a0e17] font-bold px-6 py-3 rounded-lg transition-colors"
        >
          Browse Events
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </router-link>
      </div>

      <!-- Tickets List -->
      <div v-else class="space-y-4">
        <router-link
          v-for="t in tickets"
          :key="t.ticket_uuid"
          :to="getTicketLink(t)"
          class="block bg-[#111827] rounded-xl border border-[#1f2937] hover:border-[#0df2f2]/30 transition-all duration-200 overflow-hidden group"
        >
          <div class="flex flex-col sm:flex-row">
            <!-- Banner Thumbnail -->
            <div
              class="w-full sm:w-32 h-32 sm:h-auto bg-cover bg-center shrink-0"
              :style="t.banner_filename
                ? { backgroundImage: `url(${getEventImage(t.banner_filename)})` }
                : { background: 'linear-gradient(135deg, #0a0e17 0%, #1e3a8a 100%)' }"
            ></div>

            <!-- Content -->
            <div class="flex-1 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-bold text-white group-hover:text-[#0df2f2] transition-colors truncate">
                    {{ t.event_name }}
                  </h3>
                  <span
                    class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded"
                    :class="statusClass(t.purchase_status)"
                  >
                    {{ statusLabel(t.purchase_status) }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#94a3b8]">
                  <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ formatDate(t.start_time) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {{ t.location_name || 'TBA' }}
                  </span>
                  <span class="font-mono text-[#0df2f2]">{{ t.ticket_number }}</span>
                </div>
                <div class="mt-2 text-xs text-[#94a3b8]">
                  <span class="text-white font-medium">{{ t.tier_name }}</span>
                  <span v-if="t.first_name"> · {{ [t.first_name, t.last_name].filter(Boolean).join(' ') }}</span>
                </div>
              </div>

              <div class="flex flex-col items-end shrink-0">
                <span class="text-lg font-bold text-white">
                  {{ (t.price_total === 0 || !t.price_total) ? 'FREE' : 'IDR ' + t.price_total.toLocaleString('id-ID') }}
                </span>
                <svg class="w-5 h-5 text-[#94a3b8] group-hover:text-[#0df2f2] transition-colors mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </router-link>

        <!-- Pagination -->
        <div v-if="pagination.total_pages > 1" class="flex justify-center gap-2 pt-6">
          <button
            v-for="p in pagination.total_pages"
            :key="p"
            @click="loadPage(p)"
            class="w-10 h-10 rounded-lg text-sm font-medium transition-colors"
            :class="p === pagination.page
              ? 'bg-[#0df2f2] text-[#0a0e17]'
              : 'bg-[#111827] text-[#94a3b8] border border-[#1f2937] hover:bg-[#1f2937]'"
          >
            {{ p }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import ticketApi from '../../services/ticketApi'

export default {
  name: 'PurchaseHistory',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const loading = ref(true)
    const tickets = ref([])
    const pagination = ref({ page: 1, limit: 20, total: 0, total_pages: 0 })

    function getEventImage(filename) {
      return ticketApi.getEventImageUrl(filename)
    }

    function formatDate(dateStr) {
      if (!dateStr) return 'TBA'
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      })
    }

    function statusClass(status) {
      switch (status) {
        case 'paid': return 'bg-green-500/20 text-green-400 border border-green-500/30'
        case 'under_payment': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
        case 'checked_in': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        case 'expired': return 'bg-red-500/20 text-red-400 border border-red-500/30'
        case 'failed': return 'bg-red-500/20 text-red-400 border border-red-500/30'
        default: return 'bg-[#1f2937] text-[#94a3b8]'
      }
    }

    function statusLabel(status) {
      switch (status) {
        case 'paid': return 'PAID'
        case 'under_payment': return 'PENDING'
        case 'checked_in': return 'CHECKED IN'
        case 'expired': return 'EXPIRED'
        case 'failed': return 'FAILED'
        default: return status?.toUpperCase() || '—'
      }
    }

    function getTicketLink(t) {
      if (t.purchase_status === 'under_payment') {
        return `/event/payment/${t.ticket_uuid}`
      }
      return `/event/ticket/${t.ticket_uuid}`
    }

    async function loadPage(page = 1) {
      loading.value = true
      try {
        const data = await ticketApi.getMyTickets({ page, limit: 20 })
        tickets.value = data.tickets || []
        pagination.value = data.pagination || pagination.value
      } catch (err) {
        console.error('Failed to load tickets:', err)
      } finally {
        loading.value = false
      }
    }

    onMounted(async () => {
      await authStore.initializeAuth()
      await loadPage()
    })

    return {
      loading,
      tickets,
      pagination,
      getEventImage,
      formatDate,
      statusClass,
      statusLabel,
      getTicketLink,
      loadPage,
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');

.font-display {
  font-family: 'Be Vietnam Pro', sans-serif;
}
</style>
