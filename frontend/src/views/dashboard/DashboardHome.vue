<template>
  <div class="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
    <!-- Profile Completion Banner -->
    <div v-if="authStore.needsProfileCompletion && !profileBannerDismissed"
      class="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-5">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-4">
          <div class="bg-amber-500/20 p-3 rounded-xl">
            <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-white text-lg">Complete Your Profile</h3>
            <p class="text-slate-400 text-sm">Add your legal name and nickname to personalize your experience.</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <router-link to="/dashboard/profile"
            class="bg-amber-500 hover:bg-amber-600 text-[#101622] px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-amber-500/20">
            Complete Now
          </router-link>
          <button @click="dismissProfileBanner" class="text-slate-400 hover:text-white p-1" title="Dismiss">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Welcome Header -->
    <div>
      <h1 class="text-2xl md:text-3xl font-bold text-white">
        Welcome back, {{ authStore.user?.nickname || authStore.user?.legal_name || 'User' }}
      </h1>
      <p class="text-slate-400 mt-1">Here's an overview of your activity and platform status.</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Blog Stats -->
      <div v-if="isPublisher"
        @click="navigateTo('/dashboard/blogs')"
        class="bg-[#111318] border border-slate-800 rounded-xl p-5 hover:border-[#0df2f2]/30 transition-all cursor-pointer group">
        <div class="flex items-center justify-between mb-3">
          <div class="bg-indigo-500/10 p-2.5 rounded-lg">
            <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          </div>
          <svg class="w-4 h-4 text-slate-600 group-hover:text-[#0df2f2] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </div>
        <p class="text-3xl font-bold text-white group-hover:text-[#0df2f2] transition-colors">{{ stats.blogs || 0 }}</p>
        <p class="text-sm text-slate-500 mt-1">{{ isAdmin ? 'Total Blogs' : 'My Blogs' }}</p>
      </div>

      <!-- Photo Stats -->
      <div v-if="isPhotographer"
        @click="navigateTo('/dashboard/photos')"
        class="bg-[#111318] border border-slate-800 rounded-xl p-5 hover:border-[#0df2f2]/30 transition-all cursor-pointer group">
        <div class="flex items-center justify-between mb-3">
          <div class="bg-emerald-500/10 p-2.5 rounded-lg">
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <svg class="w-4 h-4 text-slate-600 group-hover:text-[#0df2f2] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </div>
        <p class="text-3xl font-bold text-white group-hover:text-[#0df2f2] transition-colors">{{ stats.photos || 0 }}</p>
        <p class="text-sm text-slate-500 mt-1">{{ isAdmin ? 'Total Photos' : 'My Photos' }}</p>
      </div>

      <!-- User Stats (Admin) -->
      <div v-if="isAdmin"
        @click="navigateTo('/dashboard/users')"
        class="bg-[#111318] border border-slate-800 rounded-xl p-5 hover:border-[#0df2f2]/30 transition-all cursor-pointer group">
        <div class="flex items-center justify-between mb-3">
          <div class="bg-orange-500/10 p-2.5 rounded-lg">
            <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <svg class="w-4 h-4 text-slate-600 group-hover:text-[#0df2f2] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </div>
        <p class="text-3xl font-bold text-white group-hover:text-[#0df2f2] transition-colors">{{ stats.users || 0 }}</p>
        <p class="text-sm text-slate-500 mt-1">Total Users</p>
      </div>

      <!-- Event Stats (Admin) -->
      <div v-if="isAdmin"
        @click="navigateTo('/event/manage')"
        class="bg-[#111318] border border-slate-800 rounded-xl p-5 hover:border-[#0df2f2]/30 transition-all cursor-pointer group">
        <div class="flex items-center justify-between mb-3">
          <div class="bg-[#0df2f2]/10 p-2.5 rounded-lg">
            <svg class="w-6 h-6 text-[#0df2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <svg class="w-4 h-4 text-slate-600 group-hover:text-[#0df2f2] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </div>
        <p class="text-3xl font-bold text-white group-hover:text-[#0df2f2] transition-colors">Events</p>
        <p class="text-sm text-slate-500 mt-1">Manage Events</p>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-800">
        <h3 class="text-lg font-bold text-white">{{ isAdmin ? 'Recent Platform Activity' : 'Your Recent Activity' }}</h3>
      </div>
      <div class="p-6">
        <div v-if="loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0df2f2] mx-auto"></div>
          <p class="text-slate-500 mt-3 text-sm">Loading...</p>
        </div>
        <div v-else-if="recentActivity.length === 0" class="text-center py-8">
          <p class="text-slate-500 text-sm">No recent activity found.</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="item in recentActivity" :key="item.id || item.title"
            class="flex items-center justify-between p-4 bg-[#101622] rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors">
            <div>
              <p class="text-sm font-medium text-white">{{ item.title || item.mini_desc || 'Untitled' }}</p>
              <p class="text-xs text-slate-500 mt-0.5">{{ new Date(item.created_at).toLocaleDateString() }} &bull; {{ item.type }}</p>
            </div>
            <span :class="getStatusClass(item.status)" class="px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
              {{ item.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ApiService from '@/services/api'
import authApi from '@/services/authApi'

const router = useRouter()
const authStore = useAuthStore()
const apiService = new ApiService()

const loading = ref(false)
const stats = ref({ blogs: 0, photos: 0, users: 0 })
const recentActivity = ref([])

const profileBannerDismissed = ref(false)
const dismissProfileBanner = () => {
  profileBannerDismissed.value = true
  sessionStorage.setItem('profileBannerDismissed', 'true')
}
if (sessionStorage.getItem('profileBannerDismissed') === 'true') {
  profileBannerDismissed.value = true
}

const isAdmin = computed(() => authStore.isAdmin)
const isPhotographer = computed(() => authStore.isPhotographer)
const isPublisher = computed(() => authStore.isPublisher)

const getStatusClass = (status) => {
  switch (status) {
    case 'approved': return 'bg-emerald-500/20 text-emerald-400'
    case 'rejected': return 'bg-red-500/20 text-red-400'
    default: return 'bg-yellow-500/20 text-yellow-400'
  }
}

const navigateTo = (path) => router.push(path)

const loadDashboardData = async () => {
  loading.value = true
  try {
    if (isAdmin.value) {
      const [dbData, authStats] = await Promise.all([
        apiService.getDashboard(),
        authApi.getAdminStats()
      ])
      stats.value = {
        blogs: dbData.totalBlogs || 0,
        photos: dbData.totalGallery || 0,
        users: authStats.total_users || 0
      }
      recentActivity.value = (dbData.recentBlogs || []).map(r => ({ ...r, type: 'Blog' }))
    } else {
      const userStats = await apiService.getMyStats()
      stats.value.photos = userStats.photos || 0
      stats.value.blogs = userStats.blogs || 0
    }
  } catch (e) {
    console.error('Error loading dashboard:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboardData)
</script>
