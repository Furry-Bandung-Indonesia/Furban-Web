<template>
  <div class="flex-1 overflow-y-auto">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Event Financials</h1>
          <p class="text-slate-400 text-sm mt-1">Income, fees, admin split &amp; host payout tracking</p>
        </div>
        <button @click="loadData" :disabled="loading"
          class="inline-flex items-center gap-2 px-4 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 border border-slate-700 transition-colors text-sm disabled:opacity-50">
          <svg class="w-4 h-4" :class="loading && 'animate-spin'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      <!-- Status Alert -->
      <div v-if="statusMessage" :class="statusSuccess ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'"
        class="mb-6 px-4 py-3 rounded-lg border text-sm flex items-center gap-2">
        <svg v-if="statusSuccess" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        <svg v-else class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        {{ statusMessage }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="flex items-center gap-3 text-slate-400">
          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span class="text-sm">Loading financials...</span>
        </div>
      </div>

      <template v-else>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-[#111318] rounded-xl border border-slate-800 p-5">
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Income</p>
            <p class="text-2xl font-bold text-white">Rp {{ formatNumber(summary.total_received) }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ summary.total_transactions }} transactions</p>
          </div>
          <div class="bg-[#111318] rounded-xl border border-slate-800 p-5">
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Gateway Fees</p>
            <p class="text-2xl font-bold text-amber-400">Rp {{ formatNumber(summary.total_gateway_fees) }}</p>
            <p class="text-xs text-slate-500 mt-1">Paid to gateway</p>
          </div>
          <div class="bg-[#111318] rounded-xl border border-slate-800 p-5">
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Admin Earnings</p>
            <p class="text-2xl font-bold text-[#0df2f2]">Rp {{ formatNumber(summary.admin_total) }}</p>
            <p class="text-xs text-slate-500 mt-1">Platform commission</p>
          </div>
          <div class="bg-[#111318] rounded-xl border border-slate-800 p-5">
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Host Payout</p>
            <p class="text-2xl font-bold text-emerald-400">Rp {{ formatNumber(summary.host_payout) }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span :class="{
                'text-amber-400': settings.host_payout_status === 'pending',
                'text-blue-400': settings.host_payout_status === 'partial',
                'text-emerald-400': settings.host_payout_status === 'completed'
              }" class="text-xs font-semibold capitalize">{{ settings.host_payout_status || 'pending' }}</span>
              <span v-if="settings.host_payout_total > 0" class="text-xs text-slate-500">· Paid: Rp {{ formatNumber(settings.host_payout_total) }}</span>
            </div>
          </div>
        </div>

        <!-- Channel Breakdown -->
        <div class="mb-8">
          <div class="bg-[#111318] rounded-xl border border-slate-800 p-6">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Revenue by Channel
            </h3>

            <div v-if="channelBreakdown.length === 0" class="text-center py-8 text-slate-500 text-sm">
              No paid transactions yet
            </div>
            <div v-else class="space-y-3">
              <div v-for="ch in channelBreakdown" :key="ch.channel_code" class="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                <div>
                  <p class="text-sm font-medium text-white">{{ ch.payment_name || ch.channel_code }}</p>
                  <p class="text-xs text-slate-500">{{ ch.count }} transactions</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-white">Rp {{ formatNumber(ch.total_received) }}</p>
                  <p class="text-xs text-slate-500">Fees: Rp {{ formatNumber(ch.total_fees) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Host Payout Management -->
        <div class="bg-[#111318] rounded-xl border border-slate-800 p-6 mb-8">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Host Payout
          </h3>

          <!-- Current Payout Status Summary -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-4 bg-[#0a0e17] rounded-lg border border-slate-800/50">
            <div>
              <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Owed to Host</p>
              <p class="text-sm font-bold text-white">Rp {{ formatNumber(summary.host_payout) }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Amount Paid</p>
              <p class="text-sm font-bold" :class="settings.host_payout_total > 0 ? 'text-emerald-400' : 'text-slate-500'">Rp {{ formatNumber(settings.host_payout_total) }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Remaining</p>
              <p class="text-sm font-bold" :class="payoutRemaining > 0 ? 'text-amber-400' : 'text-emerald-400'">Rp {{ formatNumber(payoutRemaining) }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Last Paid</p>
              <p class="text-sm font-semibold text-white">{{ settings.host_payout_at ? formatDate(settings.host_payout_at) : 'Never' }}</p>
            </div>
          </div>

          <!-- Payout Form -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">Payout Status</label>
              <select v-model="payoutForm.status"
                class="w-full bg-[#0a0e17] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#0df2f2] outline-none">
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">Payout Amount (Rp)</label>
              <input v-model.number="payoutForm.payout_total" type="number" min="0"
                class="w-full bg-[#0a0e17] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#0df2f2] outline-none"
                :placeholder="'Max: ' + formatNumber(summary.host_payout)" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
              <input v-model="payoutForm.notes" type="text"
                class="w-full bg-[#0a0e17] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#0df2f2] outline-none"
                placeholder="Transfer ref, bank, etc." />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-xs text-slate-500">
              <span v-if="settings.host_payout_notes">Note: {{ settings.host_payout_notes }}</span>
            </div>
            <button @click="savePayout" :disabled="savingPayout"
              class="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg font-semibold text-sm border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
              {{ savingPayout ? 'Saving...' : 'Update Payout' }}
            </button>
          </div>
        </div>

        <!-- Transaction History -->
        <div class="bg-[#111318] rounded-xl border border-slate-800">
          <div class="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <svg class="w-4 h-4 text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Transaction History
            </h3>
            <div class="flex items-center gap-2">
              <select v-model="txnFilter.status" @change="loadTransactions(1)"
                class="bg-[#0a0e17] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-[#0df2f2] outline-none">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="expired">Expired</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div v-if="transactions.length === 0" class="p-8 text-center text-slate-500 text-sm">
            No transactions found
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th class="px-5 py-3 font-semibold">Ref ID</th>
                  <th class="px-5 py-3 font-semibold">Channel</th>
                  <th class="px-5 py-3 font-semibold text-right">Amount</th>
                  <th class="px-5 py-3 font-semibold text-right">Fee</th>
                  <th class="px-5 py-3 font-semibold text-right">Received</th>
                  <th class="px-5 py-3 font-semibold">Status</th>
                  <th class="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50">
                <tr v-for="txn in transactions" :key="txn.transaction_uuid" class="hover:bg-white/[0.02] transition-colors">
                  <td class="px-5 py-3">
                    <p class="text-white font-mono text-xs">{{ txn.ref_id }}</p>
                    <p v-if="txn.trx_reference" class="text-slate-600 text-[10px]">{{ txn.trx_reference }}</p>
                  </td>
                  <td class="px-5 py-3">
                    <p class="text-white text-xs">{{ txn.payment_name || txn.channel_code }}</p>
                  </td>
                  <td class="px-5 py-3 text-right text-xs text-white font-medium">Rp {{ formatNumber(txn.nominal) }}</td>
                  <td class="px-5 py-3 text-right text-xs text-amber-400">Rp {{ formatNumber(txn.total_fee) }}</td>
                  <td class="px-5 py-3 text-right text-xs text-emerald-400 font-medium">Rp {{ formatNumber(txn.total_diterima) }}</td>
                  <td class="px-5 py-3">
                    <span :class="{
                      'bg-amber-500/10 text-amber-400 border-amber-500/20': txn.status === 'pending',
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': txn.status === 'paid',
                      'bg-red-500/10 text-red-400 border-red-500/20': txn.status === 'expired' || txn.status === 'failed',
                    }" class="text-[10px] px-2 py-1 rounded-md border font-semibold uppercase">
                      {{ txn.status }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{{ formatDate(txn.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="txnPagination.total_pages > 1" class="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Page {{ txnPagination.page }} of {{ txnPagination.total_pages }} ({{ txnPagination.total }} total)</span>
            <div class="flex items-center gap-2">
              <button @click="loadTransactions(txnPagination.page - 1)" :disabled="txnPagination.page <= 1"
                class="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">Prev</button>
              <button @click="loadTransactions(txnPagination.page + 1)" :disabled="txnPagination.page >= txnPagination.total_pages"
                class="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">Next</button>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ticketApi from '../../../services/ticketApi'

const route = useRoute()
const eventId = computed(() => route.params.eventId)

const payoutRemaining = computed(() => Math.max(0, (summary.value.host_payout || 0) - (settings.value.host_payout_total || 0)))

const loading = ref(true)
const savingPayout = ref(false)
const statusMessage = ref('')
const statusSuccess = ref(true)

const summary = ref({
  total_transactions: 0, total_nominal: 0, total_bayar: 0,
  total_gateway_fees: 0, total_received: 0, admin_total: 0, host_payout: 0,
})
const settings = ref({
  admin_fee_percent: 0, admin_fee_fixed: 0,
  host_payout_status: 'pending', host_payout_total: 0, host_payout_notes: '', host_payout_at: null,
})
const channelBreakdown = ref([])
const transactions = ref([])
const txnPagination = ref({ page: 1, limit: 50, total: 0, total_pages: 1 })
const txnFilter = reactive({ status: '' })

const payoutForm = reactive({ status: 'pending', payout_total: 0, notes: '' })

function formatNumber(n) {
  return (n || 0).toLocaleString('id-ID')
}
function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}
function showStatus(msg, success = true) {
  statusMessage.value = msg
  statusSuccess.value = success
  setTimeout(() => { statusMessage.value = '' }, 5000)
}

async function loadData() {
  try {
    loading.value = true
    const [financials] = await Promise.all([
      ticketApi.getEventFinancials(eventId.value),
    ])

    summary.value = financials.summary || summary.value
    settings.value = { ...settings.value, ...financials.settings }
    channelBreakdown.value = financials.channel_breakdown || []

    // Populate payout form from settings
    payoutForm.status = settings.value.host_payout_status || 'pending'
    payoutForm.payout_total = settings.value.host_payout_total || 0
    payoutForm.notes = settings.value.host_payout_notes || ''

    await loadTransactions(1)
  } catch (e) {
    showStatus(e.message || 'Failed to load financials', false)
  } finally {
    loading.value = false
  }
}

async function loadTransactions(page = 1) {
  try {
    const params = { page, limit: 50 }
    if (txnFilter.status) params.status = txnFilter.status
    const res = await ticketApi.getEventTransactions(eventId.value, params)
    transactions.value = res.transactions || []
    txnPagination.value = res.pagination || txnPagination.value
  } catch (e) {
    console.error('Failed to load transactions:', e)
  }
}

async function savePayout() {
  try {
    savingPayout.value = true
    await ticketApi.recordHostPayout(eventId.value, {
      status: payoutForm.status,
      payout_total: payoutForm.payout_total || undefined,
      notes: payoutForm.notes || undefined,
    })
    showStatus(`Payout status updated to ${payoutForm.status}`)
    await loadData()
  } catch (e) {
    showStatus(e.message || 'Failed to update payout', false)
  } finally {
    savingPayout.value = false
  }
}

onMounted(() => loadData())
</script>
