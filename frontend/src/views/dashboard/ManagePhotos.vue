<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#111318]">
      <div>
        <h2 class="text-xl font-bold text-white">{{ isAdmin ? 'All Photos' : 'My Gallery' }}</h2>
        <p class="text-slate-400 text-sm">{{ photos.length }} photo{{ photos.length !== 1 ? 's' : '' }}</p>
      </div>
      <button @click="showUploadPhoto = true"
        class="bg-[#0df2f2] hover:bg-[#0bd8d8] text-[#101622] px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#0df2f2]/20 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Upload Photo
      </button>
    </div>
    
    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0df2f2] mx-auto"></div>
        <p class="text-slate-500 mt-4 text-sm">Loading photos...</p>
      </div>
    </div>

    <div v-else class="flex-1 overflow-hidden flex">
      <!-- Sidebar List -->
      <div class="w-64 border-r border-slate-800 flex flex-col overflow-y-auto p-2 space-y-1 bg-[#0d0f13]">
        <div v-if="photos.length === 0" class="text-center py-6 text-slate-500 text-sm">No photos found.</div>
        <div v-for="photo in photos" :key="photo.id" @click="selectedPhoto = photo"
          :class="['p-2.5 rounded-lg cursor-pointer flex items-center gap-3 transition-all',
            selectedPhoto?.id === photo.id 
              ? 'bg-[#0df2f2]/10 ring-1 ring-[#0df2f2]/30' 
              : 'hover:bg-slate-800'
          ]">
          <div class="h-11 w-11 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800">
            <img :src="getPhotoThumbnail(photo)" class="h-11 w-11 object-cover"
              @error="(e) => e.target.src = 'https://placehold.co/100/111318/334155?text=?'" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ photo.mini_desc || 'Untitled' }}</p>
            <div class="flex items-center justify-between">
              <span :class="getStatusTextClass(photo.status)" class="text-xs capitalize">{{ photo.status }}</span>
              <span v-if="isAdmin" class="text-xs text-slate-500 truncate ml-1">{{ photo.photographer }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail View -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div v-if="selectedPhoto" class="flex-1 flex flex-col h-full">
          <div class="flex-1 bg-[#0a0c10] flex items-center justify-center p-4 overflow-hidden">
            <img :src="getDisplayedImage(selectedPhoto)" class="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        </div>
        
        <!-- Info Panel -->
        <div v-if="selectedPhoto" class="w-full md:w-80 border-l border-slate-800 p-6 overflow-y-auto bg-[#111318]">
          <h3 class="text-lg font-bold text-white mb-4">Photo Details</h3>
          <div class="space-y-4">
            <!-- Admin Review -->
            <div v-if="isAdmin && selectedPhoto.status === 'pending'" class="bg-[#101622] border border-slate-700 p-4 rounded-lg mb-4">
              <h4 class="text-sm font-bold text-white mb-2">Review</h4>
              <div class="flex gap-2">
                <button @click="handleApprove(selectedPhoto)" class="flex-1 bg-emerald-500/15 text-emerald-400 px-3 py-2 rounded-lg text-sm font-bold hover:bg-emerald-500/25 transition-colors">Approve</button>
                <button @click="confirmReject(selectedPhoto)" class="flex-1 bg-red-500/15 text-red-400 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-500/25 transition-colors">Reject</button>
              </div>
            </div>

            <!-- Status -->
            <div>
              <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Status</span>
              <div class="mt-1.5">
                <span :class="getStatusClass(selectedPhoto.status)" class="px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
                  {{ selectedPhoto.status }}
                </span>
              </div>
              <div v-if="selectedPhoto.status === 'rejected' && selectedPhoto.approval_reason" class="mt-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-2.5 rounded-lg">
                <span class="font-bold">Reason:</span> {{ selectedPhoto.approval_reason }}
              </div>
            </div>

            <!-- Editable Fields -->
            <div v-if="canEdit(selectedPhoto)" class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">Title / Desc</label>
                <input v-model="editPhotoForm.mini_desc" class="block w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-[#101622] text-white focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">Camera</label>
                <input v-model="editPhotoForm.camera" class="block w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-[#101622] text-white focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">Tags</label>
                <input v-model="editPhotoForm.tags" class="block w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-[#101622] text-white focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">Replace Image</label>
                <div class="border border-dashed border-slate-700 rounded-lg p-3 text-center cursor-pointer hover:bg-slate-800 transition-colors" @click="$refs.editFileRef.click()">
                  <span class="text-xs text-slate-500">Click to replace file</span>
                  <input ref="editFileRef" type="file" hidden accept="image/*" @change="handleEditFileChange" />
                </div>
                <div v-if="editPreviewUrl" class="mt-2">
                  <p class="text-xs text-[#0df2f2] mb-1">New image selected</p>
                  <img :src="editPreviewUrl" class="h-20 object-contain mx-auto rounded-lg border border-slate-700" />
                </div>
              </div>
              <div class="pt-4 border-t border-slate-800 space-y-2">
                <button @click="updateSelectedPhoto" :disabled="saving" class="w-full bg-[#0df2f2] text-[#101622] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#0bd8d8] disabled:opacity-50 transition-colors">
                  {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
                <button @click="confirmDelete(selectedPhoto)" class="w-full bg-transparent text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/10 transition-colors">Delete Photo</button>
              </div>
            </div>

            <!-- Read Only -->
            <div v-else class="space-y-3">
              <div>
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Description</span>
                <p class="text-sm text-white mt-1">{{ selectedPhoto.mini_desc }}</p>
              </div>
              <div>
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Camera</span>
                <p class="text-sm text-white mt-1">{{ selectedPhoto.camera || 'Unknown' }}</p>
              </div>
              <div>
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Tags</span>
                <p class="text-sm text-white mt-1">{{ selectedPhoto.tags }}</p>
              </div>
              <div>
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Uploaded By</span>
                <p class="text-sm text-white mt-1">{{ selectedPhoto.photographer || 'Unknown' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
          <svg class="w-12 h-12 text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p>Select a photo to view details</p>
        </div>
      </div>
    </div>

    <!-- Upload Photo Modal -->
    <div v-if="showUploadPhoto" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div class="bg-[#111318] border border-slate-700 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-white">Upload New Photo</h3>
          <button @click="closeUploadModal" class="text-slate-400 hover:text-white p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form @submit.prevent="uploadPhoto" class="space-y-5">
          <div v-if="uploadPhotoPreviewUrl" class="mb-4">
            <img :src="uploadPhotoPreviewUrl" class="w-full h-48 object-cover rounded-lg border border-slate-700" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Photo File</label>
            <input type="file" required @change="handleUploadPhotoChange" accept="image/*" class="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#0df2f2]/10 file:text-[#0df2f2] hover:file:bg-[#0df2f2]/20 cursor-pointer" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <input v-model="uploadPhotoForm.mini_desc" required placeholder="Photo description" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Camera / Gear</label>
            <input v-model="uploadPhotoForm.camera" placeholder="e.g. Sony A7III" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Tags</label>
            <input v-model="uploadPhotoForm.tags" placeholder="e.g. Nature, Portrait" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none" />
          </div>
          <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" @click="closeUploadModal" class="px-5 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 font-medium transition-colors">Cancel</button>
            <button type="submit" :disabled="uploading" class="px-5 py-2.5 bg-[#0df2f2] text-[#101622] rounded-lg hover:bg-[#0bd8d8] font-bold shadow-lg shadow-[#0df2f2]/20 transition-all disabled:opacity-50">
              {{ uploading ? 'Uploading...' : 'Upload Photo' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <ConfirmModal 
      :isOpen="showConfirmModal"
      title="Confirm Delete"
      :message="'Are you sure you want to delete this photo?'"
      @confirm="executeDelete"
      @close="showConfirmModal = false"
    />

    <!-- Reject Reason Modal -->
    <div v-if="showRejectModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div class="bg-[#111318] border border-slate-700 p-6 rounded-xl shadow-2xl w-full max-w-md">
        <h3 class="font-bold text-white mb-4">Reject Reason</h3>
        <textarea v-model="rejectReason" class="w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 h-28 focus:ring-2 focus:ring-[#0df2f2]/40 outline-none resize-none" placeholder="Why is this rejected?"></textarea>
        <div class="flex justify-end gap-2 mt-4">
          <button @click="showRejectModal = false" class="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
          <button @click="executeReject" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold transition-colors">Reject</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ApiService from '@/services/api'
import apiConfig from '@/config/api'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const authStore = useAuthStore()
const apiService = new ApiService()

// State
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const photos = ref([])
const selectedPhoto = ref(null)

// Edit form
const editPhotoForm = ref({ mini_desc: '', camera: '', tags: '' })
const editFile = ref(null)
const editPreviewUrl = ref('')

// Upload form
const showUploadPhoto = ref(false)
const uploadPhotoForm = ref({ mini_desc: '', camera: '', tags: '' })
const uploadFile = ref(null)
const uploadPhotoPreviewUrl = ref('')

// Modals
const showConfirmModal = ref(false)
const deletingPhoto = ref(null)

const showRejectModal = ref(false)
const rejectReason = ref('')
const rejectingPhoto = ref(null)

// Role helpers
const isAdmin = computed(() => authStore.isAdmin)
const isPhotographer = computed(() => authStore.isPhotographer)

// Permission check
const canEdit = (photo) => {
  return photo.user_id === authStore.user?.sub || photo.user_id === authStore.user?.id || isAdmin.value
}

// Helper functions
const getStatusClass = (status) => {
  switch (status) {
    case 'approved': return 'bg-emerald-500/20 text-emerald-400'
    case 'rejected': return 'bg-red-500/20 text-red-400'
    default: return 'bg-yellow-500/20 text-yellow-400'
  }
}

const getStatusTextClass = (status) => {
  switch(status) {
    case 'approved': return 'text-emerald-400'
    case 'rejected': return 'text-red-400'
    default: return 'text-yellow-400'
  }
}

const getRefUrl = (filename) => {
  if (!filename) return ''
  if (filename.startsWith('http')) return filename
  if (filename.startsWith('/images/')) return `${apiConfig.rootURL}${filename}`
  return `${apiConfig.rootURL}/images/${filename}`
}

const getPhotoThumbnail = (photo) => {
  if (!photo) return 'https://placehold.co/100?text=No+Image'
  if (photo.variants?.thumbnail) {
    const url = photo.variants.thumbnail
    if (url.startsWith('http')) return url
    return `${apiConfig.rootURL}${url}`
  }
  return getRefUrl(photo.filename)
}

const getDisplayedImage = (photo) => {
  if (selectedPhoto.value?.id === photo.id && editPreviewUrl.value) {
    return editPreviewUrl.value
  }
  return getRefUrl(photo.filename)
}

// Watch selected photo changes
watch(selectedPhoto, (newVal) => {
  if (newVal) {
    editPhotoForm.value = {
      mini_desc: newVal.mini_desc || '',
      camera: newVal.camera || '',
      tags: newVal.tags || ''
    }
    editFile.value = null
    editPreviewUrl.value = ''
  }
})

// Load photos
const loadPhotos = async () => {
  loading.value = true
  try {
    const res = isAdmin.value ? await apiService.getAllPhotos() : await apiService.getMyPhotos()
    photos.value = Array.isArray(res) ? res : (res.data || [])
    
    // Auto-select first photo if available
    if (photos.value.length > 0 && !selectedPhoto.value) {
      selectedPhoto.value = photos.value[0]
    }
  } catch (e) {
    console.error('Error loading photos:', e)
  } finally {
    loading.value = false
  }
}

// Edit photo
const handleEditFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  editFile.value = file
  editPreviewUrl.value = URL.createObjectURL(file)
}

const updateSelectedPhoto = async () => {
  if (!selectedPhoto.value) return
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('mini_desc', editPhotoForm.value.mini_desc)
    formData.append('camera', editPhotoForm.value.camera)
    formData.append('tags', editPhotoForm.value.tags)
    if (editFile.value) {
      formData.append('file', editFile.value)
    }
    const updatedPhoto = await apiService.updatePhoto(selectedPhoto.value.id, formData)
    
    const index = photos.value.findIndex(p => p.id === updatedPhoto.id)
    if (index !== -1) {
      photos.value[index] = updatedPhoto
      selectedPhoto.value = updatedPhoto
    }
    
    editFile.value = null
    editPreviewUrl.value = ''
    alert('Photo updated')
  } catch (e) {
    alert(e.message)
  } finally {
    saving.value = false
  }
}

// Upload photo
const handleUploadPhotoChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  if (file.size > 3 * 1024 * 1024) {
    alert('File size too large. Max 3MB.')
    e.target.value = ''
    return
  }
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    alert('Invalid file type. Only JPG and PNG allowed.')
    e.target.value = ''
    return
  }

  uploadFile.value = file
  uploadPhotoPreviewUrl.value = URL.createObjectURL(file)
}

const closeUploadModal = () => {
  showUploadPhoto.value = false
  uploadFile.value = null
  uploadPhotoPreviewUrl.value = ''
  uploadPhotoForm.value = { mini_desc: '', camera: '', tags: '' }
}

const uploadPhoto = async () => {
  if (!uploadFile.value) return alert('Select file')
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', uploadFile.value)
    fd.append('mini_desc', uploadPhotoForm.value.mini_desc)
    fd.append('camera', uploadPhotoForm.value.camera)
    fd.append('tags', uploadPhotoForm.value.tags)
    const newPhoto = await apiService.uploadPhoto(fd)
    
    photos.value.unshift(newPhoto)
    closeUploadModal()
    alert('Uploaded')
  } catch (e) {
    alert(e.message)
  } finally {
    uploading.value = false
  }
}

// Delete
const confirmDelete = (photo) => {
  deletingPhoto.value = photo
  showConfirmModal.value = true
}

const executeDelete = async () => {
  if (!deletingPhoto.value) return
  try {
    await apiService.deletePhoto(deletingPhoto.value.id)
    photos.value = photos.value.filter(p => p.id !== deletingPhoto.value.id)
    if (selectedPhoto.value?.id === deletingPhoto.value.id) {
      selectedPhoto.value = null
    }
  } catch (e) {
    alert(e.message)
  }
  showConfirmModal.value = false
  deletingPhoto.value = null
}

// Approval
const handleApprove = async (photo) => {
  try {
    await apiService.approvePhoto(photo.id)
    const p = photos.value.find(x => x.id === photo.id)
    if (p) p.status = 'approved'
    if (selectedPhoto.value?.id === photo.id) {
      selectedPhoto.value.status = 'approved'
    }
  } catch (e) {
    alert('Action failed: ' + e.message)
  }
}

const confirmReject = (photo) => {
  rejectingPhoto.value = photo
  rejectReason.value = ''
  showRejectModal.value = true
}

const executeReject = async () => {
  if (!rejectingPhoto.value) return
  try {
    await apiService.rejectPhoto(rejectingPhoto.value.id, rejectReason.value)
    const p = photos.value.find(x => x.id === rejectingPhoto.value.id)
    if (p) {
      p.status = 'rejected'
      p.approval_reason = rejectReason.value
    }
    if (selectedPhoto.value?.id === rejectingPhoto.value.id) {
      selectedPhoto.value.status = 'rejected'
      selectedPhoto.value.approval_reason = rejectReason.value
    }
    showRejectModal.value = false
    rejectReason.value = ''
  } catch (e) {
    alert('Reject failed: ' + e.message)
  }
}

onMounted(loadPhotos)
</script>
