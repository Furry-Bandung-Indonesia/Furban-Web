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
          <button
            v-for="item in navigationItems"
            :key="item.id"
            @click="$emit('update:activeSection', item.id); isMobileMenuOpen = false"
            :class="[
              'w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeSection === item.id 
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
          >
            <component :is="item.icon" class="mr-3 h-5 w-5" />
            {{ item.label }}
          </button>
        </nav>
        
        <!-- User Info -->
        <div class="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-white">
                  {{ user?.username?.charAt(0).toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="ml-3 truncate">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[150px]">
                {{ user?.username }}
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

      <!-- Content Area -->
      <main class="flex-1 p-4 sm:p-6 overflow-x-hidden">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  navigationItems: {
    type: Array,
    required: true
  },
  activeSection: {
    type: String,
    required: true
  },
  titleMap: {
    type: Object,
    default: () => ({})
  },
  descriptionMap: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:activeSection'])

const router = useRouter()
const authStore = useAuthStore()
const isMobileMenuOpen = ref(false)

const user = computed(() => authStore.user)

const roleLabel = computed(() => {
  if (!user.value?.role) return ''
  return user.value.role.charAt(0).toUpperCase() + user.value.role.slice(1)
})

const currentSectionTitle = computed(() => {
  return props.titleMap[props.activeSection] || 'Dashboard'
})

const currentSectionDescription = computed(() => {
  return props.descriptionMap[props.activeSection] || ''
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>
