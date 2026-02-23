<template>
  <div class="min-h-screen bg-[#0a0e17] text-white font-display">
    <div class="max-w-2xl mx-auto px-4 pt-20 pb-20">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-12 h-12 border-4 border-[#0df2f2]/20 border-t-[#0df2f2] rounded-full animate-spin"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-20">
        <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h2 class="text-xl font-bold mb-2">{{ error }}</h2>
        <router-link to="/purchases" class="text-[#0df2f2] hover:underline">Back to my tickets</router-link>
      </div>

      <!-- Ticket Card -->
      <template v-else-if="ticket">
        <!-- Status Banner -->
        <div
          class="rounded-t-2xl p-4 text-center font-bold text-sm"
          :class="{
            'bg-blue-500/20 text-blue-400 border border-blue-500/30': ticket.purchase_status === 'paid' && ticket.is_redeemed,
            'bg-green-500/20 text-green-400 border border-green-500/30': ticket.purchase_status === 'paid' && !ticket.is_redeemed,
            'bg-orange-500/20 text-orange-400 border border-orange-500/30': ticket.purchase_status === 'under_payment',
            'bg-red-500/20 text-red-400 border border-red-500/30': ticket.purchase_status === 'expired' || ticket.purchase_status === 'failed',
            'bg-purple-500/20 text-purple-400 border border-purple-500/30': ticket.purchase_status === 'revoked',
          }"
        >
          <span v-if="ticket.purchase_status === 'paid' && ticket.is_redeemed">CHECKED IN</span>
          <span v-else-if="ticket.purchase_status === 'paid'">TICKET CONFIRMED</span>
          <span v-else-if="ticket.purchase_status === 'under_payment'">AWAITING PAYMENT</span>
          <span v-else-if="ticket.purchase_status === 'expired'">EXPIRED</span>
          <span v-else-if="ticket.purchase_status === 'failed'">FAILED</span>
          <span v-else-if="ticket.purchase_status === 'revoked'">REVOKED</span>
          <span v-else>{{ ticket.purchase_status?.toUpperCase() }}</span>
        </div>

        <!-- Main Card -->
        <div class="bg-[#111827] border border-[#1f2937] border-t-0 rounded-b-2xl overflow-hidden">
          <!-- Event Banner -->
          <div
            v-if="ticket.banner_filename"
            class="w-full h-48 bg-cover bg-center relative"
            :style="{ backgroundImage: `url(${getEventImage(ticket.banner_filename)})` }"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent"></div>
          </div>

          <div class="p-6 md:p-8 space-y-6">
            <!-- Event Info -->
            <div>
              <h1 class="text-2xl md:text-3xl font-bold mb-2">{{ ticket.event_name }}</h1>
              <div class="flex flex-col sm:flex-row sm:items-center gap-3 text-[#94a3b8] text-sm">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ formatDate(ticket.start_time) }}
                </div>
                <div class="hidden sm:block w-1 h-1 rounded-full bg-[#94a3b8]"></div>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ ticket.location_name || 'TBA' }}
                </div>
              </div>
            </div>

            <!-- QR Code Section -->
            <div v-if="ticket.purchase_status === 'paid'" class="flex flex-col items-center py-6">
              <div class="bg-white p-4 rounded-2xl shadow-2xl mb-4">
                <canvas ref="qrCanvas"></canvas>
              </div>
              <p class="text-xs text-[#94a3b8] text-center max-w-xs">
                Show this QR code at the entrance for check-in
              </p>
            </div>

            <!-- Revoked Message -->
            <div v-if="ticket.purchase_status === 'revoked'" class="flex flex-col items-center py-6">
              <div class="size-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <svg class="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <p class="text-lg font-bold text-purple-400 mb-2">This ticket has been revoked</p>
              <p class="text-sm text-[#94a3b8] text-center max-w-xs">
                Please contact the event administrator if you believe this is a mistake.
              </p>
            </div>

            <!-- Dashed Separator (ticket tear line effect) -->
            <div class="relative">
              <div class="absolute left-0 top-1/2 w-4 h-8 bg-[#0a0e17] rounded-r-full -translate-y-1/2 -ml-6 md:-ml-8"></div>
              <div class="absolute right-0 top-1/2 w-4 h-8 bg-[#0a0e17] rounded-l-full -translate-y-1/2 -mr-6 md:-mr-8"></div>
              <div class="border-t-2 border-dashed border-[#1f2937]"></div>
            </div>

            <!-- Ticket Details -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-[#94a3b8] text-xs uppercase tracking-wider font-bold mb-1">Ticket Number</p>
                <p class="font-mono font-bold text-[#0df2f2]">{{ ticket.ticket_number }}</p>
              </div>
              <div>
                <p class="text-[#94a3b8] text-xs uppercase tracking-wider font-bold mb-1">Tier</p>
                <p class="font-bold">{{ ticket.tier_name }}</p>
              </div>
              <div>
                <p class="text-[#94a3b8] text-xs uppercase tracking-wider font-bold mb-1">Name</p>
                <p class="font-bold">{{ [ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-[#94a3b8] text-xs uppercase tracking-wider font-bold mb-1">Nickname</p>
                <p class="font-bold">{{ ticket.nickname || '—' }}</p>
              </div>
              <div>
                <p class="text-[#94a3b8] text-xs uppercase tracking-wider font-bold mb-1">Price</p>
                <p class="font-bold">
                  {{ (ticket.price_total === 0 || !ticket.price_total) ? 'FREE' : 'IDR ' + ticket.price_total.toLocaleString('id-ID') }}
                </p>
              </div>
              <div>
                <p class="text-[#94a3b8] text-xs uppercase tracking-wider font-bold mb-1">Fursuiter</p>
                <p class="font-bold">{{ ticket.is_fursuiter ? 'Yes' : 'No' }}</p>
              </div>
            </div>

            <!-- Pricing Breakdown (when food add-on exists) -->
            <div v-if="ticket.food_total > 0" class="bg-[#1a2332] border border-[#1f2937] rounded-xl p-4 space-y-2">
              <p class="text-[#94a3b8] text-xs uppercase tracking-wider font-bold mb-2">Price Breakdown</p>
              <div class="flex justify-between text-sm">
                <span class="text-[#94a3b8]">Ticket Base</span>
                <span class="text-white">IDR {{ (ticket.tier_price || (ticket.price_total - ticket.food_total)).toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-[#94a3b8]">Meal Add-on</span>
                <span class="text-amber-400">+IDR {{ ticket.food_total.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between text-sm pt-2 border-t border-[#1f2937] font-bold">
                <span class="text-white">Total</span>
                <span class="text-[#0df2f2]">IDR {{ ticket.price_total.toLocaleString('id-ID') }}</span>
              </div>
            </div>

            <!-- Food Selection with Prices -->
            <div v-if="ticket.food_selection && ticket.food_selection !== '[]'" class="space-y-2">
              <p class="text-[#94a3b8] text-xs uppercase tracking-wider font-bold">Food Selection</p>
              <div class="space-y-1.5">
                <div v-for="item in foodItemsWithPrices" :key="item.name"
                  class="flex items-center justify-between bg-[#1a2332] border border-[#1f2937] rounded-lg px-3 py-2">
                  <div>
                    <span class="text-sm text-white">{{ item.name }}</span>
                    <span v-if="item.choice" class="text-xs text-[#94a3b8] ml-1">— {{ item.choice }}</span>
                  </div>
                  <span v-if="item.price > 0" class="text-xs font-medium text-amber-400">+IDR {{ item.price.toLocaleString('id-ID') }}</span>
                  <span v-else class="text-xs font-medium text-green-400">Included</span>
                </div>
              </div>
            </div>

            <!-- Food Received Status -->
            <div v-if="ticket.food_selection && ticket.food_selection !== '[]' && ticket.purchase_status === 'paid'">
              <div class="flex items-center gap-3 p-4 rounded-xl border"
                :class="ticket.food_received ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'">
                <div class="size-10 rounded-full flex items-center justify-center"
                  :class="ticket.food_received ? 'bg-green-500/20' : 'bg-amber-500/20'">
                  <svg v-if="ticket.food_received" class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-bold" :class="ticket.food_received ? 'text-green-400' : 'text-amber-400'">
                    {{ ticket.food_received ? 'Food Received' : 'Food Not Yet Received' }}
                  </p>
                  <p class="text-xs mt-0.5" :class="ticket.food_received ? 'text-green-400/60' : 'text-amber-400/60'">
                    {{ ticket.food_received ? 'Your meal has been collected.' : 'Present your QR code at the food station to collect your meal.' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Pending Payment CTA -->
            <div v-if="ticket.purchase_status === 'under_payment'" class="pt-4">
              <router-link
                :to="`/event/payment/${ticket.ticket_uuid}`"
                class="w-full py-3 rounded-lg bg-[#0df2f2] hover:bg-[#00dada] text-[#0a0e17] font-bold flex items-center justify-center gap-2 transition-colors"
              >
                Complete Payment
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </router-link>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'
import ticketApi from '../../services/ticketApi'

export default {
  name: 'TicketDetail',
  setup() {
    const route = useRoute()
    const loading = ref(true)
    const error = ref(null)
    const ticket = ref(null)
    const qrCanvas = ref(null)

    function getEventImage(filename) {
      return ticketApi.getEventImageUrl(filename)
    }

    function formatDate(dateStr) {
      if (!dateStr) return 'TBA'
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    }

    function parseFoodSelection(raw) {
      try {
        const arr = JSON.parse(raw)
        return Array.isArray(arr) ? arr.join(', ') : raw
      } catch {
        return raw
      }
    }

    function parseEventFoodOptions(raw) {
      if (!raw) return []
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (!Array.isArray(parsed)) return []
        return parsed.map(o => typeof o === 'string' ? { name: o, price: 0 } : o)
      } catch { return [] }
    }

    const foodItemsWithPrices = computed(() => {
      if (!ticket.value) return []
      try {
        const selection = JSON.parse(ticket.value.food_selection || '[]')
        if (!Array.isArray(selection) || !selection.length) return []
        const eventOptions = parseEventFoodOptions(ticket.value.event_food_options)
        return selection.map(item => {
          // Support both old format (plain string) and new format (object with name/choice/choice_price)
          if (typeof item === 'string') {
            const opt = eventOptions.find(o => o.name === item)
            return { name: item, choice: null, price: opt?.price || 0 }
          }
          // New format: { name, choice, choice_price }
          const opt = eventOptions.find(o => o.name === item.name)
          const basePrice = opt?.price || 0
          const choicePrice = item.choice_price || 0
          return {
            name: item.name,
            choice: item.choice || null,
            price: basePrice + choicePrice,
          }
        })
      } catch { return [] }
    })

    async function generateQR() {
      if (!qrCanvas.value || !ticket.value) return
      try {
        await QRCode.toCanvas(qrCanvas.value, ticket.value.ticket_uuid, {
          width: 200,
          margin: 0,
          color: { dark: '#000000', light: '#ffffff' },
        })
      } catch (err) {
        console.error('QR generation failed:', err)
      }
    }

    function shareTicket() {
      if (navigator.share) {
        navigator.share({
          title: `Ticket: ${ticket.value?.event_name}`,
          text: `My ticket #${ticket.value?.ticket_number} for ${ticket.value?.event_name}`,
          url: window.location.href,
        })
      } else {
        navigator.clipboard.writeText(window.location.href)
        alert('Link copied!')
      }
    }

    function downloadTicket() {
      if (!qrCanvas.value) return
      const link = document.createElement('a')
      link.download = `ticket-${ticket.value?.ticket_number || 'unknown'}.png`
      link.href = qrCanvas.value.toDataURL()
      link.click()
    }

    onMounted(async () => {
      try {
        const data = await ticketApi.getTicket(route.params.ticketId)
        ticket.value = data
      } catch (err) {
        error.value = err.message || 'Ticket not found'
      } finally {
        loading.value = false
      }

      // Wait for the ticket template (and canvas) to mount after loading becomes false
      if (ticket.value && ticket.value.purchase_status === 'paid') {
        await nextTick()
        generateQR()
      }
    })

    return {
      loading,
      error,
      ticket,
      qrCanvas,
      getEventImage,
      formatDate,
      parseFoodSelection,
      foodItemsWithPrices,
      shareTicket,
      downloadTicket,
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
