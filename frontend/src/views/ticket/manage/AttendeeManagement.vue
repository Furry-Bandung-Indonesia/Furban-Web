<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <header class="shrink-0 bg-[#101622] z-10 px-6 pt-6 pb-3">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Attendees</h2>
          <p class="text-slate-400 text-sm mt-1">Manage ticket holders and check-in status.</p>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <button @click="exportToExcel" :disabled="actionLoading" class="flex items-center gap-2 bg-[#0df2f2]/10 hover:bg-[#0df2f2]/20 text-[#0df2f2] px-4 py-2 rounded-lg border border-[#0df2f2]/30 transition-colors disabled:opacity-50">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {{ actionLoading ? 'Exporting...' : 'Export Excel' }}
          </button>
          <div class="flex items-center gap-4 bg-[#161e2c] px-4 py-2 rounded-lg border border-slate-800/50">
            <div class="flex items-center gap-2">
              <span class="text-slate-400">Total:</span>
              <span class="font-bold text-white">{{ pagination.total || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex flex-col lg:flex-row gap-3 items-start lg:items-center bg-[#1a202c] p-3 rounded-xl border border-slate-800">
        <div class="flex-1 relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="w-5 h-5 text-slate-400 group-focus-within:text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input v-model="searchQuery" @input="debouncedLoad" class="block w-full rounded-lg border-0 py-2.5 pl-10 text-white bg-slate-900 ring-1 ring-inset ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0df2f2] sm:text-sm" placeholder="Search by name, email, or ticket..." type="text" />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="statusFilter" @change="loadAttendees(1)" class="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]">
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="under_payment">Pending</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
            <option value="revoked">Revoked</option>
          </select>
          <select v-model="tierFilter" @change="loadAttendees(1)" class="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]">
            <option value="">All Tiers</option>
            <option v-for="t in tierOptions" :key="t.tier_uuid" :value="t.tier_uuid">{{ t.tier_name }}</option>
          </select>
          <label class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" v-model="redeemedOnly" @change="loadAttendees(1)" class="rounded border-slate-700 bg-slate-900 text-[#0df2f2] focus:ring-[#0df2f2]" />
            <span class="text-sm text-slate-300">Checked-in</span>
          </label>
        </div>
      </div>
    </header>

    <!-- Table -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0df2f2]"></div>
      </div>

      <div v-else-if="attendees.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <svg class="w-12 h-12 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <h3 class="text-lg font-bold text-white mb-1">No attendees found</h3>
        <p class="text-sm text-slate-400">{{ searchQuery ? 'Try a different search query.' : 'No tickets have been claimed yet.' }}</p>
      </div>

      <table v-else class="w-full">
        <thead class="sticky top-0 bg-[#101622] z-10">
          <tr class="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
            <th class="px-6 py-3 text-left font-semibold w-10">#</th>
            <th class="px-6 py-3 text-left font-semibold">Ticket ID</th>
            <th class="px-6 py-3 text-left font-semibold">Attendee</th>
            <th class="px-6 py-3 text-left font-semibold">Tier</th>
            <th class="px-6 py-3 text-left font-semibold">Food Prefs</th>
            <th class="px-6 py-3 text-left font-semibold">Status</th>
            <th class="px-6 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/50">
          <tr v-for="(att, idx) in attendees" :key="att.ticket_uuid"
            :class="[att.moderation_status === 'BAN' ? 'border-l-4 border-l-red-500 bg-red-500/[0.03]' : att.moderation_status === 'WATCH' ? 'border-l-4 border-l-amber-500/50 bg-amber-500/[0.02]' : '']"
            class="hover:bg-white/[0.02] transition-colors group">
            <td class="px-6 py-4 text-sm text-slate-500">{{ (pagination.page - 1) * pagination.limit + idx + 1 }}</td>
            <td class="px-6 py-4">
              <span class="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded">{{ att.ticket_number || att.ticket_uuid?.slice(0, 8) }}</span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                  <img v-if="att._avatar_url" :src="getAuthImageUrl(att._avatar_url)" class="w-full h-full object-cover" @error="att._avatar_url = null" />
                  <span v-else class="text-xs font-bold text-slate-400">{{ getInitials(att) }}</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-white">{{ [att.first_name, att.last_name].filter(Boolean).join(' ') || att.nickname || 'N/A' }}</p>
                  <p class="text-xs text-slate-400">{{ att.nickname || '' }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center rounded-md bg-[#0df2f2]/10 px-2 py-1 text-xs font-medium text-[#0df2f2] ring-1 ring-inset ring-[#0df2f2]/20">
                {{ att.tier_name || 'N/A' }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1">
                <span v-for="food in parseFoodSelection(att.food_selection)" :key="food.name || food"
                  class="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                  {{ typeof food === 'string' ? food : food.name }}{{ food.choice ? ` · ${food.choice}` : '' }}
                </span>
                <span v-if="!parseFoodSelection(att.food_selection).length" class="text-xs text-slate-500">—</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <span class="size-2 rounded-full" :class="statusDot(att)"></span>
                <span class="text-xs font-medium" :class="statusText(att)">{{ statusLabel(att) }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-1">
                <button v-if="isAdmin" @click.stop="openModeration(att)" class="p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100" :class="att.moderation_status === 'BAN' ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : att.moderation_status === 'WATCH' ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10' : 'text-slate-400 hover:text-red-400 hover:bg-slate-800'" title="Moderation">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h12v2H1v-2zm16.3-7.7L8.7 4.7l1.4-1.4 8.6 8.6-1.4 1.4zM5.1 11.5l-2.8 2.8c-.4.4-.4 1 0 1.4l2 2c.4.4 1 .4 1.4 0l2.8-2.8-3.4-3.4zm8.4-8.4L11.1.7c-.4-.4-1-.4-1.4 0l-2 2c-.4.4-.4 1 0 1.4l2.4 2.4 3.4-3.4z"/></svg>
                </button>
                <!-- Quick pay override for pending tickets -->
                <button v-if="isAdmin && att.purchase_status === 'under_payment'" @click.stop="handleManualPay(att)"
                  :disabled="actionLoading"
                  class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 ring-1 ring-emerald-600/30 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                  title="Mark as Paid (Override)">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
                  Pay
                </button>
                <button @click="openDetail(att)" class="p-1.5 rounded-lg text-slate-400 hover:text-[#0df2f2] hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination.total_pages > 1" class="sticky bottom-0 bg-[#101622] border-t border-slate-800 px-6 py-3 flex items-center justify-between">
        <p class="text-sm text-slate-400">
          Showing {{ (pagination.page - 1) * pagination.limit + 1 }}–{{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }}
        </p>
        <div class="flex items-center gap-1">
          <button @click="loadAttendees(pagination.page - 1)" :disabled="pagination.page <= 1" class="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed">Prev</button>
          <button v-for="p in visiblePages" :key="p" @click="loadAttendees(p)"
            :class="p === pagination.page ? 'bg-[#0df2f2] text-[#0a0e17] font-bold' : 'text-slate-300 hover:bg-slate-800'"
            class="min-w-[36px] h-9 rounded-lg text-sm">{{ p }}</button>
          <button @click="loadAttendees(pagination.page + 1)" :disabled="pagination.page >= pagination.total_pages" class="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
        </div>
      </div>
    </div>

    <!-- Attendee Detail Modal -->
    <div v-if="selectedAttendee" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="selectedAttendee = null">
      <div class="w-full max-w-lg bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <h3 class="text-lg font-bold text-white">Attendee Detail</h3>
          <button @click="selectedAttendee = null" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="overflow-y-auto p-6 space-y-5">
          <!-- Profile Card -->
          <div class="flex items-center gap-4">
            <div class="shrink-0 w-16 h-16 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center ring-2 ring-slate-600">
              <img v-if="attendeeProfile?.profile_image_url" :src="getAuthImageUrl(attendeeProfile.profile_image_url)" class="w-full h-full object-cover" @error="attendeeProfile.profile_image_url = null" />
              <span v-else class="text-xl font-bold text-slate-400">{{ getInitials(selectedAttendee) }}</span>
            </div>
            <div>
              <p class="text-lg font-bold text-white">{{ [selectedAttendee.first_name, selectedAttendee.last_name].filter(Boolean).join(' ') || selectedAttendee.nickname || 'N/A' }}</p>
              <p v-if="selectedAttendee.nickname" class="text-sm text-slate-400">@{{ selectedAttendee.nickname }}</p>
              <p v-if="attendeeProfile?.email" class="text-xs text-slate-500 mt-0.5">{{ attendeeProfile.email }}</p>
            </div>
          </div>

          <!-- Alert for moderation -->
          <div v-if="selectedAttendee.moderation_status === 'BAN'" class="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <svg class="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            <div>
              <p class="text-sm font-medium text-red-400">Banned from moderation list</p>
              <p class="text-xs text-red-300/70 mt-0.5">This person is on the ban list. Review moderation before proceeding.</p>
            </div>
          </div>
          <div v-else-if="selectedAttendee.moderation_status === 'WATCH'" class="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <svg class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <div>
              <p class="text-sm font-medium text-amber-400">On watchlist</p>
              <p class="text-xs text-amber-300/70 mt-0.5">Review moderation notes.</p>
            </div>
          </div>

          <!-- Personal Info -->
          <div class="space-y-3">
            <h4 class="text-xs uppercase tracking-wider text-slate-500 font-semibold">Ticket Information</h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">First Name</p>
                <p class="text-sm text-white mt-1">{{ selectedAttendee.first_name || '—' }}</p>
              </div>
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Last Name</p>
                <p class="text-sm text-white mt-1">{{ selectedAttendee.last_name || '—' }}</p>
              </div>
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Date of Birth</p>
                <p class="text-sm text-white mt-1">{{ selectedAttendee.date_of_birth || '—' }}</p>
              </div>
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Phone Number</p>
                <p class="text-sm text-white mt-1">{{ selectedAttendee.phone_number || '—' }}</p>
              </div>
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Nickname</p>
                <p class="text-sm text-white mt-1">{{ selectedAttendee.nickname || '—' }}</p>
              </div>
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Fursuiter</p>
                <p class="text-sm text-white mt-1">{{ selectedAttendee.is_fursuiter ? 'Yes' : 'No' }}</p>
              </div>
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ticket #</p>
                <p class="text-sm text-white mt-1 font-mono">{{ selectedAttendee.ticket_number || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <!-- Account Info (from auth) -->
          <div v-if="attendeeProfile" class="space-y-3">
            <h4 class="text-xs uppercase tracking-wider text-slate-500 font-semibold">Account Information</h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Email</p>
                <p class="text-sm text-white mt-1">{{ attendeeProfile.email || '—' }}</p>
              </div>
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Username</p>
                <p class="text-sm text-white mt-1">{{ attendeeProfile.username || '—' }}</p>
              </div>
            </div>
          </div>

          <!-- Purchase Info -->
          <div class="space-y-3">
            <h4 class="text-xs uppercase tracking-wider text-slate-500 font-semibold">Purchase Details</h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Tier</p>
                <p class="text-sm text-white mt-1">{{ selectedAttendee.tier_name }}</p>
              </div>
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ticket Base</p>
                <p class="text-sm text-white mt-1">{{ formatCurrency(selectedAttendee.tier_price || selectedAttendee.price_total) }}</p>
              </div>
              <div v-if="selectedAttendee.food_total > 0" class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Meal Add-on</p>
                <p class="text-sm text-amber-400 mt-1">+{{ formatCurrency(selectedAttendee.food_total) }}</p>
              </div>
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Price</p>
                <p class="text-sm text-[#0df2f2] font-bold mt-1">{{ formatCurrency(selectedAttendee.price_total) }}</p>
              </div>
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Status</p>
                <p class="text-sm mt-1" :class="statusText(selectedAttendee)">{{ statusLabel(selectedAttendee) }}</p>
              </div>
              <div class="bg-slate-900 rounded-lg p-3">
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Checked In</p>
                <p class="text-sm mt-1" :class="selectedAttendee.is_redeemed ? 'text-green-400' : 'text-slate-400'">
                  {{ selectedAttendee.is_redeemed ? formatDateTime(selectedAttendee.redeemed_at) : 'Not yet' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Food Selection with Prices & Choices -->
          <div class="space-y-3">
            <h4 class="text-xs uppercase tracking-wider text-slate-500 font-semibold">Food Selection</h4>
            <div v-if="detailFoodItems.length" class="space-y-2">
              <div v-for="item in detailFoodItems" :key="item.name"
                class="bg-slate-900 rounded-lg px-3 py-2.5 ring-1 ring-slate-800">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-slate-200 font-medium">{{ item.name }}</span>
                  <span v-if="item.menuPrice > 0" class="text-xs font-medium text-amber-400">+{{ formatCurrency(item.menuPrice) }}</span>
                  <span v-else class="text-xs font-medium text-green-400">Included</span>
                </div>
                <div v-if="item.choice" class="flex items-center justify-between mt-1 pl-3 border-l-2 border-slate-700">
                  <span class="text-xs text-slate-400">{{ item.choice }}</span>
                  <span v-if="item.choicePrice > 0" class="text-[10px] font-medium text-amber-400">+{{ formatCurrency(item.choicePrice) }}</span>
                </div>
              </div>
              <div v-if="selectedAttendee.food_total > 0"
                class="flex items-center justify-between pt-2 border-t border-slate-700 px-1">
                <span class="text-xs text-slate-400 uppercase tracking-wider">Food Add-on Total</span>
                <span class="text-sm font-bold text-amber-400">{{ formatCurrency(selectedAttendee.food_total) }}</span>
              </div>
            </div>
            <span v-else class="text-sm text-slate-500">No food preferences selected</span>
          </div>

          <!-- Food Notes -->
          <div v-if="selectedAttendee.food_notes" class="space-y-2">
            <h4 class="text-xs uppercase tracking-wider text-slate-500 font-semibold">Food Notes</h4>
            <p class="text-sm text-slate-300 bg-slate-900 rounded-lg px-3 py-2.5 ring-1 ring-slate-800 italic">{{ selectedAttendee.food_notes }}</p>
          </div>

          <!-- Food Received Status -->
          <div v-if="detailFoodItems.length" class="space-y-3">
            <h4 class="text-xs uppercase tracking-wider text-slate-500 font-semibold">Food Received</h4>
            <div class="flex items-center gap-3 p-3 rounded-lg border"
              :class="selectedAttendee.food_received ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-900 border-slate-800'">
              <span class="size-3 rounded-full" :class="selectedAttendee.food_received ? 'bg-green-400' : 'bg-slate-600'"></span>
              <div>
                <p class="text-sm font-medium" :class="selectedAttendee.food_received ? 'text-green-400' : 'text-slate-400'">
                  {{ selectedAttendee.food_received ? 'Food Received' : 'Not Yet Received' }}
                </p>
                <p v-if="selectedAttendee.food_received && selectedAttendee.food_received_at" class="text-xs text-slate-500 mt-0.5">
                  at {{ formatDateTime(selectedAttendee.food_received_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 py-4 border-t border-slate-700 space-y-3 shrink-0">
          <!-- Revoked Alert -->
          <div v-if="selectedAttendee.purchase_status === 'revoked'" class="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <svg class="w-5 h-5 text-purple-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            <div>
              <p class="text-sm font-medium text-purple-400">Ticket Revoked</p>
              <p v-if="selectedAttendee.revoke_reason" class="text-xs text-purple-300/70 mt-0.5">{{ selectedAttendee.revoke_reason }}</p>
            </div>
          </div>

          <!-- Food received toggle -->
          <button v-if="detailFoodItems.length && selectedAttendee.purchase_status === 'paid' && !selectedAttendee.food_received"
            @click="markFoodReceived(selectedAttendee, true)" :disabled="actionLoading"
            class="w-full px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            {{ actionLoading ? 'Processing...' : 'Mark Food Received' }}
          </button>
          <button v-if="detailFoodItems.length && selectedAttendee.food_received"
            @click="markFoodReceived(selectedAttendee, false)" :disabled="actionLoading"
            class="w-full px-4 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-600 disabled:opacity-50 flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            {{ actionLoading ? 'Processing...' : 'Undo Food Received' }}
          </button>
          <!-- Manual Pay Override for pending tickets -->
          <button v-if="selectedAttendee.purchase_status === 'under_payment'"
            @click="handleManualPay(selectedAttendee)" :disabled="actionLoading"
            class="w-full px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
            {{ actionLoading ? 'Processing...' : 'Mark as Paid (Override)' }}
          </button>
          <div class="flex gap-3">
            <button v-if="selectedAttendee.purchase_status === 'paid' && !selectedAttendee.is_redeemed"
              @click="forceCheckin(selectedAttendee)" :disabled="actionLoading"
              class="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {{ actionLoading ? 'Processing...' : 'Force Check-In' }}
            </button>
            <button v-if="selectedAttendee.is_redeemed"
              @click="undoCheckin(selectedAttendee)" :disabled="actionLoading"
              class="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50">
              {{ actionLoading ? 'Processing...' : 'Undo Check-In' }}
            </button>
            <button v-if="selectedAttendee.purchase_status === 'paid'"
              @click="showRevokeModal = true" :disabled="actionLoading"
              class="flex-1 px-4 py-2.5 rounded-lg bg-red-600/20 text-red-400 text-sm font-semibold ring-1 ring-red-600/30 hover:bg-red-600/30 disabled:opacity-50">
              Revoke
            </button>
            <button v-if="selectedAttendee.purchase_status === 'revoked'"
              @click="handleUnrevoke(selectedAttendee)" :disabled="actionLoading"
              class="flex-1 px-4 py-2.5 rounded-lg bg-green-600/20 text-green-400 text-sm font-semibold ring-1 ring-green-600/30 hover:bg-green-600/30 disabled:opacity-50">
              {{ actionLoading ? 'Processing...' : 'Restore Ticket' }}
            </button>
            <button @click="selectedAttendee = null" class="px-4 py-2.5 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Revoke Reason Modal -->
    <div v-if="showRevokeModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showRevokeModal = false">
      <div class="w-full max-w-sm bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 class="text-lg font-bold text-red-400">Revoke Ticket</h3>
          <button @click="showRevokeModal = false" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <p class="text-sm text-slate-300">This will revoke the ticket and prevent the attendee from using it. You can restore it later.</p>
          <textarea v-model="revokeReason" rows="3" placeholder="Reason for revoking (optional)..."
            class="w-full rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 p-3 focus:ring-2 focus:ring-red-500/50 focus:border-transparent resize-none"></textarea>
          <div class="flex gap-3">
            <button @click="handleRevoke(selectedAttendee)" :disabled="actionLoading"
              class="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
              {{ actionLoading ? 'Revoking...' : 'Confirm Revoke' }}
            </button>
            <button @click="showRevokeModal = false" class="px-4 py-2.5 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Moderation Action Modal -->
    <div v-if="showModerationModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showModerationModal = false">
      <div class="w-full max-w-md bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h12v2H1v-2zm16.3-7.7L8.7 4.7l1.4-1.4 8.6 8.6-1.4 1.4zM5.1 11.5l-2.8 2.8c-.4.4-.4 1 0 1.4l2 2c.4.4 1 .4 1.4 0l2.8-2.8-3.4-3.4zm8.4-8.4L11.1.7c-.4-.4-1-.4-1.4 0l-2 2c-.4.4-.4 1 0 1.4l2.4 2.4 3.4-3.4z"/></svg>
            <h3 class="text-lg font-bold text-white">Moderation</h3>
          </div>
          <button @click="showModerationModal = false" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Target Info -->
        <div v-if="moderationTarget" class="px-6 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-3">
          <div class="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
            <img v-if="moderationTarget._avatar_url" :src="getAuthImageUrl(moderationTarget._avatar_url)" class="w-full h-full object-cover" />
            <span v-else class="text-sm font-bold text-slate-400">{{ getInitials(moderationTarget) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ [moderationTarget.first_name, moderationTarget.last_name].filter(Boolean).join(' ') || moderationTarget.nickname || 'N/A' }}</p>
            <p v-if="moderationTarget.nickname" class="text-xs text-slate-400">@{{ moderationTarget.nickname }}</p>
          </div>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto flex-1">
          <div v-if="moderationLoading" class="flex items-center justify-center py-10">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-400"></div>
          </div>

          <template v-else>
            <!-- Report Form -->
            <div class="p-5 border-b border-slate-800">
              <h4 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Report Attendee</h4>

              <!-- Info: enforcement requires confirmation -->
              <div class="mb-3 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p class="text-[11px] text-blue-300">Adding a report creates a <strong>detection rule</strong> and a <strong>pending suspect</strong>. An admin must confirm from <span class="font-semibold">Moderation → Account Suspects</span> before enforcement takes effect.</p>
              </div>

              <!-- Type Selector -->
              <div class="flex gap-2 mb-3">
                <button @click="modFormType = 'WATCH'" class="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2"
                  :class="modFormType === 'WATCH' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-2.694-.833-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Watchlist
                </button>
                <button @click="modFormType = 'BAN'" class="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2"
                  :class="modFormType === 'BAN' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  Ban
                </button>
              </div>

              <!-- Reason -->
              <textarea v-model="modFormNotes" rows="3" placeholder="Reason for report (optional but recommended)..."
                class="w-full rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 p-3 focus:ring-2 focus:border-transparent resize-none"
                :class="modFormType === 'BAN' ? 'focus:ring-red-500/50' : 'focus:ring-amber-500/50'"></textarea>

              <!-- Submit -->
              <button @click="submitModeration" :disabled="modFormSubmitting"
                class="w-full mt-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                :class="modFormType === 'BAN' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'">
                <svg v-if="modFormSubmitting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h12v2H1v-2zm16.3-7.7L8.7 4.7l1.4-1.4 8.6 8.6-1.4 1.4zM5.1 11.5l-2.8 2.8c-.4.4-.4 1 0 1.4l2 2c.4.4 1 .4 1.4 0l2.8-2.8-3.4-3.4zm8.4-8.4L11.1.7c-.4-.4-1-.4-1.4 0l-2 2c-.4.4-.4 1 0 1.4l2.4 2.4 3.4-3.4z"/></svg>
                {{ modFormSubmitting ? 'Submitting...' : modFormType === 'BAN' ? 'Report for Ban' : 'Report for Watchlist' }}
              </button>
            </div>

            <!-- Existing Records -->
            <div class="p-5">
              <h4 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Existing Records <span v-if="moderationEntries.length" class="text-slate-500">({{ moderationEntries.length }})</span></h4>

              <div v-if="moderationEntries.length === 0" class="text-center py-6">
                <svg class="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <p class="text-xs text-slate-500">No existing records for this attendee.</p>
              </div>

              <div v-else class="space-y-3">
                <div v-for="entry in moderationEntries" :key="entry.moderation_uuid"
                  class="rounded-lg border p-4 space-y-2"
                  :class="entry.moderation_type === 'BAN' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'">
                  <div class="flex items-center justify-between">
                    <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      :class="entry.moderation_type === 'BAN' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'">
                      <span class="size-1.5 rounded-full" :class="entry.moderation_type === 'BAN' ? 'bg-red-400' : 'bg-amber-400'"></span>
                      {{ entry.moderation_type === 'BAN' ? 'Banned' : 'Watchlist' }}
                    </span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-slate-500">{{ formatDateTime(entry.created_at) }}</span>
                      <button @click="removeModEntry(entry)" class="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Remove entry">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  <div v-if="entry.notes" class="p-2.5 rounded bg-slate-900/50 border border-slate-800">
                    <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Reason</p>
                    <p class="text-sm text-slate-300">{{ entry.notes }}</p>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <p class="text-xs text-slate-500">Issued by: <span class="text-slate-300">{{ entry.issuer_name }}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-700 shrink-0">
          <button @click="showModerationModal = false" class="w-full px-4 py-2.5 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import ticketApi from '../../../services/ticketApi'
import authApi from '../../../services/authApi'
import { getAuthImageUrl } from '../../../config/api'

const props = defineProps({ event: Object })
const route = useRoute()
const authStore = useAuthStore()
const eventId = computed(() => route.params.eventId)
const isAdmin = computed(() => authStore.user?.role === 'admin')

const isLoading = ref(true)
const attendees = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const tierFilter = ref('')
const redeemedOnly = ref(false)
const tierOptions = ref([])
const selectedAttendee = ref(null)
const attendeeProfile = ref(null)
const actionLoading = ref(false)
const showModerationModal = ref(false)
const moderationTarget = ref(null)
const moderationEntries = ref([])
const moderationLoading = ref(false)
const modFormType = ref('WATCH')
const modFormNotes = ref('')
const modFormSubmitting = ref(false)
const showRevokeModal = ref(false)
const revokeReason = ref('')

const pagination = ref({ page: 1, limit: 50, total: 0, total_pages: 0 })

let debounceTimer = null
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadAttendees(1), 300)
}

const visiblePages = computed(() => {
  const total = pagination.value.total_pages
  const current = pagination.value.page
  const pages = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function parseFoodSelection(val) {
  if (!val) return []
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    if (!Array.isArray(parsed)) return []
    return parsed.map(item => typeof item === 'string' ? { name: item } : item)
  } catch { return [] }
}

/**
 * Parse event food_options (supports both legacy ["name"] and new [{name, price, choices}] format)
 */
function parseEventFoodOptions(raw) {
  if (!raw) return []
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []
    return parsed.map(o => typeof o === 'string'
      ? { name: o, price: 0, choices: [] }
      : { ...o, choices: Array.isArray(o.choices) ? o.choices : [] })
  } catch { return [] }
}

/**
 * Get food items with prices and choices for the detail modal
 */
const detailFoodItems = computed(() => {
  if (!selectedAttendee.value) return []
  const selection = parseFoodSelection(selectedAttendee.value.food_selection)
  if (!selection.length) return []
  const eventOptions = parseEventFoodOptions(selectedAttendee.value.event_food_options)
  return selection.map(item => {
    const opt = eventOptions.find(o => o.name === item.name)
    return {
      name: item.name,
      choice: item.choice || null,
      menuPrice: opt?.price || 0,
      choicePrice: item.choice_price || 0
    }
  })
})

function formatCurrency(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0)
}

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusDot(att) {
  if (att.purchase_status === 'revoked') return 'bg-purple-400'
  if (att.is_redeemed) return 'bg-green-400 animate-pulse'
  const map = { paid: 'bg-green-400', under_payment: 'bg-yellow-400 animate-pulse', expired: 'bg-slate-400', failed: 'bg-red-400' }
  return map[att.purchase_status] || 'bg-slate-400'
}

function statusText(att) {
  if (att.purchase_status === 'revoked') return 'text-purple-400'
  if (att.is_redeemed) return 'text-green-400'
  const map = { paid: 'text-green-400', under_payment: 'text-yellow-400', expired: 'text-slate-400', failed: 'text-red-400' }
  return map[att.purchase_status] || 'text-slate-400'
}

function statusLabel(att) {
  if (att.purchase_status === 'revoked') return 'Revoked'
  if (att.is_redeemed) return 'Checked In'
  const map = { paid: 'Paid', under_payment: 'Pending', expired: 'Expired', failed: 'Failed' }
  return map[att.purchase_status] || att.purchase_status
}

function getInitials(att) {
  const first = att.first_name?.[0] || ''
  const last = att.last_name?.[0] || ''
  if (first || last) return (first + last).toUpperCase()
  return att.nickname?.[0]?.toUpperCase() || '?'
}

async function loadAvatars() {
  const unique = [...new Set(attendees.value.filter(a => a.user_uuid).map(a => a.user_uuid))]
  if (!unique.length) return
  const results = await Promise.allSettled(
    unique.map(uuid => authApi.getUserProfile(uuid).then(r => {
      const u = r.user || r
      return { uuid, url: u?.profile_image_url }
    }))
  )
  const avatarMap = {}
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value.url) {
      avatarMap[r.value.uuid] = r.value.url
    }
  })
  attendees.value.forEach(a => {
    if (a.user_uuid && avatarMap[a.user_uuid]) {
      a._avatar_url = avatarMap[a.user_uuid]
    }
  })
}

async function openModeration(att) {
  moderationTarget.value = att
  showModerationModal.value = true
  moderationLoading.value = true
  moderationEntries.value = []
  modFormType.value = 'WATCH'
  modFormNotes.value = ''
  await fetchModerationEntries(att)
}

async function fetchModerationEntries(att) {
  moderationLoading.value = true
  try {
    const all = await ticketApi.getModerationList(eventId.value)
    const entries = Array.isArray(all) ? all : (all.entries || all.moderation || [])
    // Filter entries matching this attendee by name
    const fullName = [att.first_name, att.last_name].filter(Boolean).join(' ').toLowerCase()
    const nick = (att.nickname || '').toLowerCase()
    const matched = entries.filter(e => {
      const eName = (e.legal_name || '').toLowerCase()
      const eNick = (e.nickname || '').toLowerCase()
      return (fullName && eName === fullName) || (nick && eNick && eNick === nick)
    })
    // Resolve added_by UUIDs to usernames
    const issuerIds = [...new Set(matched.map(e => e.added_by).filter(Boolean))]
    const issuerMap = {}
    await Promise.allSettled(
      issuerIds.map(id => authApi.getUserProfile(id).then(r => {
        const u = r.user || r
        issuerMap[id] = u.username || u.email || id.slice(0, 8)
      }))
    )
    moderationEntries.value = matched.map(e => ({
      ...e,
      issuer_name: issuerMap[e.added_by] || e.added_by?.slice(0, 8) || 'Unknown'
    }))
  } catch (e) {
    console.error('Failed to load moderation:', e)
  } finally {
    moderationLoading.value = false
  }
}

async function submitModeration() {
  const att = moderationTarget.value
  if (!att) return
  modFormSubmitting.value = true
  try {
    const legalName = [att.first_name, att.last_name].filter(Boolean).join(' ') || att.nickname || 'Unknown'
    await ticketApi.addModeration(eventId.value, {
      legal_name: legalName,
      first_name: att.first_name || null,
      last_name: att.last_name || null,
      nickname: att.nickname || null,
      moderation_type: modFormType.value,
      notes: modFormNotes.value.trim() || null,
      target_user_uuid: att.user_uuid || null,
      target_ticket_uuid: att.ticket_uuid || null,
    })
    modFormNotes.value = ''
    // Refresh entries
    await fetchModerationEntries(att)
    // Refresh attendee list
    await loadAttendees(pagination.value.page)
  } catch (e) {
    alert(e.message || 'Failed to submit moderation')
  } finally {
    modFormSubmitting.value = false
  }
}

async function removeModEntry(entry) {
  if (!confirm(`Remove this ${entry.moderation_type === 'BAN' ? 'ban' : 'watchlist'} entry?`)) return
  try {
    await ticketApi.removeModeration(eventId.value, entry.moderation_uuid)
    // Refresh entries
    if (moderationTarget.value) {
      await fetchModerationEntries(moderationTarget.value)
    }
    // Refresh attendee list to update flag_status indicator
    await loadAttendees(pagination.value.page)
  } catch (e) {
    alert(e.message || 'Failed to remove entry')
  }
}

async function openDetail(att) {
  attendeeProfile.value = null
  try {
    const res = await ticketApi.getAttendee(eventId.value, att.ticket_uuid)
    selectedAttendee.value = res.attendee || res.ticket || res
  } catch {
    selectedAttendee.value = att
  }
  // Fetch user identification from auth backend
  if (att.user_uuid) {
    try {
      const userRes = await authApi.getUserProfile(att.user_uuid)
      attendeeProfile.value = userRes.user || userRes
    } catch { /* user data not available */ }
  }
}

async function forceCheckin(att) {
  actionLoading.value = true
  try {
    await ticketApi.redeemTicket(eventId.value, { ticket_uuid: att.ticket_uuid })
    att.is_redeemed = 1
    att.redeemed_at = new Date().toISOString()
    await loadAttendees(pagination.value.page)
    selectedAttendee.value = null
  } catch (e) {
    alert(e.message || 'Failed to check in')
  } finally {
    actionLoading.value = false
  }
}

async function undoCheckin(att) {
  actionLoading.value = true
  try {
    await ticketApi.unredeemTicket(eventId.value, { ticket_uuid: att.ticket_uuid })
    att.is_redeemed = 0
    att.redeemed_at = null
    att.food_received = 0
    att.food_received_at = null
    await loadAttendees(pagination.value.page)
    selectedAttendee.value = null
  } catch (e) {
    alert(e.message || 'Failed to undo check-in')
  } finally {
    actionLoading.value = false
  }
}

async function handleManualPay(att) {
  if (!att) return
  if (!confirm('Mark this pending ticket as paid? This will override the payment requirement.')) return
  actionLoading.value = true
  try {
    await ticketApi.manualPayTicket(eventId.value, att.ticket_uuid)
    await loadAttendees(pagination.value.page)
    selectedAttendee.value = null
  } catch (e) {
    alert(e.message || 'Failed to mark as paid')
  } finally {
    actionLoading.value = false
  }
}

async function handleRevoke(att) {
  if (!att) return
  actionLoading.value = true
  try {
    await ticketApi.revokeTicket(eventId.value, att.ticket_uuid, revokeReason.value.trim())
    showRevokeModal.value = false
    revokeReason.value = ''
    await loadAttendees(pagination.value.page)
    selectedAttendee.value = null
  } catch (e) {
    alert(e.message || 'Failed to revoke ticket')
  } finally {
    actionLoading.value = false
  }
}

async function handleUnrevoke(att) {
  if (!att) return
  if (!confirm('Restore this revoked ticket back to paid status?')) return
  actionLoading.value = true
  try {
    await ticketApi.unrevokeTicket(eventId.value, att.ticket_uuid)
    await loadAttendees(pagination.value.page)
    selectedAttendee.value = null
  } catch (e) {
    alert(e.message || 'Failed to restore ticket')
  } finally {
    actionLoading.value = false
  }
}

async function markFoodReceived(att, received) {
  actionLoading.value = true
  try {
    await ticketApi.markFoodReceived(eventId.value, { ticket_uuid: att.ticket_uuid, received })
    att.food_received = received ? 1 : 0
    att.food_received_at = received ? new Date().toISOString() : null
    // Re-fetch detail to get updated data
    try {
      const res = await ticketApi.getAttendee(eventId.value, att.ticket_uuid)
      selectedAttendee.value = res.attendee || res.ticket || res
    } catch { /* keep existing */ }
  } catch (e) {
    alert(e.message || 'Failed to update food status')
  } finally {
    actionLoading.value = false
  }
}

async function exportToExcel() {
  actionLoading.value = true
  try {
    const params = { page: 1, limit: 10000 }
    if (searchQuery.value) params.search = searchQuery.value
    if (statusFilter.value) params.status = statusFilter.value
    if (tierFilter.value) params.tier = tierFilter.value
    if (redeemedOnly.value) params.redeemed = '1'

    const res = await ticketApi.getAttendees(eventId.value, params)
    const exportData = res.attendees || []

    let csvContent = '\uFEFF' // BOM for Excel UTF-8
    csvContent += 'Ticket Number,Nickname,First Name,Last Name,Food Selection,Choices/Variants\n'

    exportData.forEach(att => {
      const ticketNum = att.ticket_number || att.ticket_uuid?.slice(0, 8) || ''
      const nickname = att.nickname || ''
      const firstName = att.first_name || ''
      const lastName = att.last_name || ''

      const foodSelection = parseFoodSelection(att.food_selection)
      const foodNames = foodSelection.map(f => typeof f === 'string' ? f : f.name).join('; ')
      const foodChoices = foodSelection.map(f => f.choice || '').filter(Boolean).join('; ')

      const row = [
        `"${ticketNum}"`,
        `"${nickname.replace(/"/g, '""')}"`,
        `"${firstName.replace(/"/g, '""')}"`,
        `"${lastName.replace(/"/g, '""')}"`,
        `"${foodNames.replace(/"/g, '""')}"`,
        `"${foodChoices.replace(/"/g, '""')}"`
      ]
      csvContent += row.join(',') + '\n'
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Attendees_Export_${eventId.value}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    alert(e.message || 'Failed to export attendees')
  } finally {
    actionLoading.value = false
  }
}

async function loadAttendees(page = 1) {
  isLoading.value = true
  try {
    const params = { page, limit: pagination.value.limit }
    if (searchQuery.value) params.search = searchQuery.value
    if (statusFilter.value) params.status = statusFilter.value
    if (tierFilter.value) params.tier = tierFilter.value
    if (redeemedOnly.value) params.redeemed = '1'

    const res = await ticketApi.getAttendees(eventId.value, params)
    attendees.value = res.attendees || []
    if (res.pagination) {
      pagination.value = { ...pagination.value, ...res.pagination }
    }
    // Load avatars in background (non-blocking)
    loadAvatars()
  } catch (e) {
    console.error('Failed to load attendees:', e)
  } finally {
    isLoading.value = false
  }
}

async function loadTierOptions() {
  try {
    const res = await ticketApi.getTiers(eventId.value)
    tierOptions.value = res.tiers || res || []
  } catch { /* ignore */ }
}

onMounted(async () => {
  await Promise.all([loadAttendees(), loadTierOptions()])
})
</script>
