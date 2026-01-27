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
        <div class="flex items-center space-x-4">
          <!-- Language Toggle Button -->
          <button 
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
          
          <!-- Mobile Menu Button -->
          <button 
            @click="toggleMobileMenu"
            class="md:hidden p-2 rounded-lg hover:bg-white/20 text-white"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Mobile Menu -->
      <div v-if="showMobileMenu" class="md:hidden py-4 border-t border-white/20">
        <div class="flex flex-col space-y-2">
          <a href="#home" class="nav-link-mobile">{{ $t('nav.home') }}</a>
          <a href="#about" class="nav-link-mobile">{{ $t('nav.about') }}</a>
          <a href="#gallery" class="nav-link-mobile">{{ $t('nav.gallery') }}</a>
          <a href="#blog" class="nav-link-mobile">{{ $t('nav.blog') }}</a>
          <a href="#socials" class="nav-link-mobile">{{ $t('nav.socials') }}</a>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '../stores/theme'
import { useI18n } from 'vue-i18n'

export default {
  name: 'Navbar',
  setup() {
    const themeStore = useThemeStore()
    const { locale, t } = useI18n()
    
    const showMobileMenu = ref(false)
    // Provide a default value to prevent undefined errors
    const currentLanguage = ref(locale.value || 'en')
    
    const isDarkMode = computed(() => themeStore.isDarkMode)
    
    const toggleDarkMode = () => {
      themeStore.toggleDarkMode()
    }
    
    const toggleMobileMenu = () => {
      showMobileMenu.value = !showMobileMenu.value
    }
    
    const toggleLanguage = () => {
      // Toggle between 'en' and 'id'
      currentLanguage.value = currentLanguage.value === 'en' ? 'id' : 'en'
      locale.value = currentLanguage.value
    }
    
    // Smooth scrolling for anchor links
    onMounted(() => {
      const handleNavClick = (e) => {
        const href = e.target.getAttribute('href')
        if (href && href.startsWith('#')) {
          e.preventDefault()
          const target = document.querySelector(href)
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            })
          }
          // Close mobile menu if open
          showMobileMenu.value = false
        }
      }
      
      document.addEventListener('click', handleNavClick)
      
      return () => {
        document.removeEventListener('click', handleNavClick)
      }
    })
    
    return {
      isDarkMode,
      showMobileMenu,
      currentLanguage,
      toggleDarkMode,
      toggleMobileMenu,
      toggleLanguage
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
</style>
