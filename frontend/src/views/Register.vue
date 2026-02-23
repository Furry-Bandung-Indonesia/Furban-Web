<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Create an Account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Join our platform to start sharing content
        </p>
      </div>

      <!-- Google Sign-Up Button -->
      <div>
        <button
          type="button"
          :disabled="loading || googleLoading"
          @click="handleGoogleSignUp"
          class="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span v-if="googleLoading">Signing up with Google...</span>
          <span v-else>Sign up with Google</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or register with email</span>
        </div>
      </div>
      
      <form class="space-y-6" @submit.prevent="handleRegister">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div class="relative">
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
            >
              <svg v-if="!showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
          <div class="relative">
            <label for="confirmPassword" class="sr-only">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              name="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Confirm Password"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
            >
              <svg v-if="!showConfirmPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Password requirements -->
        <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p class="font-medium">Password must contain:</p>
          <ul class="list-disc list-inside space-y-0.5">
            <li :class="{ 'text-green-600': form.password.length >= 8 }">At least 8 characters</li>
            <li :class="{ 'text-green-600': /[A-Z]/.test(form.password) }">One uppercase letter</li>
            <li :class="{ 'text-green-600': /[a-z]/.test(form.password) }">One lowercase letter</li>
            <li :class="{ 'text-green-600': /[0-9]/.test(form.password) }">One number</li>
          </ul>
        </div>

        <!-- Cloudflare Turnstile -->
        <div v-if="!turnstileBypass" class="flex justify-center">
          <div ref="turnstileRef"></div>
        </div>
        <div v-else class="flex justify-center">
          <span class="text-xs text-green-500 bg-green-900/30 px-3 py-1.5 rounded-full">Captcha bypassed (dev mode)</span>
        </div>
        <p v-if="turnstileError" class="text-red-600 dark:text-red-400 text-xs text-center">{{ turnstileError }}</p>

        <div v-if="error" class="text-red-600 dark:text-red-400 text-sm text-center">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || !isPasswordValid || !turnstileToken"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">Creating account...</span>
            <span v-else>Create Account</span>
          </button>
        </div>
        
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?
            <router-link to="/login" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Sign in
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { GOOGLE_CLIENT_ID } from '@/config/google.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const googleLoading = ref(false)

// Turnstile
const turnstileRef = ref(null)
const turnstileToken = ref('')
const turnstileError = ref('')
let turnstileWidgetId = null
const turnstileBypass = import.meta.env.VITE_TURNSTILE_BYPASS === 'true'

const isPasswordValid = computed(() => {
  const p = form.value.password
  return p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
})

// Render Turnstile widget when component mounts
const renderTurnstile = () => {
  if (window.turnstile && turnstileRef.value) {
    turnstileWidgetId = window.turnstile.render(turnstileRef.value, {
      sitekey: '0x4AAAAAACYz8MBTSm0NXSvb',
      theme: 'auto',
      callback: (token) => {
        turnstileToken.value = token
        turnstileError.value = ''
      },
      'expired-callback': () => {
        turnstileToken.value = ''
      },
      'error-callback': () => {
        turnstileError.value = 'Verification failed. Please try again.'
        turnstileToken.value = ''
      },
    })
  }
}

const navigateAfterAuth = () => {
  const redirect = route.query.redirect
  if (redirect && typeof redirect === 'string' && redirect.startsWith('/')) {
    router.push(redirect)
  } else {
    router.push('/')
  }
}

// Google Sign-Up
const handleGoogleSignUp = () => {
  if (!window.google?.accounts?.id) {
    error.value = 'Google Sign-In is not available. Please try again later.'
    return
  }

  googleLoading.value = true
  error.value = ''

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCallback,
    auto_select: false,
    ux_mode: 'popup',
    use_fedcm_for_prompt: true,
  })

  window.google.accounts.id.prompt((notification) => {
    if (notification.isDisplayed()) return
    googleLoading.value = false
    renderGoogleButtonFallback()
  })
}

const renderGoogleButtonFallback = () => {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '-9999px'
  document.body.appendChild(container)

  window.google.accounts.id.renderButton(container, {
    type: 'standard',
    size: 'large',
    click_listener: () => {
      googleLoading.value = true
    },
  })

  setTimeout(() => {
    const btn = container.querySelector('div[role="button"]') || container.querySelector('iframe')
    if (btn) btn.click()
    setTimeout(() => container.remove(), 60000)
  }, 100)
}

const handleGoogleCallback = async (response) => {
  try {
    googleLoading.value = true
    await authStore.googleAuth(response.credential)
    navigateAfterAuth()
  } catch (err) {
    error.value = err.message || 'Google sign-up failed. Please try again.'
  } finally {
    googleLoading.value = false
  }
}

onMounted(() => {
  // Auto-bypass turnstile in dev mode
  if (turnstileBypass) {
    turnstileToken.value = 'dev-bypass'
    return
  }
  // Wait for Turnstile script to load
  if (window.turnstile) {
    renderTurnstile()
  } else {
    // Poll until turnstile is available
    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval)
        renderTurnstile()
      }
    }, 200)
    // Cleanup after 10s
    setTimeout(() => clearInterval(interval), 10000)
  }
})

onBeforeUnmount(() => {
  if (turnstileWidgetId !== null && window.turnstile) {
    window.turnstile.remove(turnstileWidgetId)
  }
})

const handleRegister = async () => {
  error.value = ''

  // Validate passwords match
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  if (!turnstileToken.value) {
    turnstileError.value = 'Please complete the captcha verification'
    return
  }

  if (!isPasswordValid.value) {
    error.value = 'Password does not meet requirements'
    return
  }

  loading.value = true
  
  try {
    await authStore.register(form.value.email, form.value.password, turnstileToken.value)
    navigateAfterAuth()
  } catch (err) {
    console.error('Registration error:', err)
    error.value = err.message || 'Failed to register. Please try again.'
    // Reset turnstile on failure
    if (window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId)
      turnstileToken.value = ''
    }
  } finally {
    loading.value = false
  }
}
</script>
