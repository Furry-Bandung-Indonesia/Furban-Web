import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDarkMode = ref(true) // Changed default to true for dark mode
  
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
    
    // Apply dark mode to document
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }
  
  const initTheme = () => {
    const savedTheme = localStorage.getItem('darkMode')
    if (savedTheme !== null) {
      // If user has a saved preference, use it
      if (savedTheme === 'true') {
        isDarkMode.value = true
        document.documentElement.classList.add('dark')
      } else {
        isDarkMode.value = false
        document.documentElement.classList.remove('dark')
      }
    } else {
      // If no saved preference, default to dark mode
      isDarkMode.value = true
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    }
  }
  
  return {
    isDarkMode,
    toggleDarkMode,
    initTheme
  }
})