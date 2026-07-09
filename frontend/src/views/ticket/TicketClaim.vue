<template>
  <div class="min-h-screen bg-[#020617] text-white antialiased">
    <!-- Header -->
    <header class="sticky top-0 z-50 flex items-center justify-between border-b border-[#334155] bg-[#0f172a]/95 backdrop-blur-md px-4 sm:px-10 py-3">
      <div class="flex items-center gap-2 text-[#94a3b8]">
        <svg class="w-5 h-5 text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        <span class="text-sm font-medium">
          <span class="text-[#0df2f2] font-bold">Step 1</span> of 2 — Personal Information
        </span>
      </div>
      <div v-if="ticket" class="hidden md:flex items-center gap-2 text-sm font-medium text-[#94a3b8]">
        <span>Ticket:</span>
        <span v-if="ticket.ticket_number" class="font-mono text-white bg-[#334155] px-2 py-0.5 rounded">#{{ ticket.ticket_number }}</span>
        <span v-else class="text-xs text-amber-400">Pending</span>
      </div>
      <div class="w-24"></div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="w-12 h-12 border-4 border-[#0df2f2]/20 border-t-[#0df2f2] rounded-full animate-spin"></div>
    </div>

    <!-- Expired -->
    <div v-else-if="ticket && (ticket.purchase_status === 'expired' || ticket.purchase_status === 'failed')" class="flex items-center justify-center py-32 px-4">
      <div class="text-center max-w-md">
        <div class="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold mb-2">Reservation Expired</h1>
        <p class="text-[#94a3b8] mb-8">Your ticket reservation has expired. Please try again.</p>
        <router-link :to="`/event/id/${ticket.event_uuid}`"
          class="inline-flex items-center gap-2 bg-[#0df2f2] hover:bg-[#00dada] text-[#020617] font-bold px-8 py-3 rounded-lg transition-colors">
          Back to Event
        </router-link>
      </div>
    </div>

    <!-- Already Paid -->
    <div v-else-if="ticket && ticket.purchase_status === 'paid'" class="flex items-center justify-center py-32 px-4">
      <div class="text-center max-w-md">
        <div class="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold mb-2">Ticket Already Purchased</h1>
        <p class="text-[#94a3b8] mb-8">This ticket is already paid for.</p>
        <router-link :to="`/event/ticket/${ticket.ticket_uuid}`"
          class="inline-flex items-center gap-2 bg-[#0df2f2] hover:bg-[#00dada] text-[#020617] font-bold px-8 py-3 rounded-lg transition-colors">
          View My Ticket
        </router-link>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="flex items-center justify-center py-32 px-4">
      <div class="text-center max-w-md">
        <div class="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold mb-2">Something went wrong</h1>
        <p class="text-[#94a3b8] mb-8">{{ loadError }}</p>
        <router-link to="/event"
          class="inline-flex items-center gap-2 bg-[#0df2f2] hover:bg-[#00dada] text-[#020617] font-bold px-8 py-3 rounded-lg transition-colors">
          Back to Events
        </router-link>
      </div>
    </div>

    <!-- Main Form -->
    <template v-else-if="ticket">
      <div class="flex flex-1 justify-center py-8 px-4 sm:px-6">
        <div class="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <!-- ═══ Left Sidebar ═══ -->
          <div class="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-20">
            <!-- Timer -->
            <div class="rounded-xl border border-[#334155] bg-[#1e293b]/50 p-6 shadow-lg backdrop-blur-sm">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2 text-[#94a3b8]">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-base font-semibold">Time remaining</span>
                </div>
                <div class="h-2 w-2 rounded-full animate-pulse" :class="timeRemaining <= 60 ? 'bg-red-500' : 'bg-[#0df2f2]'"></div>
              </div>
              <div class="flex gap-4 mb-5">
                <div class="flex grow basis-0 flex-col items-stretch gap-2">
                  <div class="flex h-16 grow items-center justify-center rounded-lg bg-[#0f172a] border border-[#334155]">
                    <p class="text-3xl font-bold tracking-tight tabular-nums" :class="timeRemaining <= 60 ? 'text-red-400' : 'text-[#0df2f2]'">{{ timerParts.minutes }}</p>
                  </div>
                  <div class="flex items-center justify-center">
                    <p class="text-[#94a3b8] text-xs font-medium uppercase tracking-wider">Minutes</p>
                  </div>
                </div>
                <div class="flex grow basis-0 flex-col items-stretch gap-2">
                  <div class="flex h-16 grow items-center justify-center rounded-lg bg-[#0f172a] border border-[#334155]">
                    <p class="text-white text-3xl font-bold tracking-tight tabular-nums">{{ timerParts.seconds }}</p>
                  </div>
                  <div class="flex items-center justify-center">
                    <p class="text-[#94a3b8] text-xs font-medium uppercase tracking-wider">Seconds</p>
                  </div>
                </div>
              </div>
              <div class="rounded p-3 flex items-center justify-center gap-2"
                :class="timeRemaining <= 60
                  ? 'bg-red-500/10 border border-red-500/20'
                  : 'bg-[#0df2f2]/10 border border-[#0df2f2]/20'">
                <svg class="w-4 h-4 shrink-0" :class="timeRemaining <= 60 ? 'text-red-400' : 'text-[#0df2f2]'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p class="text-sm font-medium" :class="timeRemaining <= 60 ? 'text-red-400' : 'text-[#0df2f2]'">
                  {{ timeRemaining <= 60 ? 'Hurry! Your slot is about to expire' : 'Your slot is secure until the timer expires' }}
                </p>
              </div>
            </div>

            <!-- Event Summary -->
            <div class="rounded-xl border border-[#334155] bg-[#0f172a] p-6 shadow-lg">
              <h3 class="text-white text-lg font-bold mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Event Summary
              </h3>
              <div class="flex flex-col gap-4">
                <div class="flex justify-between items-center border-b border-[#334155] pb-3">
                  <span class="text-[#94a3b8] text-sm">Event</span>
                  <span class="text-white font-medium text-sm text-right max-w-[60%] truncate">{{ ticket.event_name }}</span>
                </div>
                <div class="flex justify-between items-center border-b border-[#334155] pb-3">
                  <span class="text-[#94a3b8] text-sm">Date</span>
                  <span class="text-white font-medium text-sm text-right">{{ formatDate(ticket.start_time) }}</span>
                </div>
                <div class="flex justify-between items-center border-b border-[#334155] pb-3">
                  <span class="text-[#94a3b8] text-sm">Venue</span>
                  <span class="text-white font-medium text-sm text-right max-w-[60%] truncate">{{ ticket.location_name || 'TBA' }}</span>
                </div>
                <div class="flex justify-between items-center pt-1">
                  <span class="text-[#94a3b8] text-sm">Ticket Type</span>
                  <div class="flex flex-col items-end">
                    <span class="text-white font-medium text-sm">{{ ticket.tier_name }}</span>
                      <span v-if="ticket.name_your_price && bidPrice" class="text-[#0df2f2] text-xs font-bold">
                        Your Bid: {{ formatPrice(bidPrice) }}
                      </span>
                      <span v-else-if="ticket.bid_price" class="text-[#0df2f2] text-xs font-bold">
                      Your Bid: {{ formatPrice(ticket.bid_price) }}
                    </span>
                    <span v-else class="text-[#0df2f2] text-xs font-bold">
                      {{ formatPrice(ticket.price_total) }}
                    </span>
                  </div>
                </div>
                <div v-if="foodAddOnTotal > 0" class="flex justify-between items-center border-t border-[#334155] pt-3">
                  <span class="text-[#94a3b8] text-sm">Meal Add-on</span>
                  <span class="text-amber-400 text-sm font-bold">+{{ formatPrice(foodAddOnTotal) }}</span>
                </div>
                <div v-if="drinkAddOnTotal > 0" class="flex justify-between items-center border-t border-[#334155] pt-3">
                  <span class="text-[#94a3b8] text-sm">Drink Add-on</span>
                  <span class="text-amber-400 text-sm font-bold">+{{ formatPrice(drinkAddOnTotal) }}</span>
                </div>
                  <div v-if="foodAddOnTotal > 0 || drinkAddOnTotal > 0 || bidPrice || ticket.bid_price" class="flex justify-between items-center border-t border-[#334155] pt-3">
                  <span class="text-white text-sm font-bold">Total</span>
                  <span class="text-[#0df2f2] text-sm font-bold">{{ formatPrice(computedTotal) }}</span>
                </div>
              </div>
            </div>

            <!-- Support -->
            <div class="flex flex-col gap-2 text-xs text-[#94a3b8] px-1">
              <p>Need help? Contact the event organizer for assistance.</p>
            </div>
          </div>

          <!-- ═══ Right Column — Form ═══ -->
          <div class="lg:col-span-7">
            <div class="flex flex-col gap-8 rounded-xl border border-[#334155] bg-[#0f172a] p-6 sm:p-8 shadow-2xl">

              <!-- Name Your Price Section (shown first for NYP tiers) -->
              <div v-if="ticket.name_your_price" class="flex flex-col gap-4">
                <div class="flex flex-col gap-1">
                  <h2 class="text-white text-2xl font-black leading-tight tracking-tight flex items-center gap-2">
                    <svg class="w-6 h-6 text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Name Your Price
                  </h2>
                  <p class="text-sm text-[#94a3b8]">Set your own ticket price — pay more to support the event!</p>
                </div>

                <!-- Base price display -->
                <div class="flex items-center justify-between bg-[#111827] rounded-lg px-4 py-3 border border-[#1f2937]">
                  <span class="text-sm text-[#94a3b8]">Base Price (minimum)</span>
                  <span class="text-sm text-white font-bold tabular-nums">{{ formatPrice(ticket.tier_price || ticket.price_total) }}</span>
                </div>

                <!-- Bid price input -->
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm font-medium">IDR</span>
                  <input
                    v-model.number="bidPrice"
                    type="number"
                    :min="ticket.tier_price || ticket.price_total || 0"
                    step="1000"
                    class="w-full h-14 pl-14 pr-4 rounded-lg bg-[#1e293b] text-white text-xl font-black border-2 border-[#334155] focus:border-[#0df2f2] focus:outline-none focus:ring-0 placeholder-[#64748b] transition-all tabular-nums"
                    :placeholder="((ticket.tier_price || ticket.price_total || 0)).toLocaleString('id-ID')"
                  />
                </div>

                <!-- Quick-add buttons -->
                <div class="flex flex-wrap gap-2">
                  <button type="button" @click="addToBid(0)" class="px-4 py-2 rounded-lg text-sm font-bold transition-all" :class="bidPrice === (ticket.tier_price || ticket.price_total) ? 'bg-[#0df2f2] text-[#0a0e17]' : 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#334155] hover:text-white border border-[#334155]'">
                    Base Price
                  </button>
                  <button type="button" @click="addToBid(10000)" class="px-4 py-2 rounded-lg text-sm font-bold transition-all bg-[#1e293b] text-[#94a3b8] hover:bg-[#0df2f2]/20 hover:text-[#0df2f2] border border-[#334155]">
                    +10.000
                  </button>
                  <button type="button" @click="addToBid(20000)" class="px-4 py-2 rounded-lg text-sm font-bold transition-all bg-[#1e293b] text-[#94a3b8] hover:bg-[#0df2f2]/20 hover:text-[#0df2f2] border border-[#334155]">
                    +20.000
                  </button>
                  <button type="button" @click="addToBid(50000)" class="px-4 py-2 rounded-lg text-sm font-bold transition-all bg-[#1e293b] text-[#94a3b8] hover:bg-[#0df2f2]/20 hover:text-[#0df2f2] border border-[#334155]">
                    +50.000
                  </button>
                </div>

                <!-- Validation message -->
                <p v-if="bidPrice && bidPrice < (ticket.tier_price || ticket.price_total || 0)" class="text-xs text-red-400">
                  Minimum price is {{ formatPrice(ticket.tier_price || ticket.price_total) }}
                </p>

                <div class="border-b border-[#334155]"></div>
              </div>

              <div class="flex flex-col gap-2">
                <h1 class="text-white text-3xl font-black leading-tight tracking-tight">Fill Your Personal Information</h1>
              </div>
                
              <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
                <!-- Name Fields -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-2">
                    <span class="text-white text-sm font-semibold tracking-wide">First Name <span class="text-red-400">*</span></span>
                    <div class="relative group">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#0df2f2] transition-colors">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                      <input v-model="form.first_name" type="text" required
                        class="w-full h-12 pl-12 pr-4 rounded-lg bg-[#1e293b] text-white border border-[#334155] focus:border-[#0df2f2] focus:outline-none focus:ring-0 placeholder-[#64748b] transition-all"
                        placeholder="John" />
                    </div>
                    <p v-if="firstNameNeedsChange" class="text-xs text-amber-400">
                      Please replace the default first name "Attendee" with your real first name.
                    </p>
                  </div>
                  <div class="flex flex-col gap-2">
                    <span class="text-white text-sm font-semibold tracking-wide">Last Name</span>
                    <div class="relative group">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#0df2f2] transition-colors">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                      <input v-model="form.last_name" type="text"
                        class="w-full h-12 pl-12 pr-4 rounded-lg bg-[#1e293b] text-white border border-[#334155] focus:border-[#0df2f2] focus:outline-none focus:ring-0 placeholder-[#64748b] transition-all"
                        placeholder="Doe" />
                    </div>
                  </div>
                </div>

                <!-- Date of Birth & Social Link -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-2">
                    <span class="text-white text-sm font-semibold tracking-wide">Date of Birth <span class="text-red-400">*</span></span>
                    <div class="relative group">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#0df2f2] transition-colors">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <input v-model="form.date_of_birth" type="date"
                        class="w-full h-12 pl-12 pr-4 rounded-lg bg-[#1e293b] text-white border border-[#334155] focus:border-[#0df2f2] focus:outline-none focus:ring-0 placeholder-[#64748b] transition-all [color-scheme:dark]" />
                    </div>
                  </div>
                  <div class="flex flex-col gap-2">
                    <span class="text-white text-sm font-semibold tracking-wide">Social Link <span class="text-red-400">*</span></span>
                    <div class="relative group">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#0df2f2] transition-colors">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </span>
                      <input v-model="form.social_link" type="text"
                        class="w-full h-12 pl-12 pr-4 rounded-lg bg-[#1e293b] text-white border border-[#334155] focus:border-[#0df2f2] focus:outline-none focus:ring-0 placeholder-[#64748b] transition-all"
                        placeholder="https://t.me/username" />
                    </div>
                  </div>
                </div>

                <!-- Nickname -->
                <div class="flex flex-col gap-2">
                  <span class="text-white text-sm font-semibold tracking-wide">Nickname / Badge Name <span class="text-red-400">*</span></span>
                  <div class="relative group">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#0df2f2] transition-colors">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <input v-model="form.nickname" type="text"
                      class="w-full h-12 pl-12 pr-4 rounded-lg bg-[#1e293b] text-white border border-[#334155] focus:border-[#0df2f2] focus:outline-none focus:ring-0 placeholder-[#64748b] transition-all"
                      placeholder="Your preferred name" />
                  </div>
                </div>

                <div class="h-px bg-[#334155] w-full"></div>

                <!-- Fursuit Toggle -->
                <div class="flex items-center justify-between rounded-lg border border-[#334155] bg-[#1e293b] p-4">
                  <div class="flex flex-col gap-1">
                    <span class="text-white font-semibold">Are you Fursuiter/Handlers?</span>
                  </div>
                  <label class="flex items-center cursor-pointer relative">
                    <input type="checkbox" v-model="form.is_fursuiter" class="sr-only peer" />
                    <div class="w-14 h-7 bg-[#334155] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0df2f2]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#0df2f2]"></div>
                  </label>
                </div>

                <!-- Food Selection — Menu with Choices -->
                <div v-if="foodEnabled && foodOptions.length > 0" class="flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <span class="text-white text-sm font-semibold tracking-wide">Meal Preference <span class="text-red-400">*</span></span>
                    <span class="text-[#94a3b8] text-xs">{{ foodMultiSelect ? 'Select all that apply' : 'Choose one' }}</span>
                  </div>
                  <div class="flex flex-col gap-3">
                    <div v-for="option in foodOptions" :key="option.name"
                      class="rounded-xl border transition-all overflow-hidden"
                      :class="isFoodSelected(option.name) ? 'border-[#0df2f2] bg-[#0df2f2]/5' : 'border-[#334155] bg-[#1e293b] hover:border-[#475569]'">
                      <!-- Menu item header -->
                      <label class="flex items-center gap-3 px-4 py-3 cursor-pointer">
                        <template v-if="foodMultiSelect">
                          <div class="relative flex items-center" @click.prevent="toggleFoodItem(option.name)">
                            <div class="w-5 h-5 border-2 rounded flex items-center justify-center transition-all"
                              :class="isFoodSelected(option.name) ? 'border-[#0df2f2] bg-[#0df2f2]' : 'border-[#64748b] bg-transparent'">
                              <svg v-if="isFoodSelected(option.name)" class="w-3 h-3 text-[#020617]" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </template>
                        <template v-else>
                          <div class="relative flex items-center" @click.prevent="selectSingleFood(option.name)">
                            <div class="w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all"
                              :class="isFoodSelected(option.name) ? 'border-[#0df2f2]' : 'border-[#64748b]'">
                              <div v-if="isFoodSelected(option.name)" class="w-2.5 h-2.5 rounded-full bg-[#0df2f2]"></div>
                            </div>
                          </div>
                        </template>
                        <div class="flex flex-1 items-center justify-between">
                          <span class="text-white text-sm font-medium">{{ option.name }}</span>
                          <span class="text-xs font-medium" :class="option.price > 0 ? 'text-amber-400' : 'text-green-400'">
                            {{ option.price > 0 ? '+' + formatPrice(option.price) : 'Included' }}
                          </span>
                        </div>
                      </label>
                      <!-- Choices (sub-options) — shown when selected and choices exist -->
                      <div v-if="isFoodSelected(option.name) && option.choices?.length" class="border-t border-[#334155] px-4 py-3 bg-[#0f172a]/50 space-y-1.5">
                        <p class="text-[10px] uppercase tracking-wider text-[#94a3b8] font-semibold mb-2">Choose variant</p>
                        <label v-for="ch in option.choices" :key="ch.name"
                          class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all"
                          :class="getSelectedChoice(option.name) === ch.name ? 'bg-[#0df2f2]/10 ring-1 ring-[#0df2f2]/30' : 'hover:bg-[#1e293b]'"
                          @click.prevent="setFoodChoice(option.name, ch.name, ch.price)">
                          <div class="w-4 h-4 border-2 rounded-full flex items-center justify-center transition-all shrink-0"
                            :class="getSelectedChoice(option.name) === ch.name ? 'border-[#0df2f2]' : 'border-[#475569]'">
                            <div v-if="getSelectedChoice(option.name) === ch.name" class="w-2 h-2 rounded-full bg-[#0df2f2]"></div>
                          </div>
                          <div class="flex flex-1 items-center justify-between">
                            <span class="text-sm text-white">{{ ch.name }}</span>
                            <span class="text-[11px] font-medium" :class="ch.price > 0 ? 'text-amber-400' : 'text-green-400'">
                              {{ ch.price > 0 ? '+' + formatPrice(ch.price) : 'Included' }}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                  <!-- Food add-on subtotal -->
                  <div v-if="foodAddOnTotal > 0" class="flex justify-between items-center bg-[#0f172a] rounded-lg px-4 py-2 border border-[#334155]">
                    <span class="text-[#94a3b8] text-xs">Meal add-on</span>
                    <span class="text-amber-400 text-sm font-bold">+{{ formatPrice(foodAddOnTotal) }}</span>
                  </div>
                </div>

                <!-- Drink Selection -->
                <div v-if="drinksEnabled && drinkOptions.length > 0" class="flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <span class="text-white text-sm font-semibold tracking-wide">Drink Preference <span class="text-red-400">*</span></span>
                    <span class="text-[#94a3b8] text-xs">{{ drinkMultiSelect ? 'Select all that apply' : 'Choose one' }}</span>
                  </div>
                  <div class="flex flex-col gap-3">
                    <div v-for="option in drinkOptions" :key="option.name"
                      class="rounded-xl border transition-all overflow-hidden"
                      :class="isDrinkSelected(option.name) ? 'border-[#0df2f2] bg-[#0df2f2]/5' : 'border-[#334155] bg-[#1e293b] hover:border-[#475569]'">
                      <!-- Drink item header -->
                      <label class="flex items-center gap-3 px-4 py-3 cursor-pointer">
                        <template v-if="drinkMultiSelect">
                          <div class="relative flex items-center" @click.prevent="toggleDrinkItem(option.name)">
                            <div class="w-5 h-5 border-2 rounded flex items-center justify-center transition-all"
                              :class="isDrinkSelected(option.name) ? 'border-[#0df2f2] bg-[#0df2f2]' : 'border-[#64748b] bg-transparent'">
                              <svg v-if="isDrinkSelected(option.name)" class="w-3 h-3 text-[#020617]" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </template>
                        <template v-else>
                          <div class="relative flex items-center" @click.prevent="selectSingleDrink(option.name)">
                            <div class="w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all"
                              :class="isDrinkSelected(option.name) ? 'border-[#0df2f2]' : 'border-[#64748b]'">
                              <div v-if="isDrinkSelected(option.name)" class="w-2.5 h-2.5 rounded-full bg-[#0df2f2]"></div>
                            </div>
                          </div>
                        </template>
                        <div class="flex flex-1 items-center justify-between">
                          <span class="text-white text-sm font-medium">{{ option.name }}</span>
                          <span class="text-xs font-medium" :class="option.price > 0 ? 'text-amber-400' : 'text-green-400'">
                            {{ option.price > 0 ? '+' + formatPrice(option.price) : 'Included' }}
                          </span>
                        </div>
                      </label>
                      <!-- Choices — shown when selected and choices exist -->
                      <div v-if="isDrinkSelected(option.name) && option.choices?.length" class="border-t border-[#334155] px-4 py-3 bg-[#0f172a]/50 space-y-1.5">
                        <p class="text-[10px] uppercase tracking-wider text-[#94a3b8] font-semibold mb-2">Choose variant</p>
                        <label v-for="ch in option.choices" :key="ch.name"
                          class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all"
                          :class="getDrinkSelectedChoice(option.name) === ch.name ? 'bg-[#0df2f2]/10 ring-1 ring-[#0df2f2]/30' : 'hover:bg-[#1e293b]'"
                          @click.prevent="setDrinkChoice(option.name, ch.name, ch.price)">
                          <div class="w-4 h-4 border-2 rounded-full flex items-center justify-center transition-all shrink-0"
                            :class="getDrinkSelectedChoice(option.name) === ch.name ? 'border-[#0df2f2]' : 'border-[#475569]'">
                            <div v-if="getDrinkSelectedChoice(option.name) === ch.name" class="w-2 h-2 rounded-full bg-[#0df2f2]"></div>
                          </div>
                          <div class="flex flex-1 items-center justify-between">
                            <span class="text-sm text-white">{{ ch.name }}</span>
                            <span class="text-[11px] font-medium" :class="ch.price > 0 ? 'text-amber-400' : 'text-green-400'">
                              {{ ch.price > 0 ? '+' + formatPrice(ch.price) : 'Included' }}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                    <!-- Drink add-on subtotal -->
                  <div v-if="drinkAddOnTotal > 0" class="flex justify-between items-center bg-[#0f172a] rounded-lg px-4 py-2 border border-[#334155]">
                    <span class="text-[#94a3b8] text-xs">Drink add-on</span>
                    <span class="text-amber-400 text-sm font-bold">+{{ formatPrice(drinkAddOnTotal) }}</span>
                  </div>
                </div>

                <!-- Food & Drink notes -->
                <div v-if="(foodEnabled && foodOptions.length > 0) || (drinksEnabled && drinkOptions.length > 0)" class="flex flex-col gap-2">
                  <span class="text-[#94a3b8] text-xs">Notes <span class="text-[#475569]">(optional)</span></span>
                  <textarea v-model="form.food_notes" rows="2" maxlength="500"
                    class="w-full px-4 py-2.5 rounded-lg bg-[#1e293b] text-white text-sm border border-[#334155] focus:border-[#0df2f2] focus:outline-none focus:ring-0 placeholder-[#64748b] resize-none transition-all"
                    placeholder="e.g. No onions, extra spicy, allergies..."></textarea>
                </div>

                <!-- TOS Agreement -->
                <div class="mt-2">
                  <label class="flex items-start gap-3 cursor-pointer group">
                    <div class="relative flex items-center mt-0.5">
                      <input type="checkbox" v-model="tosAgreed" class="sr-only peer" />
                      <div class="w-5 h-5 border-2 rounded flex items-center justify-center transition-all"
                        :class="tosAgreed
                          ? 'border-[#0df2f2] bg-[#0df2f2]'
                          : 'border-[#64748b] bg-[#1e293b] group-hover:border-[#0df2f2]'">
                        <svg v-if="tosAgreed" class="w-3 h-3 text-[#020617]" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <span class="text-[#94a3b8] text-sm leading-tight">
                      I agree to the
                      <button type="button" @click.stop="showTos = true" class="text-[#0df2f2] hover:underline">Terms of Service</button>
                      and event rules.
                    </span>
                  </label>
                </div>

                <!-- Error -->
                <div v-if="submitError" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                  <svg class="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p class="text-sm text-red-300">{{ submitError }}</p>
                </div>

                <!-- Submit -->
                <div class="flex flex-col gap-3 pt-2">
                  <button type="submit"
                    :disabled="isSubmitDisabled"
                    class="group flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 gap-2 text-lg font-bold leading-normal transition-all"
                    :class="isSubmitDisabled
                      ? 'bg-[#334155] text-[#94a3b8] cursor-not-allowed'
                      : 'bg-[#0df2f2] hover:bg-[#00dada] hover:scale-[1.01] active:scale-[0.99] text-[#020617] shadow-[0_0_20px_rgba(13,242,242,0.2)]'"
                  >
                    <div v-if="submitting" class="w-5 h-5 border-2 border-[#020617]/20 border-t-[#020617] rounded-full animate-spin"></div>
                    <span>{{ submitting ? 'Saving...' : 'Continue to Payment' }}</span>
                  </button>
                  <button type="button" @click="handleCancel"
                    class="flex w-full items-center justify-center rounded-lg h-10 text-[#94a3b8] hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-medium">
                    Cancel Reservation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- TOS Modal -->
    <div v-if="showTos" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-sm" @click.self="showTos = false">
      <div class="w-full max-w-lg max-h-[80vh] bg-[#0f172a] rounded-xl border border-[#334155] shadow-2xl overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-[#334155] flex justify-between items-center shrink-0">
          <h2 class="text-lg font-bold text-white">Terms of Service</h2>
          <button @click="showTos = false" class="text-[#94a3b8] hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 tos-content text-sm text-[#94a3b8] leading-relaxed" v-html="tosHtml"></div>
        <div class="px-6 py-4 border-t border-[#334155] shrink-0">
          <button @click="showTos = false; tosAgreed = true"
            class="w-full py-3 rounded-lg bg-[#0df2f2] text-[#020617] font-bold text-sm hover:bg-[#00dada] transition-colors">
            I Agree
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import ticketApi from '../../services/ticketApi'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const loadError = ref(null)
const ticket = ref(null)
const event = ref(null)
const submitting = ref(false)
const submitError = ref(null)
const showTos = ref(false)
const tosAgreed = ref(false)
const timeRemaining = ref(600)
const bidPrice = ref(null)
let timerInterval = null

function addToBid(extra) {
  const base = ticket.value?.tier_price || ticket.value?.price_total || 0
  bidPrice.value = base + extra
}

const form = ref({
  first_name: '',
  last_name: '',
  nickname: '',
  date_of_birth: '',
  social_link: '',
  is_fursuiter: false,
  food_selection: [],   // [{name, choice?, choice_price?}]
  food_notes: '',
  drink_selection: [],  // [{name, choice?, choice_price?}]
})

// Check if a menu item is selected
function isFoodSelected(name) {
  return form.value.food_selection.some(s => s.name === name)
}

// Get the selected choice for a menu item
function getSelectedChoice(name) {
  const sel = form.value.food_selection.find(s => s.name === name)
  return sel?.choice || null
}

// Toggle a food item (multi-select)
function toggleFoodItem(name) {
  const idx = form.value.food_selection.findIndex(s => s.name === name)
  if (idx >= 0) {
    form.value.food_selection.splice(idx, 1)
  } else {
    form.value.food_selection.push({ name })
  }
}

// Select single food item (radio behavior)
function selectSingleFood(name) {
  if (form.value.food_selection.length === 1 && form.value.food_selection[0].name === name) return
  form.value.food_selection = [{ name }]
}

// Set choice for a food item
function setFoodChoice(menuName, choiceName, choicePrice) {
  const sel = form.value.food_selection.find(s => s.name === menuName)
  if (sel) {
    sel.choice = choiceName
    sel.choice_price = choicePrice || 0
  }
}

// Food options from event data
const foodEnabled = computed(() => {
  const fe = event.value?.food_enabled
  return fe === 1 || fe === true || fe === '1'
})
const foodMultiSelect = computed(() => {
  const fms = event.value?.food_multi_select
  return fms === 1 || fms === true || fms === '1'
})
const foodOptions = computed(() => {
  const opts = event.value?.food_options
  if (!opts) return []
  const arr = Array.isArray(opts) ? opts : (() => { try { return JSON.parse(opts) } catch { return [] } })()
  return arr.map(item => {
    if (typeof item === 'string') return { name: item, price: 0, choices: [] }
    return {
      name: item.name || '',
      price: Number(item.price) || 0,
      choices: Array.isArray(item.choices) ? item.choices.map(c => ({ name: c.name || '', price: Number(c.price) || 0 })) : [],
    }
  })
})

const tosHtml = computed(() => event.value?.tos_text || ticket.value?.tos_text || '<p>No terms of service provided for this event.</p>')

const foodMissing = computed(() => {
  if (!foodEnabled.value || foodOptions.value.length === 0) return false
  if (form.value.food_selection.length === 0) return true
  // Check if any selected item with choices doesn't have a choice picked
  return form.value.food_selection.some(sel => {
    const opt = foodOptions.value.find(o => o.name === sel.name)
    return opt?.choices?.length > 0 && !sel.choice
  })
})

const foodAddOnTotal = computed(() => {
  return form.value.food_selection.reduce((sum, sel) => {
    const opt = foodOptions.value.find(o => o.name === sel.name)
    const menuPrice = opt?.price || 0
    const choicePrice = sel.choice_price || 0
    return sum + menuPrice + choicePrice
  }, 0)
})

// ─── Drink helpers ───

function isDrinkSelected(name) {
  return form.value.drink_selection.some(s => s.name === name)
}

function getDrinkSelectedChoice(name) {
  const sel = form.value.drink_selection.find(s => s.name === name)
  return sel?.choice || null
}

function toggleDrinkItem(name) {
  const idx = form.value.drink_selection.findIndex(s => s.name === name)
  if (idx >= 0) {
    form.value.drink_selection.splice(idx, 1)
  } else {
    form.value.drink_selection.push({ name })
  }
}

function selectSingleDrink(name) {
  if (form.value.drink_selection.length === 1 && form.value.drink_selection[0].name === name) return
  form.value.drink_selection = [{ name }]
}

function setDrinkChoice(menuName, choiceName, choicePrice) {
  const sel = form.value.drink_selection.find(s => s.name === menuName)
  if (sel) {
    sel.choice = choiceName
    sel.choice_price = choicePrice || 0
  }
}

const drinksEnabled = computed(() => {
  const de = event.value?.drinks_enabled
  return de === 1 || de === true || de === '1'
})

const drinkMultiSelect = computed(() => {
  const dms = event.value?.drinks_multi_select
  return dms === 1 || dms === true || dms === '1'
})

const drinkOptions = computed(() => {
  const opts = event.value?.drink_options
  if (!opts) return []
  const arr = Array.isArray(opts) ? opts : (() => { try { return JSON.parse(opts) } catch { return [] } })()
  return arr.map(item => {
    if (typeof item === 'string') return { name: item, price: 0, choices: [] }
    return {
      name: item.name || '',
      price: Number(item.price) || 0,
      choices: Array.isArray(item.choices) ? item.choices.map(c => ({ name: c.name || '', price: Number(c.price) || 0 })) : [],
    }
  })
})

const drinkMissing = computed(() => { if (!drinksEnabled.value || drinkOptions.value.length === 0) return false; if (form.value.drink_selection.length === 0) return true; return form.value.drink_selection.some(sel => { const opt = drinkOptions.value.find(o => o.name === sel.name); return opt?.choices?.length > 0 && !sel.choice; }); });

  const drinkAddOnTotal = computed(() => {
  return form.value.drink_selection.reduce((sum, sel) => {
    const opt = drinkOptions.value.find(o => o.name === sel.name)
    const menuPrice = opt?.price || 0
    const choicePrice = sel.choice_price || 0
    return sum + menuPrice + choicePrice
  }, 0)
})

// Name Your Price: total = max(bid_price, tier_price + food_total + drink_total)
const computedTotal = computed(() => {
  const tierPrice = ticket.value?.tier_price || ticket.value?.price_total || 0
  const food = foodAddOnTotal.value
  const drinks = drinkAddOnTotal.value
  const bid = bidPrice.value || ticket.value?.bid_price || 0
  
  if (ticket.value?.name_your_price) {
    return Math.max(bid, tierPrice + food + drinks)
  }
  return tierPrice + food + drinks
})
const firstNameNeedsChange = computed(() => {
  return (form.value.first_name || '').trim().toLowerCase() === 'attendee'
})

const isSubmitDisabled = computed(() => {
  return submitting.value || !form.value.first_name || !form.value.nickname?.trim() || !form.value.date_of_birth || !form.value.social_link?.trim() || foodMissing.value || drinkMissing.value || !tosAgreed.value || firstNameNeedsChange.value
})

// Timer
const timerParts = computed(() => {
  const m = Math.floor(timeRemaining.value / 60)
  const s = timeRemaining.value % 60
  return {
    minutes: m.toString().padStart(2, '0'),
    seconds: s.toString().padStart(2, '0'),
  }
})

function startTimer() {
  if (!ticket.value?.claim_expiry) return

  const expiry = new Date(ticket.value.claim_expiry).getTime()
  const updateTimer = () => {
    const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
    timeRemaining.value = remaining

    if (remaining <= 0) {
      clearInterval(timerInterval)
      ticket.value.purchase_status = 'expired'
    }
  }

  updateTimer()
  timerInterval = setInterval(updateTimer, 1000)
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBD'
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatPrice(price) {
  if (!price || price === 0) return 'FREE'
  return 'IDR ' + Number(price).toLocaleString('id-ID')
}

async function handleSubmit() {
  if (isSubmitDisabled.value) {
    if (firstNameNeedsChange.value) {
      submitError.value = 'Please update your first name. "Attendee" is only a default placeholder.'
    }
    return
  }

  submitting.value = true
  submitError.value = null

  try {
    const body = {
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim() || null,
      nickname: form.value.nickname.trim(),
      date_of_birth: form.value.date_of_birth,
      social_link: form.value.social_link.trim(),
      is_fursuiter: form.value.is_fursuiter,
    }

    // Only include food_selection if food is enabled
    if (foodEnabled.value && form.value.food_selection.length > 0) {
      body.food_selection = form.value.food_selection
    }
    if (form.value.food_notes?.trim()) {
      body.food_notes = form.value.food_notes.trim()
    }
    // Only include drink_selection if drinks is enabled
    if (drinksEnabled.value && form.value.drink_selection.length > 0) {
      body.drink_selection = form.value.drink_selection
    }
    // Include bid_price for Name Your Price tiers
    if (ticket.value?.name_your_price && bidPrice.value) {
      body.bid_price = bidPrice.value
    }

    await ticketApi.updateMyTicket(route.params.ticketId, body)

    // Redirect to payment
    router.push(`/event/payment/${route.params.ticketId}`)
  } catch (err) {
    if (err.status === 410) {
      ticket.value.purchase_status = 'expired'
    } else {
      submitError.value = err.message || 'Failed to save. Please try again.'
    }
  } finally {
    submitting.value = false
  }
}

async function handleCancel() {
  if (!confirm('Are you sure you want to cancel? Your ticket reservation will be released.')) return

  try {
    await ticketApi.cancelTicket(route.params.ticketId)
    router.push(`/event/id/${ticket.value.event_uuid}`)
  } catch (err) {
    submitError.value = err.message || 'Failed to cancel'
  }
}

onMounted(async () => {
  // Force fresh profile fetch to get latest first_name, last_name, etc.
  await authStore.checkAuth(true)

  try {
    // Load ticket data (includes event_name, tier_name, price_total, claim_expiry)
    const ticketData = await ticketApi.getTicket(route.params.ticketId)
    ticket.value = ticketData

    // Pre-fill form: ticket data first, then fall back to user profile
    const u = authStore.user || {}
    form.value.first_name = ticketData.first_name || u.first_name || ''
    form.value.last_name = ticketData.last_name || u.last_name || ''
    form.value.nickname = ticketData.nickname || u.nickname || ''
    form.value.date_of_birth = ticketData.date_of_birth || u.date_of_birth || ''
    form.value.social_link = ticketData.social_link || u.social_link || ''
    form.value.is_fursuiter = !!ticketData.is_fursuiter

    // Initialize bid price for Name Your Price tiers
    if (ticketData.name_your_price) {
      bidPrice.value = ticketData.bid_price || (ticketData.tier_price || ticketData.price_total)
    }

    // Parse existing food selection (supports both legacy ["name"] and new [{name,choice}] formats)
    if (ticketData.food_selection) {
      try {
        const parsed = typeof ticketData.food_selection === 'string'
          ? JSON.parse(ticketData.food_selection)
          : ticketData.food_selection
        if (Array.isArray(parsed) && parsed.length > 0) {
          form.value.food_selection = parsed.map(item => {
            if (typeof item === 'string') return { name: item }
            return { name: item.name || '', choice: item.choice || undefined, choice_price: item.choice_price || 0 }
          })
        }
      } catch { /* ignore */ }
    }
    if (ticketData.food_notes) {
      form.value.food_notes = ticketData.food_notes
    }

    // Parse existing drink selection
    if (ticketData.drink_selection) {
      try {
        const parsed = typeof ticketData.drink_selection === 'string'
          ? JSON.parse(ticketData.drink_selection)
          : ticketData.drink_selection
        if (Array.isArray(parsed) && parsed.length > 0) {
          form.value.drink_selection = parsed.map(item => {
            if (typeof item === 'string') return { name: item }
            return { name: item.name || '', choice: item.choice || undefined, choice_price: item.choice_price || 0 }
          })
        }
      } catch { /* ignore */ }
    }

    // Load full event data for food/drink options and TOS
    try {
      const eventData = await ticketApi.getEvent(ticketData.event_uuid)
      event.value = eventData
    } catch {
      // Non-critical — food & TOS might not show but form still works
    }

    // Start the countdown timer
    startTimer()
  } catch (err) {
    loadError.value = err.message || 'Ticket not found'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.tos-content h1, .tos-content h2, .tos-content h3 {
  color: white;
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
.tos-content p { margin-bottom: 0.5rem; }
.tos-content ul, .tos-content ol { margin-left: 1.25rem; margin-bottom: 0.5rem; }
.tos-content a { color: #0df2f2; }
</style>
