<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <header class="shrink-0 bg-[#101622] z-10 p-6 pb-2">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-white">Events</h2>
          <p class="text-slate-400 mt-1">{{ isPlatformAdmin ? 'Manage your events, tickets, and attendees.' : 'Events you have access to manage.' }}</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="hidden lg:flex items-center gap-4 bg-[#161e2c] px-4 py-2 rounded-lg border border-slate-800/50">
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-green-500 animate-pulse"></span>
              <span class="text-xs font-medium text-slate-400">Active Events: <span class="text-white">{{ publishedCount }}</span></span>
            </div>
          </div>
        </div>
      </div>
      <!-- Controls -->
      <div class="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-[#1a202c] p-3 rounded-xl border border-slate-800">
        <div class="w-full xl:max-w-md relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="w-5 h-5 text-slate-400 group-focus-within:text-[#0df2f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input v-model="searchQuery" class="block w-full rounded-lg border-0 py-2.5 pl-10 text-white bg-slate-900 ring-1 ring-inset ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0df2f2] sm:text-sm" placeholder="Search events..." type="text" />
        </div>
        <div class="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <select v-model="statusFilter" class="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
          <div class="flex-1 xl:flex-none"></div>
          <button v-if="isPlatformAdmin" @click="showCreateModal = true" class="inline-flex items-center gap-2 rounded-lg bg-[#0df2f2] px-4 py-2.5 text-sm font-semibold text-[#0a0e17] hover:bg-[#00dada] transition-colors min-w-[140px]">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            New Event
          </button>
        </div>
      </div>
    </header>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto p-6 pt-4">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0df2f2]"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredEvents.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="size-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
        <h3 class="text-lg font-bold text-white mb-1">No events found</h3>
        <p class="text-slate-400 text-sm">{{ searchQuery ? 'Try a different search.' : 'Create your first event to get started.' }}</p>
      </div>

      <!-- Event Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
        <router-link v-for="ev in filteredEvents" :key="ev.event_uuid" :to="`/event/manage/${ev.event_uuid}`"
          class="group flex flex-col bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden hover:shadow-md hover:border-[#0df2f2]/50 transition-all duration-300">
          <!-- Thumbnail -->
          <div class="relative aspect-[16/9] overflow-hidden bg-slate-800">
            <img v-if="ev.banner_filename" :src="getImageUrl(ev.banner_filename)" :alt="ev.event_name" class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
            <div v-else class="w-full h-full flex items-center justify-center text-slate-600">
              <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div class="absolute top-3 right-3">
              <span :class="statusBadge(ev.status)" class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset backdrop-blur-md">
                {{ ev.status || 'draft' }}
              </span>
            </div>
          </div>
          <!-- Info -->
          <div class="flex flex-col flex-1 p-5">
            <div class="mb-4">
              <h3 class="text-base font-bold text-white leading-snug truncate">{{ ev.event_name }}</h3>
              <div class="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>{{ formatDate(ev.start_time) }}</span>
                <span v-if="ev.location_name" class="mx-1">•</span>
                <span v-if="ev.location_name" class="truncate">{{ ev.location_name }}</span>
              </div>
            </div>
            <div class="mt-auto space-y-3">
              <div class="flex justify-between items-end text-sm">
                <span class="text-slate-400 text-xs uppercase font-semibold tracking-wider">Tickets Sold</span>
                <span class="font-medium text-white tabular-nums">{{ ev.stats?.paid_tickets || 0 }}<span class="text-slate-400 text-xs font-normal">/{{ ev.stats?.quota_total || 0 }}</span></span>
              </div>
              <div class="relative w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div class="absolute top-0 left-0 h-full bg-[#0df2f2] rounded-full transition-all" :style="{ width: soldPercent(ev) + '%' }"></div>
              </div>
              <div class="pt-3 flex items-center justify-between border-t border-slate-800">
                <div class="flex flex-col">
                  <span class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Hosts</span>
                  <span class="text-sm font-bold text-white">{{ ev.hosts_count || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </router-link>

        <!-- Create New Card -->
        <button v-if="isPlatformAdmin" @click="showCreateModal = true" class="group flex flex-col items-center justify-center min-h-[300px] bg-[#161e2c] rounded-xl border border-dashed border-slate-800 hover:border-[#0df2f2]/50 cursor-pointer transition-all">
          <div class="size-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-400 group-hover:text-[#0df2f2] group-hover:scale-110 transition-all">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          </div>
          <h3 class="text-lg font-bold text-white">Create New Event</h3>
          <p class="text-sm text-slate-400 mt-1 max-w-[200px] text-center">Start from scratch.</p>
        </button>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showCreateModal = false">
      <div class="w-full max-w-lg max-h-[90vh] bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h2 class="text-xl font-bold text-white">Create New Event</h2>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form @submit.prevent="handleCreate" class="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Event Name *</label>
            <input v-model="createForm.event_name" required class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2]" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea v-model="createForm.description" rows="3" class="w-full px-4 py-3 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] resize-none"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Start Time *</label>
              <input v-model="createForm.start_time" type="datetime-local" required class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2]" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">End Time *</label>
              <input v-model="createForm.end_time" type="datetime-local" required class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2]" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Location Name</label>
            <input v-model="createForm.location_name" placeholder="e.g. Jakarta Convention Center" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2]" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Pin Location</label>
            <MapPicker
              v-model:lat="createForm.location_lat"
              v-model:lng="createForm.location_long"
              @update:location-name="name => { if (!createForm.location_name) createForm.location_name = name }"
              map-height="180px"
              placeholder="Search venue or click map..."
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Banner Image</label>
            <div v-if="bannerPreview" class="relative mb-3">
              <img :src="bannerPreview" alt="Banner preview" class="w-full max-h-36 object-cover rounded-lg border border-slate-700" />
              <button type="button" @click="removeBannerPreview" class="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <label
              class="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 bg-slate-900/50"
              :class="isDraggingBanner ? 'border-[#0df2f2] bg-[#0df2f2]/5 scale-[1.01]' : 'border-slate-700 hover:border-[#0df2f2]/50'"
              @dragover.prevent="isDraggingBanner = true"
              @dragenter.prevent="isDraggingBanner = true"
              @dragleave.prevent="isDraggingBanner = false"
              @drop.prevent="handleBannerDrop"
            >
              <div class="text-center pointer-events-none">
                <svg class="mx-auto w-8 h-8 mb-2 transition-colors" :class="isDraggingBanner ? 'text-[#0df2f2]' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span class="text-sm" :class="isDraggingBanner ? 'text-[#0df2f2]' : 'text-slate-400'">{{ isDraggingBanner ? 'Drop image here' : 'Click or drag & drop banner' }}</span>
                <span class="block text-xs text-slate-500 mt-1">PNG, JPG or WebP (max 8MB)</span>
              </div>
              <input type="file" accept="image/*" class="hidden" @change="handleBannerFile" />
            </label>
          </div>
          <div v-if="createError" class="text-red-400 text-sm">{{ createError }}</div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showCreateModal = false" class="px-4 py-2 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Cancel</button>
            <button type="submit" :disabled="isCreating" class="px-6 py-2 rounded-lg bg-[#0df2f2] text-[#0a0e17] font-bold text-sm hover:bg-[#00dada] disabled:opacity-50">
              {{ isCreating ? 'Creating...' : 'Create Event' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import ticketApi from '../../../services/ticketApi'
import MapPicker from '../../../components/MapPicker.vue'

const router = useRouter()
const authStore = useAuthStore()

const isPlatformAdmin = computed(() => authStore.user?.role === 'admin')

const events = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')
const showCreateModal = ref(false)
const isCreating = ref(false)
const createError = ref('')
const createForm = ref({ event_name: '', description: '', start_time: '', end_time: '', location_name: '', location_lat: null, location_long: null })
const bannerFile = ref(null)
const bannerPreview = ref(null)
const isDraggingBanner = ref(false)

const publishedCount = computed(() => events.value.filter(e => e.status === 'published').length)

const filteredEvents = computed(() => {
  let list = events.value
  if (statusFilter.value) list = list.filter(e => e.status === statusFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(e => e.event_name?.toLowerCase().includes(q) || e.location_name?.toLowerCase().includes(q))
  }
  return list
})

function getImageUrl(banner) {
  return ticketApi.getEventImageUrl(banner)
}

function formatDate(d) {
  if (!d) return 'TBD'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function soldPercent(ev) {
  const total = ev.stats?.quota_total || 0
  const paid = ev.stats?.paid_tickets || 0
  if (!total) return 0
  return Math.min(100, Math.round((paid / total) * 100))
}

function statusBadge(status) {
  const map = {
    published: 'bg-green-500/10 text-green-400 ring-green-500/20',
    draft: 'bg-yellow-400/10 text-yellow-400 ring-yellow-400/20',
    closed: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
  }
  return map[status] || map.draft
}

function handleBannerFile(e) {
  const file = e.target.files[0] || null
  bannerFile.value = file
  if (file) {
    bannerPreview.value = URL.createObjectURL(file)
  } else {
    bannerPreview.value = null
  }
}

function removeBannerPreview() {
  bannerFile.value = null
  bannerPreview.value = null
}

function handleBannerDrop(e) {
  isDraggingBanner.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  if (file.size > 8 * 1024 * 1024) {
    createError.value = 'Image must be under 8MB'
    return
  }
  bannerFile.value = file
  bannerPreview.value = URL.createObjectURL(file)
}

async function handleCreate() {
  createError.value = ''
  isCreating.value = true
  try {
    const fd = new FormData()
    fd.append('event_name', createForm.value.event_name)
    if (createForm.value.description) fd.append('description', createForm.value.description)
    fd.append('start_time', new Date(createForm.value.start_time).toISOString())
    fd.append('end_time', new Date(createForm.value.end_time).toISOString())
    if (createForm.value.location_name) fd.append('location_name', createForm.value.location_name)
    if (createForm.value.location_lat) fd.append('location_lat', createForm.value.location_lat)
    if (createForm.value.location_long) fd.append('location_long', createForm.value.location_long)
    if (bannerFile.value) fd.append('banner', bannerFile.value)
    const res = await ticketApi.createEvent(fd)
    showCreateModal.value = false
    router.push(`/event/manage/${res.event?.event_uuid || res.event_uuid}`)
  } catch (e) {
    createError.value = e.message || 'Failed to create event'
  } finally {
    isCreating.value = false
  }
}

async function loadEvents() {
  isLoading.value = true
  try {
    const res = await ticketApi.getManageableEvents()
    events.value = res.events || res || []
  } catch (e) {
    console.error('Failed to load events:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadEvents)
</script>
