<template>
  <div class="min-h-screen bg-[#0a0e17] text-white font-display pb-20">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="w-12 h-12 border-4 border-[#0df2f2]/20 border-t-[#0df2f2] rounded-full animate-spin"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-screen px-4">
      <svg class="w-16 h-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <h2 class="text-xl font-bold mb-2">{{ error }}</h2>
      <router-link to="/event" class="text-[#0df2f2] hover:underline">Back to events</router-link>
    </div>

    <template v-else-if="event">
      <!-- Hero Section -->
      <div class="relative h-[400px] md:h-[500px] w-full overflow-hidden group">
        <div class="absolute inset-0">
          <img
            v-if="event.banner_filename"
            :src="getEventImage(event.banner_filename)"
            :alt="event.event_name"
            class="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          <div v-else class="w-full h-full bg-gradient-to-br from-[#0a0e17] to-[#1e3a8a]"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/80 to-transparent"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-[#0a0e17]/90 via-transparent to-transparent"></div>
        </div>

        <div class="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-end pb-12">
          <!-- Badges -->
          <div class="flex gap-3 mb-4">
            <span v-if="hasLowStock" class="bg-[#0df2f2]/20 text-[#0df2f2] border border-[#0df2f2]/30 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"></path>
              </svg>
              SELLING FAST
            </span>
            <span v-if="event.food_enabled" class="bg-white/10 text-[#94a3b8] border border-white/10 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Food Included
            </span>
          </div>

          <h1 class="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight max-w-3xl">
            {{ event.event_name }}
          </h1>

          <div class="flex flex-col md:flex-row md:items-center gap-6 text-[#94a3b8] mb-8">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="font-medium text-white">{{ formatDate(event.start_time) }}</span>
            </div>
            <div class="hidden md:block w-1 h-1 rounded-full bg-[#94a3b8]"></div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="font-medium text-white">{{ event.location_name || 'TBA' }}</span>
            </div>
          </div>

          <!-- Mobile CTA -->
          <button
            @click="scrollToTiers"
            class="md:hidden w-full bg-[#0df2f2] text-[#0a0e17] font-bold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            Get Tickets
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Main Content Layout -->
      <main class="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- Left Column -->
        <div class="lg:col-span-2 space-y-12">
          <!-- About Section -->
          <section>
            <h2 class="text-2xl font-bold text-white mb-4">About the Event</h2>
            <div class="text-[#94a3b8] leading-relaxed space-y-4">
              <p>{{ event.description }}</p>
            </div>
          </section>

          <!-- Ticket Selection Section -->
          <section id="ticket-tiers">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-white">Select Tickets</h2>
            </div>

            <!-- Sales Status Banner -->
            <div v-if="salesBlocked" class="mb-6 rounded-xl border p-5" :class="salesBannerClass">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" :class="salesIconBgClass">
                  <svg v-if="effectiveSalesStatus === 'sold_out'" class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  <svg v-else-if="effectiveSalesStatus === 'coming_soon'" class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <svg v-else class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                  <p class="font-bold text-sm" :class="salesTitleClass">{{ salesStatusLabel }}</p>
                  <p class="text-xs mt-1 opacity-80" :class="salesTitleClass">{{ salesStatusMessage }}</p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div
                v-for="tier in tiers"
                :key="tier.tier_uuid"
                class="relative rounded-xl border p-5 transition-all duration-200 bg-[#111827]"
                :class="{
                  'border-[#0df2f2] ring-1 ring-[#0df2f2]': !salesBlocked && selectedTier === tier.tier_uuid,
                  'border-[#1f2937]': salesBlocked || selectedTier !== tier.tier_uuid,
                  'opacity-60': tier.quota_available <= 0 || salesBlocked,
                }"
              >
                <!-- Best Value badge -->
                <div
                  v-if="isBestValue(tier)"
                  class="absolute -top-3 right-4 bg-[#0df2f2] text-[#0a0e17] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-lg"
                >
                  Best Value
                </div>

                <div class="flex flex-col sm:flex-row justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-1">
                      <h3 class="text-lg font-bold text-white">{{ tier.tier_name }}</h3>
                      <span
                        v-if="tier.quota_available > 0 && tier.quota_available <= tier.quota_total * 0.2"
                        class="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-orange-500/30"
                      >
                        Selling Fast
                      </span>
                      <span
                        v-else-if="tier.quota_available > 0"
                        class="bg-green-500/20 text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-500/30"
                      >
                        Available
                      </span>
                      <span
                        v-else
                        class="bg-[#1f2937] text-[#94a3b8] text-[10px] font-bold px-1.5 py-0.5 rounded"
                      >
                        Sold Out
                      </span>
                    </div>
                    <p v-if="tier.tier_description" class="text-sm text-[#94a3b8] mb-3">{{ tier.tier_description }}</p>
                    <p class="text-xs text-[#94a3b8]">{{ tier.quota_available }} out of {{ tier.quota_total }} remaining</p>
                  </div>

                  <div class="flex flex-row sm:flex-col justify-between items-center sm:items-end min-w-[140px]">
                    <div class="text-right">
                      <div class="text-2xl font-bold text-white">
                        {{ tier.price_total === 0 ? 'FREE' : 'IDR ' + tier.price_total.toLocaleString('id-ID') }}
                      </div>
                    </div>
                    <div class="mt-2">
                      <button
                        v-if="salesBlocked || tier.quota_available <= 0"
                        disabled
                        class="w-[120px] py-2 rounded-lg border border-[#1f2937] text-[#94a3b8] text-sm font-medium cursor-not-allowed bg-[#0a0e17]/50"
                      >
                        {{ salesBlocked ? salesButtonLabel : 'Unavailable' }}
                      </button>
                      <button
                        v-else-if="selectedTier === tier.tier_uuid"
                        @click="selectedTier = null"
                        class="w-[120px] py-2 rounded-lg bg-[#0df2f2] text-[#0a0e17] text-sm font-bold transition-colors"
                      >
                        Selected
                      </button>
                      <button
                        v-else
                        @click="selectedTier = tier.tier_uuid"
                        class="w-[120px] py-2 rounded-lg bg-[#1f2937] hover:bg-[#0df2f2] hover:text-[#0a0e17] text-white text-sm font-medium transition-colors border border-[#1f2937]"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Existing Ticket Warning -->
            <div v-if="existingTicket" class="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-start gap-4">
              <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-red-300 font-bold text-sm mb-1">You already have a ticket for this event</p>
                <p class="text-red-300/80 text-xs mb-3">
                  {{ existingTicket.purchase_status === 'paid'
                    ? 'Each user can only claim one ticket per event.'
                    : (existingTicket.nickname && existingTicket.date_of_birth && existingTicket.phone_number
                      ? 'You have a pending payment. Please complete or cancel it first.'
                      : 'You have a pending reservation. Please complete your information first.') }}
                </p>
                <router-link
                  :to="existingTicket.purchase_status === 'paid'
                    ? `/event/ticket/${existingTicket.ticket_uuid}`
                    : (existingTicket.nickname && existingTicket.date_of_birth && existingTicket.phone_number
                      ? `/event/payment/${existingTicket.ticket_uuid}`
                      : `/event/ticket/${existingTicket.ticket_uuid}/fill`)"
                  class="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold text-xs px-4 py-2 rounded-lg transition-colors border border-red-500/30"
                >
                  {{ existingTicket.purchase_status === 'paid' ? 'View My Ticket' : (existingTicket.nickname && existingTicket.date_of_birth && existingTicket.phone_number ? 'Complete Payment' : 'Complete Registration') }}
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </router-link>
              </div>
            </div>

            <!-- Claim Error -->
            <div v-if="claimError && !existingTicket" class="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <svg class="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p class="text-sm text-red-300">{{ claimError }}</p>
            </div>

            <!-- Checkout CTA (Desktop) -->
            <div v-if="selectedTier && !existingTicket && !salesBlocked" class="mt-6 bg-[#111827] p-6 rounded-xl border border-[#1f2937] hidden lg:block">
              <!-- Turnstile Widget -->
              <div class="flex justify-center mb-4">
                <div ref="turnstileDesktopRef"></div>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-[#94a3b8] text-sm">Selected: {{ selectedTierData?.tier_name }}</div>
                  <div class="text-3xl font-bold text-white">
                    {{ selectedTierData?.price_total === 0 ? 'FREE' : 'IDR ' + (selectedTierData?.price_total || 0).toLocaleString('id-ID') }}
                  </div>
                </div>
                <button
                  @click="proceedToClaim"
                  :disabled="claimingTicket || !turnstileToken"
                  class="font-bold py-3 px-8 rounded-lg transition-all flex items-center gap-2 shadow-lg"
                  :class="claimingTicket
                    ? 'bg-[#334155] text-[#94a3b8] cursor-not-allowed'
                    : 'bg-[#0df2f2] hover:bg-[#00dada] text-[#0a0e17] shadow-[#0df2f2]/20'"
                >
                  <div v-if="claimingTicket" class="w-5 h-5 border-2 border-[#0a0e17]/20 border-t-[#0a0e17] rounded-full animate-spin"></div>
                  <span>{{ claimingTicket ? 'Reserving...' : 'Proceed to Checkout' }}</span>
                  <svg v-if="!claimingTicket" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </section>

          <!-- ToS Section -->
          <section v-if="event.tos_text">
            <h2 class="text-2xl font-bold text-white mb-4">Terms & Conditions</h2>
            <div class="tos-content text-[#94a3b8] leading-relaxed bg-[#111827] p-6 rounded-xl border border-[#1f2937] text-sm" v-html="sanitizeTos(event.tos_text)"></div>
          </section>
        </div>

        <!-- Right Column: Sidebar -->
        <aside class="space-y-6">
          <!-- Date & Location Card -->
          <div class="bg-[#111827] rounded-xl border border-[#1f2937] p-5 space-y-6">
            <div class="flex gap-4">
              <div class="w-10 h-10 rounded-lg bg-[#0df2f2]/10 flex items-center justify-center shrink-0 text-[#0df2f2]">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div class="text-sm font-bold text-white mb-0.5">Date & Time</div>
                <div class="text-sm text-[#94a3b8]">{{ formatDateLong(event.start_time) }}</div>
                <div v-if="event.end_time" class="text-xs text-[#94a3b8] mt-0.5">
                  Ends: {{ formatDateLong(event.end_time) }}
                </div>
              </div>
            </div>
            <div class="h-px bg-white/5"></div>
            <div class="flex gap-4">
              <div class="w-10 h-10 rounded-lg bg-[#0df2f2]/10 flex items-center justify-center shrink-0 text-[#0df2f2]">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div class="text-sm font-bold text-white mb-0.5">{{ event.location_name || 'Location TBA' }}</div>
                <div v-if="event.location_address" class="text-sm text-[#94a3b8]">{{ event.location_address }}</div>
              </div>
            </div>
          </div>

          <!-- Map -->
          <div v-if="event.location_lat && event.location_long" class="rounded-xl overflow-hidden border border-[#1f2937]">
            <iframe
              :src="`https://www.openstreetmap.org/export/embed.html?bbox=${event.location_long - 0.01},${event.location_lat - 0.01},${event.location_long + 0.01},${event.location_lat + 0.01}&layer=mapnik&marker=${event.location_lat},${event.location_long}`"
              class="w-full h-[200px] border-0"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
            <a
              :href="`https://www.google.com/maps?q=${event.location_lat},${event.location_long}`"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#0df2f2] hover:text-[#00dada] bg-[#111827] transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in Google Maps
            </a>
          </div>

          <!-- Share & Save Buttons -->
          <div class="grid grid-cols-2 gap-4">
            <button
              @click="shareEvent"
              class="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#1f2937] text-[#94a3b8] font-medium hover:bg-[#111827] transition-colors text-sm"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            <router-link
              to="/event"
              class="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#1f2937] text-[#94a3b8] font-medium hover:bg-[#111827] transition-colors text-sm"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              All Events
            </router-link>
          </div>
        </aside>
      </main>

      <!-- Sticky Footer Mobile -->
      <div
        v-if="selectedTier && !existingTicket && !salesBlocked"
        class="fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-[#1f2937] p-4 lg:hidden z-40"
      >
        <!-- Turnstile Widget Mobile -->
        <div class="flex justify-center mb-3">
          <div ref="turnstileMobileRef"></div>
        </div>
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-[#94a3b8] text-xs">{{ selectedTierData?.tier_name }}</div>
            <div class="text-xl font-bold text-white">
              {{ selectedTierData?.price_total === 0 ? 'FREE' : 'IDR ' + (selectedTierData?.price_total || 0).toLocaleString('id-ID') }}
            </div>
          </div>
          <button
            @click="proceedToClaim"
            :disabled="claimingTicket || !turnstileToken"
            class="font-bold py-3 px-6 rounded-lg flex-1 text-center shadow-lg transition-all"
            :class="claimingTicket
              ? 'bg-[#334155] text-[#94a3b8] cursor-not-allowed'
              : 'bg-[#0df2f2] hover:bg-[#00dada] text-[#0a0e17]'"
          >
            {{ claimingTicket ? 'Reserving...' : 'Checkout' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTicketStore } from '../../stores/ticketing'
import { useAuthStore } from '../../stores/auth'
import ticketApi from '../../services/ticketApi'
import DOMPurify from 'dompurify'

export default {
  name: 'EventDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const ticketStore = useTicketStore()
    const authStore = useAuthStore()

    const loading = ref(true)
    const error = ref(null)
    const event = ref(null)
    const tiers = ref([])
    const selectedTier = ref(null)
    const existingTicket = ref(null)
    const checkingTicket = ref(false)
    const claimingTicket = ref(false)
    const claimError = ref(null)
    const turnstileToken = ref('')
    const turnstileDesktopRef = ref(null)
    const turnstileMobileRef = ref(null)
    let turnstileDesktopId = null
    let turnstileMobileId = null

    const TURNSTILE_SITE_KEY = '0x4AAAAAACYz8MBTSm0NXSvb'

    function renderTurnstileWidgets() {
      if (!window.turnstile) return
      const callback = (token) => { turnstileToken.value = token }
      const expiredCb = () => { turnstileToken.value = '' }
      const errorCb = () => { turnstileToken.value = '' }
      const opts = {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        callback,
        'expired-callback': expiredCb,
        'error-callback': errorCb,
      }
      if (turnstileDesktopRef.value && !turnstileDesktopId) {
        turnstileDesktopId = window.turnstile.render(turnstileDesktopRef.value, opts)
      }
      if (turnstileMobileRef.value && !turnstileMobileId) {
        turnstileMobileId = window.turnstile.render(turnstileMobileRef.value, opts)
      }
    }

    function resetTurnstile() {
      turnstileToken.value = ''
      if (window.turnstile) {
        if (turnstileDesktopId != null) window.turnstile.reset(turnstileDesktopId)
        if (turnstileMobileId != null) window.turnstile.reset(turnstileMobileId)
      }
    }

    const selectedTierData = computed(() => {
      if (!selectedTier.value) return null
      return tiers.value.find(t => t.tier_uuid === selectedTier.value)
    })

    const hasLowStock = computed(() => {
      return tiers.value.some(t => t.quota_available > 0 && t.quota_available <= t.quota_total * 0.2)
    })

    // ─── Sales status computed properties ────────────
    const effectiveSalesStatus = computed(() => {
      return event.value?.effective_sales_status || event.value?.sales_status || 'available'
    })

    const salesBlocked = computed(() => {
      return effectiveSalesStatus.value !== 'available'
    })

    const salesStatusLabel = computed(() => {
      const map = {
        sold_out: 'Sold Out',
        coming_soon: 'Coming Soon',
        unavailable: 'Unavailable',
      }
      return map[effectiveSalesStatus.value] || 'Unavailable'
    })

    const salesButtonLabel = computed(() => {
      const map = {
        sold_out: 'Sold Out',
        coming_soon: 'Soon',
        unavailable: 'Closed',
      }
      return map[effectiveSalesStatus.value] || 'Closed'
    })

    const salesStatusMessage = computed(() => {
      const status = effectiveSalesStatus.value
      if (status === 'sold_out') return 'All tickets have been sold out. Check back later for updates.'
      if (status === 'coming_soon') {
        const openTime = event.value?.sales_open_time
        if (openTime) {
          const d = new Date(openTime)
          const formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
            ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          return `Ticket sales will open on ${formatted}`
        }
        return 'Ticket sales will open soon. Stay tuned!'
      }
      if (status === 'unavailable') return 'Ticket sales are currently closed.'
      return ''
    })

    const salesBannerClass = computed(() => {
      const map = {
        sold_out: 'bg-red-500/5 border-red-500/20',
        coming_soon: 'bg-amber-500/5 border-amber-500/20',
        unavailable: 'bg-slate-500/5 border-slate-600/20',
      }
      return map[effectiveSalesStatus.value] || ''
    })

    const salesIconBgClass = computed(() => {
      const map = {
        sold_out: 'bg-red-500/20',
        coming_soon: 'bg-amber-500/20',
        unavailable: 'bg-slate-500/20',
      }
      return map[effectiveSalesStatus.value] || ''
    })

    const salesTitleClass = computed(() => {
      const map = {
        sold_out: 'text-red-300',
        coming_soon: 'text-amber-300',
        unavailable: 'text-slate-300',
      }
      return map[effectiveSalesStatus.value] || ''
    })

    function isBestValue(tier) {
      // Find the tier with best price among available tiers
      const available = tiers.value.filter(t => t.quota_available > 0)
      if (available.length <= 1) return false
      const sorted = [...available].sort((a, b) => a.price_total - b.price_total)
      // Second cheapest = best value (common pattern)
      return sorted.length > 1 && tier.tier_uuid === sorted[1].tier_uuid
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
      }) + ' \u2022 ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    function formatDateLong(dateStr) {
      if (!dateStr) return 'TBA'
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    function scrollToTiers() {
      const el = document.getElementById('ticket-tiers')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }

    function shareEvent() {
      if (navigator.share) {
        navigator.share({
          title: event.value?.event_name,
          text: event.value?.description,
          url: window.location.href,
        })
      } else {
        navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    }

    function sanitizeTos(html) {
      if (!html) return ''
      // If it looks like plain text (no HTML tags), wrap lines in <p>
      if (!/<[a-z][\s\S]*>/i.test(html)) {
        return html.split('\n').map(line => `<p>${DOMPurify.sanitize(line)}</p>`).join('')
      }
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'hr', 'mark', 'span', 'div'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      })
    }

    async function checkExistingTicket() {
      if (!authStore.isAuthenticated) return
      checkingTicket.value = true
      try {
        const data = await ticketApi.getMyTickets({ limit: 100 })
        const tickets = data.tickets || []
        const eventId = route.params.eventId

        const existing = tickets.find(t => {
          if (t.event_uuid !== eventId) return false
          if (t.purchase_status === 'paid') return true
          if (t.purchase_status === 'under_payment') {
            // Check if claim_expiry has passed — if so, treat as expired
            if (t.claim_expiry && new Date(t.claim_expiry) < new Date()) {
              return false
            }
            return true
          }
          return false
        })

        if (existing) {
          existingTicket.value = existing
        }
      } catch {
        // silently ignore
      } finally {
        checkingTicket.value = false
      }
    }

    async function proceedToClaim() {
      if (!selectedTier.value) return
      if (existingTicket.value) return
      if (claimingTicket.value) return
      if (salesBlocked.value) return
      const eventId = route.params.eventId

      if (!authStore.isAuthenticated) {
        router.push({
          path: '/login',
          query: { redirect: `/event/id/${eventId}` }
        })
        return
      }

      claimingTicket.value = true
      claimError.value = null

      try {
        // Claim ticket immediately — slot is reserved, timer starts
        const data = await ticketApi.claimTicket(eventId, {
          tier_uuid: selectedTier.value,
          first_name: authStore.user?.first_name || authStore.user?.username || 'Attendee',
          last_name: authStore.user?.last_name || '',
          nickname: authStore.user?.nickname || '',
          is_fursuiter: false,
          turnstile_token: turnstileToken.value,
        })

        const ticketUuid = data.ticket?.ticket_uuid || data.ticket_uuid
        // Redirect to fill personal information page
        router.push(`/event/ticket/${ticketUuid}/fill`)
      } catch (err) {
        if (err.status === 409) {
          // Already has a ticket
          existingTicket.value = {
            ticket_uuid: err.data?.ticket_uuid,
            purchase_status: err.message?.includes('pending') ? 'under_payment' : 'paid',
          }
          claimError.value = err.message
        } else {
          claimError.value = err.message || 'Failed to claim ticket. Please try again.'
        }
        // Reset Turnstile on error so user can retry
        resetTurnstile()
      } finally {
        claimingTicket.value = false
      }
    }

    // Render Turnstile when tier is selected
    watch(selectedTier, (val) => {
      if (val) {
        nextTick(() => renderTurnstileWidgets())
      } else {
        resetTurnstile()
      }
    })

    onMounted(async () => {
      await authStore.initializeAuth()
      const eventId = route.params.eventId
      try {
        const data = await ticketApi.getEvent(eventId)
        event.value = data
        tiers.value = data.tiers || []
        // Check if user already has a ticket for this event
        await checkExistingTicket()
      } catch (err) {
        error.value = err.message || 'Event not found'
      } finally {
        loading.value = false
      }
    })

    return {
      authStore,
      loading,
      error,
      event,
      tiers,
      selectedTier,
      selectedTierData,
      hasLowStock,
      isBestValue,
      getEventImage,
      formatDate,
      formatDateLong,
      scrollToTiers,
      shareEvent,
      sanitizeTos,
      existingTicket,
      checkingTicket,
      claimingTicket,
      claimError,
      proceedToClaim,
      turnstileToken,
      turnstileDesktopRef,
      turnstileMobileRef,
      // Sales status
      effectiveSalesStatus,
      salesBlocked,
      salesStatusLabel,
      salesButtonLabel,
      salesStatusMessage,
      salesBannerClass,
      salesIconBgClass,
      salesTitleClass,
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');

.font-display {
  font-family: 'Be Vietnam Pro', sans-serif;
}

/* Rendered TOS HTML styles */
.tos-content :deep(h2) {
  font-size: 1.15rem;
  font-weight: 700;
  color: white;
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
}

.tos-content :deep(h3) {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
}

.tos-content :deep(p) {
  margin-bottom: 0.5rem;
}

.tos-content :deep(ul),
.tos-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.tos-content :deep(ul) {
  list-style-type: disc;
}

.tos-content :deep(ol) {
  list-style-type: decimal;
}

.tos-content :deep(li) {
  margin-bottom: 0.25rem;
}

.tos-content :deep(blockquote) {
  border-left: 3px solid #0df2f2;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #64748b;
  font-style: italic;
}

.tos-content :deep(a) {
  color: #0df2f2;
  text-decoration: underline;
}

.tos-content :deep(hr) {
  border: none;
  border-top: 1px solid #1f2937;
  margin: 0.75rem 0;
}

.tos-content :deep(strong) {
  color: white;
  font-weight: 600;
}
</style>
