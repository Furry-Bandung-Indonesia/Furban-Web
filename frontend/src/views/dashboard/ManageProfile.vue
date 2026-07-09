<template>
  <div class="flex-1 overflow-y-auto p-6 md:p-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile Card Sidebar -->
      <div class="lg:col-span-1">
        <div class="bg-[#111318] border border-slate-800 rounded-xl p-6 text-center">
          <!-- Avatar -->
          <div class="relative inline-block mb-4">
            <div v-if="authStore.user?.profile_image_url" class="w-28 h-28 rounded-full overflow-hidden ring-4 ring-[#0df2f2]/30 ring-offset-2 ring-offset-[#111318] mx-auto">
              <img :src="getAuthImageUrl(authStore.user.profile_image_url)" alt="Profile" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-28 h-28 rounded-full bg-gradient-to-br from-[#0df2f2] to-emerald-600 flex items-center justify-center text-[#101622] text-3xl font-bold ring-4 ring-[#0df2f2]/30 ring-offset-2 ring-offset-[#111318] mx-auto">
              {{ (authStore.user?.nickname || authStore.user?.legal_name || authStore.user?.email || 'U').charAt(0).toUpperCase() }}
            </div>
            <!-- Upload Button -->
            <label class="absolute bottom-0 right-0 bg-[#0df2f2] hover:bg-[#0bd8d8] text-[#101622] p-2 rounded-full cursor-pointer shadow-lg shadow-[#0df2f2]/20 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" accept="image/*" class="hidden" @change="handleAvatarUpload" />
            </label>
          </div>
          
          <h2 class="text-xl font-bold text-white">{{ authStore.user?.nickname || 'User' }}</h2>
          <p class="text-slate-400 text-sm mt-1">{{ authStore.user?.email }}</p>
          <span :class="getRoleBadgeClass(authStore.user?.role)" class="mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {{ getRoleLabel(authStore.user?.role) }}
          </span>
          
          <!-- Quick Links -->
          <div class="mt-6 pt-6 border-t border-slate-800 text-center" v-if="isPhotographer || isPublisher || isAdmin">
            <p class="text-sm text-slate-500 mb-3">Quick Links</p>
            <div class="flex flex-col gap-2">
              <router-link v-if="isPhotographer" to="/dashboard/photos" class="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors">
                My Photos
              </router-link>
              <router-link v-if="isPublisher" to="/dashboard/blogs" class="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition-colors">
                My Blogs
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Edit Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Profile Information -->
        <div class="bg-[#111318] border border-slate-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-5">Profile Information</h3>
          <form @submit.prevent="updateProfile" class="space-y-4">
            <!-- Identification Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">First Name</label>
                <input v-model="profileForm.first_name" type="text" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none transition-all" placeholder="First name" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Last Name</label>
                <input v-model="profileForm.last_name" type="text" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none transition-all" placeholder="Last name" />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Date of Birth</label>
                <input v-model="profileForm.date_of_birth" type="date" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none transition-all" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Social Link</label>
                <input v-model="profileForm.social_link" type="tel" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none transition-all" placeholder="+62 812 3456 7890" />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Legal Name</label>
                <input v-model="profileForm.legal_name" type="text" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none transition-all" placeholder="Your legal name" />
                <p class="text-xs text-slate-500 mt-1">Used for verification and official documents</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Nickname</label>
                <input v-model="profileForm.nickname" type="text" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none transition-all" placeholder="Display name" />
                <p class="text-xs text-slate-500 mt-1">Displayed publicly on your content</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input :value="authStore.user?.email" type="email" disabled class="block w-full border border-slate-700 p-3 rounded-lg bg-slate-800/50 text-slate-400 cursor-not-allowed" />
              <p class="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>
            <div class="flex justify-end pt-4">
              <button type="submit" :disabled="profileLoading" class="px-6 py-2.5 bg-[#0df2f2] hover:bg-[#0bd8d8] text-[#101622] rounded-lg font-bold text-sm shadow-lg shadow-[#0df2f2]/20 transition-all disabled:opacity-50">
                {{ profileLoading ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Change Password -->
        <div class="bg-[#111318] border border-slate-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-5">Security</h3>

          <!-- Google / Third-party account warning -->
          <div v-if="isThirdPartyOnly" class="relative">
            <div class="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-[#111318]/60 rounded-lg">
              <div class="text-center px-6 py-8">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-3">
                  <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p class="text-sm font-semibold text-white mb-1">Third-party account</p>
                <p class="text-xs text-slate-400 max-w-xs">Manage your account password through your <span class="text-amber-400 font-medium">{{ providerLabel }}</span> account settings.</p>
              </div>
            </div>
            <div class="space-y-4 opacity-30 pointer-events-none select-none">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label>
                <input type="password" disabled class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500" placeholder="••••••••" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                  <input type="password" disabled class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500" placeholder="••••••••" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                  <input type="password" disabled class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500" placeholder="••••••••" />
                </div>
              </div>
              <div class="flex justify-end pt-4">
                <button disabled class="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-bold text-sm opacity-50 cursor-not-allowed">
                  Change Password
                </button>
              </div>
            </div>
          </div>

          <!-- Normal password change form -->
          <form v-else @submit.prevent="changePassword" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label>
              <input v-model="passwordForm.old_password" type="password" required class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none transition-all" placeholder="••••••••" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                <input v-model="passwordForm.new_password" type="password" required class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none transition-all" placeholder="••••••••" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                <input v-model="passwordForm.confirm_password" type="password" required class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none transition-all" placeholder="••••••••" />
              </div>
            </div>
            <div v-if="passwordError" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">{{ passwordError }}</div>
            <div v-if="passwordSuccess" class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-lg">{{ passwordSuccess }}</div>
            <div class="flex justify-end pt-4">
              <button type="submit" :disabled="passwordLoading" class="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50">
                {{ passwordLoading ? 'Changing...' : 'Change Password' }}
              </button>
            </div>
          </form>
        </div>
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
const profileForm = ref({ legal_name: '', nickname: '', first_name: '', last_name: '', date_of_birth: '', social_link: '' })
const profileLoading = ref(false)
const passwordForm = ref({ old_password: '', new_password: '', confirm_password: '' })
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

// Role Helpers
const isAdmin = computed(() => authStore.isAdmin)
const isPhotographer = computed(() => authStore.isPhotographer)
const isPublisher = computed(() => authStore.isPublisher)

// Check if user signed in via third-party only (no local password)
const isThirdPartyOnly = computed(() => {
  const provider = authStore.user?.auth_provider || 'local'
  return provider === 'google'
})
const providerLabel = computed(() => {
  const provider = authStore.user?.auth_provider || 'local'
  if (provider === 'google') return 'Google'
  return provider
})

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
    case 'admin': return 'bg-purple-500/20 text-purple-400'
    case 'photographer': return 'bg-blue-500/20 text-blue-400'
    case 'publisher': return 'bg-emerald-500/20 text-emerald-400'
    default: return 'bg-slate-700 text-slate-300'
  }
}

// Initialize profile form
const initializeProfile = () => {
  if (authStore.user) {
    profileForm.value = {
      legal_name: authStore.user.legal_name || '',
      nickname: authStore.user.nickname || '',
      first_name: authStore.user.first_name || '',
      last_name: authStore.user.last_name || '',
      date_of_birth: authStore.user.date_of_birth || '',
      social_link: authStore.user.social_link || ''
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
    await authStore.uploadAvatar(file)
  } catch (e) {
    alert('Failed to upload avatar: ' + e.message)
  }
}

onMounted(() => {
  initializeProfile()
})
</script>
