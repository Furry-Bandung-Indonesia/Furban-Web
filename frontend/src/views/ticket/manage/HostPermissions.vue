<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <header class="shrink-0 bg-[#101622] z-10 px-6 pt-6 pb-3">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Host Permissions</h2>
          <p class="text-slate-400 text-sm mt-1">Manage who can access event admin and check-in tools.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 bg-[#161e2c] px-4 py-2.5 rounded-lg border border-slate-800/50 text-sm">
            <span class="size-2 rounded-full bg-green-400 animate-pulse"></span>
            <span class="text-slate-400">Active Hosts:</span>
            <span class="font-bold text-white">{{ permissions.length }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-6 pt-2">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left: Add Host Panel -->
        <div class="lg:col-span-4">
          <div class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden sticky top-4">
            <div class="px-6 py-4 border-b border-slate-800">
              <h3 class="text-lg font-bold text-white">Add Host</h3>
              <p class="text-xs text-slate-400 mt-1">Search users by name, nickname, or email.</p>
            </div>
            <div class="p-6 space-y-4">
              <!-- Search Input -->
              <div class="relative">
                <label class="block text-sm font-medium text-slate-300 mb-2">Search User *</label>
                <div class="relative">
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    v-model="searchQuery"
                    @input="onSearchInput"
                    @focus="showDropdown = searchResults.length > 0"
                    class="w-full h-11 pl-10 pr-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm"
                    placeholder="Type name, nickname, or email..."
                    autocomplete="off"
                  />
                  <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
                    <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#0df2f2]"></div>
                  </div>
                </div>

                <!-- Search Results Dropdown -->
                <div v-if="showDropdown && searchResults.length > 0" class="absolute z-20 left-0 right-0 mt-1 bg-[#1a2235] rounded-xl border border-slate-700 shadow-2xl max-h-64 overflow-y-auto">
                  <button
                    v-for="user in searchResults"
                    :key="user.uuid"
                    @click="selectUser(user)"
                    class="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#0df2f2]/10 transition-colors text-left border-b border-slate-800/50 last:border-0"
                  >
                    <div class="size-9 rounded-full bg-gradient-to-tr from-[#0df2f2] to-[#0df2f2]/40 flex items-center justify-center text-sm font-bold text-[#0a0e17] shrink-0">
                      {{ getInitial(user) }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-white truncate">{{ getDisplayName(user) }}</p>
                      <p class="text-xs text-slate-400 truncate">{{ user.email }}</p>
                    </div>
                    <span class="text-[10px] font-medium text-slate-500 uppercase tracking-wider shrink-0 px-1.5 py-0.5 rounded bg-slate-800">{{ user.role }}</span>
                  </button>
                </div>

                <!-- No results -->
                <div v-if="showDropdown && searchQuery.length >= 2 && !isSearching && searchResults.length === 0" class="absolute z-20 left-0 right-0 mt-1 bg-[#1a2235] rounded-xl border border-slate-700 shadow-2xl p-4 text-center">
                  <p class="text-sm text-slate-400">No users found matching "{{ searchQuery }}"</p>
                </div>
              </div>

              <!-- Selected User Preview -->
              <div v-if="selectedUser" class="bg-slate-900/50 rounded-lg p-4 ring-1 ring-[#0df2f2]/30">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="size-10 rounded-full bg-gradient-to-tr from-[#0df2f2] to-[#0df2f2]/40 flex items-center justify-center text-sm font-bold text-[#0a0e17] shrink-0">
                      {{ getInitial(selectedUser) }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-white truncate">{{ getDisplayName(selectedUser) }}</p>
                      <p class="text-xs text-slate-400 truncate">{{ selectedUser.email }}</p>
                    </div>
                  </div>
                  <button @click="clearSelection" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <!-- Role Selection -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Role</label>
                <select v-model="addForm.role" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm">
                  <option value="HOST">HOST — Scanner (check-in only)</option>
                  <option value="ADMIN">ADMIN — Full management</option>
                </select>
              </div>

              <div v-if="addError" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{{ addError }}</div>
              <div v-if="addSuccess" class="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{{ addSuccess }}</div>

              <button @click="addHost" :disabled="isAdding || !selectedUser" class="w-full px-4 py-2.5 rounded-lg bg-[#0df2f2] text-[#0a0e17] font-semibold text-sm hover:bg-[#00dada] disabled:opacity-50 transition-colors">
                {{ isAdding ? 'Assigning...' : 'Assign Access' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Active Hosts Grid -->
        <div class="lg:col-span-8">
          <div v-if="isLoading" class="flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0df2f2]"></div>
          </div>

          <div v-else-if="permissions.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <div class="size-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-1">No hosts assigned</h3>
            <p class="text-sm text-slate-400">Search and add users to grant them access to manage this event.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="perm in permissions" :key="perm.permission_uuid" class="bg-[#161e2c] rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition-colors">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div class="relative">
                    <div class="size-12 rounded-full bg-gradient-to-tr from-[#0df2f2] to-[#0df2f2]/40 flex items-center justify-center text-lg font-bold text-[#0a0e17]">
                      {{ getPermInitial(perm) }}
                    </div>
                    <span class="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-[#161e2c] bg-green-400"></span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-white truncate">{{ perm.display_name || perm.user_uuid?.slice(0, 12) + '...' }}</p>
                    <p class="text-xs text-slate-400 truncate">{{ perm.display_email || 'No email stored' }}</p>
                  </div>
                </div>
                <span :class="perm.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 ring-purple-500/20' : 'bg-[#0df2f2]/10 text-[#0df2f2] ring-[#0df2f2]/20'"
                  class="shrink-0 inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset uppercase tracking-wider">
                  {{ perm.role }}
                </span>
              </div>

              <!-- Role Switcher & Revoke -->
              <div class="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <select :value="perm.role" @change="changeRole(perm, ($event.target).value)" class="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]">
                  <option value="HOST">HOST</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <button @click="revokeAccess(perm)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-600/10 hover:ring-1 hover:ring-red-600/30 transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                  Revoke
                </button>
              </div>

              <!-- Granted info -->
              <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>Added {{ formatDate(perm.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import ticketApi from '../../../services/ticketApi'
import authApi from '../../../services/authApi'

const props = defineProps({ event: Object })
const route = useRoute()
const eventId = computed(() => route.params.eventId)

const isLoading = ref(true)
const permissions = ref([])
const isAdding = ref(false)
const addError = ref('')
const addSuccess = ref('')
const addForm = ref({ role: 'HOST' })

// Search state
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const showDropdown = ref(false)
const selectedUser = ref(null)
let searchTimeout = null

function getInitial(user) {
  return (user.nickname || user.first_name || user.email || 'U')[0].toUpperCase()
}

function getDisplayName(user) {
  if (user.nickname) return user.nickname
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
  if (user.first_name) return user.first_name
  if (user.legal_name) return user.legal_name
  return user.email?.split('@')[0] || 'Unknown'
}

function getPermInitial(perm) {
  return (perm.display_name || perm.user_uuid || 'U')[0].toUpperCase()
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function onSearchInput() {
  addError.value = ''
  addSuccess.value = ''
  if (selectedUser.value) {
    selectedUser.value = null
  }

  if (searchTimeout) clearTimeout(searchTimeout)

  if (searchQuery.value.length < 2) {
    searchResults.value = []
    showDropdown.value = false
    return
  }

  searchTimeout = setTimeout(async () => {
    isSearching.value = true
    try {
      const res = await authApi.searchUsers(searchQuery.value)
      searchResults.value = res.users || []
      showDropdown.value = true
    } catch (e) {
      console.error('Search failed:', e)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
}

function selectUser(user) {
  selectedUser.value = user
  searchQuery.value = getDisplayName(user)
  showDropdown.value = false
  searchResults.value = []
  addError.value = ''
}

function clearSelection() {
  selectedUser.value = null
  searchQuery.value = ''
  searchResults.value = []
}

// Close dropdown when clicking outside
function handleClickOutside(e) {
  if (!e.target.closest('.relative')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadPermissions()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchTimeout) clearTimeout(searchTimeout)
})

async function loadPermissions() {
  isLoading.value = true
  try {
    const res = await ticketApi.getPermissions(eventId.value)
    permissions.value = res.permissions || res || []
  } catch (e) {
    console.error('Failed to load permissions:', e)
  } finally {
    isLoading.value = false
  }
}

async function addHost() {
  if (!selectedUser.value) return
  isAdding.value = true
  addError.value = ''
  addSuccess.value = ''
  try {
    await ticketApi.addPermission(eventId.value, {
      user_uuid: selectedUser.value.uuid,
      role: addForm.value.role,
      display_name: getDisplayName(selectedUser.value),
      display_email: selectedUser.value.email,
    })
    addSuccess.value = `${getDisplayName(selectedUser.value)} has been assigned as ${addForm.value.role}`
    clearSelection()
    addForm.value.role = 'HOST'
    await loadPermissions()
    setTimeout(() => { addSuccess.value = '' }, 4000)
  } catch (e) {
    addError.value = e.message || 'Failed to add host'
  } finally {
    isAdding.value = false
  }
}

async function changeRole(perm, newRole) {
  try {
    await ticketApi.updatePermission(eventId.value, perm.permission_uuid, { role: newRole })
    perm.role = newRole
  } catch (e) {
    alert(e.message || 'Failed to update role')
  }
}

async function revokeAccess(perm) {
  const name = perm.display_name || perm.user_uuid?.slice(0, 12)
  if (!confirm(`Revoke access for ${name}? They will no longer be able to manage this event.`)) return
  try {
    await ticketApi.removePermission(eventId.value, perm.permission_uuid)
    await loadPermissions()
  } catch (e) {
    alert(e.message || 'Failed to revoke access')
  }
}
</script>
