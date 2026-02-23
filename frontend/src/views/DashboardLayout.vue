<template>
  <div class="min-h-screen bg-[#101622] text-white font-['Inter',sans-serif] flex flex-col md:flex-row">
    <!-- Mobile Header -->
    <header class="md:hidden flex items-center justify-between bg-[#111318] border-b border-slate-800 px-4 py-3 sticky top-0 z-40">
      <div class="flex items-center gap-3">
        <div class="size-8 rounded-lg bg-[#0df2f2]/20 flex items-center justify-center text-[#0df2f2]">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        </div>
        <span class="text-sm font-bold">Furban {{ roleLabelText }}</span>
      </div>
      <button @click="showMobileNav = !showMobileNav" class="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
    </header>

    <!-- Mobile Nav Overlay -->
    <div v-if="showMobileNav" class="md:hidden fixed inset-0 bg-black/50 z-40" @click="showMobileNav = false"></div>
    <aside v-if="showMobileNav" class="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#111318] z-50 p-4 overflow-y-auto">
      <div class="flex items-center gap-3 mb-6 px-2 pt-2">
        <div class="size-8 rounded-lg bg-[#0df2f2]/20 flex items-center justify-center text-[#0df2f2]">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        </div>
        <div>
          <h1 class="text-white text-sm font-bold">Furban</h1>
          <p class="text-slate-400 text-xs">{{ roleLabelText }} Panel</p>
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
        <router-link to="/" class="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white text-sm" @click="showMobileNav = false">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Home
        </router-link>
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-sm mt-1">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Logout
        </button>
      </div>
    </aside>

    <!-- Desktop Sidebar -->
    <aside class="hidden md:flex w-64 bg-[#111318] flex-col border-r border-slate-800 shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-gradient-to-br from-[#0df2f2]/60 to-[#0df2f2] flex items-center justify-center text-white shadow-lg shadow-[#0df2f2]/20">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          </div>
          <div>
            <h1 class="text-white text-lg font-bold leading-none tracking-tight">Furban</h1>
            <p class="text-slate-400 text-xs font-medium mt-1">{{ roleLabelText }} Panel</p>
          </div>
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
        <router-link to="/" class="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Home
        </router-link>
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm mt-1">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Logout
        </button>
        <div v-if="user" class="flex items-center gap-3 px-2 py-2 mt-2">
          <div v-if="user.profile_image_url" class="size-9 rounded-full overflow-hidden border-2 border-slate-700">
            <img :src="getAuthImageUrl(user.profile_image_url)" alt="" class="w-full h-full object-cover" />
          </div>
          <div v-else class="size-9 rounded-full bg-gradient-to-tr from-[#0df2f2] to-[#0df2f2]/50 flex items-center justify-center text-xs font-bold text-[#0a0e17] shadow">
            {{ (user.nickname || user.email || 'U')[0].toUpperCase() }}
          </div>
          <div class="flex flex-col overflow-hidden">
            <p class="text-sm font-medium text-white truncate">{{ user.nickname || user.legal_name || user.email }}</p>
            <p class="text-xs text-slate-500 truncate capitalize">{{ user.role }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAuthImageUrl } from '@/config/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const showMobileNav = ref(false)
const user = computed(() => authStore.user)

const isAdmin = computed(() => authStore.isAdmin)
const isPhotographer = computed(() => authStore.isPhotographer)
const isPublisher = computed(() => authStore.isPublisher)

const roleLabelText = computed(() => {
  if (!user.value?.role) return 'Dashboard'
  switch (user.value.role) {
    case 'admin': return 'Admin'
    case 'photographer': return 'Photographer'
    case 'publisher': return 'Publisher'
    default: return 'Dashboard'
  }
})

// Icon render functions (matching ManageLayout style)
const IconHome = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' })]) }
const IconProfile = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' })]) }
const IconBlogs = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' })]) }
const IconPhotos = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' })]) }
const IconUsers = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' })]) }
const IconEvents = { render: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' })]) }

const navItems = computed(() => {
  const role = user.value?.role
  const items = []

  items.push({ path: '/dashboard', label: 'Dashboard', icon: IconHome })
  items.push({ path: '/dashboard/profile', label: 'My Profile', icon: IconProfile })

  if (role === 'photographer' || role === 'admin') {
    items.push({ path: '/dashboard/photos', label: role === 'admin' ? 'Manage Photos' : 'My Photos', icon: IconPhotos })
  }
  if (role === 'publisher' || role === 'admin') {
    items.push({ path: '/dashboard/blogs', label: role === 'admin' ? 'Manage Blogs' : 'My Blogs', icon: IconBlogs })
  }
  if (role === 'admin') {
    items.push({ path: '/dashboard/users', label: 'Manage Users', icon: IconUsers })
    items.push({ path: '/event/manage', label: 'Event Management', icon: IconEvents })
  }



  return items
})

function isActive(path) {
  if (path === '/dashboard') return route.path === '/dashboard'
  if (path === '/event/manage') return route.path.startsWith('/event/manage')
  return route.path.startsWith(path)
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
