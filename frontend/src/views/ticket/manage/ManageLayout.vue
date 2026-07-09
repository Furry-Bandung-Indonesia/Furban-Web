<template>
  <div class="min-h-screen bg-[#101622] text-white font-['Inter',sans-serif] flex flex-col md:flex-row">
    <!-- Mobile Header -->
    <header v-if="!accessDenied" class="md:hidden flex items-center justify-between bg-[#111318] border-b border-slate-800 px-4 py-3 sticky top-0 z-40">
      <div class="flex items-center gap-3">
        <div class="size-8 rounded-lg bg-[#0df2f2]/20 flex items-center justify-center text-[#0df2f2]">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
        </div>
        <span class="text-sm font-bold">Furban {{ isPlatformAdmin ? 'Admin' : 'Host' }}</span>
      </div>
      <button @click="showMobileNav = !showMobileNav" class="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
    </header>

    <!-- Mobile Nav Overlay -->
    <div v-if="showMobileNav && !accessDenied" class="md:hidden fixed inset-0 bg-black/50 z-40" @click="showMobileNav = false"></div>
    <aside v-if="showMobileNav && !accessDenied" class="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#111318] z-50 p-4 overflow-y-auto">
      <div class="flex items-center gap-3 mb-6 px-2 pt-2">
        <div class="size-8 rounded-lg bg-[#0df2f2]/20 flex items-center justify-center text-[#0df2f2]">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
        </div>
        <div>
          <h1 class="text-white text-sm font-bold">Furban {{ isPlatformAdmin ? 'Admin' : 'Host' }}</h1>
          <p class="text-slate-400 text-xs">Event Console</p>
        </div>
      </div>
      <nav class="space-y-1">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path" @click="showMobileNav = false"
          :class="[isActive(item.path) ? 'bg-[#0df2f2]/10 text-white border-l-2 border-[#0df2f2]' : 'text-slate-400 hover:text-white hover:bg-white/5']"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium">
          <component :is="item.icon" class="w-5 h-5" :class="isActive(item.path) ? 'text-[#0df2f2]' : ''" />
          {{ item.label }}
        </router-link>
      </nav>
      <div class="mt-6 pt-4 border-t border-slate-800">
        <router-link to="/event" class="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white text-sm" @click="showMobileNav = false">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Events
        </router-link>
      </div>
    </aside>

    <!-- Desktop Sidebar -->
    <aside v-if="!accessDenied" class="hidden md:flex w-64 bg-[#111318] flex-col border-r border-slate-800 shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-gradient-to-br from-[#0df2f2]/60 to-[#0df2f2] flex items-center justify-center text-white shadow-lg shadow-[#0df2f2]/20">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
          </div>
          <div>
            <h1 class="text-white text-lg font-bold leading-none tracking-tight">Furban</h1>
            <p class="text-slate-400 text-xs font-medium mt-1">{{ isPlatformAdmin ? 'Admin Console' : 'Host Console' }}</p>
          </div>
        </div>
      </div>

      <!-- Event name if we have one -->
      <div v-if="currentEvent" class="px-6 pb-4">
        <div class="p-3 rounded-lg bg-white/5 border border-white/5">
          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Managing Event</p>
          <p class="text-sm font-bold text-white truncate">{{ currentEvent.name }}</p>
          <p class="text-xs text-slate-400 mt-1">{{ currentEvent.status || 'draft' }}</p>
        </div>
      </div>

      <nav class="flex-1 px-4 flex flex-col gap-1">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path"
          :class="[isActive(item.path) ? 'bg-[#0df2f2]/10 text-white ring-1 ring-inset ring-[#0df2f2]/20' : 'text-slate-400 hover:text-white hover:bg-slate-800']"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group">
          <component :is="item.icon" class="w-5 h-5" :class="isActive(item.path) ? 'text-[#0df2f2]' : 'group-hover:text-[#0df2f2]'" />
          <span class="text-sm font-medium">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-slate-800">
        <router-link to="/event" class="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Events
        </router-link>
        <div v-if="user" class="flex items-center gap-3 px-2 py-2 mt-2">
          <div class="size-9 rounded-full overflow-hidden bg-gradient-to-tr from-[#0df2f2] to-[#0df2f2]/50 flex items-center justify-center text-xs font-bold text-[#0a0e17] shadow shrink-0">
            <img v-if="user.profile_image_url" :src="getAuthImageUrl(user.profile_image_url)" class="w-full h-full object-cover" @error="user.profile_image_url = null" />
            <span v-else>{{ (user.nickname || user.email || 'A')[0].toUpperCase() }}</span>
          </div>
          <div class="flex flex-col overflow-hidden">
            <p class="text-sm font-medium text-white truncate">{{ user.nickname || user.email }}</p>
            <p class="text-xs text-slate-500 truncate capitalize">{{ user.role }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Access Denied Page -->
    <main v-if="accessDenied" class="flex-1 flex items-center justify-center min-h-screen bg-[#0a0e17]">
      <div class="text-center px-6 max-w-lg">
        <div class="mx-auto mb-8 size-32 rounded-full bg-red-500/10 flex items-center justify-center ring-2 ring-red-500/20">
          <svg class="w-16 h-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 class="text-4xl font-black text-white mb-3 tracking-tight">Upps, you stop there fella!</h1>
        <p class="text-xl text-red-400 font-semibold mb-2">This is restricted territory</p>
        <p class="text-slate-400 text-sm mb-8">You don't have permission to manage this event. Only assigned hosts and admins can access this area.</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <router-link to="/event" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0df2f2] text-[#0a0e17] font-bold text-sm hover:bg-[#00dada] transition-colors shadow-lg shadow-[#0df2f2]/20">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Events
          </router-link>
          <router-link to="/" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-white font-medium text-sm hover:bg-slate-700 transition-colors ring-1 ring-slate-700">
            Go Home
          </router-link>
        </div>
      </div>
    </main>

    <!-- Main Content -->
    <main v-else class="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-hidden">
      <router-view :event="currentEvent" :userEventRole="userEventRole" @update-event="fetchEvent" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import ticketApi from '../../../services/ticketApi'
import { getAuthImageUrl } from '../../../config/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const showMobileNav = ref(false)
const currentEvent = ref(null)
const accessDenied = ref(false)
const userEventRole = ref(null) // 'ADMIN' or 'HOST'

const user = computed(() => authStore.user)
const isPlatformAdmin = computed(() => user.value?.role === 'admin')

const eventId = computed(() => route.params.eventId)

// Icon components (inline SVGs as render functions)
const IconDashboard = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' })]) }
const IconSettings = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }), h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' })]) }
const IconUsers = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' })]) }
const IconScan = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' })]) }
const IconShield = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' })]) }
const IconKey = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' })]) }
const IconPayment = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' })]) }
const IconFinancials = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })]) }
const IconVoucher = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' })]) }

