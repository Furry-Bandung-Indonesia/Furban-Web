<template>
  <div id="app" :class="{ 'dark': isDarkMode }">
    <!-- Only show navbar on public routes -->
    <Navbar v-if="!shouldHideNavbar" />
    <main :class="shouldHideNavbar ? '' : 'min-h-screen bg-gray-50 dark:bg-gray-900'">
      <RouterView />
    </main>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from './stores/theme'
import Navbar from './components/Navbar.vue'

export default {
  name: 'App',
  components: {
    Navbar
  },
  setup() {
    const route = useRoute()
    const themeStore = useThemeStore()
    const isDarkMode = computed(() => themeStore.isDarkMode)
    
    // Check if current route should hide the public navbar
    const shouldHideNavbar = computed(() => {
      const hiddenRoutes = ['/admin', '/login', '/register', '/publisher', '/photographer', '/dashboard', '/manage-profile', '/manage-blogs', '/manage-photos', '/manage-users']
      return hiddenRoutes.some(path => route.path.startsWith(path))
    })
    
    return {
      isDarkMode,
      shouldHideNavbar
    }
  }
}
</script>
