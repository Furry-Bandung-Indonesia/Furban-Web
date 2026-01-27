<template>
  <div>
    <!-- User Management Table -->
    <div class="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
      <div class="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">User Management</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Manage platform access and roles</p>
        </div>
        <button @click="openCreateUser" class="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 transform hover:scale-105 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add User
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="text-gray-500 mt-4">Loading users...</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="user in users" :key="user.uuid" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div v-if="user.profile_image_url" class="h-10 w-10 rounded-full overflow-hidden">
                      <img :src="getAuthImageUrl(user.profile_image_url)" alt="" class="w-full h-full object-cover" />
                    </div>
                    <div v-else class="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {{ (user.nickname || user.legal_name || user.email || 'U').charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ user.nickname || user.legal_name || 'No name' }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-wrap gap-1">
                  <span :class="getRoleBadgeClass(user.role)" class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border bg-opacity-10">
                    {{ getRoleLabel(user.role) }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ user.is_active ? 'Active' : 'Suspended' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="editUser(user)" class="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button @click="confirmDelete(user)" class="text-gray-400 hover:text-red-600 transition-colors duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit User Modal -->
    <div v-if="showCreateUser" class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ isEditingUser ? 'Edit User' : 'Add New User' }}</h3>
          <button @click="closeUserModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form @submit.prevent="submitUser" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input v-model="userForm.email" type="email" placeholder="john@example.com" :required="!isEditingUser" :disabled="isEditingUser" class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed" />
          </div>
          <div v-if="!isEditingUser">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div class="relative">
              <input v-model="userForm.password" :type="showUserPassword ? 'text' : 'password'" placeholder="••••••••" required class="block w-full border border-gray-300 dark:border-gray-600 p-3 pr-10 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              <button type="button" @click="showUserPassword = !showUserPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                <svg v-if="!showUserPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>
          <div v-if="isEditingUser">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password <span class="text-gray-400 font-normal">(leave blank to keep current)</span></label>
            <div class="relative">
              <input v-model="userForm.password" :type="showUserPassword ? 'text' : 'password'" placeholder="Enter new password..." class="block w-full border border-gray-300 dark:border-gray-600 p-3 pr-10 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              <button type="button" @click="showUserPassword = !showUserPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                <svg v-if="!showUserPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Legal Name</label>
              <input v-model="userForm.legal_name" placeholder="John Doe" class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nickname</label>
              <input v-model="userForm.nickname" placeholder="Johnny" class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          
          <!-- Role Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center space-x-2 p-3 border rounded-xl cursor-pointer transition-colors" :class="userForm.role === 'user' ? 'border-gray-500 bg-gray-50 dark:bg-gray-700' : 'border-gray-300 dark:border-gray-600'">
                <input type="radio" v-model="userForm.role" value="user" class="form-radio h-4 w-4" />
                <span class="text-gray-700 dark:text-gray-300">User</span>
              </label>
              <label class="flex items-center space-x-2 p-3 border rounded-xl cursor-pointer transition-colors" :class="userForm.role === 'photographer' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'">
                <input type="radio" v-model="userForm.role" value="photographer" class="form-radio h-4 w-4 text-blue-600" />
                <span class="text-gray-700 dark:text-gray-300">Photographer</span>
              </label>
              <label class="flex items-center space-x-2 p-3 border rounded-xl cursor-pointer transition-colors" :class="userForm.role === 'publisher' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-300 dark:border-gray-600'">
                <input type="radio" v-model="userForm.role" value="publisher" class="form-radio h-4 w-4 text-emerald-600" />
                <span class="text-gray-700 dark:text-gray-300">Publisher</span>
              </label>
              <label class="flex items-center space-x-2 p-3 border rounded-xl cursor-pointer transition-colors" :class="userForm.role === 'admin' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-gray-300 dark:border-gray-600'">
                <input type="radio" v-model="userForm.role" value="admin" class="form-radio h-4 w-4 text-purple-600" />
                <span class="text-gray-700 dark:text-gray-300">Admin</span>
              </label>
            </div>
          </div>

          <!-- Status Toggle -->
          <div>
            <label class="flex items-center cursor-pointer">
              <div class="relative">
                <input type="checkbox" v-model="userForm.is_active" :true-value="1" :false-value="0" class="sr-only" />
                <div class="w-10 h-4 bg-gray-400 rounded-full shadow-inner"></div>
                <div class="dot absolute w-6 h-6 bg-white rounded-full shadow -left-1 -top-1 transition" :class="{ 'transform translate-x-full bg-green-500': userForm.is_active }"></div>
              </div>
              <div class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ userForm.is_active ? 'Account Active' : 'Account Suspended' }}
              </div>
            </label>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="closeUserModal" class="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">Cancel</button>
            <button type="submit" :disabled="submitting" class="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50">
              {{ submitting ? 'Saving...' : (isEditingUser ? 'Update User' : 'Create User') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <ConfirmModal 
      :isOpen="showConfirmModal"
      title="Confirm Delete"
      :message="'Are you sure you want to delete this user?'"
      @confirm="executeDelete"
      @close="showConfirmModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import authApi from '@/services/authApi'
import { getAuthImageUrl } from '@/config/api'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

// State
const loading = ref(false)
const submitting = ref(false)
const users = ref([])

// Modal state
const showCreateUser = ref(false)
const isEditingUser = ref(false)
const editingUserId = ref(null)
const showUserPassword = ref(false)
const userForm = ref({
  email: '',
  password: '',
  legal_name: '',
  nickname: '',
  role: 'user',
  is_active: 1
})

const showConfirmModal = ref(false)
const deletingUser = ref(null)

// Helper functions
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

// Load users
const loadUsers = async () => {
  loading.value = true
  try {
    const u = await authApi.getUsers()
    users.value = Array.isArray(u) ? u : (u.data || [])
  } catch (e) {
    console.error('Error loading users:', e)
  } finally {
    loading.value = false
  }
}

// User form actions
const resetUserForm = () => {
  userForm.value = {
    email: '',
    password: '',
    legal_name: '',
    nickname: '',
    role: 'user',
    is_active: 1
  }
  isEditingUser.value = false
  editingUserId.value = null
  showUserPassword.value = false
}

const openCreateUser = () => {
  resetUserForm()
  showCreateUser.value = true
}

const closeUserModal = () => {
  showCreateUser.value = false
  resetUserForm()
}

const editUser = (user) => {
  isEditingUser.value = true
  editingUserId.value = user.uuid || user.id
  userForm.value = {
    email: user.email,
    legal_name: user.legal_name || '',
    nickname: user.nickname || '',
    password: '',
    role: user.role || 'user',
    is_active: user.is_active
  }
  showCreateUser.value = true
}

const submitUser = async () => {
  submitting.value = true
  try {
    if (isEditingUser.value) {
      const updateData = {
        legal_name: userForm.value.legal_name,
        nickname: userForm.value.nickname,
        is_active: userForm.value.is_active
      }
      if (userForm.value.password && userForm.value.password.trim()) {
        updateData.password = userForm.value.password
      }
      await authApi.adminUpdateUser(editingUserId.value, updateData)
      await authApi.adminSetRole(editingUserId.value, userForm.value.role)
    } else {
      await authApi.adminCreateUser({
        email: userForm.value.email,
        password: userForm.value.password,
        role: userForm.value.role,
        legal_name: userForm.value.legal_name,
        nickname: userForm.value.nickname
      })
    }
    closeUserModal()
    await loadUsers()
  } catch (e) {
    console.error(e)
    alert(e.message)
  } finally {
    submitting.value = false
  }
}

// Delete
const confirmDelete = (user) => {
  deletingUser.value = user
  showConfirmModal.value = true
}

const executeDelete = async () => {
  if (!deletingUser.value) return
  try {
    await authApi.adminDeleteUser(deletingUser.value.uuid)
    users.value = users.value.filter(u => u.uuid !== deletingUser.value.uuid)
  } catch (e) {
    alert(e.message)
  }
  showConfirmModal.value = false
  deletingUser.value = null
}

onMounted(loadUsers)
</script>
