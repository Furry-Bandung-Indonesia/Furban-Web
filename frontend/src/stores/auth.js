import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import authApi from '../services/authApi'
import logger from '../services/LoggerService'

// Cache duration for auth check (5 minutes in milliseconds)
const AUTH_CHECK_CACHE_DURATION = 5 * 60 * 1000

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('authToken'))
  const isLoading = ref(false)
  const error = ref(null)
  const lastAuthCheck = ref(0) // Timestamp of last successful auth check

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  
  // Role helpers - Per NEW-FEATURE.md roles are: user, admin, photographer, publisher
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isPhotographer = computed(() => user.value?.role === 'photographer' || user.value?.role === 'admin')
  const isPublisher = computed(() => user.value?.role === 'publisher' || user.value?.role === 'admin')
  const isRegularUser = computed(() => user.value?.role === 'user')
  const needsProfileCompletion = computed(() => user.value?.pending_profile === true)

  // Initialize auth state from storage
  const initializeAuth = async () => {
    if (token.value && !user.value) {
      try {
        const response = await authApi.getMe()
        if (response && response.user) {
          user.value = response.user
          lastAuthCheck.value = Date.now()
          logger.info('Auth state restored from token')
        } else if (response) {
          user.value = response
          lastAuthCheck.value = Date.now()
          logger.info('Auth state restored from token')
        }
      } catch (err) {
        logger.warn('Invalid token found, clearing auth state')
        logout()
      }
    }
  }

  /**
   * Login with email and password
   */
  const login = async (credentials) => {
    isLoading.value = true
    error.value = null

    logger.info('Login attempt', { email: credentials.email || credentials.identifier })

    try {
      const response = await authApi.login(
        credentials.email || credentials.identifier,
        credentials.password
      )

      token.value = response.token
      user.value = response.user
      lastAuthCheck.value = Date.now() // Mark auth as freshly verified

      logger.info('Login successful', { userId: response.user.uuid })

      return response
    } catch (err) {
      error.value = err.message
      logger.error('Login failed', {
        email: credentials.email || credentials.identifier,
        error: err.message
      })
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Register Step 1 - Email and Password
   */
  const register = async (email, password, turnstileToken) => {
    isLoading.value = true
    error.value = null

    logger.info('Registration attempt', { email })

    try {
      const response = await authApi.register(email, password, turnstileToken)

      token.value = response.token
      user.value = response.user

      logger.info('Registration successful', { userId: response.user.uuid })

      return response
    } catch (err) {
      error.value = err.message
      logger.error('Registration failed', { email, error: err.message })
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Google Sign-In / Register
   * Sends Google ID token to backend for verification and login/registration
   */
  const googleAuth = async (credential) => {
    isLoading.value = true
    error.value = null

    logger.info('Google auth attempt')

    try {
      const response = await authApi.googleAuth(credential)

      token.value = response.token
      user.value = response.user
      lastAuthCheck.value = Date.now()

      logger.info('Google auth successful', { userId: response.user.uuid })

      return response
    } catch (err) {
      error.value = err.message
      logger.error('Google auth failed', { error: err.message })
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Complete profile (Step 2 of registration)
   */
  const completeProfile = async (legalName, nickname) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.completeProfile(legalName, nickname)

      token.value = response.token
      user.value = response.user

      logger.info('Profile completed', { userId: response.user.uuid })

      return response
    } catch (err) {
      error.value = err.message
      logger.error('Profile completion failed', { error: err.message })
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout
   */
  const logout = async () => {
    logger.info('User logout', { userId: user.value?.uuid })
    
    try {
      await authApi.logout()
    } catch (err) {
      // Ignore logout errors
    }
    
    token.value = null
    user.value = null
    lastAuthCheck.value = 0 // Reset cache timestamp
    authApi.clearTokens()
  }

  /**
   * Check if auth is valid (with caching to avoid excessive API calls)
   * @param {boolean} force - Force a fresh check, bypassing cache
   */
  const checkAuth = async (force = false) => {
    if (!token.value) return false

    // Check if we have valid cached data (within cache duration)
    const now = Date.now()
    const timeSinceLastCheck = now - lastAuthCheck.value
    
    if (!force && user.value && timeSinceLastCheck < AUTH_CHECK_CACHE_DURATION) {
      // Use cached auth state - no API call needed
      logger.debug('Using cached auth state', { 
        cachedFor: Math.round(timeSinceLastCheck / 1000) + 's' 
      })
      return true
    }

    // Try to restore from localStorage first (if no user in memory)
    if (!user.value) {
      const storedUser = localStorage.getItem('userData')
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser)
        } catch (err) {
          logger.warn('Failed to parse stored user data')
        }
      }
    }

    try {
      const response = await authApi.getMe()
      if (response.user) {
        user.value = response.user
      } else {
        user.value = response
      }
      // Update last check timestamp on success
      lastAuthCheck.value = Date.now()
      return true
    } catch (err) {
      logout()
      return false
    }
  }

  /**
   * Update profile
   */
  const updateProfile = async (data) => {
    try {
      const response = await authApi.updateProfile(data)
      if (response.user) {
        user.value = { ...user.value, ...response.user }
        localStorage.setItem('userData', JSON.stringify(user.value))
      }
      return response
    } catch (err) {
      throw err
    }
  }

  /**
   * Change password
   */
  const changePassword = async (oldPassword, newPassword) => {
    return authApi.changePassword(oldPassword, newPassword)
  }

  /**
   * Upload avatar
   */
  const uploadAvatar = async (file) => {
    const response = await authApi.uploadAvatar(file)
    if (response.profile_image_url) {
      user.value = { ...user.value, profile_image_url: response.profile_image_url }
      localStorage.setItem('userData', JSON.stringify(user.value))
    }
    return response
  }

  /**
   * Remove avatar
   */
  const removeAvatar = async () => {
    const response = await authApi.removeAvatar()
    user.value = { ...user.value, profile_image_url: null }
    localStorage.setItem('userData', JSON.stringify(user.value))
    return response
  }

  // Initialize on store creation
  if (token.value) {
    const storedUser = localStorage.getItem('userData')
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (err) {
        logger.warn('Failed to restore user data from localStorage')
        logout()
      }
    }
  }

  const getDashboardRoute = () => {
    if (!user.value) return '/login'
    
    // Regular users go to /profile (no sidebar dashboard)
    // Admin/photographer/publisher go to full dashboard
    if (user.value.role === 'user') return '/profile'
    return '/dashboard'
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    isPhotographer,
    isPublisher,
    isRegularUser,
    needsProfileCompletion,
    login,
    register,
    googleAuth,
    completeProfile,
    logout,
    checkAuth,
    initializeAuth,
    updateProfile,
    changePassword,
    uploadAvatar,
    removeAvatar,
    getDashboardRoute
  }
})