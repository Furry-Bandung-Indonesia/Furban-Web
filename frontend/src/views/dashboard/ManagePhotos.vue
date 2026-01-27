<template>
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg h-[calc(100vh-140px)] flex flex-col">
    <div class="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
        {{ isAdmin ? 'All Photos' : 'My Gallery' }}
      </h3>
      <button
        @click="showUploadPhoto = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
      >
        Upload New Photo
      </button>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="text-gray-500 mt-4">Loading photos...</p>
      </div>
    </div>

    <div v-else class="flex-1 overflow-hidden flex">
      <!-- Sidebar List -->
      <div class="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto p-2 space-y-2 bg-gray-50 dark:bg-gray-900/50">
        <div v-if="photos.length === 0" class="text-center py-4 text-gray-500 text-sm">
          No photos found.
        </div>
        <div 
          v-for="photo in photos" 
          :key="photo.id"
          @click="selectedPhoto = photo"
          :class="[
            'p-2 rounded cursor-pointer flex items-center space-x-3 transition-colors',
            selectedPhoto?.id === photo.id 
              ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-1 ring-indigo-500' 
              : 'hover:bg-gray-200 dark:hover:bg-gray-800'
          ]"
        >
          <div class="h-12 w-12 flex-shrink-0">
            <img 
              :src="getPhotoThumbnail(photo)" 
              class="h-12 w-12 rounded overflow-hidden object-cover"
              @error="(e) => e.target.src = 'https://placehold.co/100?text=No+Image'"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ photo.mini_desc || 'Untitled' }}</p>
            <div class="flex items-center justify-between">
              <span :class="getStatusTextClass(photo.status)" class="text-xs capitalize">{{ photo.status }}</span>
              <span v-if="isAdmin" class="text-xs text-gray-400">{{ photo.photographer }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail View -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-gray-800">
        <div v-if="selectedPhoto" class="flex-1 flex flex-col h-full">
          <!-- Image -->
          <div class="flex-1 bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 relative group overflow-hidden">
            <img :src="getDisplayedImage(selectedPhoto)" class="max-w-full max-h-full object-contain shadow-lg" />
          </div>
        </div>
        
        <!-- Info Panel -->
        <div v-if="selectedPhoto" class="w-full md:w-80 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto bg-white dark:bg-gray-800">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Photo Details</h3>
          
          <div class="space-y-4">
            <!-- Admin Approval Controls -->
            <div v-if="isAdmin && selectedPhoto.status === 'pending'" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Review</h4>
              <div class="flex space-x-2">
                <button @click="handleApprove(selectedPhoto)" class="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">Approve</button>
                <button @click="confirmReject(selectedPhoto)" class="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700">Reject</button>
              </div>
            </div>

            <!-- Status Display -->
            <div>
              <span class="text-xs text-gray-500 uppercase font-semibold">Status</span>
              <div class="mt-1">
                <span :class="getStatusClass(selectedPhoto.status)" class="px-3 py-1 text-sm font-semibold rounded-full uppercase tracking-wide">
                  {{ selectedPhoto.status }}
                </span>
              </div>
              <p v-if="selectedPhoto.status === 'rejected' && selectedPhoto.approval_reason" class="mt-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                <span class="font-bold">Reason:</span> {{ selectedPhoto.approval_reason }}
              </p>
            </div>

            <!-- Metadata Fields (Editable for owner) -->
            <div v-if="canEdit(selectedPhoto)">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title / Desc</label>
                <input v-model="editPhotoForm.mini_desc" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Camera</label>
                <input v-model="editPhotoForm.camera" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Tags</label>
                <input v-model="editPhotoForm.tags" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              
              <!-- Edit Image File -->
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Replace Image</label>
                <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-2 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" @click="$refs.editFileRef.click()">
                  <span class="text-xs text-gray-500">Click to replace file</span>
                  <input ref="editFileRef" type="file" hidden accept="image/*" @change="handleEditFileChange" />
                </div>
                <div v-if="editPreviewUrl" class="mt-2">
                  <p class="text-xs text-green-600 mb-1">New image selected!</p>
                  <img :src="editPreviewUrl" class="h-20 object-contain mx-auto border rounded" />
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <button @click="updateSelectedPhoto" :disabled="saving" class="w-full bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
                <button @click="confirmDelete(selectedPhoto)" class="w-full bg-white text-red-600 border border-red-200 px-4 py-2 rounded text-sm font-medium hover:bg-red-50">Delete Photo</button>
              </div>
            </div>

            <!-- Read Only View -->
            <div v-else>
              <div>
                <span class="text-xs text-gray-500 uppercase font-semibold">Description</span>
                <p class="text-sm text-gray-900 dark:text-white mt-1">{{ selectedPhoto.mini_desc }}</p>
              </div>
              <div class="mt-3">
                <span class="text-xs text-gray-500 uppercase font-semibold">Camera</span>
                <p class="text-sm text-gray-900 dark:text-white mt-1">{{ selectedPhoto.camera || 'Unknown' }}</p>
              </div>
              <div class="mt-3">
                <span class="text-xs text-gray-500 uppercase font-semibold">Tags</span>
                <p class="text-sm text-gray-900 dark:text-white mt-1">{{ selectedPhoto.tags }}</p>
              </div>
              <div class="mt-3">
                <span class="text-xs text-gray-500 uppercase font-semibold">Uploaded By</span>
                <p class="text-sm text-gray-900 dark:text-white mt-1">{{ selectedPhoto.photographer || 'Unknown' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8">
          <p>Select a photo to view details</p>
        </div>
      </div>
    </div>

    <!-- Upload Photo Modal -->
    <div v-if="showUploadPhoto" class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">Upload New Photo</h3>
          <button @click="closeUploadModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form @submit.prevent="uploadPhoto" class="space-y-5">
          <div v-if="uploadPhotoPreviewUrl" class="mb-4">
            <img :src="uploadPhotoPreviewUrl" class="w-full h-48 object-cover rounded-lg" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo File</label>
            <input type="file" required @change="handleUploadPhotoChange" accept="image/*" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input v-model="uploadPhotoForm.mini_desc" required placeholder="Photo description" class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Camera / Gear</label>
            <input v-model="uploadPhotoForm.camera" placeholder="e.g. Sony A7III" class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
            <input v-model="uploadPhotoForm.tags" placeholder="e.g. Nature, Portrait" class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="closeUploadModal" class="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">Cancel</button>
            <button type="submit" :disabled="uploading" class="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50">
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
    <div v-if="showRejectModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
        <h3 class="font-bold mb-4 dark:text-white">Reject Reason</h3>
        <textarea v-model="rejectReason" class="w-full border p-2 rounded h-24 dark:bg-gray-700 dark:text-white" placeholder="Why is this rejected?"></textarea>
        <div class="flex justify-end space-x-2 mt-4">
          <button @click="showRejectModal = false" class="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button @click="executeReject" class="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
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
    case 'approved': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-yellow-100 text-yellow-800'
  }
}

const getStatusTextClass = (status) => {
  switch(status) {
    case 'approved': return 'text-green-600'
    case 'rejected': return 'text-red-600'
    default: return 'text-yellow-600'
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
