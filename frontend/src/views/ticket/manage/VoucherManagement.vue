<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0">
      <div>
        <h1 class="text-xl font-bold text-white">Vouchers</h1>
        <p class="text-sm text-slate-400 mt-0.5">
          {{ vouchers.length }} voucher{{ vouchers.length !== 1 ? 's' : '' }} ·
          {{ totalRedemptions }} total redemptions
        </p>
      </div>
      <button
        v-if="isAdmin"
        @click="showCreateForm = !showCreateForm"
        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0df2f2] text-[#0a0e17] text-sm font-bold
               hover:bg-[#00dada] transition-colors shadow-lg shadow-[#0df2f2]/20"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Voucher
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-6">

      <!-- Create / Edit Form -->
      <div v-if="showCreateForm && isAdmin"
        class="bg-[#111827] border border-[#1f2937] rounded-xl p-6 space-y-4 shadow-lg">
        <h2 class="text-base font-bold text-white">{{ editingVoucher ? 'Edit Voucher' : 'Create New Voucher' }}</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Code -->
          <div>
            <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Voucher Code</label>
            <input
              v-model="form.code"
              @input="form.code = form.code.toUpperCase()"
              placeholder="e.g. EARLYBIRD20"
              class="w-full bg-[#0a0e17] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white text-sm
                     placeholder:text-slate-600 focus:outline-none focus:border-[#0df2f2] transition-colors font-mono tracking-wider"
            />
          </div>

          <!-- Max Uses -->
          <div>
            <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Max Uses</label>
            <input
              v-model.number="form.max_uses"
              type="number" min="1"
              placeholder="e.g. 50"
              class="w-full bg-[#0a0e17] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white text-sm
                     placeholder:text-slate-600 focus:outline-none focus:border-[#0df2f2] transition-colors"
            />
          </div>

          <!-- Discount Type -->
          <div>
            <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Discount Type</label>
            <div class="flex rounded-lg overflow-hidden border border-[#2d3748]">
              <button
                type="button"
                @click="form.discount_type = 'fixed'"
                class="flex-1 py-2.5 text-sm font-medium transition-colors"
                :class="form.discount_type === 'fixed'
                  ? 'bg-[#0df2f2] text-[#0a0e17]'
                  : 'bg-[#0a0e17] text-slate-400 hover:text-white'"
              >Fixed (IDR)</button>
              <button
                type="button"
                @click="form.discount_type = 'percent'"
                class="flex-1 py-2.5 text-sm font-medium transition-colors border-l border-[#2d3748]"
                :class="form.discount_type === 'percent'
                  ? 'bg-[#0df2f2] text-[#0a0e17]'
                  : 'bg-[#0a0e17] text-slate-400 hover:text-white'"
              >Percent (%)</button>
            </div>
          </div>

          <!-- Discount Value -->
          <div>
            <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Discount Value {{ form.discount_type === 'percent' ? '(%)' : '(IDR)' }}
            </label>
            <input
              v-model.number="form.discount_value"
              type="number" :min="1" :max="form.discount_type === 'percent' ? 100 : undefined"
              :placeholder="form.discount_type === 'percent' ? 'e.g. 20' : 'e.g. 50000'"
              class="w-full bg-[#0a0e17] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white text-sm
                     placeholder:text-slate-600 focus:outline-none focus:border-[#0df2f2] transition-colors"
            />
          </div>

          <!-- Active Status Toggle -->
          <div class="flex flex-col justify-end pb-1">
            <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Voucher Status</label>
            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="form.is_active = !form.is_active"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0df2f2] focus:ring-offset-2"
                :class="form.is_active ? 'bg-[#0df2f2]' : 'bg-slate-700'"
              >
                <span
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  :class="form.is_active ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
              <span class="text-sm text-slate-300">{{ form.is_active ? 'Active' : 'Inactive' }}</span>
            </div>
          </div>
        </div>

        <!-- Form Error -->
        <p v-if="formError" class="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
          {{ formError }}
        </p>

        <!-- Buttons -->
        <div class="flex gap-3 pt-2">
          <button
            @click="submitForm"
            :disabled="saving"
            class="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0df2f2] text-[#0a0e17] text-sm font-bold
                   hover:bg-[#00dada] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div v-if="saving" class="w-4 h-4 border-2 border-[#0a0e17]/30 border-t-[#0a0e17] rounded-full animate-spin"></div>
            {{ saving ? 'Saving...' : (editingVoucher ? 'Save Changes' : 'Create Voucher') }}
          </button>
          <button
            @click="cancelForm"
            class="px-5 py-2.5 rounded-lg border border-[#1f2937] text-slate-400 text-sm font-medium
                   hover:bg-[#1f2937] hover:text-white transition-colors"
          >Cancel</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-4 border-[#0df2f2]/20 border-t-[#0df2f2] rounded-full animate-spin"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="vouchers.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-16 h-16 rounded-2xl bg-[#0df2f2]/10 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-white mb-1">No vouchers yet</h3>
        <p class="text-sm text-slate-400">
          {{ isAdmin ? 'Create your first voucher to offer discounts to attendees.' : 'No vouchers have been created for this event.' }}
        </p>
      </div>

      <!-- Voucher Table -->
      <div v-else class="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[#1f2937] text-xs text-slate-500 uppercase tracking-wider">
              <th class="text-left px-5 py-3.5 font-semibold">Code</th>
              <th class="text-left px-5 py-3.5 font-semibold hidden md:table-cell">Discount</th>
              <th class="text-left px-5 py-3.5 font-semibold hidden sm:table-cell">Uses</th>
              <th class="text-left px-5 py-3.5 font-semibold">Status</th>
              <th class="text-right px-5 py-3.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#1f2937]">
            <tr
              v-for="v in vouchers"
              :key="v.voucher_uuid"
              class="hover:bg-white/[0.02] transition-colors"
            >
              <td class="px-5 py-4">
                <span class="font-mono font-bold text-white tracking-wider text-sm">{{ v.code }}</span>
              </td>
              <td class="px-5 py-4 hidden md:table-cell text-slate-300">
                <span v-if="v.discount_type === 'fixed'">IDR {{ Number(v.discount_value).toLocaleString('id-ID') }}</span>
                <span v-else>{{ v.discount_value }}%</span>
              </td>
              <td class="px-5 py-4 hidden sm:table-cell">
                <div class="flex items-center gap-2">
                  <div class="flex-1 max-w-[80px] h-1.5 rounded-full bg-[#1f2937]">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="v.uses_count >= v.max_uses ? 'bg-slate-500' : 'bg-[#0df2f2]'"
                      :style="{ width: Math.min(100, (v.uses_count / v.max_uses) * 100) + '%' }"
                    ></div>
                  </div>
                  <span class="text-slate-400 text-xs tabular-nums">{{ v.uses_count }}/{{ v.max_uses }}</span>
                </div>
              </td>
              <td class="px-5 py-4">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="v.is_active && v.uses_count < v.max_uses
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : v.uses_count >= v.max_uses
                      ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'"
                >
                  <span class="w-1.5 h-1.5 rounded-full"
                    :class="v.is_active && v.uses_count < v.max_uses ? 'bg-green-400' : 'bg-current'"
                  ></span>
                  {{ v.uses_count >= v.max_uses ? 'Exhausted' : (v.is_active ? 'Live' : 'Inactive') }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-2">
                  <!-- View Usages -->
                  <button
                    v-if="v.uses_count > 0"
                    @click="openUsageDrawer(v)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-[#0df2f2] hover:bg-[#0df2f2]/10 transition-colors"
                    title="View usages"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <!-- Edit -->
                  <button
                    v-if="isAdmin"
                    @click="startEdit(v)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2937] transition-colors"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <!-- Delete -->
                  <button
                    v-if="isAdmin && v.uses_count === 0"
                    @click="deleteVoucher(v)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Usage Drawer Overlay -->
    <transition name="fade">
      <div v-if="usageDrawer.open" class="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" @click="usageDrawer.open = false"></div>
    </transition>

    <!-- Usage Drawer -->
    <transition name="slide-right">
      <div v-if="usageDrawer.open"
        class="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-[#111318] border-l border-slate-800 z-50 flex flex-col shadow-2xl">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <h2 class="text-base font-bold text-white">Voucher Usages</h2>
            <p class="text-xs text-slate-400 font-mono mt-0.5">{{ usageDrawer.voucher?.code }}</p>
          </div>
          <button @click="usageDrawer.open = false"
            class="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="usageDrawer.loading" class="flex justify-center py-12">
            <div class="w-6 h-6 border-2 border-[#0df2f2]/20 border-t-[#0df2f2] rounded-full animate-spin"></div>
          </div>
          <div v-else-if="usageDrawer.usages.length === 0" class="text-center py-12">
            <p class="text-slate-400 text-sm">No usages recorded yet.</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="u in usageDrawer.usages"
              :key="u.ticket_uuid"
              class="bg-[#0a0e17] border border-[#1f2937] rounded-xl p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-white truncate">
                    {{ u.nickname || u.first_name || 'Unknown' }}
                    <span v-if="u.first_name && u.nickname" class="text-slate-500 font-normal">· {{ u.first_name }}</span>
                  </p>
                  <p class="text-xs text-slate-400 mt-0.5">{{ u.tier_name }}</p>
                </div>
                <div class="text-right shrink-0">
                  <span v-if="u.ticket_number"
                    class="text-xs font-mono text-[#0df2f2] bg-[#0df2f2]/10 px-2 py-0.5 rounded border border-[#0df2f2]/20">
                    #{{ u.ticket_number }}
                  </span>
                  <span v-else class="text-xs text-slate-500">Pending</span>
                </div>
              </div>
              <div class="flex items-center justify-between mt-3 pt-3 border-t border-[#1f2937]">
                <span class="text-xs text-slate-500">{{ formatDate(u.created_at) }}</span>
                <span class="text-xs font-medium"
                  :class="u.purchase_status === 'paid' ? 'text-green-400' : u.purchase_status === 'under_payment' ? 'text-amber-400' : 'text-slate-400'">
                  {{ u.purchase_status === 'paid' ? '✓ Paid' : u.purchase_status === 'under_payment' ? '⏳ Pending' : u.purchase_status }}
                </span>
              </div>
              <div class="mt-2 text-xs text-slate-400">
                Discount: <span class="text-red-400 font-medium">− IDR {{ Number(u.discount_amount).toLocaleString('id-ID') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ticketApi from '../../../services/ticketApi'

const props = defineProps({
  event: Object,
  userEventRole: String,
})

const route = useRoute()
const eventId = computed(() => route.params.eventId)
const isAdmin = computed(() => props.userEventRole === 'ADMIN')

// ─── State ────────────────────────────────────────
const loading = ref(false)
const vouchers = ref([])
const showCreateForm = ref(false)
const editingVoucher = ref(null)
const saving = ref(false)
const formError = ref(null)

const form = ref({
  code: '',
  discount_type: 'percent',
  discount_value: null,
  max_uses: null,
  is_active: true,
})

const usageDrawer = ref({
  open: false,
  voucher: null,
  usages: [],
  loading: false,
})

// ─── Computed ──────────────────────────────────────
const totalRedemptions = computed(() =>
  vouchers.value.reduce((sum, v) => sum + (v.uses_count || 0), 0)
)

// ─── Fetch ────────────────────────────────────────
async function fetchVouchers() {
  loading.value = true
  try {
    const data = await ticketApi.getVouchers(eventId.value)
    vouchers.value = data.vouchers || []
  } catch (err) {
    console.error('Failed to load vouchers:', err)
  } finally {
    loading.value = false
  }
}

// ─── Form ─────────────────────────────────────────
function resetForm() {
  form.value = { code: '', discount_type: 'percent', discount_value: null, max_uses: null, is_active: true }
  formError.value = null
  editingVoucher.value = null
}

function cancelForm() {
  showCreateForm.value = false
  resetForm()
}

function startEdit(voucher) {
  editingVoucher.value = voucher
  form.value = {
    code: voucher.code,
    discount_type: voucher.discount_type,
    discount_value: voucher.discount_value,
    max_uses: voucher.max_uses,
    is_active: Boolean(voucher.is_active),
  }
  showCreateForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function submitForm() {
  formError.value = null
  if (!form.value.code?.trim()) {
    formError.value = 'Voucher code is required.'; return
  }
  if (!form.value.discount_value || form.value.discount_value <= 0) {
    formError.value = 'Discount value must be a positive number.'; return
  }
  if (form.value.discount_type === 'percent' && form.value.discount_value > 100) {
    formError.value = 'Percent discount cannot exceed 100%.'; return
  }
  if (!form.value.max_uses || form.value.max_uses < 1) {
    formError.value = 'Max uses must be at least 1.'; return
  }

  saving.value = true
  try {
    const payload = {
      code: form.value.code.trim().toUpperCase(),
      discount_type: form.value.discount_type,
      discount_value: Number(form.value.discount_value),
      max_uses: Number(form.value.max_uses),
      is_active: form.value.is_active ? 1 : 0,
    }

    if (editingVoucher.value) {
      await ticketApi.updateVoucher(eventId.value, editingVoucher.value.voucher_uuid, payload)
    } else {
      await ticketApi.createVoucher(eventId.value, payload)
    }
    showCreateForm.value = false
    resetForm()
    await fetchVouchers()
  } catch (err) {
    formError.value = err.message || 'Failed to save voucher.'
  } finally {
    saving.value = false
  }
}

async function deleteVoucher(voucher) {
  if (!confirm(`Delete voucher "${voucher.code}"? This cannot be undone.`)) return
  try {
    await ticketApi.deleteVoucher(eventId.value, voucher.voucher_uuid)
    await fetchVouchers()
  } catch (err) {
    alert(err.message || 'Failed to delete voucher.')
  }
}

// ─── Usage Drawer ──────────────────────────────────
async function openUsageDrawer(voucher) {
  usageDrawer.value.open = true
  usageDrawer.value.voucher = voucher
  usageDrawer.value.usages = []
  usageDrawer.value.loading = true
  try {
    const data = await ticketApi.getVoucherUsages(eventId.value, voucher.voucher_uuid)
    usageDrawer.value.usages = data.usages || []
  } catch (err) {
    console.error('Failed to load usages:', err)
  } finally {
    usageDrawer.value.loading = false
  }
}

// ─── Helpers ──────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

onMounted(fetchVouchers)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
