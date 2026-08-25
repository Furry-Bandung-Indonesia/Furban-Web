<template>
  <div class="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <div class="size-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </div>
          Telegram Bot Integration
        </h1>
        <p class="text-slate-400 mt-1">Manage AI admin assistant access and connected Telegram accounts.</p>
      </div>

      <button
        @click="loadData"
        :disabled="loading"
        class="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 text-sm font-medium">
        <svg :class="{'animate-spin': loading}" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>

    <!-- Notification / Alert -->
    <div v-if="alertMessage" :class="alertType === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'"
      class="border rounded-xl p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <svg v-if="alertType === 'error'" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <svg v-else class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        <span class="text-sm font-medium">{{ alertMessage }}</span>
      </div>
      <button @click="alertMessage = ''" class="hover:opacity-75">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>

    <!-- Section 1: My Telegram Connection Status -->
    <div class="bg-[#111318] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-2 max-w-2xl">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-bold text-white">My Telegram Account</h2>
            <span v-if="myTelegram.linked"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span class="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Connected
            </span>
            <span v-else
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
              Not Connected
            </span>
          </div>

          <p v-if="myTelegram.linked" class="text-slate-300 text-sm">
            Your account is connected to Telegram ID:
            <code class="px-2 py-0.5 bg-slate-900 text-sky-400 rounded text-xs border border-slate-800 font-mono font-bold">{{ myTelegram.id }}</code>
            <span v-if="myTelegram.username"> (@{{ myTelegram.username }})</span>.
            You can interact directly with the Telegram AI assistant bot.
          </p>
          <p v-else class="text-slate-400 text-sm">
            Link your Telegram account to command the Furban AI Assistant bot. You will be able to create events, manage tickets, check in attendees, and control moderation directly from Telegram.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            v-if="myTelegram.linked"
            @click="unlinkMyTelegram"
            :disabled="actionLoading"
            class="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Disconnect Telegram
          </button>
          <button
            v-else
            @click="showLinkModal = true"
            class="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-slate-950 rounded-xl text-sm font-bold transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
            Connect Telegram
          </button>
        </div>
      </div>
    </div>

    <!-- Section 2: Connected Users List (Admin View) -->
    <div class="bg-[#111318] border border-slate-800 rounded-2xl overflow-hidden">
      <div class="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-white">Connected Telegram Users</h2>
          <p class="text-slate-400 text-sm mt-0.5">List of all administrators with active Telegram bot connections.</p>
        </div>

        <div class="relative w-full sm:w-64">
          <svg class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            class="w-full bg-[#101622] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
        </div>
      </div>

      <!-- Users Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800/80 bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th class="py-3.5 px-6">User</th>
              <th class="py-3.5 px-6">Role</th>
              <th class="py-3.5 px-6">Telegram ID</th>
              <th class="py-3.5 px-6">Telegram Username</th>
              <th class="py-3.5 px-6">Linked At</th>
              <th class="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50 text-sm">
            <tr v-if="filteredUsers.length === 0" class="text-slate-500 text-center">
              <td colspan="6" class="py-8">
                <div class="flex flex-col items-center justify-center gap-2">
                  <svg class="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p>{{ searchQuery ? 'No matching connected users found' : 'No users have connected their Telegram account yet' }}</p>
                </div>
              </td>
            </tr>

            <tr v-for="u in filteredUsers" :key="u.uuid" class="hover:bg-slate-900/40 transition-colors">
              <td class="py-3.5 px-6">
                <div class="flex items-center gap-3">
                  <div class="size-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs text-sky-400 shrink-0">
                    <img v-if="u.profile_image_url" :src="getAuthImageUrl(u.profile_image_url)" class="w-full h-full object-cover" />
                    <span v-else>{{ (u.nickname || u.email || 'U')[0].toUpperCase() }}</span>
                  </div>
                  <div class="truncate">
                    <p class="font-medium text-white truncate">{{ u.nickname || u.legal_name || 'No Name' }}</p>
                    <p class="text-xs text-slate-500 truncate">{{ u.email }}</p>
                  </div>
                </div>
              </td>

              <td class="py-3.5 px-6">
                <span class="px-2 py-0.5 rounded text-xs font-semibold capitalize"
                  :class="{
                    'bg-red-500/10 text-red-400 border border-red-500/20': u.role === 'admin',
                    'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20': u.role === 'publisher',
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': u.role === 'photographer',
                    'bg-slate-800 text-slate-400': u.role === 'user'
                  }">
                  {{ u.role }}
                </span>
              </td>

              <td class="py-3.5 px-6">
                <code class="px-2 py-0.5 bg-slate-900 text-sky-400 rounded text-xs border border-slate-800 font-mono">{{ u.telegram_id }}</code>
              </td>

              <td class="py-3.5 px-6 text-slate-300">
                <span v-if="u.telegram_username" class="text-sky-400">@{{ u.telegram_username }}</span>
                <span v-else class="text-slate-600">—</span>
              </td>

              <td class="py-3.5 px-6 text-xs text-slate-400">
                {{ formatDate(u.telegram_linked_at) }}
              </td>

              <td class="py-3.5 px-6 text-right">
                <button
                  @click="adminUnlink(u)"
                  :disabled="actionLoading"
                  class="px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                  title="Unlink Telegram account">
                  Unlink
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Link Telegram Modal -->
    <div v-if="showLinkModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-[#111318] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5 text-white font-bold text-lg">
            <div class="size-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </div>
            Connect Telegram
          </div>
          <button @click="showLinkModal = false" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Step-by-step Instructions -->
        <div class="bg-[#101622] rounded-xl p-4 border border-slate-800/80 space-y-2.5 text-xs text-slate-300">
          <p class="font-bold text-white text-xs tracking-wide uppercase">How to find your Telegram ID:</p>
          <ol class="list-decimal list-inside space-y-1.5 text-slate-400">
            <li>Open Telegram and start our bot: <a href="https://t.me/FurbanBot" target="_blank" class="text-sky-400 underline font-medium">@FurbanBot</a> (or search for your bot)</li>
            <li>Send the command <code class="px-1.5 py-0.5 bg-slate-800 text-sky-300 rounded font-mono">/start</code> or <code class="px-1.5 py-0.5 bg-slate-800 text-sky-300 rounded font-mono">/whoami</code></li>
            <li>Copy your numeric <strong>Telegram User ID</strong> and paste it below.</li>
          </ol>
        </div>

        <form @submit.prevent="submitLink" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Telegram User ID <span class="text-red-400">*</span></label>
            <input
              v-model="linkForm.telegram_id"
              type="text"
              required
              placeholder="e.g. 123456789"
              class="w-full bg-[#101622] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-mono" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Telegram Username (optional)</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
              <input
                v-model="linkForm.telegram_username"
                type="text"
                placeholder="yourusername"
                class="w-full bg-[#101622] border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors" />
            </div>
          </div>

          <div class="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="showLinkModal = false"
              class="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              :disabled="actionLoading || !linkForm.telegram_id"
              class="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center gap-2">
              <svg v-if="actionLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Link Account
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import authApi from '@/services/authApi'
import { getAuthImageUrl } from '@/config/api'

