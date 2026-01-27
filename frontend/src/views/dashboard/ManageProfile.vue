<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Profile Card -->
    <div class="lg:col-span-1">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center">
        <!-- Avatar -->
        <div class="relative inline-block mb-4">
          <div v-if="authStore.user?.profile_image_url" class="w-32 h-32 rounded-full overflow-hidden ring-4 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800 mx-auto">
            <img :src="getAuthImageUrl(authStore.user.profile_image_url)" alt="Profile" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800 mx-auto">
            {{ (authStore.user?.nickname || authStore.user?.legal_name || authStore.user?.email || 'U').charAt(0).toUpperCase() }}
          </div>
          <!-- Upload Button -->
          <label class="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <input type="file" accept="image/*" class="hidden" @change="handleAvatarUpload" />
          </label>
        </div>
        
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ authStore.user?.nickname || 'User' }}</h2>
        <p class="text-gray-500 dark:text-gray-400">{{ authStore.user?.email }}</p>
        <span :class="getRoleBadgeClass(authStore.user?.role)" class="mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
          {{ getRoleLabel(authStore.user?.role) }}
        </span>
        
        <!-- Quick Stats - Links to respective pages -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center" v-if="isPhotographer || isPublisher || isAdmin">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Quick Links</p>
          <div class="flex justify-center gap-4">
            <router-link v-if="isPhotographer" to="/manage-photos" class="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors">
              My Photos
            </router-link>
            <router-link v-if="isPublisher" to="/manage-blogs" class="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors">
              My Blogs
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile Edit Form -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Profile Information -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Profile Information</h3>
        <form @submit.prevent="updateProfile" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Legal Name</label>
              <input v-model="profileForm.legal_name" type="text" class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Your legal name" />
              <p class="text-xs text-gray-400 mt-1">Used for verification and official documents</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nickname</label>
              <input v-model="profileForm.nickname" type="text" class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Display name" />
              <p class="text-xs text-gray-400 mt-1">Displayed publicly on your content</p>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input :value="authStore.user?.email" type="email" disabled class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl bg-gray-100 dark:bg-gray-600 dark:text-gray-300 cursor-not-allowed" />
            <p class="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div class="flex justify-end pt-4">
            <button type="submit" :disabled="profileLoading" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg transition-all disabled:opacity-50">
              {{ profileLoading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Change Password -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Change Password</h3>
        <form @submit.prevent="changePassword" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
            <input v-model="passwordForm.old_password" type="password" required class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input v-model="passwordForm.new_password" type="password" required class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input v-model="passwordForm.confirm_password" type="password" required class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
            </div>
          </div>
          <div v-if="passwordError" class="text-red-500 text-sm">{{ passwordError }}</div>
          <div v-if="passwordSuccess" class="text-green-500 text-sm">{{ passwordSuccess }}</div>
          <div class="flex justify-end pt-4">
            <button type="submit" :disabled="passwordLoading" class="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium shadow-lg transition-all disabled:opacity-50">
              {{ passwordLoading ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import authApi from '@/services/authApi'
import { getAuthImageUrl } from '@/config/api'

const authStore = useAuthStore()

// State
const profileForm = ref({ legal_name: '', nickname: '' })
const profileLoading = ref(false)
const passwordForm = ref({ old_password: '', new_password: '', confirm_password: '' })
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

// Role Helpers
const isAdmin = computed(() => authStore.isAdmin)
const isPhotographer = computed(() => authStore.isPhotographer)
const isPublisher = computed(() => authStore.isPublisher)

const getRoleLabel = (role) => {
  switch(role) {
    case 'admin': return 'Admin'
    case 'photographer': return 'Photographer'
    case 'publisher': return 'Publisher'
    case 'user': return 'User'
    default: return role || 'Unknown'
  }
}

const getRoleBadgeClass = (role) => {
  switch(role) {
    case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700'
    case 'photographer': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700'
    case 'publisher': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

// Initialize profile form
const initializeProfile = () => {
  if (authStore.user) {
    profileForm.value = {
      legal_name: authStore.user.legal_name || '',
      nickname: authStore.user.nickname || ''
    }
  }
}

// Profile Actions
const updateProfile = async () => {
  profileLoading.value = true
  try {
    await authApi.updateProfile(profileForm.value)
    await authStore.checkAuth()
    alert('Profile updated successfully!')
  } catch (e) {
    alert('Failed to update profile: ' + e.message)
  } finally {
    profileLoading.value = false
  }
}

const changePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''
  
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    passwordError.value = 'New passwords do not match'
    return
  }
  
  if (passwordForm.value.new_password.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
    return
  }
  
  passwordLoading.value = true
  try {
    await authApi.changePassword(passwordForm.value.old_password, passwordForm.value.new_password)
    passwordSuccess.value = 'Password changed successfully!'
    passwordForm.value = { old_password: '', new_password: '', confirm_password: '' }
  } catch (e) {
    passwordError.value = e.message
  } finally {
    passwordLoading.value = false
  }
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    await authApi.uploadAvatar(file)
    await authStore.checkAuth()
    alert('Avatar uploaded successfully!')
  } catch (e) {
    alert('Failed to upload avatar: ' + e.message)
  }
}

onMounted(() => {
  initializeProfile()
})
</script>