// Host-only pages: only Attendees, Check-In, and Vouchers
const hostAllowedPaths = ['attendees', 'checkin', 'voucher']

const navItems = computed(() => {
  if (!eventId.value) {
    return [
      { path: '/event/manage', label: 'My Events', icon: IconDashboard }
    ]
  }
  const eid = eventId.value
  const isHostOnly = userEventRole.value === 'HOST'

  const allItems = [
    { path: '/event/manage', label: 'My Events', icon: IconDashboard, hostVisible: true },
    { path: `/event/manage/${eid}`, label: 'Configuration', icon: IconSettings, hostVisible: false },
    { path: `/event/manage/${eid}/attendees`, label: 'Attendees', icon: IconUsers, hostVisible: true },
    { path: `/event/manage/${eid}/checkin`, label: 'Check-In', icon: IconScan, hostVisible: true },
    { path: `/event/manage/${eid}/voucher`, label: 'Vouchers', icon: IconVoucher, hostVisible: true },
    { path: `/event/manage/${eid}/moderation`, label: 'Moderation', icon: IconShield, hostVisible: false },
    { path: `/event/manage/${eid}/hosts`, label: 'Host Permissions', icon: IconKey, hostVisible: false },
    { path: `/event/manage/${eid}/payment`, label: 'Payment Gateway', icon: IconPayment, hostVisible: false },
    { path: `/event/manage/${eid}/financials`, label: 'Financials', icon: IconFinancials, hostVisible: false },
  ]

  return isHostOnly ? allItems.filter(i => i.hostVisible) : allItems
})

function isActive(path) {
  return route.path === path
}

async function fetchEvent() {
  if (!eventId.value) {
    currentEvent.value = null
    userEventRole.value = null
    // On the dashboard page (/event/manage), check if user is allowed
    // Platform admins always allowed. Others need at least one manageable event.
    if (!isPlatformAdmin.value) {
      try {
        const res = await ticketApi.getManageableEvents()
        const events = res.events || res || []
        if (events.length === 0) {
          accessDenied.value = true
          return
        }
      } catch (e) {
        if (e.status === 403) {
          accessDenied.value = true
          return
        }
      }
    }
    accessDenied.value = false
    return
  }
  try {
    const res = await ticketApi.getManageEvent(eventId.value)
    currentEvent.value = res.event || res
    userEventRole.value = (res.event || res).user_event_role || null
    accessDenied.value = false

    // If HOST tries to access admin-only pages, redirect to attendees
    if (userEventRole.value === 'HOST') {
      const subPath = route.path.split('/').pop()
      const isEventRoot = route.name === 'manage-event-config'
      if (isEventRoot || (subPath && !hostAllowedPaths.includes(subPath))) {
        router.replace(`/event/manage/${eventId.value}/attendees`)
      }
    }
  } catch (e) {
    if (e.status === 403 || e.message?.includes('403') || e.message?.includes('Forbidden') || e.message?.includes('Access denied')) {
      accessDenied.value = true
    } else {
      console.error('Failed to fetch event:', e)
    }
  }
}

// Also guard on route changes within the same event
watch(() => route.path, () => {
  if (userEventRole.value === 'HOST' && eventId.value) {
    const subPath = route.path.split('/').pop()
    const isEventRoot = route.name === 'manage-event-config'
    if (isEventRoot || (subPath && !hostAllowedPaths.includes(subPath) && subPath !== 'manage')) {
      router.replace(`/event/manage/${eventId.value}/attendees`)
    }
  }
})

watch(eventId, () => fetchEvent(), { immediate: true })
</script>
