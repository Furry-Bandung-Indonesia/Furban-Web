<template>
  <div class="min-h-screen bg-[#020617] text-white antialiased">
    <!-- Header -->
    <header class="sticky top-0 z-50 flex items-center justify-between border-b border-[#334155] bg-[#0f172a]/95 backdrop-blur-md px-4 sm:px-10 py-3">
      <div class="flex items-center gap-2 text-[#94a3b8]">
        <svg class="w-5 h-5 text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        <span class="text-sm font-medium">
          <span class="text-[#0df2f2] font-bold">Step 2</span> of 2 — Payment
        </span>
      </div>
      <div v-if="ticket" class="hidden md:flex items-center gap-2 text-sm font-medium text-[#94a3b8]">
        <span>Ticket:</span>
        <span v-if="ticket.ticket_number" class="font-mono text-white bg-[#334155] px-2 py-0.5 rounded">#{{ ticket.ticket_number }}</span>
        <span v-else class="text-xs text-amber-400">Issued after payment</span>
      </div>
      <div class="w-24"></div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="w-12 h-12 border-4 border-[#0df2f2]/20 border-t-[#0df2f2] rounded-full animate-spin"></div>
    </div>

    <!-- Already Paid -->
    <div v-else-if="ticket && ticket.purchase_status === 'paid'" class="flex items-center justify-center py-32 px-4">
      <div class="text-center max-w-md">
        <div class="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold mb-2">Payment Confirmed!</h1>
        <p class="text-[#94a3b8] mb-8">Your ticket has been purchased successfully.</p>
        <router-link :to="`/event/ticket/${ticket.ticket_uuid}`"
          class="inline-flex items-center gap-2 bg-[#0df2f2] hover:bg-[#00dada] text-[#020617] font-bold px-8 py-3 rounded-lg transition-colors">
          View My Ticket
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </router-link>
      </div>
    </div>

    <!-- Expired -->
    <div v-else-if="ticket && (ticket.purchase_status === 'expired' || ticket.purchase_status === 'failed')" class="flex items-center justify-center py-32 px-4">
      <div class="text-center max-w-md">
        <div class="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold mb-2">Payment Expired</h1>
        <p class="text-[#94a3b8] mb-8">The payment window has closed. Please claim a new ticket.</p>
        <router-link :to="`/event/id/${ticket.event_uuid}`"
          class="inline-flex items-center gap-2 bg-[#0df2f2] hover:bg-[#00dada] text-[#020617] font-bold px-8 py-3 rounded-lg transition-colors">
          Back to Event
        </router-link>
      </div>
    </div>

    <!-- Payment Form -->
    <template v-else-if="ticket">
      <div class="flex flex-1 justify-center py-8 px-4 sm:px-6">
        <div class="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <!-- Left Sidebar -->
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
                  <span class="text-white font-medium text-sm text-right max-w-[60%] truncate">{{ ticket.event_name || 'Event' }}</span>
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
                    <span v-if="ticket.bid_price" class="text-[#0df2f2] text-xs font-bold">
                      Your Bid Price: {{ formatPrice(ticket.bid_price) }}
                    </span>
                    <span v-else class="text-[#0df2f2] text-xs font-bold">
                      {{ formatPrice(ticket.price_total) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Attendee Info -->
            <div class="rounded-xl border border-[#334155] bg-[#0f172a] p-6 shadow-lg">
              <h3 class="text-white text-sm font-bold mb-3">Attendee</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-[#94a3b8]">Name</span>
                  <span class="text-white">{{ [ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || 'N/A' }}</span>
                </div>
                <div v-if="ticket.nickname" class="flex justify-between">
                  <span class="text-[#94a3b8]">Badge Name</span>
                  <span class="text-white">{{ ticket.nickname }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[#94a3b8]">Ticket #</span>
                  <span v-if="ticket.ticket_number" class="text-white font-mono">{{ ticket.ticket_number }}</span>
                  <span v-else class="text-amber-400 text-xs">Issued after payment</span>
                </div>
              </div>
            </div>

            <!-- Support -->
            <div class="flex flex-col gap-2 text-xs text-[#94a3b8] px-1">
              <p>Need help? Contact the event organizer for assistance.</p>
            </div>
          </div>

          <!-- Right Column — Payment -->
          <div class="lg:col-span-7">
            <div class="flex flex-col gap-8 rounded-xl border border-[#334155] bg-[#0f172a] p-6 sm:p-8 shadow-2xl">

              <!-- STATE: Channels loading -->
              <div v-if="channelsLoading" class="flex items-center justify-center py-12">
                <div class="w-8 h-8 border-3 border-[#0df2f2]/20 border-t-[#0df2f2] rounded-full animate-spin"></div>
              </div>

              <!-- STATE: Free ticket — no payment needed -->
              <template v-else-if="ticket.price_total === 0">
                <div class="flex flex-col gap-2">
                  <h1 class="text-white text-3xl font-black leading-tight tracking-tight">Free Ticket</h1>
                  <p class="text-[#94a3b8] text-base">No payment required for this ticket.</p>
                </div>
                <div class="flex flex-col gap-3 pt-2">
                  <button @click="handleFreeClaim"
                    :disabled="paying"
                    class="group flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 gap-2 text-lg font-bold leading-normal transition-all"
                    :class="paying
                      ? 'bg-[#334155] text-[#94a3b8] cursor-not-allowed'
                      : 'bg-[#0df2f2] hover:bg-[#00dada] hover:scale-[1.01] active:scale-[0.99] text-[#020617] shadow-[0_0_20px_rgba(13,242,242,0.2)]'">
                    <div v-if="paying" class="w-5 h-5 border-2 border-[#020617]/20 border-t-[#020617] rounded-full animate-spin"></div>
                    <span>{{ paying ? 'Confirming...' : 'Confirm Free Ticket' }}</span>
                  </button>
                </div>
              </template>

              <!-- STATE: No channels available -->
              <template v-else-if="!channelsLoading && channels.length === 0 && !activeTransaction">
                <div class="flex flex-col gap-2">
                  <h1 class="text-white text-3xl font-black leading-tight tracking-tight">Complete Your Payment</h1>
                  <p class="text-[#94a3b8] text-base">Choose your preferred payment method to finalize your booking.</p>
                </div>
                <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
                  <svg class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p class="text-sm text-amber-300">No payment channels are currently available. Please contact the event organizer or try again later.</p>
                </div>
                <button type="button" @click="handleCancel"
                  class="flex w-full items-center justify-center rounded-lg h-10 text-[#94a3b8] hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-medium">
                  Cancel Reservation
                </button>
              </template>

              <!-- STATE: Active transaction — waiting for payment -->
              <template v-else-if="activeTransaction">
                <div class="flex flex-col gap-2">
                  <h1 class="text-white text-3xl font-black leading-tight tracking-tight">Complete Your Payment</h1>
                  <p class="text-[#94a3b8] text-base">Follow the instructions below to complete your payment.</p>
                </div>

                <!-- Payment channel info -->
                <div class="flex items-center gap-4 bg-[#1e293b] rounded-lg p-4 border border-[#334155]">
                  <img v-if="activeTransaction.payment_image" :src="activeTransaction.payment_image" :alt="activeTransaction.payment_name" class="w-12 h-8 object-contain rounded bg-white p-1" />
                  <div class="flex-1">
                    <p class="text-white font-semibold text-sm">{{ activeTransaction.payment_name || activeTransaction.payment_method || 'Payment' }}</p>
                    <p class="text-[#94a3b8] text-xs">{{ activeTransaction.payment_method }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full animate-pulse bg-amber-400"></div>
                    <span class="text-amber-400 text-xs font-medium">Waiting</span>
                  </div>
                </div>

                <!-- QR Code -->
                <div v-if="activeTransaction.qr_image || activeTransaction.qr_string" class="flex flex-col items-center gap-4 py-4">
                  <div class="bg-white p-4 rounded-xl shadow-lg">
                    <img v-if="activeTransaction.qr_image" :src="activeTransaction.qr_image" alt="QR Code" class="w-48 h-48 object-contain" />
                    <div v-else class="w-48 h-48 flex items-center justify-center text-slate-400 text-sm">QR Code</div>
                  </div>
                  <div class="text-center">
                    <p class="text-sm text-white font-medium">Scan QR Code</p>
                    <p class="text-xs text-[#94a3b8] mt-1">Open your preferred e-wallet app and scan the QR code above.</p>
                  </div>
                </div>

                <!-- Virtual Account / Payment Number -->
                <div v-if="activeTransaction.nomor_va || activeTransaction.nomor_pembayaran" class="flex flex-col gap-4">
                  <div class="flex flex-col gap-1">
                    <label class="text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
                      {{ activeTransaction.nomor_va ? 'Virtual Account Number' : 'Payment Number' }}
                    </label>
                    <div class="flex items-center justify-between bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3">
                      <span class="font-mono text-xl text-[#0df2f2] tracking-wide">{{ activeTransaction.nomor_va || activeTransaction.nomor_pembayaran }}</span>
                      <button type="button" @click="copyCode(activeTransaction.nomor_va || activeTransaction.nomor_pembayaran)" class="text-xs font-bold text-white bg-[#1e293b] hover:bg-[#334155] px-3 py-1.5 rounded transition-colors uppercase tracking-wide">
                        {{ copiedCode ? 'Copied!' : 'Copy' }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Total -->
                <div class="border-t border-[#334155] pt-4 space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-[#94a3b8] text-sm">Amount</span>
                    <span class="text-white text-sm">{{ formatPrice(activeTransaction.nominal || ticket.price_total) }}</span>
                  </div>
                  <div class="flex justify-between items-end border-t border-[#334155]/50 pt-2">
                    <span class="text-[#94a3b8] text-sm font-medium">Total to Pay</span>
                    <span class="text-white text-2xl font-bold">{{ formatPrice(activeTransaction.total_bayar || ticket.price_total) }}</span>
                  </div>
                </div>

                <!-- Polling status indicator + manual check -->
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-2 text-[#94a3b8] text-xs">
                    <div class="w-3 h-3 border-2 border-[#0df2f2]/30 border-t-[#0df2f2] rounded-full animate-spin"></div>
                    <span>Checking automatically every 5s...</span>
                  </div>
                  <button @click="manualCheckStatus" :disabled="manualChecking"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border"
                    :class="manualChecking
                      ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                      : 'bg-[#0df2f2]/10 text-[#0df2f2] border-[#0df2f2]/30 hover:bg-[#0df2f2]/20'">
                    <div v-if="manualChecking" class="w-3 h-3 border border-[#0df2f2]/30 border-t-[#0df2f2] rounded-full animate-spin"></div>
                    <svg v-else class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {{ manualChecking ? 'Checking...' : 'Check Now' }}
                  </button>
                </div>

                <!-- Error -->
                <div v-if="payError" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                  <svg class="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p class="text-sm text-red-300">{{ payError }}</p>
                </div>

                <!-- Cancel -->
                <button type="button" @click="handleCancel"
                  class="flex w-full items-center justify-center rounded-lg h-10 text-[#94a3b8] hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-medium">
                  Cancel Transaction
                </button>
              </template>

              <!-- STATE: Channel selection — no active transaction yet -->
              <template v-else>
                <div class="flex flex-col gap-2">
                  <h1 class="text-white text-3xl font-black leading-tight tracking-tight">Complete Your Payment</h1>
                  <p class="text-[#94a3b8] text-base">Choose your preferred payment method to finalize your booking.</p>
                </div>

                <form @submit.prevent="handleGeneratePayment" class="flex flex-col gap-6">
                  <!-- Payment Methods grouped -->
                  <div class="flex flex-col gap-4">
                    <div v-for="(group, groupName) in groupedChannels" :key="groupName">
                      <p class="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-2">{{ groupName }}</p>
                      <div class="flex flex-col gap-2">
                        <label v-for="ch in group" :key="ch.code"
                          class="flex items-center gap-4 px-4 py-3 rounded-lg border bg-[#1e293b] cursor-pointer transition-all"
                          :class="selectedChannel === ch.code
                            ? 'border-[#0df2f2] bg-[#0df2f2]/5'
                            : 'border-[#334155] hover:border-[#475569]'">
                          <input type="radio" :value="ch.code" v-model="selectedChannel" name="payment_channel" class="sr-only" />
                          <img v-if="ch.image_url" :src="ch.image_url.replace('https://dash.wijayapay.com', 'https://dashboard.wijayapay.com')" :alt="ch.name" class="w-12 h-8 object-contain rounded bg-white p-1" />
                          <div v-else class="w-12 h-8 rounded bg-[#334155] flex items-center justify-center text-[8px] font-bold text-[#94a3b8] uppercase">
                            {{ ch.code?.substring(0, 4) }}
                          </div>
                          <div class="flex-1">
                            <span class="text-white text-sm font-medium">{{ ch.name }}</span>
                          </div>
                          <div class="w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center"
                            :class="selectedChannel === ch.code ? 'border-[#0df2f2]' : 'border-[#64748b]'">
                            <div v-if="selectedChannel === ch.code" class="w-2.5 h-2.5 rounded-full bg-[#0df2f2]"></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Total -->
                  <div class="border-t border-[#334155] pt-4 mt-2 space-y-2">
                    <div v-if="(ticket.food_total || 0) > 0 || (ticket.drink_total || 0) > 0" class="flex justify-between items-center">
                      <span class="text-[#94a3b8] text-sm">Ticket Base</span>
                      <span class="text-white text-sm">{{ formatPrice(ticket.price_total - (ticket.food_total || 0) - (ticket.drink_total || 0)) }}</span>
                    </div>
                    <div v-if="ticket.food_total > 0" class="flex justify-between items-center">
                      <span class="text-[#94a3b8] text-sm">Meal Add-on</span>
                      <span class="text-amber-400 text-sm font-medium">+{{ formatPrice(ticket.food_total) }}</span>
                    </div>
                    <div v-if="ticket.drink_total > 0" class="flex justify-between items-center">
                      <span class="text-[#94a3b8] text-sm">Drink Add-on</span>
                      <span class="text-amber-400 text-sm font-medium">+{{ formatPrice(ticket.drink_total) }}</span>
                    </div>
                    <div class="flex justify-between items-end" :class="(ticket.food_total || 0) > 0 || (ticket.drink_total || 0) > 0 ? 'border-t border-[#334155]/50 pt-2' : ''">
                      <span class="text-[#94a3b8] text-sm font-medium">Total Payment</span>
                      <span class="text-white text-2xl font-bold">{{ formatPrice(ticket.price_total) }}</span>
                    </div>
                  </div>

                  <!-- Error -->
                  <div v-if="payError" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                    <svg class="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p class="text-sm text-red-300">{{ payError }}</p>
                  </div>

                  <!-- Pay Button -->
                  <div class="flex flex-col gap-3 pt-2">
                    <button type="submit"
                      :disabled="paying || !selectedChannel"
                      class="group flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 gap-2 text-lg font-bold leading-normal transition-all"
                      :class="paying || !selectedChannel
                        ? 'bg-[#334155] text-[#94a3b8] cursor-not-allowed'
                        : 'bg-[#0df2f2] hover:bg-[#00dada] hover:scale-[1.01] active:scale-[0.99] text-[#020617] shadow-[0_0_20px_rgba(13,242,242,0.2)]'"
                    >
                      <div v-if="paying" class="w-5 h-5 border-2 border-[#020617]/20 border-t-[#020617] rounded-full animate-spin"></div>
                      <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{{ paying ? 'Generating Payment...' : 'Pay Now' }}</span>
                    </button>
                    <button type="button" @click="handleCancel" :disabled="paying"
                      class="flex w-full items-center justify-center rounded-lg h-10 text-[#94a3b8] hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-medium">
                      Cancel Transaction
                    </button>
                  </div>
                </form>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Success Overlay -->
    <Transition name="fade">
      <div v-if="showSuccess" class="fixed inset-0 z-[60] flex items-center justify-center bg-[#020617]/90 backdrop-blur-sm">
        <div class="text-center">
          <div class="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg class="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold mb-2">Payment Successful!</h2>
          <p class="text-[#94a3b8] mb-2">Your ticket is confirmed.</p>
          <p class="text-sm text-[#94a3b8]">Redirecting to your ticket...</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ticketApi from '../../services/ticketApi'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const ticket = ref(null)
const paying = ref(false)
const payError = ref(null)
const showSuccess = ref(false)
const copiedCode = ref(false)
const timeRemaining = ref(600)
let timerInterval = null

// Payment channels from WijayaPay
const channelsLoading = ref(false)
const channels = ref([])
const selectedChannel = ref(null)

// Active payment transaction (after generating via WijayaPay)
const activeTransaction = ref(null)
const manualChecking = ref(false)
let pollInterval = null

const timerParts = computed(() => {
  const m = Math.floor(timeRemaining.value / 60)
  const s = timeRemaining.value % 60
  return {
    minutes: m.toString().padStart(2, '0'),
    seconds: s.toString().padStart(2, '0'),
  }
})

// Group channels by group_name for display
const groupedChannels = computed(() => {
  const groups = {}
  for (const ch of channels.value) {
    const g = ch.group_name || 'Other'
    if (!groups[g]) groups[g] = []
    groups[g].push(ch)
  }
  return groups
})

function startTimer() {
  if (!ticket.value?.claim_expiry) return

  const expiry = new Date(ticket.value.claim_expiry).getTime()
  const updateTimer = () => {
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((expiry - now) / 1000))
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

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(String(code).replace(/\s/g, ''))
    copiedCode.value = true
    setTimeout(() => { copiedCode.value = false }, 2000)
  } catch { /* fallback */ }
}

// Load enabled payment channels from backend (synced from WijayaPay)
async function loadChannels() {
  channelsLoading.value = true
  try {
    const data = await ticketApi.getPublicPaymentChannels()
    channels.value = data.channels || []
    // Auto-select first channel
    if (channels.value.length > 0) {
      selectedChannel.value = channels.value[0].code
    }
  } catch (err) {
    console.error('Failed to load payment channels:', err)
  } finally {
    channelsLoading.value = false
  }
}

// Generate a real payment transaction via WijayaPay
async function handleGeneratePayment() {
  if (!selectedChannel.value || paying.value) return
  paying.value = true
  payError.value = null

  try {
    const data = await ticketApi.generatePayment({
      event_uuid: ticket.value.event_uuid,
      ticket_uuid: ticket.value.ticket_uuid,
      channel_code: selectedChannel.value,
      nominal: ticket.value.price_total,
    })

    activeTransaction.value = data
    // Start polling for payment confirmation
    startPolling(data.ref_id)
  } catch (err) {
    payError.value = err.message || 'Failed to generate payment. Please try again.'
    if (err.status === 410) {
      ticket.value.purchase_status = 'expired'
    }
  } finally {
    paying.value = false
  }
}

// Handle free ticket (price = 0) — directly mark as paid
async function handleFreeClaim() {
  paying.value = true
  payError.value = null
  try {
    await ticketApi.payTicket(route.params.ticketId, {
      payment_reference: 'FREE_TICKET'
    })
    showSuccess.value = true
    setTimeout(() => {
      router.push(`/event/ticket/${route.params.ticketId}`)
    }, 2000)
  } catch (err) {
    payError.value = err.message || 'Failed to confirm. Please try again.'
    if (err.status === 410) {
      ticket.value.purchase_status = 'expired'
    }
  } finally {
    paying.value = false
  }
}

// Poll WijayaPay payment status every 5 seconds
function startPolling(refId) {
  if (pollInterval) clearInterval(pollInterval)

  pollInterval = setInterval(async () => {
    try {
      const data = await ticketApi.checkPaymentStatus(refId)
      if (data.status === 'paid') {
        clearInterval(pollInterval)
        pollInterval = null
        showSuccess.value = true
        ticket.value.purchase_status = 'paid'
        setTimeout(() => {
          router.push(`/event/ticket/${route.params.ticketId}`)
        }, 2500)
      } else if (data.status === 'expired' || data.status === 'failed') {
        clearInterval(pollInterval)
        pollInterval = null
        payError.value = 'Payment expired or failed. Please try again.'
        activeTransaction.value = null
      }
    } catch {
      // Silently continue polling
    }
  }, 5000)
}

// Manually trigger a payment status check
async function manualCheckStatus() {
  if (!activeTransaction.value?.ref_id || manualChecking.value) return
  manualChecking.value = true
  try {
    const data = await ticketApi.checkPaymentStatus(activeTransaction.value.ref_id)
    if (data.status === 'paid') {
      if (pollInterval) clearInterval(pollInterval)
      pollInterval = null
      showSuccess.value = true
      ticket.value.purchase_status = 'paid'
      setTimeout(() => {
        router.push(`/event/ticket/${route.params.ticketId}`)
      }, 2500)
    } else if (data.status === 'expired' || data.status === 'failed') {
      if (pollInterval) clearInterval(pollInterval)
      pollInterval = null
      payError.value = 'Payment expired or failed. Please try again.'
      activeTransaction.value = null
    }
  } catch {
    // ignore — silently fail
  } finally {
    manualChecking.value = false
  }
}

async function handleCancel() {
  if (!confirm('Are you sure you want to cancel? Your ticket will be released.')) return

  try {
    await ticketApi.cancelTicket(route.params.ticketId)
    router.push(`/event/id/${ticket.value.event_uuid}`)
  } catch (err) {
    payError.value = err.message || 'Failed to cancel'
  }
}

onMounted(async () => {
  try {
    const data = await ticketApi.getTicket(route.params.ticketId)
    ticket.value = data

    // If personal info is incomplete, redirect back to Step 1 (fill form)
    if (data.purchase_status === 'under_payment') {
      const infoComplete = data.first_name?.trim() && data.nickname?.trim() && data.date_of_birth && data.phone_number?.trim()
      if (!infoComplete) {
        router.replace(`/event/ticket/${route.params.ticketId}/fill`)
        return
      }
    }

    startTimer()

    // Load available payment channels (only for paid tickets that need payment)
    if (data.purchase_status === 'under_payment' && data.price_total > 0) {
      await loadChannels()

      // Restore state if there's already a pending transaction (survives page refresh)
      try {
        const existing = await ticketApi.getPaymentForTicket(route.params.ticketId)
        if (existing.transaction && existing.transaction.status === 'pending') {
          const t = existing.transaction
          activeTransaction.value = {
            transaction_uuid: t.transaction_uuid,
            ref_id: t.ref_id,
            trx_reference: t.trx_reference,
            payment_name: t.payment_name,
            payment_method: t.payment_method,
            payment_image: t.payment_image,
            nominal: t.nominal,
            expired: t.expired_at,
            nomor_va: t.nomor_va,
            nomor_pembayaran: t.nomor_pembayaran,
            qr_image: t.qr_image,
            qr_string: t.qr_string,
            tutorial: t.tutorial,
            total_bayar: t.total_bayar,
          }
          startPolling(t.ref_id)
        }
      } catch {
        // Non-fatal — user can still generate a new payment
      }
    }
  } catch (err) {
    payError.value = err.message || 'Ticket not found'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
