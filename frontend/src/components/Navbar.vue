<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <a href="/" class="flex items-center space-x-2">
            <img src="/furban.png" alt="Furban Logo" class="h-8 w-8">
          </a>
        </div>
        
        <!-- Controls -->
        <div class="flex items-center space-x-3">
          <!-- Language Toggle Button -->
          <button 
            v-if="showLanguageToggle"
            @click="toggleLanguage"
            class="bg-[#10BEC5] hover:bg-[#0ea5ac] border border-[#10BEC5] rounded-lg px-3 py-1.5 text-sm text-white backdrop-blur-sm transition-all duration-200 font-medium min-w-[50px] shadow-md"
          >
            {{ (currentLanguage || 'en').toUpperCase() }}
          </button>
          
          <!-- Dark Mode Toggle -->
          <button 
            @click="toggleDarkMode"
            class="p-2 rounded-lg bg-[#10BEC5] hover:bg-[#0ea5ac] transition-colors text-white shadow-md"
          >
            <svg v-if="isDarkMode" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </button>

          <!-- User Avatar / Login -->
          <div v-if="isAuthenticated" class="relative">
            <button
              @click="toggleUserMenu"
              class="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0df2f2]/50"
            >
              <div class="relative">
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt="Avatar"
                  class="w-9 h-9 rounded-full object-cover ring-2 ring-[#0df2f2]/60"
                />
                <div
                  v-else
                  class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-[#101622] ring-2 ring-[#0df2f2]/60"
                  :style="{ background: 'linear-gradient(135deg, #0df2f2, #06b6d4)' }"
                >
                  {{ userInitial }}
                </div>
                <!-- Online dot -->
                <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#101622] rounded-full"></span>
              </div>
            </button>

            <!-- Dropdown Menu -->
            <Transition
              enter-active-class="transition ease-out duration-150"
              enter-from-class="opacity-0 scale-95 translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition ease-in duration-100"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 translate-y-1"
            >
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-64 rounded-xl bg-[#111318] border border-slate-700 shadow-2xl shadow-black/40 overflow-hidden"
              >
                <!-- User Info Header -->
                <div class="px-4 py-3 border-b border-slate-700/60">
                  <p class="text-sm font-semibold text-white truncate">{{ authStore.user?.username || authStore.user?.email }}</p>
                  <p class="text-xs text-slate-400 truncate">{{ authStore.user?.email }}</p>
                  <span class="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full" :class="roleBadgeClass">
                    {{ authStore.user?.role }}
                  </span>
                </div>

                <!-- Menu Links -->
                <div class="py-1">
                  <!-- Dashboard link for non-regular users -->
                  <router-link
                    v-if="!authStore.isRegularUser"
                    to="/dashboard"
                    class="user-menu-item"
                    @click="showUserMenu = false"
                  >
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                    Dashboard
                  </router-link>

                  <!-- Profile -->
                  <router-link
                    :to="profilePath"
                    class="user-menu-item"
                    @click="showUserMenu = false"
                  >
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    Profile
                  </router-link>

                  <!-- My Tickets -->
                  <router-link
                    :to="ticketsPath"
                    class="user-menu-item"
                    @click="showUserMenu = false"
                  >
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
                    My Tickets
                  </router-link>

                  <!-- Purchase History -->
                  <router-link
                    :to="purchasesPath"
                    class="user-menu-item"
                    @click="showUserMenu = false"
                  >
                    <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                    Purchase History
                  </router-link>
                </div>

                <!-- Logout -->
                <div class="border-t border-slate-700/60">
                  <button
                    @click="handleLogout"
                    class="user-menu-item w-full text-red-400 hover:bg-red-500/10"
                  >
                    <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    Logout
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Login Button (unauthenticated) -->
          <router-link
            v-else
            to="/login"
            class="flex items-center space-x-1.5 bg-[#0df2f2] hover:bg-[#0bd8d8] text-[#101622] font-bold text-sm px-4 py-2 rounded-lg transition-colors shadow-lg shadow-[#0df2f2]/20"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
            <span>Login</span>
          </router-link>
          
        </div>
      </div>
    </div>
  </nav>

  <!-- Backdrop to close user menu when clicking outside -->
  <div v-if="showUserMenu" class="fixed inset-0 z-40" @click="showUserMenu = false"></div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useThemeStore } from '../stores/theme'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getAuthImageUrl } from '../config/api'