const authStore = useAuthStore()

const loading = ref(false)
const actionLoading = ref(false)
const alertMessage = ref('')
const alertType = ref('success')

const showLinkModal = ref(false)
const searchQuery = ref('')
const connectedUsers = ref([])

const linkForm = ref({
  telegram_id: '',
  telegram_username: '',
})

const myTelegram = computed(() => {
  const u = authStore.user
  return {
    linked: !!u?.telegram_id,
    id: u?.telegram_id || '',
    username: u?.telegram_username || '',
    linked_at: u?.telegram_linked_at || null,
  }
})

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return connectedUsers.value
  const q = searchQuery.value.toLowerCase().trim()
  return connectedUsers.value.filter(u =>
    (u.nickname && u.nickname.toLowerCase().includes(q)) ||
    (u.legal_name && u.legal_name.toLowerCase().includes(q)) ||
    (u.email && u.email.toLowerCase().includes(q)) ||
    (u.telegram_id && String(u.telegram_id).includes(q)) ||
    (u.telegram_username && u.telegram_username.toLowerCase().includes(q))
  )
})

function showAlert(message, type = 'success') {
  alertMessage.value = message
  alertType.value = type
  setTimeout(() => {
    if (alertMessage.value === message) alertMessage.value = ''
  }, 5000)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

async function loadData() {
  loading.value = true
  try {
    // Refresh current user profile
    await authStore.checkAuth(true)

    // Fetch list of telegram-linked users (admin only)
    if (authStore.isAdmin) {
      const res = await authApi.getTelegramUsers()
      connectedUsers.value = Array.isArray(res) ? res : []
    }
  } catch (e) {
    console.error('Failed to load Telegram integration data:', e)
    showAlert(e.message || 'Failed to load Telegram users', 'error')
  } finally {
    loading.value = false
  }
}

async function submitLink() {
  if (!linkForm.value.telegram_id) return
  actionLoading.value = true
  try {
    await authApi.linkTelegram(linkForm.value.telegram_id, linkForm.value.telegram_username)
    showAlert('Telegram account successfully linked!')
    showLinkModal.value = false
    linkForm.value = { telegram_id: '', telegram_username: '' }
    await loadData()
  } catch (e) {
    showAlert(e.message || 'Failed to link Telegram account', 'error')
  } finally {
    actionLoading.value = false
  }
}

async function unlinkMyTelegram() {
  if (!confirm('Are you sure you want to disconnect your Telegram account from Furban?')) return
  actionLoading.value = true
  try {
    await authApi.unlinkTelegram()
    showAlert('Telegram account disconnected.')
    await loadData()
  } catch (e) {
    showAlert(e.message || 'Failed to disconnect Telegram account', 'error')
  } finally {
    actionLoading.value = false
  }
}

async function adminUnlink(targetUser) {
  if (!confirm(`Are you sure you want to unlink Telegram for ${targetUser.nickname || targetUser.email}?`)) return
  actionLoading.value = true
  try {
    await authApi.adminUnlinkTelegram(targetUser.uuid)
    showAlert(`Unlinked Telegram for ${targetUser.nickname || targetUser.email}`)
    await loadData()
  } catch (e) {
    showAlert(e.message || 'Failed to unlink user', 'error')
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
