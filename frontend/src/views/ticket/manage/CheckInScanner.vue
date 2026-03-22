<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden">
    <!-- Header with Stats -->
    <header class="shrink-0 bg-[#101622] z-10 px-6 pt-6 pb-3">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Check-In Scanner</h2>
          <p class="text-slate-400 text-sm mt-1">Scan tickets or search manually to check in attendees.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-4 bg-[#161e2c] px-4 py-2.5 rounded-lg border border-slate-800/50 text-sm">
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-green-400 animate-pulse"></span>
              <span class="text-slate-400">Checked In:</span>
              <span class="font-bold text-white">{{ stats.redeemed_tickets || 0 }}</span>
              <span class="text-slate-500">/</span>
              <span class="text-slate-400">{{ stats.paid_tickets || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-6 pt-2">
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Left: Scanner + Manual Search (2 cols) -->
        <div class="xl:col-span-2 space-y-6">
          <!-- QR Scanner Area -->
          <div class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 class="text-lg font-bold text-white">QR Scanner</h3>
              <span class="inline-flex items-center gap-2 text-xs text-slate-400">
                <span class="size-2 rounded-full" :class="scannerActive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'"></span>
                {{ scannerActive ? 'Camera Active' : 'Camera Standby' }}
              </span>
            </div>
            <div class="p-6">
              <!-- Camera viewer -->
              <div class="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-700">
                <div id="qr-reader" class="w-full h-full"></div>
                <!-- Overlay when not active -->
                <div v-if="!scannerActive" class="absolute inset-0 bg-black flex items-center justify-center">
                  <div class="text-center z-10">
                    <svg class="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <p class="text-slate-400 text-sm font-medium">Click "Start Scanner" to begin</p>
                    <p class="text-slate-600 text-xs mt-1">Camera permission required</p>
                  </div>
                </div>
              </div>
              <!-- Scanner error message -->
              <div v-if="scannerError" class="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {{ scannerError }}
              </div>
              <div class="mt-4 flex gap-3">
                <button @click="toggleScanner" class="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors" :class="scannerActive ? 'bg-red-600/20 text-red-400 ring-1 ring-red-600/30 hover:bg-red-600/30' : 'bg-[#0df2f2]/10 text-[#0df2f2] ring-1 ring-[#0df2f2]/30 hover:bg-[#0df2f2]/20'">
                  {{ scannerActive ? 'Stop Scanner' : 'Start Scanner' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Manual Search -->
          <div class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-800">
              <h3 class="text-lg font-bold text-white">Manual Check-In</h3>
            </div>
            <div class="p-6">
              <form @submit.prevent="handleManualSearch" class="flex gap-3">
                <div class="flex-1 relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-slate-400 group-focus-within:text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input v-model="manualSearch" class="block w-full rounded-lg border-0 py-3 pl-10 text-white bg-slate-900 ring-1 ring-inset ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0df2f2] sm:text-sm" placeholder="Enter ticket number, name, or nickname..." type="text" />
                </div>
                <button type="submit" :disabled="!manualSearch.trim() || isSearching" class="px-6 py-3 rounded-lg bg-[#0df2f2] text-[#0a0e17] font-semibold text-sm hover:bg-[#00dada] disabled:opacity-50 transition-colors">
                  {{ isSearching ? 'Searching...' : 'Verify' }}
                </button>
              </form>
            </div>
          </div>

          <!-- Recent Check-ins Table -->
          <div class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 class="text-lg font-bold text-white">Recent Check-ins</h3>
              <span class="text-xs text-slate-400">Last {{ recentCheckins.length }} entries</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <th class="px-6 py-3 text-left font-semibold">Time</th>
                    <th class="px-6 py-3 text-left font-semibold">Attendee</th>
                    <th class="px-6 py-3 text-left font-semibold">Tier</th>
                    <th class="px-6 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/50">
                  <tr v-for="entry in recentCheckins" :key="entry.ticket_uuid" class="hover:bg-white/[0.02]">
                    <td class="px-6 py-3 text-sm text-slate-400">{{ formatTime(entry.time) }}</td>
                    <td class="px-6 py-3">
                      <div class="flex items-center gap-3">
                        <div class="size-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#0df2f2] to-[#0df2f2]/40 flex items-center justify-center text-xs font-bold text-[#0a0e17] shrink-0">
                          <img v-if="entry.avatar_url" :src="getAuthImageUrl(entry.avatar_url)" class="w-full h-full object-cover" @error="entry.avatar_url = null" />
                          <span v-else>{{ (entry.name || 'A')[0].toUpperCase() }}</span>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-white">{{ entry.name }}</p>
                          <p class="text-xs text-slate-400">{{ entry.ticket_number }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-3">
                      <span class="inline-flex items-center rounded-md bg-[#0df2f2]/10 px-2 py-0.5 text-xs font-medium text-[#0df2f2]">{{ entry.tier_name }}</span>
                    </td>
                    <td class="px-6 py-3">
                      <span class="inline-flex items-center gap-1.5 text-xs font-medium" :class="entry.success ? 'text-green-400' : 'text-red-400'">
                        <span class="size-1.5 rounded-full" :class="entry.success ? 'bg-green-400' : 'bg-red-400'"></span>
                        {{ entry.success ? 'Checked In' : 'Invalid' }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="recentCheckins.length === 0">
                    <td colspan="4" class="px-6 py-8 text-center text-sm text-slate-400">No check-ins yet for this session.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right: Verification Result Panel (1 col) -->
        <div class="xl:col-span-1">
          <div class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden sticky top-4">
            <!-- No result state -->
            <div v-if="!verifyResult" class="p-8 text-center">
              <div class="size-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
              </div>
              <h3 class="text-white font-bold mb-1">Waiting for Scan</h3>
              <p class="text-sm text-slate-400">Scan a QR code or enter a ticket number to verify.</p>
            </div>

            <!-- Access Granted -->
            <template v-else-if="verifyResult.valid">
              <div class="bg-green-600 px-6 py-4 flex items-center gap-3">
                <div class="size-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h3 class="text-white font-bold text-lg">Access Granted</h3>
                  <p class="text-green-100 text-xs">{{ verifyResult.already_redeemed ? 'Already checked in' : 'Valid ticket found' }}</p>
                </div>
              </div>
              <div class="p-6 space-y-4">
                <!-- Attendee Info -->
                <div class="flex items-center gap-4">
                  <div class="size-14 rounded-full overflow-hidden bg-gradient-to-tr from-[#0df2f2] to-[#0df2f2]/40 flex items-center justify-center text-xl font-bold text-[#0a0e17] shrink-0">
                    <img v-if="verifyProfile?.profile_image_url" :src="getAuthImageUrl(verifyProfile.profile_image_url)" class="w-full h-full object-cover" @error="verifyProfile.profile_image_url = null" />
                    <span v-else>{{ (verifyResult.ticket?.first_name || verifyResult.ticket?.nickname || 'A')[0].toUpperCase() }}</span>
                  </div>
                  <div>
                    <p class="text-lg font-bold text-white">{{ [verifyResult.ticket?.first_name, verifyResult.ticket?.last_name].filter(Boolean).join(' ') || 'N/A' }}</p>
                    <p class="text-sm text-slate-400">{{ verifyResult.ticket?.nickname || '' }}</p>
                  </div>
                </div>

                <!-- Subtle Moderation Indicator -->
                <div v-if="verifyResult.moderation" class="flex items-center gap-2 px-3 py-2 rounded-lg"
                  :class="verifyResult.moderation.moderation_type === 'BAN' ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'">
                  <svg class="w-4 h-4 shrink-0" :class="verifyResult.moderation.moderation_type === 'BAN' ? 'text-red-400' : 'text-amber-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path v-if="verifyResult.moderation.moderation_type === 'BAN'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class="text-xs font-medium" :class="verifyResult.moderation.moderation_type === 'BAN' ? 'text-red-400' : 'text-amber-400'">
                    {{ verifyResult.moderation.moderation_type === 'BAN' ? 'BANNED' : 'WATCHLIST' }}
                  </span>
                </div>

                <div class="space-y-3">
                  <!-- Identification -->
                  <div class="mb-4 p-3 bg-slate-900/60 rounded-lg space-y-2">
                    <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Identification</p>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span class="text-[10px] text-slate-500 block">First Name</span>
                        <span class="text-white">{{ verifyResult.ticket?.first_name || verifyProfile?.first_name || '—' }}</span>
                      </div>
                      <div>
                        <span class="text-[10px] text-slate-500 block">Last Name</span>
                        <span class="text-white">{{ verifyResult.ticket?.last_name || verifyProfile?.last_name || '—' }}</span>
                      </div>
                      <div>
                        <span class="text-[10px] text-slate-500 block">Date of Birth</span>
                        <span class="text-white">{{ verifyResult.ticket?.date_of_birth || verifyProfile?.date_of_birth || '—' }}</span>
                      </div>
                      <div>
                        <span class="text-[10px] text-slate-500 block">Phone</span>
                        <span class="text-white">{{ verifyResult.ticket?.phone_number || verifyProfile?.phone_number || '—' }}</span>
                      </div>
                      <div class="col-span-2">
                        <span class="text-[10px] text-slate-500 block">Email</span>
                        <span class="text-white">{{ verifyProfile?.email || '—' }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-slate-800">
                    <span class="text-xs text-slate-400 uppercase tracking-wider">Tier</span>
                    <span class="inline-flex items-center rounded-md bg-[#0df2f2]/10 px-2 py-1 text-xs font-medium text-[#0df2f2]">{{ verifyResult.ticket?.tier_name }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-slate-800">
                    <span class="text-xs text-slate-400 uppercase tracking-wider">Ticket #</span>
                    <span class="text-sm font-mono text-white">{{ verifyResult.ticket?.ticket_number }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-slate-800">
                    <span class="text-xs text-slate-400 uppercase tracking-wider">Fursuiter</span>
                    <span class="text-sm text-white">{{ verifyResult.ticket?.is_fursuiter ? 'Yes' : 'No' }}</span>
                  </div>
                  <div v-if="parseFoodSelection(verifyResult.ticket?.food_selection).length" class="py-2">
                    <span class="text-xs text-slate-400 uppercase tracking-wider block mb-2">Food Selection</span>
                    <div class="space-y-1.5">
                      <div v-for="item in verifyFoodItems" :key="item.name"
                        class="rounded-lg bg-slate-800 px-2.5 py-1.5">
                        <div class="flex items-center justify-between">
                          <span class="text-xs text-slate-200 font-medium">{{ item.name }}</span>
                          <span v-if="item.menuPrice > 0" class="text-[10px] font-medium text-amber-400">+{{ formatCurrency(item.menuPrice) }}</span>
                          <span v-else class="text-[10px] font-medium text-green-400">Included</span>
                        </div>
                        <div v-if="item.choice" class="flex items-center justify-between mt-0.5 pl-2 border-l-2 border-slate-700">
                          <span class="text-[10px] text-slate-400">{{ item.choice }}</span>
                          <span v-if="item.choicePrice > 0" class="text-[10px] text-amber-400">+{{ formatCurrency(item.choicePrice) }}</span>
                        </div>
                      </div>
                    </div>
                    <div v-if="verifyResult.ticket?.food_total > 0" class="flex items-center justify-between mt-2 pt-2 border-t border-slate-700">
                      <span class="text-[10px] text-slate-500 uppercase">Food Add-on</span>
                      <span class="text-xs font-bold text-amber-400">{{ formatCurrency(verifyResult.ticket.food_total) }}</span>
                    </div>
                  </div>

                  <!-- Food notes -->
                  <div v-if="verifyResult.ticket?.food_notes" class="py-2 border-t border-slate-800">
                    <span class="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Food Notes</span>
                    <p class="text-xs text-slate-300 bg-slate-800 rounded-lg px-2.5 py-2 italic">{{ verifyResult.ticket.food_notes }}</p>
                  </div>

                  <!-- Food received status -->
                  <div v-if="parseFoodSelection(verifyResult.ticket?.food_selection).length" class="py-2 border-t border-slate-800">
                    <div class="flex items-center gap-3 p-2.5 rounded-lg"
                      :class="verifyResult.food_received || verifyResult.ticket?.food_received ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-800'">
                      <span class="size-2.5 rounded-full" :class="verifyResult.food_received || verifyResult.ticket?.food_received ? 'bg-green-400' : 'bg-slate-600'"></span>
                      <span class="text-xs font-medium" :class="verifyResult.food_received || verifyResult.ticket?.food_received ? 'text-green-400' : 'text-slate-400'">
                        {{ verifyResult.food_received || verifyResult.ticket?.food_received ? 'Food Already Received' : 'Food Not Yet Received' }}
                      </span>
                    </div>
                  </div>

                  <!-- Drink Selection -->
                  <div v-if="parseDrinkSelection(verifyResult.ticket?.drink_selection).length" class="py-2 border-t border-slate-800">
                    <span class="text-xs text-slate-400 uppercase tracking-wider block mb-2">Drink Selection</span>
                    <div class="space-y-1.5">
                      <div v-for="item in verifyDrinkItems" :key="item.name"
                        class="rounded-lg bg-slate-800 px-2.5 py-1.5">
                        <div class="flex items-center justify-between">
                          <span class="text-xs text-slate-200 font-medium">{{ item.name }}</span>
                          <span v-if="item.menuPrice > 0" class="text-[10px] font-medium text-amber-400">+{{ formatCurrency(item.menuPrice) }}</span>
                          <span v-else class="text-[10px] font-medium text-green-400">Included</span>
                        </div>
                        <div v-if="item.choice" class="flex items-center justify-between mt-0.5 pl-2 border-l-2 border-slate-700">
                          <span class="text-[10px] text-slate-400">{{ item.choice }}</span>
                          <span v-if="item.choicePrice > 0" class="text-[10px] text-amber-400">+{{ formatCurrency(item.choicePrice) }}</span>
                        </div>
                      </div>
                    </div>
                    <div v-if="verifyResult.ticket?.drink_total > 0" class="flex items-center justify-between mt-2 pt-2 border-t border-slate-700">
                      <span class="text-[10px] text-slate-500 uppercase">Drink Add-on</span>
                      <span class="text-xs font-bold text-amber-400">{{ formatCurrency(verifyResult.ticket.drink_total) }}</span>
                    </div>
                    <!-- Drink received status -->
                    <div class="mt-2">
                      <div class="flex items-center gap-3 p-2.5 rounded-lg"
                        :class="verifyResult.drink_received || verifyResult.ticket?.drink_received ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-800'">
                        <span class="size-2.5 rounded-full" :class="verifyResult.drink_received || verifyResult.ticket?.drink_received ? 'bg-green-400' : 'bg-slate-600'"></span>
                        <span class="text-xs font-medium" :class="verifyResult.drink_received || verifyResult.ticket?.drink_received ? 'text-green-400' : 'text-slate-400'">
                          {{ verifyResult.drink_received || verifyResult.ticket?.drink_received ? 'Drink Already Received' : 'Drink Not Yet Received' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Already redeemed warning -->
                <div v-if="verifyResult.already_redeemed" class="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <svg class="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-2.694-.833-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <div>
                    <p class="text-sm font-medium text-yellow-400">Already Checked In</p>
                    <p class="text-xs text-yellow-300/70 mt-0.5">This ticket was redeemed at {{ formatTime(verifyResult.ticket?.redeemed_at) }}</p>
                  </div>
                </div>

                <!-- Actions -->
                <div class="space-y-3 pt-2">
                  <!-- Moderation report button -->
                  <button @click="openScannerModeration" class="w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    :class="verifyResult.moderation ? (verifyResult.moderation.moderation_type === 'BAN' ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/30 hover:bg-red-500/20' : 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30 hover:bg-amber-500/20') : 'bg-slate-800 text-slate-300 hover:bg-slate-700'">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h12v2H1v-2zm16.3-7.7L8.7 4.7l1.4-1.4 8.6 8.6-1.4 1.4zM5.1 11.5l-2.8 2.8c-.4.4-.4 1 0 1.4l2 2c.4.4 1 .4 1.4 0l2.8-2.8-3.4-3.4zm8.4-8.4L11.1.7c-.4-.4-1-.4-1.4 0l-2 2c-.4.4-.4 1 0 1.4l2.4 2.4 3.4-3.4z"/></svg>
                    Moderation
                  </button>

                  <!-- Revoke button (for paid, valid tickets) -->
                  <button v-if="!verifyResult.already_redeemed" @click="showScannerRevokeModal = true"
                    class="w-full px-4 py-2.5 rounded-lg bg-red-600/10 text-red-400 text-sm font-semibold ring-1 ring-red-600/20 hover:bg-red-600/20">
                    Revoke Ticket
                  </button>

                  <!-- Food received checkbox (shown during check-in if food exists) -->
                  <label v-if="parseFoodSelection(verifyResult.ticket?.food_selection).length && !verifyResult.already_redeemed && !(verifyResult.food_received || verifyResult.ticket?.food_received)"
                    class="flex items-center gap-3 p-3 rounded-lg bg-slate-800 cursor-pointer select-none hover:bg-slate-700 transition-colors">
                    <input type="checkbox" v-model="checkInFoodReceived" class="rounded border-slate-600 bg-slate-900 text-[#0df2f2] focus:ring-[#0df2f2]" />
                    <div>
                      <span class="text-sm font-medium text-white">Also mark food as received</span>
                      <p class="text-xs text-slate-400 mt-0.5">Check if attendee is receiving food now</p>
                    </div>
                  </label>

                  <!-- Drink received checkbox (shown during check-in if drink exists) -->
                  <label v-if="parseDrinkSelection(verifyResult.ticket?.drink_selection).length && !verifyResult.already_redeemed && !(verifyResult.drink_received || verifyResult.ticket?.drink_received)"
                    class="flex items-center gap-3 p-3 rounded-lg bg-slate-800 cursor-pointer select-none hover:bg-slate-700 transition-colors">
                    <input type="checkbox" v-model="checkInDrinkReceived" class="rounded border-slate-600 bg-slate-900 text-[#0df2f2] focus:ring-[#0df2f2]" />
                    <div>
                      <span class="text-sm font-medium text-white">Also mark drink as received</span>
                      <p class="text-xs text-slate-400 mt-0.5">Check if attendee is receiving drink now</p>
                    </div>
                  </label>

                  <div class="flex gap-3">
                    <button v-if="!verifyResult.already_redeemed" @click="handleRedeem" :disabled="isRedeeming"
                      class="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                      {{ isRedeeming ? 'Checking in...' : 'Confirm Check-In' }}
                    </button>

                    <!-- Food-only action for already checked-in tickets -->
                    <button v-if="verifyResult.already_redeemed && parseFoodSelection(verifyResult.ticket?.food_selection).length && !(verifyResult.food_received || verifyResult.ticket?.food_received)"
                      @click="handleFoodOnly" :disabled="isRedeeming"
                      class="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50">
                      {{ isRedeeming ? 'Processing...' : 'Confirm Food Pick-up' }}
                    </button>

                    <!-- Drink-only action for already checked-in tickets -->
                    <button v-if="verifyResult.already_redeemed && parseDrinkSelection(verifyResult.ticket?.drink_selection).length && !(verifyResult.drink_received || verifyResult.ticket?.drink_received)"
                      @click="handleDrinkOnly" :disabled="isRedeeming"
                      class="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                      {{ isRedeeming ? 'Processing...' : 'Confirm Drink Pick-up' }}
                    </button>

                    <button @click="clearResult" class="px-4 py-2.5 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">
                      {{ verifyResult.already_redeemed ? 'Check Next' : 'Cancel' }}
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <!-- Access Denied -->
            <template v-else>
              <!-- Revoked ticket -->
              <template v-if="verifyResult.revoked">
                <div class="bg-purple-600 px-6 py-4 flex items-center gap-3">
                  <div class="size-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  </div>
                  <div>
                    <h3 class="text-white font-bold text-lg">Ticket Revoked</h3>
                    <p class="text-purple-100 text-xs">This ticket has been revoked</p>
                  </div>
                </div>
                <div class="p-6 space-y-4">
                  <!-- Attendee Info -->
                  <div class="flex items-center gap-4">
                    <div class="size-14 rounded-full overflow-hidden bg-purple-500/20 flex items-center justify-center text-xl font-bold text-purple-400 shrink-0">
                      {{ (verifyResult.ticket?.first_name || 'R')[0].toUpperCase() }}
                    </div>
                    <div>
                      <p class="text-lg font-bold text-white">{{ [verifyResult.ticket?.first_name, verifyResult.ticket?.last_name].filter(Boolean).join(' ') || 'N/A' }}</p>
                      <p class="text-sm text-slate-400">{{ verifyResult.ticket?.nickname || '' }}</p>
                    </div>
                  </div>
                  <div v-if="verifyResult.ticket?.revoke_reason" class="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <p class="text-[10px] uppercase tracking-wider text-purple-300/70 font-semibold mb-1">Revoke Reason</p>
                    <p class="text-sm text-purple-300">{{ verifyResult.ticket.revoke_reason }}</p>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-slate-800">
                    <span class="text-xs text-slate-400 uppercase tracking-wider">Ticket #</span>
                    <span class="text-sm font-mono text-white">{{ verifyResult.ticket?.ticket_number }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-slate-800">
                    <span class="text-xs text-slate-400 uppercase tracking-wider">Tier</span>
                    <span class="text-sm text-white">{{ verifyResult.ticket?.tier_name }}</span>
                  </div>
                  <div class="space-y-3 pt-2">
                    <button @click="handleScannerUnrevoke" :disabled="isRedeeming"
                      class="w-full px-4 py-2.5 rounded-lg bg-green-600/20 text-green-400 text-sm font-semibold ring-1 ring-green-600/30 hover:bg-green-600/30 disabled:opacity-50">
                      {{ isRedeeming ? 'Processing...' : 'Restore Ticket' }}
                    </button>
                    <button @click="clearResult" class="w-full px-4 py-2.5 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">
                      Check Next
                    </button>
                  </div>
                </div>
              </template>
              <!-- Generic denied -->
              <template v-else>
              <div class="bg-red-600 px-6 py-4 flex items-center gap-3">
                <div class="size-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <div>
                  <h3 class="text-white font-bold text-lg">Access Denied</h3>
                  <p class="text-red-100 text-xs">{{ verifyResult.message || 'Ticket not found or invalid' }}</p>
                </div>
              </div>
              <div class="p-6">
                <p class="text-sm text-slate-400">{{ verifyResult.message || 'The scanned ticket is not valid for this event.' }}</p>
                <button @click="clearResult" class="mt-4 w-full px-4 py-2.5 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">
                  Try Again
                </button>
              </div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Scanner Revoke Modal -->
    <div v-if="showScannerRevokeModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showScannerRevokeModal = false">
      <div class="w-full max-w-sm bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 class="text-lg font-bold text-red-400">Revoke Ticket</h3>
          <button @click="showScannerRevokeModal = false" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <p class="text-sm text-slate-300">This will revoke the ticket and prevent the attendee from using it.</p>
          <textarea v-model="scannerRevokeReason" rows="3" placeholder="Reason for revoking (optional)..."
            class="w-full rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 p-3 focus:ring-2 focus:ring-red-500/50 focus:border-transparent resize-none"></textarea>
          <div class="flex gap-3">
            <button @click="handleScannerRevoke" :disabled="isRedeeming"
              class="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
              {{ isRedeeming ? 'Revoking...' : 'Confirm Revoke' }}
            </button>
            <button @click="showScannerRevokeModal = false" class="px-4 py-2.5 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Scanner Moderation Modal -->
    <div v-if="showScannerModModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showScannerModModal = false">
      <div class="w-full max-w-md bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h12v2H1v-2zm16.3-7.7L8.7 4.7l1.4-1.4 8.6 8.6-1.4 1.4zM5.1 11.5l-2.8 2.8c-.4.4-.4 1 0 1.4l2 2c.4.4 1 .4 1.4 0l2.8-2.8-3.4-3.4zm8.4-8.4L11.1.7c-.4-.4-1-.4-1.4 0l-2 2c-.4.4-.4 1 0 1.4l2.4 2.4 3.4-3.4z"/></svg>
            <h3 class="text-lg font-bold text-white">Moderation Report</h3>
          </div>
          <button @click="showScannerModModal = false" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div v-if="scannerModTarget" class="px-6 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-3">
          <div class="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
            <span class="text-sm font-bold text-slate-400">{{ (scannerModTarget.first_name || 'A')[0].toUpperCase() }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ [scannerModTarget.first_name, scannerModTarget.last_name].filter(Boolean).join(' ') || scannerModTarget.nickname || 'N/A' }}</p>
            <p v-if="scannerModTarget.nickname" class="text-xs text-slate-400">@{{ scannerModTarget.nickname }}</p>
          </div>
        </div>

        <div class="overflow-y-auto flex-1">
          <div v-if="scannerModLoading" class="flex items-center justify-center py-10">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-400"></div>
          </div>

          <template v-else>
            <div class="p-5 border-b border-slate-800">
              <h4 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Report Attendee</h4>
              <div class="mb-3 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p class="text-[11px] text-blue-300">This creates a detection rule and a pending suspect. An admin must confirm before enforcement.</p>
              </div>
              <div class="flex gap-2 mb-3">
                <button @click="scannerModFormType = 'WATCH'" class="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2"
                  :class="scannerModFormType === 'WATCH' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'">
                  Watchlist
                </button>
                <button @click="scannerModFormType = 'BAN'" class="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2"
                  :class="scannerModFormType === 'BAN' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'">
                  Ban
                </button>
              </div>
              <textarea v-model="scannerModFormNotes" rows="3" placeholder="Reason for report (optional)..."
                class="w-full rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 p-3 focus:ring-2 focus:border-transparent resize-none"
                :class="scannerModFormType === 'BAN' ? 'focus:ring-red-500/50' : 'focus:ring-amber-500/50'"></textarea>
              <button @click="submitScannerMod" :disabled="scannerModFormSubmitting"
                class="w-full mt-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                :class="scannerModFormType === 'BAN' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'">
                {{ scannerModFormSubmitting ? 'Submitting...' : scannerModFormType === 'BAN' ? 'Report for Ban' : 'Report for Watchlist' }}
              </button>
            </div>

            <div class="p-5">
              <h4 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Existing Records <span v-if="scannerModEntries.length" class="text-slate-500">({{ scannerModEntries.length }})</span></h4>
              <div v-if="scannerModEntries.length === 0" class="text-center py-6">
                <p class="text-xs text-slate-500">No existing records for this attendee.</p>
              </div>
              <div v-else class="space-y-3">
                <div v-for="entry in scannerModEntries" :key="entry.moderation_uuid"
                  class="rounded-lg border p-3"
                  :class="entry.moderation_type === 'BAN' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase" :class="entry.moderation_type === 'BAN' ? 'text-red-400' : 'text-amber-400'">
                      {{ entry.moderation_type === 'BAN' ? 'Banned' : 'Watchlist' }}
                    </span>
                  </div>
                  <p v-if="entry.notes" class="text-xs text-slate-300 mt-1">{{ entry.notes }}</p>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="px-6 py-4 border-t border-slate-700 shrink-0">
          <button @click="showScannerModModal = false" class="w-full px-4 py-2.5 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { Html5Qrcode } from 'html5-qrcode'
import ticketApi from '../../../services/ticketApi'
import authApi from '../../../services/authApi'
import { getAuthImageUrl } from '../../../config/api'

const props = defineProps({ event: Object })
const route = useRoute()
const eventId = computed(() => route.params.eventId)

const scannerActive = ref(false)
const scannerError = ref(null)
const manualSearch = ref('')
const isSearching = ref(false)
const isRedeeming = ref(false)
const verifyResult = ref(null)
const verifyProfile = ref(null)
const recentCheckins = ref([])
const stats = ref({ total_tickets: 0, paid_tickets: 0, redeemed_tickets: 0, pending_checkin: 0 })
const checkInFoodReceived = ref(false)
const checkInDrinkReceived = ref(false)
const showScannerModModal = ref(false)
const scannerModTarget = ref(null)
const scannerModEntries = ref([])
const scannerModLoading = ref(false)
const scannerModFormType = ref('WATCH')
const scannerModFormNotes = ref('')
const scannerModFormSubmitting = ref(false)
const showScannerRevokeModal = ref(false)
const scannerRevokeReason = ref('')

let html5QrCode = null
let lastScannedId = null
let scanCooldown = false

function parseFoodSelection(val) {
  if (!val) return []
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    if (!Array.isArray(parsed)) return []
    // Normalize: support both legacy ["name"] and new [{name, choice}] formats
    return parsed.map(item => typeof item === 'string' ? { name: item } : item)
  } catch { return [] }
}

function parseEventFoodOptions(raw) {
  if (!raw) return []
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []
    return parsed.map(o => {
      if (typeof o === 'string') return { name: o, price: 0, choices: [] }
      return { name: o.name || '', price: Number(o.price) || 0, choices: Array.isArray(o.choices) ? o.choices : [] }
    })
  } catch { return [] }
}

const verifyFoodItems = computed(() => {
  if (!verifyResult.value?.ticket) return []
  const selection = parseFoodSelection(verifyResult.value.ticket.food_selection)
  if (!selection.length) return []
  const eventOptions = parseEventFoodOptions(verifyResult.value.ticket.event_food_options)
  return selection.map(sel => {
    const opt = eventOptions.find(o => o.name === sel.name)
    return {
      name: sel.name,
      choice: sel.choice || null,
      menuPrice: opt?.price || 0,
      choicePrice: sel.choice_price || 0,
    }
  })
})

function parseDrinkSelection(val) {
  if (!val) return []
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    if (!Array.isArray(parsed)) return []
    return parsed.map(item => typeof item === 'string' ? { name: item } : item)
  } catch { return [] }
}

function parseEventDrinkOptions(raw) {
  if (!raw) return []
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []
    return parsed.map(o => {
      if (typeof o === 'string') return { name: o, price: 0, choices: [] }
      return { name: o.name || '', price: Number(o.price) || 0, choices: Array.isArray(o.choices) ? o.choices : [] }
    })
  } catch { return [] }
}

const verifyDrinkItems = computed(() => {
  if (!verifyResult.value?.ticket) return []
  const selection = parseDrinkSelection(verifyResult.value.ticket.drink_selection)
  if (!selection.length) return []
  const eventOptions = parseEventDrinkOptions(verifyResult.value.ticket.event_drink_options)
  return selection.map(sel => {
    const opt = eventOptions.find(o => o.name === sel.name)
    return {
      name: sel.name,
      choice: sel.choice || null,
      menuPrice: opt?.price || 0,
      choicePrice: sel.choice_price || 0,
    }
  })
})

function formatCurrency(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0)
}

function formatTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function clearResult() {
  verifyResult.value = null
  verifyProfile.value = null
  manualSearch.value = ''
  checkInFoodReceived.value = false
  checkInDrinkReceived.value = false
  // Reset scan cooldown so the next scan proceeds
  lastScannedId = null
  scanCooldown = false
}

async function toggleScanner() {
  if (scannerActive.value) {
    await stopScanner()
  } else {
    await startScanner()
  }
}

async function startScanner() {
  scannerError.value = null
  try {
    html5QrCode = new Html5Qrcode('qr-reader', { verbose: false })
    await html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 30,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          return {
            width: Math.floor(viewfinderWidth * 0.98),
            height: Math.floor(viewfinderHeight * 0.98)
          }
        },
        aspectRatio: 16 / 9,
        disableFlip: false,
        videoConstraints: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      },
      onScanSuccess,
      () => { /* ignore scan failures (no QR in frame) */ }
    )
    scannerActive.value = true
  } catch (err) {
    console.error('Scanner start failed:', err)
    scannerError.value = typeof err === 'string' ? err : (err.message || 'Failed to access camera. Please grant camera permission and try again.')
    scannerActive.value = false
  }
}

async function stopScanner() {
  try {
    if (html5QrCode) {
      await html5QrCode.stop()
      html5QrCode.clear()
      html5QrCode = null
    }
  } catch (err) {
    console.error('Scanner stop error:', err)
  }
  scannerActive.value = false
}

async function onScanSuccess(decodedText) {
  // Prevent duplicate scans of the same QR within cooldown period
  if (scanCooldown || decodedText === lastScannedId) return
  lastScannedId = decodedText
  scanCooldown = true

  // The QR code contains the ticket_uuid
  const ticketUuid = decodedText.trim()
  if (!ticketUuid) {
    scanCooldown = false
    return
  }

  isSearching.value = true
  try {
    const res = await ticketApi.verifyCheckin(eventId.value, { ticket_uuid: ticketUuid })
    verifyResult.value = res
    // Fetch user identification from auth
    verifyProfile.value = null
    if (res.ticket?.user_uuid) {
      try {
        const userRes = await authApi.getUserProfile(res.ticket.user_uuid)
        verifyProfile.value = userRes.user || userRes
      } catch { /* not available */ }
    }
  } catch (e) {
    verifyResult.value = { valid: false, message: e.message || 'Ticket not found' }
    // Allow re-scan after failed attempt
    setTimeout(() => { scanCooldown = false }, 2000)
  } finally {
    isSearching.value = false
  }
}

async function handleManualSearch() {
  if (!manualSearch.value.trim()) return
  isSearching.value = true
  try {
    const query = manualSearch.value.trim()
    // Always use search — backend LIKE matches ticket_number, first_name, last_name, nickname
    const res = await ticketApi.verifyCheckin(eventId.value, { search: query })
    verifyResult.value = res
    // Fetch user identification from auth
    verifyProfile.value = null
    if (res.ticket?.user_uuid) {
      try {
        const userRes = await authApi.getUserProfile(res.ticket.user_uuid)
        verifyProfile.value = userRes.user || userRes
      } catch { /* not available */ }
    }
  } catch (e) {
    verifyResult.value = { valid: false, message: e.message || 'Ticket not found' }
  } finally {
    isSearching.value = false
  }
}

async function handleRedeem() {
  if (!verifyResult.value?.ticket?.ticket_uuid) return
  isRedeeming.value = true
  try {
    const body = { ticket_uuid: verifyResult.value.ticket.ticket_uuid }
    if (checkInFoodReceived.value) body.food_received = true
    if (checkInDrinkReceived.value) body.drink_received = true
    const res = await ticketApi.redeemTicket(eventId.value, body)
    // Add to recent check-ins
    recentCheckins.value.unshift({
      ticket_uuid: verifyResult.value.ticket.ticket_uuid,
      ticket_number: verifyResult.value.ticket.ticket_number,
      name: [verifyResult.value.ticket.first_name, verifyResult.value.ticket.last_name].filter(Boolean).join(' ') || verifyResult.value.ticket.nickname || 'N/A',
      tier_name: verifyResult.value.ticket.tier_name,
      time: new Date().toISOString(),
      success: true,
      avatar_url: verifyProfile.value?.profile_image_url || null,
    })
    if (recentCheckins.value.length > 20) recentCheckins.value.pop()
    // Update stats
    stats.value.redeemed_tickets = (stats.value.redeemed_tickets || 0) + 1
    clearResult()
  } catch (e) {
    if (e.status === 409) {
      verifyResult.value.already_redeemed = true
    } else {
      alert(e.message || 'Failed to check in')
    }
  } finally {
    isRedeeming.value = false
  }
}

async function handleFoodOnly() {
  if (!verifyResult.value?.ticket?.ticket_uuid) return
  isRedeeming.value = true
  try {
    await ticketApi.markFoodReceived(eventId.value, {
      ticket_uuid: verifyResult.value.ticket.ticket_uuid,
      received: true,
    })
    // Update local state
    verifyResult.value.food_received = true
    if (verifyResult.value.ticket) verifyResult.value.ticket.food_received = 1
  } catch (e) {
    alert(e.message || 'Failed to mark food received')
  } finally {
    isRedeeming.value = false
  }
}

async function handleDrinkOnly() {
  if (!verifyResult.value?.ticket?.ticket_uuid) return
  isRedeeming.value = true
  try {
    await ticketApi.markDrinkReceived(eventId.value, {
      ticket_uuid: verifyResult.value.ticket.ticket_uuid,
      received: true,
    })
    // Update local state
    verifyResult.value.drink_received = true
    if (verifyResult.value.ticket) verifyResult.value.ticket.drink_received = 1
  } catch (e) {
    alert(e.message || 'Failed to mark drink received')
  } finally {
    isRedeeming.value = false
  }
}

async function loadStats() {
  try {
    const res = await ticketApi.getCheckinStats(eventId.value)
    stats.value = res.summary || res || {}
  } catch (e) {
    console.error('Failed to load stats:', e)
  }
}

// ─── Moderation from scanner ───

async function openScannerModeration() {
  if (!verifyResult.value?.ticket) return
  const t = verifyResult.value.ticket
  scannerModTarget.value = t
  showScannerModModal.value = true
  scannerModLoading.value = true
  scannerModEntries.value = []
  scannerModFormType.value = 'WATCH'
  scannerModFormNotes.value = ''
  try {
    const all = await ticketApi.getModerationList(eventId.value)
    const entries = Array.isArray(all) ? all : (all.entries || all.moderation || [])
    const fullName = [t.first_name, t.last_name].filter(Boolean).join(' ').toLowerCase()
    const nick = (t.nickname || '').toLowerCase()
    scannerModEntries.value = entries.filter(e => {
      const eName = (e.legal_name || '').toLowerCase()
      const eNick = (e.nickname || '').toLowerCase()
      return (fullName && eName === fullName) || (nick && eNick && eNick === nick)
    })
  } catch (e) {
    console.error('Failed to load moderation:', e)
  } finally {
    scannerModLoading.value = false
  }
}

async function submitScannerMod() {
  const t = scannerModTarget.value
  if (!t) return
  scannerModFormSubmitting.value = true
  try {
    const legalName = [t.first_name, t.last_name].filter(Boolean).join(' ') || t.nickname || 'Unknown'
    await ticketApi.addModeration(eventId.value, {
      legal_name: legalName,
      first_name: t.first_name || null,
      last_name: t.last_name || null,
      nickname: t.nickname || null,
      moderation_type: scannerModFormType.value,
      notes: scannerModFormNotes.value.trim() || null,
      target_user_uuid: t.user_uuid || null,
      target_ticket_uuid: t.ticket_uuid || null,
    })
    scannerModFormNotes.value = ''
    // Refresh entries
    await openScannerModeration()
  } catch (e) {
    alert(e.message || 'Failed to submit moderation')
  } finally {
    scannerModFormSubmitting.value = false
  }
}

// ─── Revoke from scanner ───

async function handleScannerRevoke() {
  if (!verifyResult.value?.ticket) return
  isRedeeming.value = true
  try {
    await ticketApi.revokeTicket(eventId.value, verifyResult.value.ticket.ticket_uuid, scannerRevokeReason.value.trim())
    showScannerRevokeModal.value = false
    scannerRevokeReason.value = ''
    clearResult()
  } catch (e) {
    alert(e.message || 'Failed to revoke ticket')
  } finally {
    isRedeeming.value = false
  }
}

async function handleScannerUnrevoke() {
  if (!verifyResult.value?.ticket) return
  if (!confirm('Restore this revoked ticket back to paid status?')) return
  isRedeeming.value = true
  try {
    await ticketApi.unrevokeTicket(eventId.value, verifyResult.value.ticket.ticket_uuid)
    clearResult()
  } catch (e) {
    alert(e.message || 'Failed to restore ticket')
  } finally {
    isRedeeming.value = false
  }
}

onMounted(loadStats)

onBeforeUnmount(async () => {
  if (html5QrCode) {
    try {
      await html5QrCode.stop()
      html5QrCode.clear()
    } catch { /* ignore */ }
    html5QrCode = null
  }
})
</script>

<style scoped>
@keyframes scan {
  0%, 100% { top: 1rem; }
  50% { top: calc(100% - 1rem); }
}
.animate-scan {
  animation: scan 2s ease-in-out infinite;
}

/* Override html5-qrcode default styles to fit dark theme */
:deep(#qr-reader) {
  border: none !important;
  background: black;
}
:deep(#qr-reader video) {
  border-radius: 0.75rem;
  object-fit: cover;
  width: 100% !important;
  height: 100% !important;
}
:deep(#qr-reader__scan_region) {
  min-height: auto !important;
}
/* Hide the shaded region overlay so the full camera view is visible */
:deep(#qr-shaded-region) {
  display: none !important;
}
/* Remove border on the scanning box */
:deep(#qr-reader__scan_region > img) {
  display: none !important;
}
:deep(#qr-reader__dashboard) {
  display: none !important;
}
:deep(#qr-reader__header_message) {
  display: none !important;
}
</style>
