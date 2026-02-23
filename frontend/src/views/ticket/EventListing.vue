<template>
  <div class="min-h-screen bg-[#0a0e17] text-white font-display pt-20">
    <div class="flex flex-col lg:flex-row flex-1 max-w-[1440px] mx-auto w-full p-6 md:p-10 gap-8 lg:gap-16">
      <!-- Sidebar -->
      <aside class="w-full lg:w-[280px] flex flex-col gap-8 shrink-0 relative">
        <div class="sticky top-28 flex flex-col gap-8">
          <div class="flex flex-col gap-3">
            <h1 class="text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
              Discover <span class="text-[#0df2f2]">Events</span>
            </h1>
            <p class="text-[#94a3b8] text-base leading-relaxed">
              Find and book tickets for the latest community gatherings, meetups, and conventions.
            </p>
          </div>

          <!-- Search -->
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              @input="debouncedSearch"
              type="text"
              placeholder="Search events..."
              class="w-full pl-10 pr-4 py-3 rounded-lg bg-[#111827] border border-[#1f2937] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#0df2f2] focus:ring-1 focus:ring-[#0df2f2] transition-colors"
            />
          </div>

          <!-- Filters -->
          <div class="flex flex-col gap-4">
            <h3 class="text-white text-sm uppercase tracking-wider font-bold opacity-70">Filter By</h3>
            <div class="flex flex-col gap-3">
              <button
                @click="activeFilter = 'upcoming'"
                class="group flex items-center justify-between w-full h-12 px-4 rounded-lg transition-all transform hover:-translate-y-0.5"
                :class="activeFilter === 'upcoming'
                  ? 'bg-[#0df2f2] text-[#0a0e17] font-bold shadow-[0_0_15px_rgba(13,242,242,0.15)]'
                  : 'bg-[#111827] text-[#94a3b8] border border-[#1f2937] hover:bg-[#1e3a8a] hover:text-white'"
              >
                <span>Upcoming</span>
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                @click="activeFilter = 'sold-out'"
                class="group flex items-center justify-between w-full h-12 px-4 rounded-lg transition-all transform hover:-translate-y-0.5"
                :class="activeFilter === 'sold-out'
                  ? 'bg-[#0df2f2] text-[#0a0e17] font-bold shadow-[0_0_15px_rgba(13,242,242,0.15)]'
                  : 'bg-[#111827] text-[#94a3b8] border border-[#1f2937] hover:bg-[#1e3a8a] hover:text-white'"
              >
                <span>Sold Out</span>
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </button>
            </div>
          </div>

          <div class="mt-4 pt-6 border-t border-[#1f2937]">
            <router-link to="/" class="group flex items-center gap-3 text-[#94a3b8] hover:text-[#0df2f2] transition-colors p-2 rounded-lg hover:bg-[#0df2f2]/5">
              <svg class="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <div class="flex flex-col">
                <span class="text-sm font-bold text-white group-hover:text-[#0df2f2]">Back to Home</span>
                <span class="text-xs">Return to main site</span>
              </div>
            </router-link>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col gap-8">
        <!-- Loading -->
        <div v-if="ticketStore.isLoading && !ticketStore.hasEvents" class="flex flex-col items-center justify-center p-12">
          <div class="w-12 h-12 border-4 border-[#0df2f2]/20 border-t-[#0df2f2] rounded-full animate-spin mb-4"></div>
          <p class="text-[#94a3b8]">Loading events...</p>
        </div>

        <!-- Error -->
        <div v-else-if="ticketStore.error && !ticketStore.hasEvents" class="flex flex-col items-center justify-center p-12 text-center text-[#94a3b8] bg-[#111827] rounded-xl border border-[#1f2937]">
          <svg class="w-16 h-16 mb-4 opacity-50 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 class="text-xl font-bold text-white">Failed to load events</h3>
          <p class="mt-2">{{ ticketStore.error }}</p>
          <button @click="loadEvents" class="mt-4 bg-[#0df2f2] hover:bg-[#00dada] text-[#0a0e17] font-bold px-6 py-2 rounded-lg">
            Try Again
          </button>
        </div>

        <!-- Events List -->
        <template v-else>
          <article
            v-for="event in filteredEvents"
            :key="event.event_uuid"
            class="group flex flex-col bg-[#111827] rounded-xl overflow-hidden border border-[#1f2937] transition-all duration-300 relative"
            :class="{
              'opacity-75 grayscale hover:grayscale-0 hover:opacity-100': isSoldOut(event),
              'hover:border-[#00dada] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]': !isSoldOut(event),
            }"
          >
            <!-- Image Section -->
            <div
              class="w-full h-48 md:h-64 bg-cover bg-center relative overflow-hidden"
              :style="{ backgroundImage: event.banner_filename ? `url(${getEventImage(event.banner_filename)})` : 'linear-gradient(135deg, #0a0e17 0%, #1e3a8a 100%)' }"
            >
              <div v-if="!isSoldOut(event)" class="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-90"></div>
              <div v-else class="absolute inset-0 bg-black/60"></div>

              <!-- Popular Badge -->
              <div v-if="!isSoldOut(event) && isPopular(event)" class="absolute top-4 left-4">
                <span class="inline-flex items-center gap-1 bg-[#0df2f2] text-[#0a0e17] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"></path>
                  </svg>
                  POPULAR
                </span>
              </div>

              <!-- Sold Out Badge -->
              <div v-if="isSoldOut(event)" class="absolute inset-0 flex items-center justify-center">
                <span class="bg-[#0a0e17] text-white border-2 border-white/20 px-6 py-2 rounded-lg font-black text-xl tracking-widest transform -rotate-12 shadow-2xl">
                  SOLD OUT
                </span>
              </div>
            </div>

            <!-- Content -->
            <div class="p-6 md:p-8 flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-start">
                  <h2 class="text-2xl md:text-3xl font-bold text-white group-hover:text-[#0df2f2] transition-colors">
                    {{ event.event_name }}
                  </h2>
                </div>
                <p class="text-[#94a3b8] line-clamp-2">{{ event.description }}</p>
              </div>

              <!-- Info Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4" :class="{ 'opacity-50': isSoldOut(event) }">
                <div class="flex items-center gap-3 text-white bg-[#0a0e17] p-3 rounded-lg border border-[#1f2937]">
                  <div class="size-10 rounded-full flex items-center justify-center shrink-0"
                    :class="isSoldOut(event) ? 'bg-[#1f2937] text-gray-400' : 'text-[#0df2f2]'"
                    :style="!isSoldOut(event) ? { backgroundColor: 'rgba(13, 242, 242, 0.1)' } : {}"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs text-[#94a3b8] uppercase tracking-wider font-bold">Date</span>
                    <span class="font-bold">{{ formatDate(event.start_time) }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-3 text-white bg-[#0a0e17] p-3 rounded-lg border border-[#1f2937]">
                  <div class="size-10 rounded-full flex items-center justify-center shrink-0"
                    :class="isSoldOut(event) ? 'bg-[#1f2937] text-gray-400' : 'text-[#0df2f2]'"
                    :style="!isSoldOut(event) ? { backgroundColor: 'rgba(13, 242, 242, 0.1)' } : {}"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs text-[#94a3b8] uppercase tracking-wider font-bold">Location</span>
                    <span class="font-bold truncate">{{ event.location_name || 'TBA' }}</span>
                  </div>
                </div>
              </div>

              <!-- Footer / Price & CTA -->
              <div class="flex flex-col md:flex-row items-center justify-between gap-4 mt-2 pt-6 border-t border-[#1f2937]">
                <div class="flex flex-col items-center md:items-start" :class="{ 'opacity-50': isSoldOut(event) }">
                  <span class="text-sm text-[#94a3b8] font-medium">Starting Price</span>
                  <span class="text-2xl font-black text-white">{{ getLowestPrice(event) }}</span>
                </div>

                <router-link
                  v-if="!isSoldOut(event)"
                  :to="`/event/id/${event.event_uuid}`"
                  class="w-full md:w-auto bg-[#0df2f2] hover:bg-[#00dada] text-[#0a0e17] font-bold text-lg px-8 py-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(13,242,242,0.15)]"
                >
                  <span>Buy Ticket</span>
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </router-link>
                <button
                  v-else
                  disabled
                  class="w-full md:w-auto bg-[#1f2937] text-gray-400 font-bold text-lg px-8 py-4 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <span>Unavailable</span>
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Empty State -->
          <div v-if="filteredEvents.length === 0 && !ticketStore.isLoading" class="flex flex-col items-center justify-center p-12 text-center text-[#94a3b8] bg-[#111827] rounded-xl border border-[#1f2937]">
            <svg class="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 class="text-xl font-bold text-white">No events found</h3>
            <p>Try changing your filter or search criteria.</p>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useTicketStore } from '../../stores/ticketing'
import ticketApi from '../../services/ticketApi'

export default {
  name: 'EventListing',
  setup() {
    const ticketStore = useTicketStore()
    const activeFilter = ref('upcoming')
    const searchQuery = ref('')
    let searchTimeout = null

    const filteredEvents = computed(() => {
      const events = ticketStore.events || []
      if (activeFilter.value === 'sold-out') {
        return events.filter(e => isSoldOut(e))
      }
      return events
    })

    function isSoldOut(event) {
      // Check if all tiers have 0 quota (if tiers are loaded)
      if (event.tiers && event.tiers.length > 0) {
        return event.tiers.every(t => t.quota_available <= 0)
      }
      return false
    }

    function isPopular(event) {
      // Consider popular if tiers exist and some are selling fast (< 20% remaining)
      if (event.tiers && event.tiers.length > 0) {
        return event.tiers.some(t => t.quota_available > 0 && t.quota_available <= t.quota_total * 0.2)
      }
      return false
    }

    function getEventImage(filename) {
      return ticketApi.getEventImageUrl(filename)
    }

    function formatDate(dateStr) {
      if (!dateStr) return 'TBA'
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + ' \u2022 ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    function getLowestPrice(event) {
      // Use min_price from API if available (listing endpoint)
      if (event.min_price !== null && event.min_price !== undefined) {
        if (event.min_price === 0) return 'FREE'
        return 'IDR ' + Number(event.min_price).toLocaleString('id-ID')
      }
      // Fallback to tiers if loaded (detail endpoint)
      if (event.tiers && event.tiers.length > 0) {
        const prices = event.tiers.filter(t => t.quota_available > 0).map(t => t.price_total)
        if (prices.length > 0) {
          const min = Math.min(...prices)
          if (min === 0) return 'FREE'
          return 'IDR ' + min.toLocaleString('id-ID')
        }
      }
      // No tiers at all
      if (event.tier_count === 0) return 'TBA'
      return 'Sold Out'
    }

    function debouncedSearch() {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        loadEvents()
      }, 400)
    }

    async function loadEvents() {
      try {
        await ticketStore.fetchEvents({ search: searchQuery.value || undefined })
      } catch (err) {
        console.error('Failed to load events:', err)
      }
    }

    onMounted(() => {
      loadEvents()
    })

    return {
      ticketStore,
      activeFilter,
      searchQuery,
      filteredEvents,
      isSoldOut,
      isPopular,
      getEventImage,
      formatDate,
      getLowestPrice,
      debouncedSearch,
      loadEvents,
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
