<template>
  <div class="min-h-screen bg-[#101622] pt-20 pb-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">My Profile</h1>
        <p class="text-slate-400 text-sm mt-1">Manage your personal information and account settings</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0df2f2]"></div>
      </div>

      <div v-else class="space-y-6">
        <!-- Profile Card -->
        <div class="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden">
          <div class="h-24 bg-gradient-to-r from-[#0df2f2]/20 via-[#0df2f2]/10 to-transparent"></div>
          <div class="px-6 pb-6 -mt-12">
            <div class="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <!-- Avatar -->
              <div class="relative">
                <div v-if="user?.profile_image_url" class="w-24 h-24 rounded-xl overflow-hidden ring-4 ring-[#111318] shadow-xl">
                  <img :src="getAuthImageUrl(user.profile_image_url)" alt="Profile" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-24 h-24 rounded-xl bg-gradient-to-br from-[#0df2f2] to-emerald-600 flex items-center justify-center text-[#101622] text-3xl font-bold ring-4 ring-[#111318] shadow-xl">
                  {{ (user?.nickname || user?.first_name || user?.email || 'U').charAt(0).toUpperCase() }}
                </div>
                <label class="absolute -bottom-1 -right-1 bg-[#0df2f2] hover:bg-[#0bd8d8] text-[#101622] p-1.5 rounded-lg cursor-pointer shadow-lg transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <input type="file" accept="image/*" class="hidden" @change="handleAvatarUpload" />
                </label>
              </div>
              <div class="flex-1 min-w-0 pt-2">
                <h2 class="text-xl font-bold text-white truncate">{{ user?.nickname || user?.first_name || 'User' }}</h2>
                <p class="text-slate-400 text-sm truncate">{{ user?.email }}</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-700 text-slate-300">
                {{ user?.role || 'user' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Identification Section -->
        <div class="bg-[#111318] border border-slate-800 rounded-xl p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 rounded-lg bg-[#0df2f2]/10">
              <svg class="w-5 h-5 text-[#0df2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Identification</h3>
              <p class="text-xs text-slate-500">Personal details used for event registration and verification</p>
            </div>
          </div>
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">First Name</label>
                <input v-model="form.first_name" type="text" class="field-input" placeholder="John" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Last Name</label>
                <input v-model="form.last_name" type="text" class="field-input" placeholder="Doe" />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Date of Birth</label>
                <input v-model="form.date_of_birth" type="date" class="field-input" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Social Link</label>
                <input v-model="form.social_link" type="tel" class="field-input" placeholder="https://t.me/username" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Nickname</label>
              <input v-model="form.nickname" type="text" class="field-input" placeholder="Display name" />
              <p class="text-xs text-slate-500 mt-1">How others see you on the platform</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input :value="user?.email" type="email" disabled class="field-input !bg-slate-800/50 !text-slate-500 !cursor-not-allowed" />
              <p class="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>

            <!-- Status messages -->
            <div v-if="successMsg" class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-lg flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ successMsg }}
            </div>
            <div v-if="errorMsg" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">{{ errorMsg }}</div>

            <div class="flex justify-end pt-2">
              <button type="submit" :disabled="saving" class="px-6 py-2.5 bg-[#0df2f2] hover:bg-[#0bd8d8] text-[#101622] rounded-lg font-bold text-sm shadow-lg shadow-[#0df2f2]/20 transition-all disabled:opacity-50">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Security Section -->
        <div class="bg-[#111318] border border-slate-800 rounded-xl p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 rounded-lg bg-orange-500/10">
              <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Security</h3>
              <p class="text-xs text-slate-500">Change your password</p>
            </div>
          </div>

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
                <input type="password" disabled class="field-input" placeholder="••••••••" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                  <input type="password" disabled class="field-input" placeholder="••••••••" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                  <input type="password" disabled class="field-input" placeholder="••••••••" />
                </div>
              </div>
              <div class="flex justify-end pt-2">
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
              <input v-model="pwForm.old_password" type="password" required class="field-input" placeholder="••••••••" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                <input v-model="pwForm.new_password" type="password" required class="field-input" placeholder="••••••••" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                <input v-model="pwForm.confirm_password" type="password" required class="field-input" placeholder="••••••••" />
              </div>
            </div>
            <div v-if="pwError" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">{{ pwError }}</div>
            <div v-if="pwSuccess" class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-lg">{{ pwSuccess }}</div>
            <div class="flex justify-end pt-2">
              <button type="submit" :disabled="pwLoading" class="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50">
                {{ pwLoading ? 'Changing...' : 'Change Password' }}
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
const user = computed(() => authStore.user)
const loading = ref(true)

// Check if user signed in via third-party only (no local password)
const isThirdPartyOnly = computed(() => {
  const provider = user.value?.auth_provider || 'local'
  return provider === 'google' // pure Google, no local password
})
const providerLabel = computed(() => {
  const provider = user.value?.auth_provider || 'local'
  if (provider === 'google') return 'Google'
  return provider
})

const form = ref({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  social_link: '',
  nickname: ''
})
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const pwForm = ref({ old_password: '', new_password: '', confirm_password: '' })
const pwLoading = ref(false)
const pwError = ref('')
const pwSuccess = ref('')

const initForm = () => {
  if (user.value) {
    form.value = {
      first_name: user.value.first_name || '',
      last_name: user.value.last_name || '',
      date_of_birth: user.value.date_of_birth || '',
      social_link: user.value.social_link || '',
      nickname: user.value.nickname || ''
    }
  }
  loading.value = false
}

const updateProfile = async () => {
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    await authStore.updateProfile(form.value)
    successMsg.value = 'Profile updated successfully!'
    setTimeout(() => { successMsg.value = '' }, 3000)
  } catch (e) {
    errorMsg.value = e.message || 'Failed to update profile'
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  pwError.value = ''
  pwSuccess.value = ''
  if (pwForm.value.new_password !== pwForm.value.confirm_password) {
    pwError.value = 'New passwords do not match'
    return
  }
  if (pwForm.value.new_password.length < 8) {
    pwError.value = 'Password must be at least 8 characters'
    return
  }
  pwLoading.value = true
  try {
    await authApi.changePassword(pwForm.value.old_password, pwForm.value.new_password)
    pwSuccess.value = 'Password changed successfully!'
    pwForm.value = { old_password: '', new_password: '', confirm_password: '' }
  } catch (e) {
    pwError.value = e.message
  } finally {
    pwLoading.value = false
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

onMounted(async () => {
  await authStore.checkAuth(true)
  initForm()
})
</script>

<style scoped>
.field-input {
  @apply block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none transition-all;
}
</style>
