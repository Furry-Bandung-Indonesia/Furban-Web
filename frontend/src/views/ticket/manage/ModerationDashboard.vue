<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <header class="shrink-0 bg-[#101622] z-10 px-6 pt-6 pb-3">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Moderation</h2>
          <p class="text-slate-400 text-sm mt-1">Keyword detection, suspect review, confirmed enforcement &amp; attempt logs.</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="runFullScan()" :disabled="isScanning"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            :class="isScanning ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-[#1a202c] text-[#0df2f2] border border-[#0df2f2]/30 hover:bg-[#0df2f2]/10'">
            <svg v-if="isScanning" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            {{ isScanning ? 'Scanning...' : 'Scan All Attendees' }}
          </button>
          <button @click="openAddModal()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0df2f2] text-[#0a0e17] text-sm font-semibold hover:bg-[#00dada] transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Add Keyword
          </button>
        </div>
      </div>

      <!-- 4 Tabs -->
      <div class="flex gap-1 bg-[#1a202c] p-1 rounded-xl border border-slate-800 w-fit">
        <button @click="switchTab('keywords')"
          :class="activeTab === 'keywords' ? 'bg-[#0df2f2] text-[#0a0e17] font-bold' : 'text-slate-400 hover:text-white'"
          class="px-4 py-2 rounded-lg text-sm transition-colors">
          Keyword List
        </button>
        <button @click="switchTab('suspects')"
          :class="activeTab === 'suspects' ? 'bg-[#0df2f2] text-[#0a0e17] font-bold' : 'text-slate-400 hover:text-white'"
          class="relative px-4 py-2 rounded-lg text-sm transition-colors">
          Account Suspects
          <span v-if="suspectCount > 0"
            class="absolute -top-1 -right-1 size-5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {{ suspectCount > 9 ? '9+' : suspectCount }}
          </span>
        </button>
        <button @click="switchTab('confirmed')"
          :class="activeTab === 'confirmed' ? 'bg-[#0df2f2] text-[#0a0e17] font-bold' : 'text-slate-400 hover:text-white'"
          class="relative px-4 py-2 rounded-lg text-sm transition-colors">
          Confirmed
          <span v-if="confirmedCount > 0"
            class="absolute -top-1 -right-1 size-5 flex items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
            {{ confirmedCount > 9 ? '9+' : confirmedCount }}
          </span>
        </button>
        <button @click="switchTab('logs')"
          :class="activeTab === 'logs' ? 'bg-[#0df2f2] text-[#0a0e17] font-bold' : 'text-slate-400 hover:text-white'"
          class="px-4 py-2 rounded-lg text-sm transition-colors">
          Attempt Logs
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto">

      <!-- ═══════════════════════════════════════════ -->
      <!-- TAB 1 — KEYWORD LIST                       -->
      <!-- ═══════════════════════════════════════════ -->
      <template v-if="activeTab === 'keywords'">
        <div class="p-6 pt-4">
          <!-- Info: Keywords are detection rules, NOT enforcement -->
          <div class="mb-4 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p class="text-sm text-blue-300 font-medium">Keywords are detection rules — global across all events</p>
              <p class="text-xs text-slate-400 mt-0.5">Adding a keyword scans <strong class="text-slate-300">all attendees across all events</strong>. Matches create suspect records in <strong class="text-slate-300">Account Suspects</strong> for admin confirmation. Use <strong class="text-slate-300">Scan All Attendees</strong> to re-scan after changes.</p>
            </div>
          </div>
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <!-- Left: Table -->
            <div class="xl:col-span-8 space-y-4">
              <!-- Controls -->
              <div class="flex flex-col md:flex-row gap-3">
                <div class="flex-1 relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-slate-400 group-focus-within:text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input v-model="searchQuery" @input="debouncedLoad"
                    class="block w-full rounded-lg border-0 py-2.5 pl-10 text-white bg-slate-900 ring-1 ring-inset ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0df2f2] sm:text-sm"
                    placeholder="Search by name, nickname, email, phone..." />
                </div>
                <select v-model="typeFilter" @change="loadKeywords(1)" class="rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]">
                  <option value="">All Types</option>
                  <option value="BAN">Banned</option>
                  <option value="WATCH">Watchlist</option>
                </select>
                <select v-model="statusFilter" @change="loadKeywords(1)" class="rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]">
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="APPEALED">Appealed</option>
                </select>
                <select v-model="enabledFilter" @change="loadKeywords(1)" class="rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]">
                  <option value="">All</option>
                  <option value="1">Enabled</option>
                  <option value="0">Disabled</option>
                </select>
              </div>

              <!-- Table -->
              <div class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden">
                <div v-if="isLoading" class="flex items-center justify-center py-16">
                  <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0df2f2]"></div>
                </div>
                <table v-else class="w-full">
                  <thead>
                    <tr class="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                      <th class="px-5 py-3 text-left font-semibold">Person</th>
                      <th class="px-5 py-3 text-left font-semibold">Keywords</th>
                      <th class="px-5 py-3 text-left font-semibold">Type</th>
                      <th class="px-5 py-3 text-left font-semibold">Status</th>
                      <th class="px-5 py-3 text-center font-semibold">Enabled</th>
                      <th class="px-5 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/50">
                    <tr v-for="mod in keywordList" :key="mod.moderation_uuid"
                      class="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      :class="{ 'opacity-40': mod.status === 'APPEALED' || !mod.is_enabled }"
                      @click="selectEntry(mod)">
                      <td class="px-5 py-3.5">
                        <div class="flex items-center gap-3">
                          <div class="size-9 rounded-full flex items-center justify-center text-xs font-bold"
                            :class="mod.status === 'APPEALED' ? 'bg-slate-700/30 text-slate-500' : mod.moderation_type === 'BAN' ? 'bg-red-600/20 text-red-400' : 'bg-amber-500/20 text-amber-400'">
                            {{ (mod.legal_name || 'U')[0].toUpperCase() }}
                          </div>
                          <div>
                            <p class="text-sm font-medium text-white">{{ mod.legal_name }}</p>
                            <p v-if="mod.nickname" class="text-xs text-slate-400 font-mono">@{{ mod.nickname }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-5 py-3.5">
                        <div class="flex flex-wrap gap-1">
                          <span v-if="mod.email" class="inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">email</span>
                          <span v-if="mod.phone_number" class="inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">phone</span>
                          <span v-if="mod.first_name || mod.last_name" class="inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">name</span>
                          <span v-if="!mod.email && !mod.phone_number && !mod.first_name && !mod.last_name" class="text-[10px] text-slate-500">legal only</span>
                        </div>
                      </td>
                      <td class="px-5 py-3.5">
                        <span :class="mod.moderation_type === 'BAN' ? 'bg-red-500/10 text-red-400 ring-red-500/20' : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'"
                          class="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset uppercase tracking-wider">
                          {{ mod.moderation_type }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5">
                        <span :class="mod.status === 'ACTIVE' ? 'text-green-400' : 'text-slate-500'" class="text-xs font-medium">{{ mod.status }}</span>
                      </td>
                      <td class="px-5 py-3.5 text-center">
                        <button @click.stop="toggleEnabled(mod)" :title="mod.is_enabled ? 'Click to disable' : 'Click to enable'"
                          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                          :class="mod.is_enabled ? 'bg-[#0df2f2]/30' : 'bg-slate-700'">
                          <span class="inline-block h-3.5 w-3.5 rounded-full transition-transform"
                            :class="mod.is_enabled ? 'translate-x-4 bg-[#0df2f2]' : 'translate-x-1 bg-slate-400'"></span>
                        </button>
                      </td>
                      <td class="px-5 py-3.5 text-right">
                        <button @click.stop="selectEntry(mod)" class="p-1.5 rounded-lg text-slate-400 hover:text-[#0df2f2] hover:bg-slate-800 transition-colors">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      </td>
                    </tr>
                    <tr v-if="keywordList.length === 0">
                      <td colspan="6" class="px-6 py-12 text-center text-sm text-slate-400">No keyword entries found.</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Pagination -->
                <div v-if="kwPagination.total_pages > 1" class="border-t border-slate-800 px-6 py-3 flex items-center justify-between">
                  <p class="text-sm text-slate-400">Page {{ kwPagination.page }} of {{ kwPagination.total_pages }} ({{ kwPagination.total }} entries)</p>
                  <div class="flex items-center gap-1">
                    <button @click="loadKeywords(kwPagination.page - 1)" :disabled="kwPagination.page <= 1" class="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30">Prev</button>
                    <button @click="loadKeywords(kwPagination.page + 1)" :disabled="kwPagination.page >= kwPagination.total_pages" class="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30">Next</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Detail Panel -->
            <div class="xl:col-span-4">
              <div class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden sticky top-4">
                <template v-if="!selectedEntry">
                  <div class="p-8 text-center">
                    <div class="size-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <svg class="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <h3 class="text-white font-bold mb-1">Select an Entry</h3>
                    <p class="text-sm text-slate-400">Click on a row to view keyword details.</p>
                  </div>
                </template>
                <template v-else>
                  <!-- Banner -->
                  <div :class="selectedEntry.status === 'APPEALED' ? 'bg-gradient-to-br from-slate-600/80 to-slate-800/80' : selectedEntry.moderation_type === 'BAN' ? 'bg-gradient-to-br from-red-600/80 to-red-900/80' : 'bg-gradient-to-br from-amber-600/80 to-amber-900/80'" class="px-6 py-5 text-center relative">
                    <div v-if="selectedEntry.status === 'APPEALED'" class="absolute top-2 right-2 bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-green-500/30">APPEALED</div>
                    <div v-if="!selectedEntry.is_enabled" class="absolute top-2 left-2 bg-slate-500/20 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-slate-500/30">DISABLED</div>
                    <div class="size-16 rounded-full mx-auto flex items-center justify-center text-2xl font-bold bg-white/20 text-white mb-3">
                      {{ (selectedEntry.legal_name || 'U')[0].toUpperCase() }}
                    </div>
                    <h3 class="text-white font-bold text-lg">{{ selectedEntry.legal_name }}</h3>
                    <div class="flex items-center justify-center gap-2 mt-2">
                      <span :class="selectedEntry.moderation_type === 'BAN' ? 'bg-red-600/50 ring-red-500/50' : 'bg-amber-500/50 ring-amber-400/50'"
                        class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white ring-1 ring-inset uppercase tracking-wider">
                        {{ selectedEntry.moderation_type }}
                      </span>
                    </div>
                  </div>

                  <div class="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    <!-- Keyword Fields -->
                    <div class="space-y-2">
                      <h4 class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Detection Keywords</h4>
                      <div class="grid grid-cols-2 gap-2">
                        <div class="bg-slate-900 rounded-lg p-2.5">
                          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Legal Name</p>
                          <p class="text-sm text-white mt-0.5">{{ selectedEntry.legal_name }}</p>
                        </div>
                        <div class="bg-slate-900 rounded-lg p-2.5">
                          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Nickname</p>
                          <p class="text-sm text-white mt-0.5">{{ selectedEntry.nickname || '—' }}</p>
                        </div>
                        <div class="bg-slate-900 rounded-lg p-2.5">
                          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">First Name</p>
                          <p class="text-sm text-white mt-0.5">{{ selectedEntry.first_name || '—' }}</p>
                        </div>
                        <div class="bg-slate-900 rounded-lg p-2.5">
                          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Last Name</p>
                          <p class="text-sm text-white mt-0.5">{{ selectedEntry.last_name || '—' }}</p>
                        </div>
                        <div class="bg-slate-900 rounded-lg p-2.5">
                          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Email</p>
                          <p class="text-sm text-white mt-0.5 break-all">{{ selectedEntry.email || '—' }}</p>
                        </div>
                        <div class="bg-slate-900 rounded-lg p-2.5">
                          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Phone</p>
                          <p class="text-sm text-white mt-0.5">{{ selectedEntry.phone_number || '—' }}</p>
                        </div>
                      </div>
                    </div>

                    <!-- Meta -->
                    <div class="space-y-2">
                      <div class="bg-slate-900 rounded-lg p-2.5">
                        <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Reason / Notes</p>
                        <p class="text-sm text-slate-300 mt-0.5 italic">{{ selectedEntry.notes || 'No notes provided.' }}</p>
                      </div>
                      <div class="flex gap-2">
                        <div class="flex-1 bg-slate-900 rounded-lg p-2.5">
                          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Added By</p>
                          <p class="text-sm text-white mt-0.5">{{ selectedEntry.added_by || 'system' }}</p>
                        </div>
                        <div class="flex-1 bg-slate-900 rounded-lg p-2.5">
                          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Date Added</p>
                          <p class="text-sm text-white mt-0.5">{{ formatDate(selectedEntry.created_at) }}</p>
                        </div>
                      </div>
                    </div>

                    <!-- Appeal History -->
                    <div v-if="selectedEntryDetail?.appeals?.length" class="space-y-2">
                      <h4 class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Appeal History</h4>
                      <div v-for="appeal in selectedEntryDetail.appeals" :key="appeal.appeal_uuid" class="bg-green-900/20 border border-green-800/30 rounded-lg p-2.5">
                        <div class="flex items-center gap-2 mb-1">
                          <svg class="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span class="text-xs text-green-400 font-medium">{{ appeal.previous_status || appeal.previous_type }} → {{ appeal.new_status || 'APPEALED' }}</span>
                        </div>
                        <p class="text-sm text-slate-300">{{ appeal.appeal_reason }}</p>
                        <p class="text-[10px] text-slate-500 mt-1">By {{ appeal.appealed_by || 'unknown' }} on {{ formatDate(appeal.created_at) }}</p>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="space-y-2 pt-2">
                      <div class="flex gap-3">
                        <button @click="openEditModal(selectedEntry)" class="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-white text-sm font-medium hover:bg-slate-800">Edit</button>
                        <button v-if="selectedEntry.status === 'ACTIVE'" @click="openAppealModal(selectedEntry)" class="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">Appeal</button>
                        <button v-else @click="handleReinstate(selectedEntry)" class="flex-1 px-4 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700">Reinstate</button>
                      </div>
                      <button @click="handleRemove(selectedEntry)" class="w-full px-4 py-2 rounded-lg border border-red-800/50 text-red-400 text-xs hover:bg-red-900/20">Delete Permanently</button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ═══════════════════════════════════════════ -->
      <!-- TAB 2 — ACCOUNT SUSPECTS                   -->
      <!-- ═══════════════════════════════════════════ -->
      <template v-if="activeTab === 'suspects'">
        <div class="p-6 pt-4 space-y-4">
          <!-- Info Banner -->
          <div class="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <svg class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <div>
              <p class="text-sm text-amber-300 font-medium">Suspects require admin confirmation</p>
              <p class="text-xs text-slate-400 mt-0.5">Matches are detected automatically but never auto-banned. Review each suspect and confirm or dismiss as false recognition.</p>
            </div>
          </div>

          <!-- Filters -->
          <div class="flex gap-3">
            <select v-model="suspectTypeFilter" @change="loadSuspects(1)" class="rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]">
              <option value="">All Types</option>
              <option value="BAN_BLOCKED">Blocked (BAN)</option>
              <option value="WATCH_DETECTED">Detected (WATCH)</option>
            </select>
            <select v-model="suspectDetectionFilter" @change="loadSuspects(1)" class="rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]">
              <option value="">All Detection</option>
              <option value="EXACT">Exact Match</option>
              <option value="SIMILAR">Similar Match</option>
            </select>
          </div>

          <!-- Suspects Table -->
          <div class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden">
            <div v-if="isLoadingSuspects" class="flex items-center justify-center py-16">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0df2f2]"></div>
            </div>
            <table v-else class="w-full">
              <thead>
                <tr class="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th class="px-5 py-3 text-left font-semibold">Detected Account</th>
                  <th class="px-5 py-3 text-left font-semibold">Matched Keyword</th>
                  <th class="px-5 py-3 text-left font-semibold">Detection</th>
                  <th class="px-5 py-3 text-left font-semibold">Similarity</th>
                  <th class="px-5 py-3 text-left font-semibold">Action Type</th>
                  <th class="px-5 py-3 text-left font-semibold">Time</th>
                  <th class="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50">
                <tr v-for="s in suspects" :key="s.attempt_uuid" class="hover:bg-white/[0.02] bg-amber-500/[0.03]">
                  <td class="px-5 py-3.5">
                    <p class="text-sm text-white font-medium">{{ s.raw_legal_name || s.masked_name || '—' }}</p>
                    <p v-if="s.raw_nickname" class="text-xs text-slate-400 font-mono">@{{ s.raw_nickname }}</p>
                    <p v-if="s.raw_email" class="text-[10px] text-slate-500 mt-0.5">{{ s.raw_email }}</p>
                  </td>
                  <td class="px-5 py-3.5">
                    <p class="text-sm text-slate-300">{{ s.keyword_legal_name || '—' }}</p>
                    <div v-if="s.matched_fields" class="flex flex-wrap gap-1 mt-1">
                      <span v-for="f in parseMatchedFields(s.matched_fields)" :key="f" class="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{{ f }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-3.5">
                    <span :class="s.detection_type === 'EXACT' ? 'bg-red-500/10 text-red-400 ring-red-500/20' : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'"
                      class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold ring-1 ring-inset uppercase tracking-wider">
                      {{ s.detection_type || 'EXACT' }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5">
                    <div v-if="s.similarity_score != null" class="flex items-center gap-2">
                      <div class="w-16 bg-slate-800 rounded-full h-1.5">
                        <div class="h-1.5 rounded-full transition-all"
                          :class="s.similarity_score >= 95 ? 'bg-red-400' : s.similarity_score >= 80 ? 'bg-amber-400' : 'bg-blue-400'"
                          :style="{ width: s.similarity_score + '%' }"></div>
                      </div>
                      <span class="text-xs text-slate-300 font-mono">{{ s.similarity_score }}%</span>
                    </div>
                    <span v-else class="text-xs text-slate-500">—</span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span :class="s.attempt_type === 'BAN_BLOCKED' ? 'text-red-400' : 'text-amber-400'" class="text-xs font-medium">
                      {{ s.attempt_type === 'BAN_BLOCKED' ? 'BLOCKED' : 'WATCHED' }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-sm text-slate-400">{{ formatDateTime(s.attempt_time) }}</td>
                  <td class="px-5 py-3.5 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button @click="openSuspectDetailModal(s)" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 ring-1 ring-slate-600" title="View details">
                        View
                      </button>
                      <button @click="openConfirmSuspectModal(s)" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 ring-1 ring-red-500/20" title="Confirm — same person">
                        Confirm
                      </button>
                      <button @click="openDismissSuspectModal(s)" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 ring-1 ring-green-500/20" title="False Recognition — dismiss">
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="suspects.length === 0">
                  <td colspan="7" class="px-6 py-12 text-center">
                    <svg class="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p class="text-sm text-slate-400">No pending suspects. All clear!</p>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="suspectPagination.total_pages > 1" class="border-t border-slate-800 px-6 py-3 flex items-center justify-between">
              <p class="text-sm text-slate-400">Page {{ suspectPagination.page }} of {{ suspectPagination.total_pages }} ({{ suspectPagination.total }} suspects)</p>
              <div class="flex items-center gap-1">
                <button @click="loadSuspects(suspectPagination.page - 1)" :disabled="suspectPagination.page <= 1" class="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30">Prev</button>
                <button @click="loadSuspects(suspectPagination.page + 1)" :disabled="suspectPagination.page >= suspectPagination.total_pages" class="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30">Next</button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ═══════════════════════════════════════════ -->
      <!-- TAB 3 — CONFIRMED ACCOUNTS                -->
      <!-- ═══════════════════════════════════════════ -->
      <template v-if="activeTab === 'confirmed'">
        <div class="p-6 pt-4 space-y-4">
          <!-- Info Banner -->
          <div class="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 flex items-start gap-3">
            <svg class="w-5 h-5 text-purple-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <div>
              <p class="text-sm text-purple-300 font-medium">Confirmed enforced accounts</p>
              <p class="text-xs text-slate-400 mt-0.5">These accounts have been confirmed by an admin as BAN or WATCH. They are actively enforced across all events — banned users cannot purchase tickets, watched users are flagged during scanning.</p>
            </div>
          </div>

          <!-- Filters -->
          <div class="flex gap-3">
            <select v-model="confirmedTypeFilter" @change="loadConfirmed(1)" class="rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]">
              <option value="">All Types</option>
              <option value="BAN_BLOCKED">Banned</option>
              <option value="WATCH_DETECTED">Watched</option>
            </select>
            <select v-model="confirmedStatusFilter" @change="loadConfirmed(1)" class="rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <!-- Confirmed Table -->
          <div class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden">
            <div v-if="isLoadingConfirmed" class="flex items-center justify-center py-16">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0df2f2]"></div>
            </div>
            <table v-else class="w-full">
              <thead>
                <tr class="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th class="px-5 py-3 text-left font-semibold">Account</th>
                  <th class="px-5 py-3 text-left font-semibold">Matched Keyword</th>
                  <th class="px-5 py-3 text-left font-semibold">Type</th>
                  <th class="px-5 py-3 text-left font-semibold">Status</th>
                  <th class="px-5 py-3 text-left font-semibold">Detection</th>
                  <th class="px-5 py-3 text-left font-semibold">Confirmed By</th>
                  <th class="px-5 py-3 text-left font-semibold">Confirmed At</th>
                  <th class="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50">
                <tr v-for="c in confirmedList" :key="c.attempt_uuid" class="hover:bg-white/[0.02]"
                  :class="c.resolution === 'SUSPENDED' ? 'bg-slate-500/[0.04] opacity-70' : (c.attempt_type === 'BAN_BLOCKED' ? 'bg-red-500/[0.03]' : 'bg-amber-500/[0.03]')">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="size-8 rounded-full flex items-center justify-center text-xs font-bold"
                        :class="c.attempt_type === 'BAN_BLOCKED' ? 'bg-red-600/20 text-red-400' : 'bg-amber-500/20 text-amber-400'">
                        {{ (c.raw_legal_name || 'U')[0].toUpperCase() }}
                      </div>
                      <div>
                        <p class="text-sm text-white font-medium">{{ c.raw_legal_name || c.masked_name || '—' }}</p>
                        <p v-if="c.raw_nickname" class="text-xs text-slate-400 font-mono">@{{ c.raw_nickname }}</p>
                        <p v-if="c.raw_email" class="text-[10px] text-slate-500 mt-0.5">{{ c.raw_email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-3.5">
                    <p class="text-sm text-slate-300">{{ c.keyword_legal_name || '—' }}</p>
                    <div v-if="c.matched_fields" class="flex flex-wrap gap-1 mt-1">
                      <span v-for="f in parseMatchedFields(c.matched_fields)" :key="f" class="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{{ f }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-3.5">
                    <span :class="c.attempt_type === 'BAN_BLOCKED' ? 'bg-red-500/10 text-red-400 ring-red-500/20' : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'"
                      class="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset uppercase tracking-wider">
                      {{ c.attempt_type === 'BAN_BLOCKED' ? 'BAN' : 'WATCH' }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span v-if="c.resolution === 'CONFIRMED'" class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20">
                      <span class="size-1.5 rounded-full bg-green-400 animate-pulse"></span>
                      ACTIVE
                    </span>
                    <span v-else class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20">
                      <span class="size-1.5 rounded-full bg-slate-500"></span>
                      SUSPENDED
                    </span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span :class="c.detection_type === 'EXACT' ? 'text-red-400' : 'text-amber-400'" class="text-xs font-medium">
                      {{ c.detection_type || 'EXACT' }}
                    </span>
                    <span v-if="c.similarity_score != null" class="text-[10px] text-slate-500 ml-1">{{ c.similarity_score }}%</span>
                  </td>
                  <td class="px-5 py-3.5 text-xs text-slate-400">{{ c.resolved_by || '—' }}</td>
                  <td class="px-5 py-3.5 text-sm text-slate-400">{{ formatDateTime(c.resolved_at) }}</td>
                  <td class="px-5 py-3.5 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button @click="openConfirmedDetailModal(c)" class="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 ring-1 ring-slate-600" title="View details">
                        View
                      </button>
                      <button @click="handleToggleConfirmed(c)" class="px-2.5 py-1.5 rounded-lg text-xs font-medium ring-1 ring-inset"
                        :class="c.resolution === 'CONFIRMED' ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20 hover:bg-amber-500/20' : 'bg-green-500/10 text-green-400 ring-green-500/20 hover:bg-green-500/20'"
                        :title="c.resolution === 'CONFIRMED' ? 'Suspend enforcement' : 'Activate enforcement'">
                        {{ c.resolution === 'CONFIRMED' ? 'Suspend' : 'Activate' }}
                      </button>
                      <button @click="openConfirmedDetailModal(c, 'revoke')" class="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 ring-1 ring-purple-500/20" title="Revoke back to pending">
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="confirmedList.length === 0">
                  <td colspan="8" class="px-6 py-12 text-center">
                    <svg class="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <p class="text-sm text-slate-400">No confirmed accounts yet.</p>
                    <p class="text-xs text-slate-500 mt-1">Confirm suspects from the Account Suspects tab to see them here.</p>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="confirmedPagination.total_pages > 1" class="border-t border-slate-800 px-6 py-3 flex items-center justify-between">
              <p class="text-sm text-slate-400">Page {{ confirmedPagination.page }} of {{ confirmedPagination.total_pages }} ({{ confirmedPagination.total }} confirmed)</p>
              <div class="flex items-center gap-1">
                <button @click="loadConfirmed(confirmedPagination.page - 1)" :disabled="confirmedPagination.page <= 1" class="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30">Prev</button>
                <button @click="loadConfirmed(confirmedPagination.page + 1)" :disabled="confirmedPagination.page >= confirmedPagination.total_pages" class="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30">Next</button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ═══════════════════════════════════════════ -->
      <!-- TAB 4 — ATTEMPT LOGS (Enforcement Actions) -->
      <!-- ═══════════════════════════════════════════ -->
      <template v-if="activeTab === 'logs'">
        <div class="p-6 pt-4 space-y-4">
          <!-- Info Banner -->
          <div class="bg-slate-500/5 border border-slate-600/20 rounded-xl p-4 flex items-start gap-3">
            <svg class="w-5 h-5 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p class="text-sm text-slate-300 font-medium">Enforcement attempt log</p>
              <p class="text-xs text-slate-400 mt-0.5">Records of confirmed BAN/WATCH accounts attempting to purchase tickets or being flagged during scanning.</p>
            </div>
          </div>

          <!-- Filters -->
          <div class="flex gap-3">
            <select v-model="logActionFilter" @change="loadAttempts(1)" class="rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]">
              <option value="">All Actions</option>
              <option value="PURCHASE_BLOCKED">Purchase Blocked</option>
              <option value="SCAN_FLAGGED">Scan Flagged</option>
            </select>
          </div>

          <div class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden">
            <div v-if="isLoadingLogs" class="flex items-center justify-center py-16">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0df2f2]"></div>
            </div>
            <table v-else class="w-full">
              <thead>
                <tr class="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th class="px-5 py-3 text-left font-semibold">Time</th>
                  <th class="px-5 py-3 text-left font-semibold">Account</th>
                  <th class="px-5 py-3 text-left font-semibold">Action</th>
                  <th class="px-5 py-3 text-left font-semibold">Moderation Type</th>
                  <th class="px-5 py-3 text-left font-semibold">Details</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50">
                <tr v-for="log in attemptLogs" :key="log.log_uuid" class="hover:bg-white/[0.02]"
                  :class="log.action_type === 'PURCHASE_BLOCKED' ? 'bg-red-500/[0.03]' : 'bg-amber-500/[0.03]'">
                  <td class="px-5 py-3 text-sm text-slate-400">{{ formatDateTime(log.created_at) }}</td>
                  <td class="px-5 py-3">
                    <p class="text-sm text-white font-medium">{{ log.user_name || '—' }}</p>
                    <p v-if="log.user_email" class="text-[10px] text-slate-500 mt-0.5">{{ log.user_email }}</p>
                  </td>
                  <td class="px-5 py-3">
                    <span :class="log.action_type === 'PURCHASE_BLOCKED' ? 'bg-red-500/10 text-red-400 ring-red-500/20' : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'"
                      class="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset uppercase tracking-wider">
                      {{ log.action_type === 'PURCHASE_BLOCKED' ? 'PURCHASE BLOCKED' : 'SCAN FLAGGED' }}
                    </span>
                  </td>
                  <td class="px-5 py-3">
                    <span :class="log.moderation_type === 'BAN' ? 'text-red-400' : 'text-amber-400'" class="text-xs font-medium">
                      {{ log.moderation_type }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-xs text-slate-400 max-w-[300px]">
                    <template v-if="log.details">
                      <span v-for="(val, key) in parseDetails(log.details)" :key="key" class="inline-block mr-2 mb-1">
                        <span class="text-slate-500">{{ key }}:</span> {{ val }}
                      </span>
                    </template>
                    <span v-else>—</span>
                  </td>
                </tr>
                <tr v-if="attemptLogs.length === 0">
                  <td colspan="5" class="px-6 py-12 text-center">
                    <svg class="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p class="text-sm text-slate-400">No enforcement attempts logged yet.</p>
                    <p class="text-xs text-slate-500 mt-1">When a confirmed BAN/WATCH account tries to buy a ticket or gets scanned, it will appear here.</p>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="logPagination.total_pages > 1" class="border-t border-slate-800 px-6 py-3 flex items-center justify-between">
              <p class="text-sm text-slate-400">Page {{ logPagination.page }} of {{ logPagination.total_pages }}</p>
              <div class="flex items-center gap-1">
                <button @click="loadAttempts(logPagination.page - 1)" :disabled="logPagination.page <= 1" class="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30">Prev</button>
                <button @click="loadAttempts(logPagination.page + 1)" :disabled="logPagination.page >= logPagination.total_pages" class="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30">Next</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ═══ ADD / EDIT KEYWORD MODAL ═══ -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showModal = false">
      <div class="w-full max-w-lg bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-[#1e2430] z-10">
          <h3 class="text-lg font-bold text-white">{{ editingEntry ? 'Edit Keyword Entry' : 'Add Keyword Entry' }}</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form @submit.prevent="saveEntry" class="p-6 space-y-4">
          <p class="text-xs text-slate-400 -mt-2 mb-2">Fill in keyword fields. Email/phone triggers EXACT detection; names use similarity matching (Levenshtein ≥80%).</p>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-300 mb-1">Legal Name (Full Name) *</label>
              <input v-model="modalForm.legal_name" required class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">First Name</label>
              <input v-model="modalForm.first_name" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
              <input v-model="modalForm.last_name" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Nickname</label>
              <input v-model="modalForm.nickname" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Email <span class="text-[10px] text-slate-500">(exact match)</span></label>
              <input v-model="modalForm.email" type="email" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Phone Number <span class="text-[10px] text-slate-500">(exact match)</span></label>
              <input v-model="modalForm.phone_number" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Action Type *</label>
              <select v-model="modalForm.moderation_type" required class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm">
                <option value="BAN">BAN — Block from purchasing</option>
                <option value="WATCH">WATCH — Allow but track</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Reason / Admin Notes *</label>
            <textarea v-model="modalForm.notes" rows="3" required class="w-full px-4 py-3 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] resize-none text-sm" placeholder="Reason for ban/watchlist (mandatory)..."></textarea>
          </div>
          <div v-if="modalError" class="text-red-400 text-sm">{{ modalError }}</div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showModal = false" class="px-4 py-2 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Cancel</button>
            <button type="submit" :disabled="isSavingModal" class="px-6 py-2 rounded-lg bg-[#0df2f2] text-[#0a0e17] font-bold text-sm hover:bg-[#00dada] disabled:opacity-50">
              {{ isSavingModal ? 'Saving...' : (editingEntry ? 'Update' : 'Add Entry') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ═══ APPEAL MODAL ═══ -->
    <div v-if="showAppealModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showAppealModal = false">
      <div class="w-full max-w-md bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl">
        <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 class="text-lg font-bold text-white">File Appeal</h3>
          <button @click="showAppealModal = false" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="bg-slate-900 rounded-lg p-3">
            <p class="text-sm text-white">{{ appealTarget?.legal_name }}</p>
            <p class="text-xs text-slate-400">Currently: <span class="font-medium" :class="appealTarget?.moderation_type === 'BAN' ? 'text-red-400' : 'text-amber-400'">{{ appealTarget?.moderation_type }}</span></p>
          </div>
          <p class="text-xs text-slate-400">Filing an appeal sets this entry to APPEALED status. The person will no longer be blocked or tracked. History is preserved.</p>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Appeal Reason *</label>
            <textarea v-model="appealReason" rows="3" required class="w-full px-4 py-3 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] resize-none text-sm" placeholder="Why should this person be cleared?"></textarea>
          </div>
          <div v-if="appealError" class="text-red-400 text-sm">{{ appealError }}</div>
          <div class="flex justify-end gap-3">
            <button @click="showAppealModal = false" class="px-4 py-2 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Cancel</button>
            <button @click="submitAppeal" :disabled="isSavingAppeal" class="px-6 py-2 rounded-lg bg-green-600 text-white font-bold text-sm hover:bg-green-700 disabled:opacity-50">
              {{ isSavingAppeal ? 'Filing...' : 'File Appeal' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ CONFIRM SUSPECT MODAL ═══ -->
    <div v-if="showConfirmSuspectModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showConfirmSuspectModal = false">
      <div class="w-full max-w-md bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl">
        <div class="px-6 py-4 border-b border-slate-700">
          <h3 class="text-lg font-bold text-white">Confirm Suspect</h3>
          <p class="text-xs text-slate-400 mt-1">Confirm this is the same person as the keyword entry.</p>
        </div>
        <div class="p-6 space-y-4">
          <div class="bg-slate-900 rounded-lg p-3 space-y-2">
            <p class="text-sm text-white font-medium">{{ confirmTarget?.raw_legal_name || confirmTarget?.masked_name }}</p>
            <p v-if="confirmTarget?.raw_nickname" class="text-xs text-slate-400 font-mono">@{{ confirmTarget?.raw_nickname }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span :class="(confirmTarget?.detection_type || 'EXACT') === 'EXACT' ? 'text-red-400' : 'text-amber-400'" class="text-xs font-medium">{{ confirmTarget?.detection_type || 'EXACT' }}</span>
              <span v-if="confirmTarget?.similarity_score != null" class="text-xs text-slate-400">{{ confirmTarget.similarity_score }}% match</span>
            </div>
            <div v-if="confirmTarget?.matched_fields" class="flex flex-wrap gap-1 mt-2">
              <span v-for="f in parseMatchedFields(confirmTarget.matched_fields)" :key="f" class="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{{ f }}</span>
            </div>
          </div>
          <div class="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
            <p class="text-xs text-red-300">Confirming this suspect applies enforcement. <strong>BAN</strong> = blocks future ticket purchases. <strong>WATCH</strong> = shows indicator on attendee/scanner pages. This action is logged.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Notes (optional)</label>
            <textarea v-model="confirmNotes" rows="2" class="w-full px-4 py-3 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] resize-none text-sm" placeholder="Additional notes..."></textarea>
          </div>
          <div v-if="confirmError" class="text-red-400 text-sm">{{ confirmError }}</div>
          <div class="flex justify-end gap-3">
            <button @click="showConfirmSuspectModal = false" class="px-4 py-2 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Cancel</button>
            <button @click="submitConfirmSuspect" :disabled="isSavingConfirm" class="px-6 py-2 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50">
              {{ isSavingConfirm ? 'Confirming...' : 'Confirm Match' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ DISMISS SUSPECT MODAL ═══ -->
    <div v-if="showDismissSuspectModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showDismissSuspectModal = false">
      <div class="w-full max-w-md bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl">
        <div class="px-6 py-4 border-b border-slate-700">
          <h3 class="text-lg font-bold text-white">Dismiss as False Recognition</h3>
          <p class="text-xs text-slate-400 mt-1">This person is NOT the one in the keyword entry. A persistent exclusion will be recorded.</p>
        </div>
        <div class="p-6 space-y-4">
          <div class="bg-slate-900 rounded-lg p-3 space-y-2">
            <p class="text-sm text-white font-medium">{{ dismissTarget?.raw_legal_name || dismissTarget?.masked_name }}</p>
            <p v-if="dismissTarget?.raw_nickname" class="text-xs text-slate-400 font-mono">@{{ dismissTarget?.raw_nickname }}</p>
          </div>
          <div class="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
            <p class="text-xs text-green-300">This person will no longer be flagged by this keyword entry. The exclusion is permanent.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Notes (optional)</label>
            <textarea v-model="dismissNotes" rows="2" class="w-full px-4 py-3 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] resize-none text-sm" placeholder="Reason for dismissal..."></textarea>
          </div>
          <div v-if="dismissError" class="text-red-400 text-sm">{{ dismissError }}</div>
          <div class="flex justify-end gap-3">
            <button @click="showDismissSuspectModal = false" class="px-4 py-2 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Cancel</button>
            <button @click="submitDismissSuspect" :disabled="isSavingDismiss" class="px-6 py-2 rounded-lg bg-green-600 text-white font-bold text-sm hover:bg-green-700 disabled:opacity-50">
              {{ isSavingDismiss ? 'Dismissing...' : 'Dismiss — False Recognition' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ REINSTATE MODAL ═══ -->
    <div v-if="showReinstateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showReinstateModal = false">
      <div class="w-full max-w-md bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl">
        <div class="px-6 py-4 border-b border-slate-700">
          <h3 class="text-lg font-bold text-white">Reinstate Entry</h3>
        </div>
        <div class="p-6 space-y-4">
          <p class="text-sm text-slate-400">Re-activate moderation for <span class="text-white font-medium">{{ reinstateTarget?.legal_name }}</span>.</p>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Type *</label>
            <select v-model="reinstateType" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm">
              <option value="BAN">BAN</option>
              <option value="WATCH">WATCH</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Reason</label>
            <textarea v-model="reinstateNotes" rows="2" class="w-full px-4 py-3 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] resize-none text-sm" placeholder="Reason for reinstating..."></textarea>
          </div>
          <div class="flex justify-end gap-3">
            <button @click="showReinstateModal = false" class="px-4 py-2 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Cancel</button>
            <button @click="submitReinstate" :disabled="isSavingReinstate" class="px-6 py-2 rounded-lg bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 disabled:opacity-50">
              {{ isSavingReinstate ? 'Reinstating...' : 'Reinstate' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ SUSPECT DETAIL MODAL ═══ -->
    <div v-if="showSuspectDetailModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showSuspectDetailModal = false">
      <div class="w-full max-w-xl bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-[#1e2430] z-10">
          <div>
            <h3 class="text-lg font-bold text-white">Suspect Details</h3>
            <p class="text-xs text-slate-400 mt-0.5">Review and manage this suspect record</p>
          </div>
          <button @click="showSuspectDetailModal = false" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="p-6 space-y-5" v-if="suspectDetailTarget">
          <!-- Person Info -->
          <div class="bg-slate-900 rounded-xl p-4 space-y-3">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-full flex items-center justify-center text-sm font-bold"
                :class="suspectDetailTarget.attempt_type === 'BAN_BLOCKED' ? 'bg-red-600/20 text-red-400' : 'bg-amber-500/20 text-amber-400'">
                {{ (suspectDetailTarget.raw_legal_name || 'U')[0].toUpperCase() }}
              </div>
              <div>
                <p class="text-base text-white font-semibold">{{ suspectDetailTarget.raw_legal_name || suspectDetailTarget.masked_name || 'Unknown' }}</p>
                <p v-if="suspectDetailTarget.raw_nickname" class="text-xs text-slate-400 font-mono">@{{ suspectDetailTarget.raw_nickname }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3 mt-3">
              <div v-if="suspectDetailTarget.raw_email">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider">Email</p>
                <p class="text-sm text-slate-300">{{ suspectDetailTarget.raw_email }}</p>
              </div>
              <div v-if="suspectDetailTarget.raw_phone">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider">Phone</p>
                <p class="text-sm text-slate-300">{{ suspectDetailTarget.raw_phone }}</p>
              </div>
              <div v-if="suspectDetailTarget.user_uuid">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider">User UUID</p>
                <p class="text-xs text-slate-400 font-mono truncate">{{ suspectDetailTarget.user_uuid }}</p>
              </div>
              <div v-if="suspectDetailTarget.ticket_uuid">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider">Ticket UUID</p>
                <p class="text-xs text-slate-400 font-mono truncate">{{ suspectDetailTarget.ticket_uuid }}</p>
              </div>
            </div>
          </div>

          <!-- Detection Info -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-slate-900 rounded-lg p-3">
              <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Detection Type</p>
              <span :class="suspectDetailTarget.detection_type === 'EXACT' ? 'bg-red-500/10 text-red-400 ring-red-500/20' : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'"
                class="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset uppercase">
                {{ suspectDetailTarget.detection_type || 'EXACT' }}
              </span>
              <span v-if="suspectDetailTarget.similarity_score != null" class="ml-2 text-xs text-slate-400">{{ suspectDetailTarget.similarity_score }}%</span>
            </div>
            <div class="bg-slate-900 rounded-lg p-3">
              <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Action Type</p>
              <span :class="suspectDetailTarget.attempt_type === 'BAN_BLOCKED' ? 'bg-red-500/10 text-red-400 ring-red-500/20' : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'"
                class="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset uppercase">
                {{ suspectDetailTarget.attempt_type === 'BAN_BLOCKED' ? 'BAN' : 'WATCH' }}
              </span>
            </div>
          </div>

          <!-- Matched Keyword -->
          <div class="bg-slate-900 rounded-lg p-3">
            <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Matched Keyword</p>
            <p class="text-sm text-white">{{ suspectDetailTarget.keyword_legal_name || '—' }}</p>
            <div v-if="suspectDetailTarget.matched_fields" class="flex flex-wrap gap-1 mt-2">
              <span v-for="f in parseMatchedFields(suspectDetailTarget.matched_fields)" :key="f" class="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{{ f }}</span>
            </div>
            <p class="text-[10px] text-slate-500 mt-2">Detected: {{ formatDateTime(suspectDetailTarget.attempt_time) }}</p>
          </div>

          <!-- Change Type -->
          <div class="bg-slate-800/50 rounded-lg p-4 space-y-3">
            <p class="text-xs text-slate-400 font-medium uppercase tracking-wider">Change Action Type</p>
            <div class="flex items-center gap-3">
              <button @click="handleChangeSuspectType(suspectDetailTarget, 'BAN_BLOCKED')"
                :disabled="suspectDetailTarget.attempt_type === 'BAN_BLOCKED'"
                class="flex-1 px-3 py-2 rounded-lg text-xs font-bold ring-1 ring-inset transition-colors"
                :class="suspectDetailTarget.attempt_type === 'BAN_BLOCKED' ? 'bg-red-500/20 text-red-400 ring-red-500/30' : 'bg-slate-900 text-slate-300 ring-slate-700 hover:bg-red-500/10 hover:text-red-400'">
                BAN — Block Purchases
              </button>
              <button @click="handleChangeSuspectType(suspectDetailTarget, 'WATCH_DETECTED')"
                :disabled="suspectDetailTarget.attempt_type === 'WATCH_DETECTED'"
                class="flex-1 px-3 py-2 rounded-lg text-xs font-bold ring-1 ring-inset transition-colors"
                :class="suspectDetailTarget.attempt_type === 'WATCH_DETECTED' ? 'bg-amber-500/20 text-amber-400 ring-amber-500/30' : 'bg-slate-900 text-slate-300 ring-slate-700 hover:bg-amber-500/10 hover:text-amber-400'">
                WATCH — Track Only
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div v-if="suspectDetailError" class="text-red-400 text-sm">{{ suspectDetailError }}</div>
          <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-700">
            <button @click="handleDeleteSuspect(suspectDetailTarget)" class="px-4 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20">
              Delete Record
            </button>
            <div class="flex gap-2">
              <button @click="showSuspectDetailModal = false; openDismissSuspectModal(suspectDetailTarget)" class="px-4 py-2 rounded-lg text-sm font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 ring-1 ring-green-500/20">
                Dismiss
              </button>
              <button @click="showSuspectDetailModal = false; openConfirmSuspectModal(suspectDetailTarget)" class="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700">
                Confirm Match
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ CONFIRMED DETAIL MODAL ═══ -->
    <div v-if="showConfirmedDetailModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showConfirmedDetailModal = false">
      <div class="w-full max-w-xl bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-[#1e2430] z-10">
          <div>
            <h3 class="text-lg font-bold text-white">Confirmed Account Details</h3>
            <p class="text-xs text-slate-400 mt-0.5">View and manage enforcement for this account</p>
          </div>
          <button @click="showConfirmedDetailModal = false" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="p-6 space-y-5" v-if="confirmedDetailTarget">
          <!-- Person Info -->
          <div class="bg-slate-900 rounded-xl p-4 space-y-3">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-full flex items-center justify-center text-sm font-bold"
                :class="confirmedDetailTarget.attempt_type === 'BAN_BLOCKED' ? 'bg-red-600/20 text-red-400' : 'bg-amber-500/20 text-amber-400'">
                {{ (confirmedDetailTarget.raw_legal_name || 'U')[0].toUpperCase() }}
              </div>
              <div class="flex-1">
                <p class="text-base text-white font-semibold">{{ confirmedDetailTarget.raw_legal_name || confirmedDetailTarget.masked_name || 'Unknown' }}</p>
                <p v-if="confirmedDetailTarget.raw_nickname" class="text-xs text-slate-400 font-mono">@{{ confirmedDetailTarget.raw_nickname }}</p>
              </div>
              <span v-if="confirmedDetailTarget.resolution === 'CONFIRMED'" class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20">
                <span class="size-1.5 rounded-full bg-green-400 animate-pulse"></span>
                ACTIVE
              </span>
              <span v-else class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20">
                <span class="size-1.5 rounded-full bg-slate-500"></span>
                SUSPENDED
              </span>
            </div>
            <div class="grid grid-cols-2 gap-3 mt-3">
              <div v-if="confirmedDetailTarget.raw_email">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider">Email</p>
                <p class="text-sm text-slate-300">{{ confirmedDetailTarget.raw_email }}</p>
              </div>
              <div v-if="confirmedDetailTarget.raw_phone">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider">Phone</p>
                <p class="text-sm text-slate-300">{{ confirmedDetailTarget.raw_phone }}</p>
              </div>
              <div v-if="confirmedDetailTarget.user_uuid">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider">User UUID</p>
                <p class="text-xs text-slate-400 font-mono truncate">{{ confirmedDetailTarget.user_uuid }}</p>
              </div>
              <div v-if="confirmedDetailTarget.ticket_uuid">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider">Ticket UUID</p>
                <p class="text-xs text-slate-400 font-mono truncate">{{ confirmedDetailTarget.ticket_uuid }}</p>
              </div>
            </div>
          </div>

          <!-- Current Enforcement -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-slate-900 rounded-lg p-3">
              <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Action Type</p>
              <span :class="confirmedDetailTarget.attempt_type === 'BAN_BLOCKED' ? 'bg-red-500/10 text-red-400 ring-red-500/20' : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'"
                class="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset uppercase">
                {{ confirmedDetailTarget.attempt_type === 'BAN_BLOCKED' ? 'BAN' : 'WATCH' }}
              </span>
            </div>
            <div class="bg-slate-900 rounded-lg p-3">
              <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Detection</p>
              <span :class="confirmedDetailTarget.detection_type === 'EXACT' ? 'text-red-400' : 'text-amber-400'" class="text-xs font-medium">
                {{ confirmedDetailTarget.detection_type || 'EXACT' }}
              </span>
              <span v-if="confirmedDetailTarget.similarity_score != null" class="ml-1 text-[10px] text-slate-500">{{ confirmedDetailTarget.similarity_score }}%</span>
            </div>
            <div class="bg-slate-900 rounded-lg p-3">
              <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Confirmed By</p>
              <p class="text-xs text-slate-300 truncate">{{ confirmedDetailTarget.resolved_by || '—' }}</p>
              <p class="text-[10px] text-slate-500">{{ formatDateTime(confirmedDetailTarget.resolved_at) }}</p>
            </div>
          </div>

          <!-- Matched Keyword -->
          <div class="bg-slate-900 rounded-lg p-3">
            <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Matched Keyword</p>
            <p class="text-sm text-white">{{ confirmedDetailTarget.keyword_legal_name || '—' }}</p>
            <div v-if="confirmedDetailTarget.matched_fields" class="flex flex-wrap gap-1 mt-2">
              <span v-for="f in parseMatchedFields(confirmedDetailTarget.matched_fields)" :key="f" class="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{{ f }}</span>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="confirmedDetailTarget.resolution_notes" class="bg-slate-900 rounded-lg p-3">
            <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Notes</p>
            <p class="text-sm text-slate-300">{{ confirmedDetailTarget.resolution_notes }}</p>
          </div>

          <!-- Toggle Enforcement -->
          <div class="bg-slate-800/50 rounded-lg p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-slate-400 font-medium uppercase tracking-wider">Enforcement</p>
                <p class="text-[10px] text-slate-500 mt-0.5">Toggle enforcement on or off without removing the record</p>
              </div>
              <button @click="handleToggleConfirmed(confirmedDetailTarget)"
                class="relative inline-flex h-7 w-14 items-center rounded-full transition-colors"
                :class="confirmedDetailTarget.resolution === 'CONFIRMED' ? 'bg-green-500' : 'bg-slate-600'">
                <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                  :class="confirmedDetailTarget.resolution === 'CONFIRMED' ? 'translate-x-8' : 'translate-x-1'"></span>
              </button>
            </div>
          </div>

          <!-- Change Type -->
          <div class="bg-slate-800/50 rounded-lg p-4 space-y-3">
            <p class="text-xs text-slate-400 font-medium uppercase tracking-wider">Change Action Type</p>
            <div class="flex items-center gap-3">
              <button @click="handleChangeConfirmedType(confirmedDetailTarget, 'BAN_BLOCKED')"
                :disabled="confirmedDetailTarget.attempt_type === 'BAN_BLOCKED'"
                class="flex-1 px-3 py-2 rounded-lg text-xs font-bold ring-1 ring-inset transition-colors"
                :class="confirmedDetailTarget.attempt_type === 'BAN_BLOCKED' ? 'bg-red-500/20 text-red-400 ring-red-500/30' : 'bg-slate-900 text-slate-300 ring-slate-700 hover:bg-red-500/10 hover:text-red-400'">
                BAN — Block Purchases
              </button>
              <button @click="handleChangeConfirmedType(confirmedDetailTarget, 'WATCH_DETECTED')"
                :disabled="confirmedDetailTarget.attempt_type === 'WATCH_DETECTED'"
                class="flex-1 px-3 py-2 rounded-lg text-xs font-bold ring-1 ring-inset transition-colors"
                :class="confirmedDetailTarget.attempt_type === 'WATCH_DETECTED' ? 'bg-amber-500/20 text-amber-400 ring-amber-500/30' : 'bg-slate-900 text-slate-300 ring-slate-700 hover:bg-amber-500/10 hover:text-amber-400'">
                WATCH — Track Only
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div v-if="confirmedDetailError" class="text-red-400 text-sm">{{ confirmedDetailError }}</div>
          <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-700">
            <button @click="handleRevokeConfirmed(confirmedDetailTarget)"
              class="px-4 py-2 rounded-lg text-xs font-medium text-purple-400 hover:bg-purple-500/10 border border-purple-500/20">
              Revoke — Return to Pending
            </button>
            <button @click="showConfirmedDetailModal = false" class="px-4 py-2 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ticketApi from '../../../services/ticketApi'

const props = defineProps({ event: Object })
const route = useRoute()
const eventId = computed(() => route.params.eventId)

// ─── Tabs ───
const activeTab = ref('keywords')
const suspectCount = ref(0)
const confirmedCount = ref(0)

// ─── Scan ───
const isScanning = ref(false)
const scanResult = ref(null)

// ─── Tab 1: Keyword List ───
const isLoading = ref(true)
const keywordList = ref([])
const searchQuery = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const enabledFilter = ref('')
const selectedEntry = ref(null)
const selectedEntryDetail = ref(null)
const kwPagination = ref({ page: 1, limit: 50, total: 0, total_pages: 0 })

// ─── Tab 2: Account Suspects ───
const isLoadingSuspects = ref(false)
const suspects = ref([])
const suspectTypeFilter = ref('')
const suspectDetectionFilter = ref('')
const suspectPagination = ref({ page: 1, limit: 50, total: 0, total_pages: 0 })

// ─── Tab 3: Confirmed Accounts ───
const isLoadingConfirmed = ref(false)
const confirmedList = ref([])
const confirmedTypeFilter = ref('')
const confirmedPagination = ref({ page: 1, limit: 50, total: 0, total_pages: 0 })

// ─── Tab 4: Attempt Logs (Enforcement) ───
const isLoadingLogs = ref(false)
const attemptLogs = ref([])
const logActionFilter = ref('')
const logPagination = ref({ page: 1, limit: 50, total: 0, total_pages: 0 })

// ─── Add/Edit Modal ───
const showModal = ref(false)
const editingEntry = ref(null)
const isSavingModal = ref(false)
const modalError = ref('')
const modalForm = ref({
  legal_name: '', first_name: '', last_name: '', nickname: '',
  email: '', phone_number: '', moderation_type: 'BAN', notes: '',
})

// ─── Appeal Modal ───
const showAppealModal = ref(false)
const appealTarget = ref(null)
const appealReason = ref('')
const appealError = ref('')
const isSavingAppeal = ref(false)

// ─── Confirm Suspect Modal ───
const showConfirmSuspectModal = ref(false)
const confirmTarget = ref(null)
const confirmNotes = ref('')
const confirmError = ref('')
const isSavingConfirm = ref(false)

// ─── Dismiss Suspect Modal ───
const showDismissSuspectModal = ref(false)
const dismissTarget = ref(null)
const dismissNotes = ref('')
const dismissError = ref('')
const isSavingDismiss = ref(false)

// ─── Reinstate Modal ───
const showReinstateModal = ref(false)
const reinstateTarget = ref(null)
const reinstateType = ref('BAN')
const reinstateNotes = ref('')
const isSavingReinstate = ref(false)

// ─── Suspect Detail Modal ───
const showSuspectDetailModal = ref(false)
const suspectDetailTarget = ref(null)
const suspectDetailError = ref('')

// ─── Confirmed Detail Modal ───
const showConfirmedDetailModal = ref(false)
const confirmedDetailTarget = ref(null)
const confirmedDetailError = ref('')

// ─── Confirmed Status Filter ───
const confirmedStatusFilter = ref('')

// ═══════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════

let debounceTimer = null
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadKeywords(1), 300)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function parseMatchedFields(raw) {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [raw] }
}

function parseDetails(raw) {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'suspects') loadSuspects(1)
  if (tab === 'confirmed') loadConfirmed(1)
  if (tab === 'logs') loadAttempts(1)
}

// ═══════════════════════════════════════════
// FULL SCAN
// ═══════════════════════════════════════════

async function runFullScan() {
  isScanning.value = true
  scanResult.value = null
  try {
    const res = await ticketApi.scanModeration(eventId.value)
    scanResult.value = res
    await loadSuspectCount()
    if (res.suspects_created > 0) {
      // Switch to suspects tab to show the new results
      activeTab.value = 'suspects'
      await loadSuspects(1)
      alert(`Scan complete: ${res.suspects_created} new suspect(s) found across all events.\n\nAttendees scanned: ${res.attendees_scanned}\nKeywords checked: ${res.keywords_checked}\n\nReview them in the Account Suspects tab.`)
    } else {
      alert(`Scan complete: no new suspects found.\n\nAttendees scanned: ${res.attendees_scanned}\nKeywords checked: ${res.keywords_checked}`)
    }
  } catch (e) {
    alert(e.message || 'Scan failed')
  } finally {
    isScanning.value = false
  }
}

// ═══════════════════════════════════════════
// TAB 1: KEYWORD LIST
// ═══════════════════════════════════════════

async function loadKeywords(page = 1) {
  isLoading.value = true
  try {
    const params = { page, limit: kwPagination.value.limit }
    if (searchQuery.value) params.search = searchQuery.value
    if (typeFilter.value) params.type = typeFilter.value
    if (statusFilter.value) params.status = statusFilter.value
    if (enabledFilter.value !== '') params.enabled = enabledFilter.value
    const res = await ticketApi.getModerationList(eventId.value, params)
    keywordList.value = res.moderation || []
    if (res.pagination) kwPagination.value = { ...kwPagination.value, ...res.pagination }
  } catch (e) {
    console.error('Failed to load keywords:', e)
  } finally {
    isLoading.value = false
  }
}

async function selectEntry(mod) {
  selectedEntry.value = mod
  selectedEntryDetail.value = null
  try {
    const detail = await ticketApi.getModerationDetail(eventId.value, mod.moderation_uuid)
    selectedEntryDetail.value = detail
  } catch { /* detail load not critical */ }
}

async function toggleEnabled(mod) {
  const newState = !mod.is_enabled
  try {
    await ticketApi.toggleModerationEnabled(eventId.value, mod.moderation_uuid, newState)
    mod.is_enabled = newState ? 1 : 0
  } catch (e) {
    alert(e.message || 'Failed to toggle')
  }
}

function openAddModal() {
  editingEntry.value = null
  modalForm.value = {
    legal_name: '', first_name: '', last_name: '', nickname: '',
    email: '', phone_number: '', moderation_type: 'BAN', notes: '',
  }
  modalError.value = ''
  showModal.value = true
}

function openEditModal(entry) {
  editingEntry.value = entry
  modalForm.value = {
    legal_name: entry.legal_name || '',
    first_name: entry.first_name || '',
    last_name: entry.last_name || '',
    nickname: entry.nickname || '',
    email: entry.email || '',
    phone_number: entry.phone_number || '',
    moderation_type: entry.moderation_type,
    notes: entry.notes || '',
  }
  modalError.value = ''
  showModal.value = true
}

async function saveEntry() {
  isSavingModal.value = true
  modalError.value = ''
  try {
    const payload = { ...modalForm.value }
    if (editingEntry.value) {
      await ticketApi.updateModeration(eventId.value, editingEntry.value.moderation_uuid, payload)
    } else {
      const result = await ticketApi.addModeration(eventId.value, payload)
      // If backend found matching attendees, notify and switch to suspects tab
      if (result.suspects_created > 0) {
        showModal.value = false
        await loadKeywords(kwPagination.value.page)
        // Refresh suspect count and switch to suspects tab
        await loadSuspectCount()
        activeTab.value = 'suspects'
        await loadSuspects(1)
        alert(`Keyword added. ${result.suspects_created} existing attendee(s) flagged as suspects. Review them in the Account Suspects tab.`)
        return
      }
    }
    showModal.value = false
    await loadKeywords(kwPagination.value.page)
    if (editingEntry.value) {
      const found = keywordList.value.find(m => m.moderation_uuid === editingEntry.value.moderation_uuid)
      if (found) selectEntry(found)
    }
  } catch (e) {
    modalError.value = e.message || 'Failed to save entry'
  } finally {
    isSavingModal.value = false
  }
}

async function handleRemove(entry) {
  if (!confirm(`Permanently delete "${entry.legal_name}"? This cannot be undone.`)) return
  try {
    await ticketApi.removeModeration(eventId.value, entry.moderation_uuid)
    selectedEntry.value = null
    selectedEntryDetail.value = null
    await loadKeywords(kwPagination.value.page)
  } catch (e) {
    alert(e.message || 'Failed to remove entry')
  }
}

// ─── Appeal ───

function openAppealModal(entry) {
  appealTarget.value = entry
  appealReason.value = ''
  appealError.value = ''
  showAppealModal.value = true
}

async function submitAppeal() {
  if (!appealReason.value.trim()) { appealError.value = 'Reason is required'; return }
  isSavingAppeal.value = true
  appealError.value = ''
  try {
    await ticketApi.appealModeration(eventId.value, appealTarget.value.moderation_uuid, {
      appeal_reason: appealReason.value.trim(),
    })
    showAppealModal.value = false
    await loadKeywords(kwPagination.value.page)
    const found = keywordList.value.find(m => m.moderation_uuid === appealTarget.value.moderation_uuid)
    if (found) selectEntry(found)
  } catch (e) {
    appealError.value = e.message || 'Failed to file appeal'
  } finally {
    isSavingAppeal.value = false
  }
}

// ─── Reinstate ───

function handleReinstate(entry) {
  reinstateTarget.value = entry
  reinstateType.value = entry.moderation_type || 'BAN'
  reinstateNotes.value = ''
  showReinstateModal.value = true
}

async function submitReinstate() {
  isSavingReinstate.value = true
  try {
    await ticketApi.reinstateModeration(eventId.value, reinstateTarget.value.moderation_uuid, {
      moderation_type: reinstateType.value,
      notes: reinstateNotes.value || undefined,
    })
    showReinstateModal.value = false
    await loadKeywords(kwPagination.value.page)
    const found = keywordList.value.find(m => m.moderation_uuid === reinstateTarget.value.moderation_uuid)
    if (found) selectEntry(found)
  } catch (e) {
    alert(e.message || 'Failed to reinstate')
  } finally {
    isSavingReinstate.value = false
  }
}

// ═══════════════════════════════════════════
// TAB 2: ACCOUNT SUSPECTS
// ═══════════════════════════════════════════

async function loadSuspects(page = 1) {
  isLoadingSuspects.value = true
  try {
    const params = { page, limit: 50 }
    if (suspectTypeFilter.value) params.type = suspectTypeFilter.value
    if (suspectDetectionFilter.value) params.detection = suspectDetectionFilter.value
    const res = await ticketApi.getSuspects(eventId.value, params)
    suspects.value = res.suspects || []
    if (res.pagination) suspectPagination.value = { ...suspectPagination.value, ...res.pagination }
  } catch (e) {
    console.error('Failed to load suspects:', e)
  } finally {
    isLoadingSuspects.value = false
  }
}

function openConfirmSuspectModal(suspect) {
  confirmTarget.value = suspect
  confirmNotes.value = ''
  confirmError.value = ''
  showConfirmSuspectModal.value = true
}

async function submitConfirmSuspect() {
  isSavingConfirm.value = true
  confirmError.value = ''
  try {
    await ticketApi.confirmSuspect(eventId.value, confirmTarget.value.attempt_uuid, {
      notes: confirmNotes.value || undefined,
    })
    showConfirmSuspectModal.value = false
    await loadSuspects(suspectPagination.value.page)
    await loadSuspectCount()
    await loadConfirmedCount()
  } catch (e) {
    confirmError.value = e.message || 'Failed to confirm suspect'
  } finally {
    isSavingConfirm.value = false
  }
}

function openDismissSuspectModal(suspect) {
  dismissTarget.value = suspect
  dismissNotes.value = ''
  dismissError.value = ''
  showDismissSuspectModal.value = true
}

async function submitDismissSuspect() {
  isSavingDismiss.value = true
  dismissError.value = ''
  try {
    await ticketApi.dismissSuspect(eventId.value, dismissTarget.value.attempt_uuid, {
      notes: dismissNotes.value || undefined,
    })
    showDismissSuspectModal.value = false
    await loadSuspects(suspectPagination.value.page)
    await loadSuspectCount()
  } catch (e) {
    dismissError.value = e.message || 'Failed to dismiss suspect'
  } finally {
    isSavingDismiss.value = false
  }
}

// ─── Suspect Detail ───

function openSuspectDetailModal(suspect) {
  suspectDetailTarget.value = { ...suspect }
  suspectDetailError.value = ''
  showSuspectDetailModal.value = true
}

async function handleChangeSuspectType(suspect, newType) {
  if (suspect.attempt_type === newType) return
  suspectDetailError.value = ''
  try {
    await ticketApi.updateSuspectType(eventId.value, suspect.attempt_uuid, newType)
    suspect.attempt_type = newType
    suspectDetailTarget.value = { ...suspect }
    await loadSuspects(suspectPagination.value.page)
  } catch (e) {
    suspectDetailError.value = e.message || 'Failed to change type'
  }
}

async function handleDeleteSuspect(suspect) {
  if (!confirm(`Permanently delete this suspect record for "${suspect.raw_legal_name || suspect.masked_name}"? This cannot be undone.`)) return
  suspectDetailError.value = ''
  try {
    await ticketApi.deleteSuspect(eventId.value, suspect.attempt_uuid)
    showSuspectDetailModal.value = false
    await loadSuspects(suspectPagination.value.page)
    await loadSuspectCount()
  } catch (e) {
    suspectDetailError.value = e.message || 'Failed to delete suspect'
  }
}

// ═══════════════════════════════════════════
// TAB 3: CONFIRMED ACCOUNTS
// ═══════════════════════════════════════════

async function loadConfirmed(page = 1) {
  isLoadingConfirmed.value = true
  try {
    const params = { page, limit: 50 }
    if (confirmedTypeFilter.value) params.type = confirmedTypeFilter.value
    if (confirmedStatusFilter.value) params.status = confirmedStatusFilter.value
    const res = await ticketApi.getConfirmedAccounts(eventId.value, params)
    confirmedList.value = res.confirmed || []
    if (res.pagination) confirmedPagination.value = { ...confirmedPagination.value, ...res.pagination }
  } catch (e) {
    console.error('Failed to load confirmed accounts:', e)
  } finally {
    isLoadingConfirmed.value = false
  }
}

// ─── Confirmed Detail ───

function openConfirmedDetailModal(account, action = null) {
  confirmedDetailTarget.value = { ...account }
  confirmedDetailError.value = ''
  showConfirmedDetailModal.value = true

  // If opened with 'revoke' action, trigger revoke immediately
  if (action === 'revoke') {
    // Small delay so modal renders first
    setTimeout(() => handleRevokeConfirmed(confirmedDetailTarget.value), 100)
  }
}

async function handleToggleConfirmed(account) {
  confirmedDetailError.value = ''
  try {
    const res = await ticketApi.toggleConfirmedActive(eventId.value, account.attempt_uuid)
    // Update in-place for both the list and the modal target
    const newStatus = res.new_status || (account.resolution === 'CONFIRMED' ? 'SUSPENDED' : 'CONFIRMED')
    account.resolution = newStatus
    if (confirmedDetailTarget.value?.attempt_uuid === account.attempt_uuid) {
      confirmedDetailTarget.value = { ...confirmedDetailTarget.value, resolution: newStatus }
    }
    // Update the row in the list
    const idx = confirmedList.value.findIndex(c => c.attempt_uuid === account.attempt_uuid)
    if (idx >= 0) confirmedList.value[idx].resolution = newStatus
    await loadConfirmedCount()
  } catch (e) {
    confirmedDetailError.value = e.message || 'Failed to toggle enforcement'
    alert(e.message || 'Failed to toggle enforcement')
  }
}

async function handleChangeConfirmedType(account, newType) {
  if (account.attempt_type === newType) return
  confirmedDetailError.value = ''
  try {
    await ticketApi.updateConfirmedType(eventId.value, account.attempt_uuid, newType)
    account.attempt_type = newType
    if (confirmedDetailTarget.value?.attempt_uuid === account.attempt_uuid) {
      confirmedDetailTarget.value = { ...confirmedDetailTarget.value, attempt_type: newType }
    }
    const idx = confirmedList.value.findIndex(c => c.attempt_uuid === account.attempt_uuid)
    if (idx >= 0) confirmedList.value[idx].attempt_type = newType
  } catch (e) {
    confirmedDetailError.value = e.message || 'Failed to change type'
  }
}

async function handleRevokeConfirmed(account) {
  if (!confirm(`Revoke confirmation for "${account.raw_legal_name || account.masked_name}"? This will move them back to pending suspects.`)) return
  confirmedDetailError.value = ''
  try {
    await ticketApi.revokeConfirmed(eventId.value, account.attempt_uuid)
    showConfirmedDetailModal.value = false
    await loadConfirmed(confirmedPagination.value.page)
    await loadConfirmedCount()
    await loadSuspectCount()
  } catch (e) {
    confirmedDetailError.value = e.message || 'Failed to revoke'
    alert(e.message || 'Failed to revoke')
  }
}

// ═══════════════════════════════════════════
// TAB 4: ATTEMPT LOGS (Enforcement)
// ═══════════════════════════════════════════

async function loadAttempts(page = 1) {
  isLoadingLogs.value = true
  try {
    const params = { page, limit: 50 }
    if (logActionFilter.value) params.action_type = logActionFilter.value
    const res = await ticketApi.getModerationAttempts(eventId.value, params)
    attemptLogs.value = res.attempts || []
    if (res.pagination) logPagination.value = { ...logPagination.value, ...res.pagination }
  } catch (e) {
    console.error('Failed to load attempt logs:', e)
  } finally {
    isLoadingLogs.value = false
  }
}

// ═══════════════════════════════════════════
// SHARED
// ═══════════════════════════════════════════

async function loadSuspectCount() {
  try {
    const res = await ticketApi.getSuspectCount(eventId.value)
    suspectCount.value = res.suspect_count || 0
  } catch { /* non-critical */ }
}

async function loadConfirmedCount() {
  try {
    const res = await ticketApi.getConfirmedCount(eventId.value)
    confirmedCount.value = res.confirmed_count || 0
  } catch { /* non-critical */ }
}

onMounted(() => {
  loadKeywords()
  loadSuspectCount()
  loadConfirmedCount()
})
</script>
