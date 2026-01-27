<template>
  <div>
    <!-- Profile Completion Banner -->
    <div v-if="authStore.needsProfileCompletion && !profileBannerDismissed" class="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="bg-white bg-opacity-20 p-3 rounded-xl">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <div class="text-white">
            <h3 class="font-bold text-lg">Complete Your Profile</h3>
            <p class="text-amber-100 text-sm">Add your legal name and nickname to unlock all features and personalize your experience.</p>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <router-link 
            to="/manage-profile" 
            class="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors shadow-md"
          >
            Complete Now
          </router-link>
          <button 
            @click="dismissProfileBanner" 
            class="text-white hover:text-amber-200 p-1"
            title="Remind me later"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Dashboard Stats Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Blog Stats - Only for Publisher/Admin -->
      <div v-if="isPublisher" class="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300 cursor-pointer" @click="navigateTo('/manage-blogs')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-indigo-100 text-sm font-medium uppercase tracking-wider">{{ isAdmin ? 'Total Blogs' : 'My Blogs' }}</p>
            <p class="text-3xl font-bold mt-2">{{ stats.blogs || 0 }}</p>
          </div>
          <div class="bg-white bg-opacity-20 p-3 rounded-xl">
             <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
          </div>
        </div>
        <div class="mt-4 flex items-center text-xs text-indigo-100">
            <span>View all posts</span>
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </div>
      </div>

      <!-- Photo Stats - Only for Photographer/Admin -->
      <div v-if="isPhotographer" class="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300 cursor-pointer" @click="navigateTo('/manage-photos')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-emerald-100 text-sm font-medium uppercase tracking-wider">{{ isAdmin ? 'Total Photos' : 'My Photos' }}</p>
            <p class="text-3xl font-bold mt-2">{{ stats.photos || 0 }}</p>
          </div>
          <div class="bg-white bg-opacity-20 p-3 rounded-xl">
             <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
        </div>
         <div class="mt-4 flex items-center text-xs text-emerald-100">
            <span>View gallery</span>
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </div>
      </div>
      
      <!-- User Stats - Admin only -->
      <div v-if="isAdmin" class="bg-gradient-to-br from-orange-400 to-pink-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300 cursor-pointer" @click="navigateTo('/manage-users')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium uppercase tracking-wider">Total Users</p>
            <p class="text-3xl font-bold mt-2">{{ stats.users || 0 }}</p>
          </div>
          <div class="bg-white bg-opacity-20 p-3 rounded-xl">
             <UsersIcon class="w-8 h-8 text-white" />
          </div>
        </div>
         <div class="mt-4 flex items-center text-xs text-orange-100">
             <span>Manage users</span>
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </div>
      </div>
      
      <!-- Welcome Card for Regular Users (if no other stats visible) -->
      <div v-if="isRegularUser" class="lg:col-span-2 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-100 text-sm font-medium uppercase tracking-wider">Welcome</p>
            <p class="text-xl font-bold mt-2">{{ authStore.user?.nickname || authStore.user?.legal_name || 'User' }}</p>
            <p class="text-gray-300 text-sm mt-2">Browse the gallery and blog to explore content.</p>
          </div>
          <div class="bg-white bg-opacity-20 p-3 rounded-xl">
             <UserCircleIcon class="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity (Admin) or Recent Uploads (User) -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
          {{ isAdmin ? 'Recent Platform Activity' : 'Your Recent Activity' }}
        </h3>
        <div class="space-y-3">
           <div v-if="loading" class="text-center py-8">
             <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
             <p class="text-gray-500 mt-2">Loading...</p>
           </div>
           <div v-else-if="recentActivity.length === 0" class="text-gray-500 dark:text-gray-400">
             No recent activity found.
           </div>
           <div v-else v-for="item in recentActivity" :key="item.id || item.title" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div>
                 <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.title || item.mini_desc || 'Untitled' }}</p>
                 <p class="text-xs text-gray-500 dark:text-gray-400">{{ new Date(item.created_at).toLocaleDateString() }} • {{ item.type }}</p>
              </div>
              <span :class="getStatusClass(item.status)" class="px-2 py-1 text-xs font-semibold rounded-full uppercase tracking-wide">
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
import { UsersIcon, UserCircleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const apiService = new ApiService()

// State
const loading = ref(false)
const stats = ref({ blogs: 0, photos: 0, users: 0 })
const recentActivity = ref([])

// Profile completion banner state
const profileBannerDismissed = ref(false)
const dismissProfileBanner = () => {
  profileBannerDismissed.value = true
  sessionStorage.setItem('profileBannerDismissed', 'true')
}

// Check if banner was previously dismissed
if (sessionStorage.getItem('profileBannerDismissed') === 'true') {
  profileBannerDismissed.value = true
}

// Role Helpers
const isAdmin = computed(() => authStore.isAdmin)
const isPhotographer = computed(() => authStore.isPhotographer)
const isPublisher = computed(() => authStore.isPublisher)
const isRegularUser = computed(() => authStore.user?.role === 'user')

// Helper functions
const getStatusClass = (status) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-yellow-100 text-yellow-800'
  }
}

const navigateTo = (path) => {
  router.push(path)
}

// Fetch dashboard data
const loadDashboardData = async () => {
  loading.value = true
  try {
    if (isAdmin.value) {
      // Admin: Get global stats from admin dashboard endpoint
      const [dbData, authStats] = await Promise.all([
        apiService.getDashboard(),
        authApi.getAdminStats()
      ])
      stats.value = { 
        blogs: dbData.totalBlogs || 0, 
        photos: dbData.totalGallery || 0, 
        users: authStats.total_users || 0 
      }
      
      // Get recent blogs for activity feed
      recentActivity.value = (dbData.recentBlogs || []).map(r => ({...r, type: 'Blog'}))
    } else {
      // Regular users: Get personal stats from lightweight endpoint
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
