<template>
  <div class="flex-1 overflow-y-auto">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Payment Gateway</h1>
          <p class="text-slate-400 text-sm mt-1">Manage payment channels, transactions &amp; WijayaPay integration</p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="lastSynced" class="text-xs text-slate-500">Last synced: {{ formatDate(lastSynced) }}</span>
          <button @click="syncChannels" :disabled="syncing"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0df2f2]/10 text-[#0df2f2] rounded-lg hover:bg-[#0df2f2]/20 border border-[#0df2f2]/20 transition-colors text-sm font-medium disabled:opacity-50">
            <svg v-if="syncing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ syncing ? 'Syncing...' : 'Sync from WijayaPay' }}
          </button>
        </div>
      </div>

      <!-- Status Alert -->
      <div v-if="statusMessage" :class="statusSuccess ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'"
        class="mb-6 px-4 py-3 rounded-lg border text-sm flex items-center gap-2">
        <svg v-if="statusSuccess" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        <svg v-else class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        {{ statusMessage }}
      </div>

      <!-- Tab Navigation -->
      <div class="flex items-center gap-1 mb-8 border-b border-slate-800">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          :class="activeTab === tab.id ? 'text-[#0df2f2] border-[#0df2f2]' : 'text-slate-400 border-transparent hover:text-slate-300'"
          class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px">
          {{ tab.label }}
        </button>
      </div>

      <!-- ═══════════════════════════════════════ -->
      <!-- TAB: CHANNELS -->
      <!-- ═══════════════════════════════════════ -->
      <div v-if="activeTab === 'channels'">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-[#111318] rounded-xl border border-slate-800 p-4">
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Channels</p>
            <p class="text-2xl font-bold text-white mt-1">{{ channels.length }}</p>
          </div>
          <div class="bg-[#111318] rounded-xl border border-slate-800 p-4">
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Enabled</p>
            <p class="text-2xl font-bold text-emerald-400 mt-1">{{ enabledCount }}</p>
          </div>
          <div class="bg-[#111318] rounded-xl border border-slate-800 p-4">
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Disabled</p>
            <p class="text-2xl font-bold text-slate-400 mt-1">{{ channels.length - enabledCount }}</p>
          </div>
          <div class="bg-[#111318] rounded-xl border border-slate-800 p-4">
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Groups</p>
            <p class="text-2xl font-bold text-[#0df2f2] mt-1">{{ groupNames.length }}</p>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <div class="flex items-center gap-3 text-slate-400">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span class="text-sm">Loading payment channels...</span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="channels.length === 0" class="text-center py-20">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-[#0df2f2]/10 flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          </div>
          <h3 class="text-lg font-semibold text-white mb-1">No Payment Channels</h3>
          <p class="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Sync from WijayaPay to load available payment channels. You can then enable or disable them for your users.
          </p>
          <button @click="syncChannels" :disabled="syncing"
            class="px-6 py-2.5 bg-[#0df2f2] text-[#0a0e17] rounded-lg font-semibold text-sm hover:bg-[#0df2f2]/90 transition-colors disabled:opacity-50">
            {{ syncing ? 'Syncing...' : 'Sync Now' }}
          </button>
        </div>

        <!-- Channel Groups -->
        <div v-else class="space-y-8">
          <div v-for="group in groupNames" :key="group">
            <!-- Group Header -->
            <div class="flex items-center gap-3 mb-4">
              <div class="h-px flex-1 bg-slate-800"></div>
              <h2 class="text-sm font-bold text-slate-400 uppercase tracking-wider">{{ group }}</h2>
              <div class="h-px flex-1 bg-slate-800"></div>
            </div>

            <!-- Channel Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div v-for="channel in getGroupChannels(group)" :key="channel.code"
                :class="channel.is_enabled ? 'border-[#0df2f2]/20 bg-[#111318]' : 'border-slate-800/50 bg-[#111318]/50 opacity-60'"
                class="rounded-xl border p-4 transition-all duration-200 hover:opacity-100">

                <!-- Channel Header -->
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      <img v-if="channel.image_url" :src="channel.image_url.replace(/https:\/\/(dash|dashboard)\.wijayapay\.com/g, 'https://app.wijayapay.com')" :alt="channel.name" class="w-8 h-8 object-contain" @error="(e) => e.target.style.display='none'" />
                      <svg v-else class="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-white">{{ channel.name }}</p>
                      <p class="text-xs text-slate-500 font-mono">{{ channel.code }}</p>
                    </div>
                  </div>

                  <!-- Toggle Switch -->
                  <button @click="toggleChannel(channel)" :disabled="toggling === channel.code"
                    :class="channel.is_enabled ? 'bg-[#0df2f2]' : 'bg-slate-700'"
                    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50">
                    <span :class="channel.is_enabled ? 'translate-x-5' : 'translate-x-0'"
                      class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>

                <!-- Fee Info -->
                <div class="flex flex-wrap gap-2 mb-3">
                  <span v-if="channel.fee_amount > 0"
                    class="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    Fee: Rp {{ formatNumber(channel.fee_amount) }}
                  </span>
                  <span v-if="channel.fee_percent > 0"
                    class="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    {{ channel.fee_percent }}%
                  </span>
                  <span :class="channel.type_fee === 'customer' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'"
                    class="text-xs px-2 py-1 rounded-md border font-medium capitalize">
                    {{ channel.type_fee || 'merchant' }}
                  </span>
                </div>

                <!-- Min/Max -->
                <div class="flex items-center gap-4 text-xs text-slate-500">
                  <span>Min: Rp {{ formatNumber(channel.min_trx) }}</span>
                  <span>Max: Rp {{ formatNumber(channel.max_trx) }}</span>
                </div>

                <!-- Gateway Status Badge -->
                <div class="mt-3 flex items-center gap-2">
                  <span :class="channel.gateway_status === 'active' ? 'bg-emerald-500' : 'bg-red-500'"
                    class="w-1.5 h-1.5 rounded-full"></span>
                  <span class="text-xs text-slate-500 capitalize">Gateway: {{ channel.gateway_status || 'unknown' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions Bar -->
        <div v-if="channels.length > 0" class="mt-8 p-4 bg-[#111318] rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-4 text-sm text-slate-400">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              {{ enabledCount }} enabled
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-slate-600"></span>
              {{ channels.length - enabledCount }} disabled
            </span>
          </div>
          <div class="flex items-center gap-3">
            <button @click="enableAll" class="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
              Enable All
            </button>
            <button @click="disableAll" class="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
              Disable All
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════ -->
      <!-- TAB: TRANSACTIONS -->
      <!-- ═══════════════════════════════════════ -->
      <div v-if="activeTab === 'transactions'">
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <select v-model="txnFilter.status" @change="loadTransactions"
            class="bg-[#111318] border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:ring-[#0df2f2] focus:border-[#0df2f2]">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
          </select>
          <select v-model="txnFilter.channel" @change="loadTransactions"
            class="bg-[#111318] border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:ring-[#0df2f2] focus:border-[#0df2f2]">
            <option value="">All channels</option>
            <option v-for="ch in channels" :key="ch.code" :value="ch.code">{{ ch.name }}</option>
          </select>
          <button @click="loadTransactions"
            class="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>

        <!-- Transactions Loading -->
        <div v-if="txnLoading" class="flex items-center justify-center py-16">
          <div class="flex items-center gap-3 text-slate-400">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span class="text-sm">Loading transactions...</span>
          </div>
        </div>

        <!-- Transactions Empty -->
        <div v-else-if="transactions.length === 0" class="text-center py-16">
          <svg class="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="text-slate-400 text-sm">No transactions found</p>
        </div>

        <!-- Transactions Table -->
        <div v-else class="bg-[#111318] rounded-xl border border-slate-800 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-800">
                  <th class="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Ref ID</th>
                  <th class="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Channel</th>
                  <th class="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Nominal</th>
                  <th class="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Bayar</th>
                  <th class="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Fee</th>
                  <th class="text-center px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Status</th>
                  <th class="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Expires</th>
                  <th class="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Created</th>
                  <th class="text-center px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50">
                <tr v-for="txn in transactions" :key="txn.transaction_uuid" class="hover:bg-white/[0.02] transition-colors">
                  <td class="px-4 py-3">
                    <span class="font-mono text-xs text-slate-300">{{ txn.ref_id }}</span>
                    <p v-if="txn.trx_reference" class="text-[10px] text-slate-600 mt-0.5">{{ txn.trx_reference }}</p>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <img v-if="txn.payment_image" :src="txn.payment_image" class="w-5 h-5 object-contain" @error="(e) => e.target.style.display='none'" />
                      <span class="text-white text-xs">{{ txn.payment_name || txn.channel_code }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right text-white font-medium">Rp {{ formatNumber(txn.nominal) }}</td>
                  <td class="px-4 py-3 text-right text-slate-300">Rp {{ formatNumber(txn.total_bayar) }}</td>
                  <td class="px-4 py-3 text-right text-amber-400 text-xs">Rp {{ formatNumber(txn.total_fee) }}</td>
                  <td class="px-4 py-3 text-center">
                    <span :class="txnStatusClass(txn.status)"
                      class="text-[11px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">
                      {{ txn.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-500">{{ formatDate(txn.expired_at) }}</td>
                  <td class="px-4 py-3 text-xs text-slate-500">{{ formatDate(txn.created_at) }}</td>
                  <td class="px-4 py-3 text-center">
                    <button v-if="txn.status === 'pending'" @click="checkStatus(txn)"
                      :disabled="checkingRef === txn.ref_id"
                      class="text-[#0df2f2] hover:text-white text-xs font-medium transition-colors disabled:opacity-50">
                      {{ checkingRef === txn.ref_id ? 'Checking...' : 'Check' }}
                    </button>
                    <button @click="viewTxnDetail(txn)"
                      class="text-slate-400 hover:text-white text-xs ml-2 transition-colors">
                      Detail
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="txnPagination.total_pages > 1" class="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <span class="text-xs text-slate-500">
              Page {{ txnPagination.page }} of {{ txnPagination.total_pages }} ({{ txnPagination.total }} total)
            </span>
            <div class="flex items-center gap-2">
              <button @click="txnPage--; loadTransactions()" :disabled="txnPage <= 1"
                class="px-3 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-colors">
                Prev
              </button>
              <button @click="txnPage++; loadTransactions()" :disabled="txnPage >= txnPagination.total_pages"
                class="px-3 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- ═══════════════════════════════════════ -->
      <!-- Transaction Detail Modal -->
      <!-- ═══════════════════════════════════════ -->
      <div v-if="detailTxn" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="detailTxn = null"></div>
        <div class="relative bg-[#111318] rounded-2xl border border-slate-700 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Transaction Detail</h3>
            <button @click="detailTxn = null" class="text-slate-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="px-6 py-5 space-y-4">
            <!-- Status Badge -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">Status</span>
              <span :class="txnStatusClass(detailTxn.status)"
                class="text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wide">
                {{ detailTxn.status }}
              </span>
            </div>

            <!-- Payment Info -->
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-xs text-slate-500">Payment Method</span>
                <div class="flex items-center gap-2">
                  <img v-if="detailTxn.payment_image" :src="detailTxn.payment_image" class="w-4 h-4 object-contain" />
                  <span class="text-sm text-white">{{ detailTxn.payment_name }}</span>
                </div>
              </div>
              <div class="flex justify-between">
                <span class="text-xs text-slate-500">Ref ID</span>
                <span class="text-sm text-white font-mono">{{ detailTxn.ref_id }}</span>
              </div>
              <div v-if="detailTxn.trx_reference" class="flex justify-between">
                <span class="text-xs text-slate-500">TRX Reference</span>
                <span class="text-sm text-white font-mono">{{ detailTxn.trx_reference }}</span>
              </div>
            </div>

            <div class="h-px bg-slate-800"></div>

            <!-- Amounts -->
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-xs text-slate-500">Nominal</span>
                <span class="text-sm text-white font-medium">Rp {{ formatNumber(detailTxn.nominal) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-xs text-slate-500">Total Bayar</span>
                <span class="text-sm text-white">Rp {{ formatNumber(detailTxn.total_bayar) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-xs text-slate-500">Fee</span>
                <span class="text-sm text-amber-400">Rp {{ formatNumber(detailTxn.total_fee) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-xs text-slate-500">Received</span>
                <span class="text-sm text-emerald-400 font-medium">Rp {{ formatNumber(detailTxn.total_diterima) }}</span>
              </div>
            </div>

            <div class="h-px bg-slate-800"></div>

            <!-- Payment Details (VA / QR / Retail) -->
            <div v-if="detailTxn.nomor_va" class="flex justify-between">
              <span class="text-xs text-slate-500">VA Number</span>
              <span class="text-sm text-[#0df2f2] font-mono">{{ detailTxn.nomor_va }}</span>
            </div>
            <div v-if="detailTxn.nomor_pembayaran" class="flex justify-between">
              <span class="text-xs text-slate-500">Payment Code</span>
              <span class="text-sm text-[#0df2f2] font-mono">{{ detailTxn.nomor_pembayaran }}</span>
            </div>
            <div v-if="detailTxn.qr_image" class="text-center">
              <p class="text-xs text-slate-500 mb-2">QR Code</p>
              <img :src="detailTxn.qr_image" alt="QRIS" class="mx-auto w-48 h-48 object-contain bg-white rounded-lg p-2" />
            </div>

            <!-- Timestamps -->
            <div class="space-y-2 pt-2">
              <div class="flex justify-between">
                <span class="text-xs text-slate-500">Created</span>
                <span class="text-xs text-slate-400">{{ formatDate(detailTxn.created_at) }}</span>
              </div>
              <div v-if="detailTxn.expired_at" class="flex justify-between">
                <span class="text-xs text-slate-500">Expires</span>
                <span class="text-xs text-slate-400">{{ formatDate(detailTxn.expired_at) }}</span>
              </div>
              <div v-if="detailTxn.paid_at" class="flex justify-between">
                <span class="text-xs text-slate-500">Paid At</span>
                <span class="text-xs text-emerald-400">{{ formatDate(detailTxn.paid_at) }}</span>
              </div>
            </div>

            <!-- Check Status Button -->
            <button v-if="detailTxn.status === 'pending'" @click="checkStatus(detailTxn)"
              :disabled="checkingRef === detailTxn.ref_id"
              class="w-full mt-2 px-4 py-2.5 bg-[#0df2f2]/10 text-[#0df2f2] rounded-lg hover:bg-[#0df2f2]/20 border border-[#0df2f2]/20 font-medium text-sm transition-colors disabled:opacity-50">
              {{ checkingRef === detailTxn.ref_id ? 'Checking...' : 'Check Payment Status' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import ticketApi from '../../../services/ticketApi'

const route = useRoute()
const eventId = computed(() => route.params.eventId)

// ── Tabs ──
const tabs = [
  { id: 'channels', label: 'Channels' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'financials', label: 'Financials' },
]
const activeTab = ref('channels')

// ── Channel State ──
const channels = ref([])
const loading = ref(true)
const syncing = ref(false)
const toggling = ref(null)
const lastSynced = ref(null)
const statusMessage = ref('')
const statusSuccess = ref(true)

// ── Transaction State ──
const transactions = ref([])
const txnLoading = ref(false)
const txnFilter = ref({ status: '', channel: '' })
const txnPage = ref(1)
const txnPagination = ref({ page: 1, total: 0, total_pages: 0 })
const checkingRef = ref(null)
const detailTxn = ref(null)

// ── Financial State ──
const financials = ref(null)
const finLoading = ref(false)
const feeSettings = ref({ admin_fee_percent: 0, admin_fee_fixed: 0 })
const savingFee = ref(false)
const payoutForm = ref({ status: 'pending', payout_total: 0 })
const savingPayout = ref(false)

// ── Computed ──
const enabledCount = computed(() => channels.value.filter(c => c.is_enabled).length)
const groupNames = computed(() => [...new Set(channels.value.map(c => c.group_name))].sort())

function getGroupChannels(group) {
  return channels.value.filter(c => c.group_name === group).sort((a, b) => a.sort_order - b.sort_order)
}

// ── Formatters ──
function formatNumber(n) {
  return (n || 0).toLocaleString('id-ID')
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}

function txnStatusClass(status) {
  switch (status) {
    case 'paid': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
    case 'pending': return 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
    case 'expired': return 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
    case 'failed': return 'bg-red-500/15 text-red-400 border border-red-500/20'
    default: return 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
  }
}

function payoutStatusClass(status) {
  switch (status) {
    case 'completed': return 'bg-emerald-500/15 text-emerald-400'
    case 'partial': return 'bg-amber-500/15 text-amber-400'
    default: return 'bg-slate-500/15 text-slate-400'
  }
}

function showStatus(msg, success = true) {
  statusMessage.value = msg
  statusSuccess.value = success
  setTimeout(() => { statusMessage.value = '' }, 5000)
}

// ── Channel Actions ──
async function loadChannels() {
  try {
    loading.value = true
    const res = await ticketApi.getPaymentChannels(eventId.value)
    channels.value = res.channels || []
    if (channels.value.length > 0) {
      const synced = channels.value.filter(c => c.synced_at).map(c => c.synced_at).sort().pop()
      lastSynced.value = synced || null
    }
  } catch (e) {
    showStatus(e.message || 'Failed to load channels', false)
  } finally {
    loading.value = false
  }
}

async function syncChannels() {
  if (syncing.value) return
  try {
    syncing.value = true
    const res = await ticketApi.syncPaymentChannels(eventId.value)
    showStatus(res.message || `Synced ${res.total} channels`)
    await loadChannels()
  } catch (e) {
    showStatus(e.message || 'Sync failed', false)
  } finally {
    syncing.value = false
  }
}

async function toggleChannel(channel) {
  try {
    toggling.value = channel.code
    const res = await ticketApi.togglePaymentChannel(eventId.value, channel.code)
    channel.is_enabled = res.is_enabled
    showStatus(`${channel.name} ${res.is_enabled ? 'enabled' : 'disabled'}`)
  } catch (e) {
    showStatus(e.message || 'Toggle failed', false)
  } finally {
    toggling.value = null
  }
}

async function enableAll() {
  for (const ch of channels.value) {
    if (!ch.is_enabled) {
      try {
        toggling.value = ch.code
        const res = await ticketApi.togglePaymentChannel(eventId.value, ch.code)
        ch.is_enabled = res.is_enabled
      } catch (e) { /* skip */ }
    }
  }
  toggling.value = null
  showStatus('All channels enabled')
}

async function disableAll() {
  for (const ch of channels.value) {
    if (ch.is_enabled) {
      try {
        toggling.value = ch.code
        const res = await ticketApi.togglePaymentChannel(eventId.value, ch.code)
        ch.is_enabled = res.is_enabled
      } catch (e) { /* skip */ }
    }
  }
  toggling.value = null
  showStatus('All channels disabled')
}

// ── Transaction Actions ──
async function loadTransactions() {
  try {
    txnLoading.value = true
    const params = { page: txnPage.value, limit: 50 }
    if (txnFilter.value.status) params.status = txnFilter.value.status
    if (txnFilter.value.channel) params.channel = txnFilter.value.channel
    const res = await ticketApi.getEventTransactions(eventId.value, params)
    transactions.value = res.transactions || []
    txnPagination.value = res.pagination || { page: 1, total: 0, total_pages: 0 }
  } catch (e) {
    showStatus(e.message || 'Failed to load transactions', false)
  } finally {
    txnLoading.value = false
  }
}

async function checkStatus(txn) {
  try {
    checkingRef.value = txn.ref_id
    const res = await ticketApi.checkPaymentStatus(txn.ref_id)
    txn.status = res.status || txn.status
    if (detailTxn.value?.ref_id === txn.ref_id) {
      detailTxn.value.status = txn.status
    }
    showStatus(`Status: ${txn.status}`)
    // Refresh list if status changed to paid/expired
    if (['paid', 'expired'].includes(res.status)) {
      await loadTransactions()
    }
  } catch (e) {
    showStatus(e.message || 'Status check failed', false)
  } finally {
    checkingRef.value = null
  }
}

function viewTxnDetail(txn) {
  detailTxn.value = { ...txn }
}

// ── Financial Actions ──
async function loadFinancials() {
  try {
    finLoading.value = true
    const res = await ticketApi.getEventFinancials(eventId.value)
    financials.value = res
    feeSettings.value = {
      admin_fee_percent: res.settings?.admin_fee_percent || 0,
      admin_fee_fixed: res.settings?.admin_fee_fixed || 0,
    }
    payoutForm.value.status = res.settings?.host_payout_status || 'pending'
  } catch (e) {
    showStatus(e.message || 'Failed to load financials', false)
  } finally {
    finLoading.value = false
  }
}

async function saveFinancialSettings() {
  try {
    savingFee.value = true
    await ticketApi.updateFinancialSettings(eventId.value, feeSettings.value)
    showStatus('Fee settings saved')
    await loadFinancials()
  } catch (e) {
    showStatus(e.message || 'Failed to save settings', false)
  } finally {
    savingFee.value = false
  }
}

async function recordPayout() {
  try {
    savingPayout.value = true
    await ticketApi.recordHostPayout(eventId.value, payoutForm.value)
    showStatus('Payout updated')
    await loadFinancials()
  } catch (e) {
    showStatus(e.message || 'Failed to update payout', false)
  } finally {
    savingPayout.value = false
  }
}

// ── Tab watcher: load data on tab switch ──
watch(activeTab, (tab) => {
  if (tab === 'transactions' && transactions.value.length === 0) loadTransactions()
  if (tab === 'financials' && !financials.value) loadFinancials()
})

onMounted(() => loadChannels())
</script>
