<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
    <!-- Mobile Sidebar Overlay -->
    <div 
      v-if="isMobileMenuOpen" 
      class="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden" 
      @click="isMobileMenuOpen = false"
    ></div>

    <!-- Sidebar -->
    <div 
      :class="[
        'w-64 bg-white dark:bg-gray-800 shadow-lg fixed h-full z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="flex flex-col h-full">
        <!-- Logo/Brand -->
        <div class="flex items-center justify-between h-16 px-4 bg-indigo-600">
          <h2 class="text-xl font-bold text-white">Furban {{ roleLabel }}</h2>
          <button @click="isMobileMenuOpen = false" class="md:hidden text-white">
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>
        
        <!-- Navigation -->
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <router-link
            v-for="item in navigationItems"
            :key="item.id"
            :to="item.path"
            @click="isMobileMenuOpen = false"
            :class="[
              'w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
              isActiveRoute(item.path)
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
          >
            <component :is="item.icon" class="mr-3 h-5 w-5" />
            {{ item.label }}
          </router-link>
        </nav>
        
        <!-- User Info -->
        <div class="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div v-if="user?.profile_image_url" class="w-8 h-8 rounded-full overflow-hidden">
                <img :src="getAuthImageUrl(user.profile_image_url)" alt="Avatar" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-white">
                  {{ (user?.nickname || user?.email || 'U').charAt(0).toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="ml-3 truncate">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[150px]">
                {{ user?.nickname || user?.legal_name || user?.email }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ user?.role }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col md:ml-64 min-w-0">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div class="px-4 py-4 sm:px-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <!-- Mobile Menu Button -->
              <button 
                @click="toggleMobileMenu" 
                class="mr-4 md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <Bars3Icon class="h-6 w-6" />
              </button>
              <div>
                <h1 class="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">
                  {{ currentSectionTitle }}
                </h1>
                <p class="hidden sm:block text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ currentSectionDescription }}
                </p>
              </div>
            </div>
            <button
              @click="handleLogout"
              class="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Content Area - renders the child route component -->
      <main class="flex-1 p-4 sm:p-6 overflow-x-hidden">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAuthImageUrl } from '@/config/api'
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon, 
  UserCircleIcon, 
  DocumentTextIcon, 
  PhotoIcon, 
  UsersIcon 
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isMobileMenuOpen = ref(false)

const user = computed(() => authStore.user)

const roleLabel = computed(() => {
  if (!user.value?.role) return ''
  return user.value.role.charAt(0).toUpperCase() + user.value.role.slice(1)
})

// Role helpers
const isAdmin = computed(() => authStore.isAdmin)
const isPhotographer = computed(() => authStore.isPhotographer)
const isPublisher = computed(() => authStore.isPublisher)

// Navigation Items - dynamically generated based on user role
const navigationItems = computed(() => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: markRaw(HomeIcon) },
    { id: 'profile', label: 'My Profile', path: '/manage-profile', icon: markRaw(UserCircleIcon) }
  ]
  
  // Publisher can manage blogs (admin can also)
  if (isAdmin.value || isPublisher.value) {
    items.push({ 
      id: 'blogs', 
      label: isAdmin.value ? 'Manage Blogs' : 'My Blogs', 
      path: '/manage-blogs', 
      icon: markRaw(DocumentTextIcon) 
    })
  }
  
  // Photographer can manage photos (admin can also)
  if (isAdmin.value || isPhotographer.value) {
    items.push({ 
      id: 'gallery', 
      label: isAdmin.value ? 'Manage Photos' : 'My Photos', 
      path: '/manage-photos', 
      icon: markRaw(PhotoIcon) 
    })
  }
  
  // Admin only: user management
  if (isAdmin.value) {
    items.push({ 
      id: 'users', 
      label: 'Manage Users', 
      path: '/manage-users', 
      icon: markRaw(UsersIcon) 
    })
  }
  
  return items
})

// Title and description maps
const titleMap = {
  '/dashboard': 'Dashboard',
  '/manage-profile': 'My Profile',
  '/manage-blogs': 'Blog Management',
  '/manage-photos': 'Photo Management',
  '/manage-users': 'User Administration'
}

const descriptionMap = {
  '/dashboard': 'Overview of your activity and performance.',
  '/manage-profile': 'Manage your account settings and profile information.',
  '/manage-blogs': 'Create and manage your blog posts.',
  '/manage-photos': 'Upload and manage your photography portfolio.',
  '/manage-users': 'Manage administrative access and users.'
}

const currentSectionTitle = computed(() => {
  return titleMap[route.path] || 'Dashboard'
})

const currentSectionDescription = computed(() => {
  return descriptionMap[route.path] || ''
})

const isActiveRoute = (path) => {
  return route.path === path
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>
