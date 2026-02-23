<template>
  <div class="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">User Management</h2>
        <p class="text-slate-400 text-sm mt-1">Manage platform access and roles</p>
      </div>
      <button @click="openCreateUser"
        class="bg-[#0df2f2] hover:bg-[#0bd8d8] text-[#101622] px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#0df2f2]/20 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Add User
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0df2f2] mx-auto"></div>
      <p class="text-slate-500 mt-4 text-sm">Loading users...</p>
    </div>

    <!-- User Table -->
    <div v-else class="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-800">
          <thead class="bg-[#0d0f13]">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50">
            <tr v-for="user in users" :key="user.uuid" class="hover:bg-slate-800/40 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div v-if="user.profile_image_url" class="h-10 w-10 rounded-full overflow-hidden ring-2 ring-slate-700">
                      <img :src="getAuthImageUrl(user.profile_image_url)" alt="" class="w-full h-full object-cover" />
                    </div>
                    <div v-else class="h-10 w-10 rounded-full bg-gradient-to-br from-[#0df2f2] to-emerald-600 flex items-center justify-center text-[#101622] font-bold text-sm">
                      {{ (user.nickname || user.legal_name || user.email || 'U').charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-white">{{ user.nickname || user.legal_name || 'No name' }}</div>
                    <div class="text-sm text-slate-500">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getRoleBadgeClass(user.role)" class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="user.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'" class="px-2.5 py-1 text-xs font-bold rounded-full">
                  {{ user.is_active ? 'Active' : 'Suspended' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="flex justify-end gap-1">
                  <button @click="viewUserDetail(user)" class="p-2 text-slate-500 hover:text-amber-400 transition-colors rounded-lg hover:bg-amber-500/10" title="View Details">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                  <button @click="editUser(user)" class="p-2 text-slate-500 hover:text-[#0df2f2] transition-colors rounded-lg hover:bg-[#0df2f2]/10" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button @click="confirmDelete(user)" class="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10" title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit User Modal -->
    <div v-if="showCreateUser" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div class="bg-[#111318] border border-slate-700 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-white">{{ isEditingUser ? 'Edit User' : 'Add New User' }}</h3>
          <button @click="closeUserModal" class="text-slate-400 hover:text-white p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form @submit.prevent="submitUser" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input v-model="userForm.email" type="email" placeholder="john@example.com" :required="!isEditingUser" :disabled="isEditingUser" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none disabled:bg-slate-800/50 disabled:text-slate-500 disabled:cursor-not-allowed" />
          </div>
          <div v-if="!isEditingUser">
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <div class="relative">
              <input v-model="userForm.password" :type="showUserPassword ? 'text' : 'password'" placeholder="••••••••" required class="block w-full border border-slate-700 p-3 pr-10 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
              <button type="button" @click="showUserPassword = !showUserPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300">
                <svg v-if="!showUserPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              </button>
            </div>
          </div>
          <div v-if="isEditingUser">
            <label class="block text-sm font-medium text-slate-300 mb-1.5">New Password <span class="text-slate-500 font-normal">(leave blank to keep current)</span></label>
            <div class="relative">
              <input v-model="userForm.password" :type="showUserPassword ? 'text' : 'password'" placeholder="Enter new password..." class="block w-full border border-slate-700 p-3 pr-10 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
              <button type="button" @click="showUserPassword = !showUserPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300">
                <svg v-if="!showUserPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">First Name</label>
              <input v-model="userForm.first_name" placeholder="John" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Last Name</label>
              <input v-model="userForm.last_name" placeholder="Doe" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Date of Birth</label>
              <input v-model="userForm.date_of_birth" type="date" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Phone Number</label>
              <input v-model="userForm.phone_number" type="tel" placeholder="+62 812 3456 7890" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Legal Name</label>
              <input v-model="userForm.legal_name" placeholder="John Doe" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">Nickname</label>
              <input v-model="userForm.nickname" placeholder="Johnny" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
            </div>
          </div>
          
          <!-- Role Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Role</label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all" :class="userForm.role === 'user' ? 'border-slate-500 bg-slate-800' : 'border-slate-700 hover:border-slate-600'">
                <input type="radio" v-model="userForm.role" value="user" class="form-radio h-4 w-4 text-[#0df2f2]" />
                <span class="text-slate-300 text-sm">User</span>
              </label>
              <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all" :class="userForm.role === 'photographer' ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-700 hover:border-slate-600'">
                <input type="radio" v-model="userForm.role" value="photographer" class="form-radio h-4 w-4 text-blue-500" />
                <span class="text-slate-300 text-sm">Photographer</span>
              </label>
              <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all" :class="userForm.role === 'publisher' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-600'">
                <input type="radio" v-model="userForm.role" value="publisher" class="form-radio h-4 w-4 text-emerald-500" />
                <span class="text-slate-300 text-sm">Publisher</span>
              </label>
              <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all" :class="userForm.role === 'admin' ? 'border-purple-500/50 bg-purple-500/10' : 'border-slate-700 hover:border-slate-600'">
                <input type="radio" v-model="userForm.role" value="admin" class="form-radio h-4 w-4 text-purple-500" />
                <span class="text-slate-300 text-sm">Admin</span>
              </label>
            </div>
          </div>

          <!-- Status Toggle -->
          <div>
            <label class="flex items-center gap-3 cursor-pointer">
              <div class="relative">
                <input type="checkbox" v-model="userForm.is_active" :true-value="1" :false-value="0" class="sr-only" />
                <div :class="userForm.is_active ? 'bg-[#0df2f2]' : 'bg-slate-600'" class="w-10 h-5 rounded-full transition-colors"></div>
                <div class="dot absolute w-4 h-4 bg-white rounded-full shadow top-0.5 left-0.5 transition-transform" :class="{ 'translate-x-5': userForm.is_active }"></div>
              </div>
              <span class="text-sm font-medium text-slate-300">
                {{ userForm.is_active ? 'Account Active' : 'Account Suspended' }}
              </span>
            </label>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" @click="closeUserModal" class="px-5 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 font-medium transition-colors">Cancel</button>
            <button type="submit" :disabled="submitting" class="px-5 py-2.5 bg-[#0df2f2] text-[#101622] rounded-lg hover:bg-[#0bd8d8] font-bold shadow-lg shadow-[#0df2f2]/20 transition-all disabled:opacity-50">
              {{ submitting ? 'Saving...' : (isEditingUser ? 'Update User' : 'Create User') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- User Detail Modal -->
    <div v-if="showUserDetail" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div class="bg-[#111318] border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <!-- Header with avatar -->
        <div class="relative p-6 pb-4 border-b border-slate-800">
          <button @click="showUserDetail = false" class="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0">
              <div v-if="selectedUser?.profile_image_url" class="h-16 w-16 rounded-full overflow-hidden ring-3 ring-[#0df2f2]/30">
                <img :src="getAuthImageUrl(selectedUser.profile_image_url)" alt="" class="w-full h-full object-cover" />
              </div>
              <div v-else class="h-16 w-16 rounded-full bg-gradient-to-br from-[#0df2f2] to-emerald-600 flex items-center justify-center text-[#101622] font-bold text-xl">
                {{ (selectedUser?.nickname || selectedUser?.legal_name || selectedUser?.email || 'U').charAt(0).toUpperCase() }}
              </div>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">{{ selectedUser?.first_name || selectedUser?.legal_name || 'Unknown' }} {{ selectedUser?.last_name || '' }}</h3>
              <p class="text-sm text-slate-400">{{ selectedUser?.email }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span :class="getRoleBadgeClass(selectedUser?.role)" class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">{{ getRoleLabel(selectedUser?.role) }}</span>
                <span :class="selectedUser?.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'" class="px-2.5 py-0.5 text-xs font-bold rounded-full">
                  {{ selectedUser?.is_active ? 'Active' : 'Suspended' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Detail Fields -->
        <div class="p-6 space-y-5">
          <!-- Identification -->
          <div>
            <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Identification</h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-[#0d0f13] rounded-lg p-3">
                <p class="text-xs text-slate-500 mb-1">First Name</p>
                <p class="text-sm text-white font-medium">{{ selectedUser?.first_name || '—' }}</p>
              </div>
              <div class="bg-[#0d0f13] rounded-lg p-3">
                <p class="text-xs text-slate-500 mb-1">Last Name</p>
                <p class="text-sm text-white font-medium">{{ selectedUser?.last_name || '—' }}</p>
              </div>
              <div class="bg-[#0d0f13] rounded-lg p-3">
                <p class="text-xs text-slate-500 mb-1">Date of Birth</p>
                <p class="text-sm text-white font-medium">{{ selectedUser?.date_of_birth || '—' }}</p>
              </div>
              <div class="bg-[#0d0f13] rounded-lg p-3">
                <p class="text-xs text-slate-500 mb-1">Phone Number</p>
                <p class="text-sm text-white font-medium">{{ selectedUser?.phone_number || '—' }}</p>
              </div>
            </div>
          </div>

          <!-- Profile Info -->
          <div>
            <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Profile</h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-[#0d0f13] rounded-lg p-3">
                <p class="text-xs text-slate-500 mb-1">Legal Name</p>
                <p class="text-sm text-white font-medium">{{ selectedUser?.legal_name || '—' }}</p>
              </div>
              <div class="bg-[#0d0f13] rounded-lg p-3">
                <p class="text-xs text-slate-500 mb-1">Nickname</p>
                <p class="text-sm text-white font-medium">{{ selectedUser?.nickname || '—' }}</p>
              </div>
              <div class="bg-[#0d0f13] rounded-lg p-3">
                <p class="text-xs text-slate-500 mb-1">Email</p>
                <p class="text-sm text-white font-medium">{{ selectedUser?.email || '—' }}</p>
              </div>
              <div class="bg-[#0d0f13] rounded-lg p-3">
                <p class="text-xs text-slate-500 mb-1">Member Since</p>
                <p class="text-sm text-white font-medium">{{ selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '—' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
          <button @click="editUser(selectedUser); showUserDetail = false" class="px-4 py-2 bg-[#0df2f2]/10 text-[#0df2f2] rounded-lg text-sm font-medium hover:bg-[#0df2f2]/20 transition-colors">
            Edit User
          </button>
          <button @click="showUserDetail = false" class="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors">
            Close
          </button>
        </div>
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
const showUserDetail = ref(false)
const selectedUser = ref(null)
const userForm = ref({
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  date_of_birth: '',
  phone_number: '',
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
    case 'admin': return 'bg-purple-500/20 text-purple-400'
    case 'photographer': return 'bg-blue-500/20 text-blue-400'
    case 'publisher': return 'bg-emerald-500/20 text-emerald-400'
    default: return 'bg-slate-700 text-slate-300'
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
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone_number: '',
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
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    date_of_birth: user.date_of_birth || '',
    phone_number: user.phone_number || '',
    legal_name: user.legal_name || '',
    nickname: user.nickname || '',
    password: '',
    role: user.role || 'user',
    is_active: user.is_active
  }
  showCreateUser.value = true
}

const viewUserDetail = (user) => {
  selectedUser.value = user
  showUserDetail.value = true
}

const submitUser = async () => {
  submitting.value = true
  try {
    if (isEditingUser.value) {
      const updateData = {
        first_name: userForm.value.first_name,
        last_name: userForm.value.last_name,
        date_of_birth: userForm.value.date_of_birth,
        phone_number: userForm.value.phone_number,
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
        first_name: userForm.value.first_name,
        last_name: userForm.value.last_name,
        date_of_birth: userForm.value.date_of_birth,
        phone_number: userForm.value.phone_number,
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