export default {
  name: 'Navbar',
  setup() {
    const themeStore = useThemeStore()
    const authStore = useAuthStore()
    const { locale } = useI18n()
    const route = useRoute()
    const router = useRouter()
    
    const showUserMenu = ref(false)
    const currentLanguage = ref(locale.value || 'en')
    
    const isDarkMode = computed(() => themeStore.isDarkMode)
    const isAuthenticated = computed(() => authStore.isAuthenticated)

    const avatarUrl = computed(() => {
      const avatar = authStore.user?.profile_image_url
      if (!avatar) return null
      if (avatar.startsWith('http')) return avatar
      return getAuthImageUrl(avatar)
    })

    const userInitial = computed(() => {
      const name = authStore.user?.username || authStore.user?.email || '?'
      return name.charAt(0).toUpperCase()
    })

    const roleBadgeClass = computed(() => {
      switch (authStore.user?.role) {
        case 'admin': return 'bg-purple-500/20 text-purple-400'
        case 'photographer': return 'bg-blue-500/20 text-blue-400'
        case 'publisher': return 'bg-emerald-500/20 text-emerald-400'
        default: return 'bg-slate-700 text-slate-300'
      }
    })

    const showLanguageToggle = computed(() => {
      const languageHiddenRoutes = ['/event', '/profile', '/tickets', '/purchases']
      return !languageHiddenRoutes.some(path => route.path.startsWith(path))
    })

    // Role-aware paths: regular users get standalone pages, others get dashboard pages
    const profilePath = computed(() => authStore.isRegularUser ? '/profile' : '/dashboard/profile')
    const ticketsPath = computed(() => '/tickets')
    const purchasesPath = computed(() => '/purchases')
    
    const toggleDarkMode = () => {
      themeStore.toggleDarkMode()
    }
    
    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value
    }
    
    const toggleLanguage = () => {
      currentLanguage.value = currentLanguage.value === 'en' ? 'id' : 'en'
      locale.value = currentLanguage.value
    }

    const handleLogout = () => {
      showUserMenu.value = false
      authStore.logout()
      router.push('/')
    }
    
    // Scroll to hash section after navigation
    const scrollToHash = (hash) => {
      if (hash) {
        const target = document.querySelector(hash)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }

    // Watch for route changes with hash (e.g. /#about)
    watch(() => route.hash, (newHash) => {
      if (newHash) {
        setTimeout(() => scrollToHash(newHash), 100)
      }
    })

    // Close menus on route change
    watch(() => route.path, () => {
      showUserMenu.value = false
    })

    onMounted(() => {
      if (route.hash) {
        setTimeout(() => scrollToHash(route.hash), 300)
      }
    })
    
    return {
      isDarkMode,
      isAuthenticated,
      showUserMenu,
      currentLanguage,
      showLanguageToggle,
      avatarUrl,
      userInitial,
      roleBadgeClass,
      authStore,
      profilePath,
      ticketsPath,
      purchasesPath,
      toggleDarkMode,
      toggleUserMenu,
      toggleLanguage,
      handleLogout
    }
  }
}
</script>
<style scoped>
.nav-link {
  @apply text-white/90 hover:text-white font-medium transition-colors duration-200 cursor-pointer;
}

.nav-link-mobile {
  @apply block px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-colors duration-200 cursor-pointer;
}

.user-menu-item {
  @apply flex items-center px-4 py-2.5 text-sm text-slate-300 hover:bg-[#0df2f2]/10 hover:text-white transition-colors cursor-pointer;
}
</style>
