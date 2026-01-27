<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">
        {{ isAdmin ? 'All Blogs' : 'My Blogs' }}
      </h3>
      <button
        @click="showCreateBlog = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition duration-200 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Create New Blog Post
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p class="text-gray-500 mt-4">Loading blogs...</p>
    </div>

    <div v-else-if="blogs.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
      <p class="text-gray-500 dark:text-gray-400">No blog posts found</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="blog in blogs" :key="blog.id" class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
        <!-- Blog Card Content -->
        <div class="h-48 w-full bg-gray-200 dark:bg-gray-700 relative">
          <img 
            :src="getBlogImageUrl(blog)" 
            class="w-full h-full object-cover"
            @error="(e) => e.target.src = 'https://placehold.co/600x400?text=No+Image'"
          />
        </div>
        <div class="p-5 flex-1 flex flex-col">
          <div class="flex-1">
            <div class="flex items-center justify-between mb-3">
              <span :class="getStatusClass(blog.status)" class="px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wide">
                {{ blog.status }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatBlogAuthor(blog.author) }} • {{ new Date(blog.created_at).toLocaleDateString() }}
              </span>
            </div>
            <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{{ blog.title }}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">{{ blog.description || blog.mini_desc }}</p>
            
            <p v-if="blog.status === 'rejected' && blog.approval_reason" class="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">
              Reason: {{ blog.approval_reason }}
            </p>
          </div>

          <div class="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
            <!-- Admin Approval Controls -->
            <div v-if="isAdmin && blog.status === 'pending'" class="flex space-x-2">
              <button @click="handleApprove(blog)" class="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">Approve</button>
              <button @click="confirmReject(blog)" class="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">Reject</button>
            </div>
            <div v-else></div>
            
            <!-- Owner Actions -->
            <div class="flex space-x-2">
              <button v-if="canEdit(blog)" @click="openEditBlog(blog)" class="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <!-- Delete only for Admin -->
              <button v-if="isAdmin" @click="confirmDelete(blog)" class="p-2 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Blog Form Modal (Create / Edit) -->
    <div v-if="showCreateBlog" class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ isEditingBlog ? 'Edit Blog Post' : 'Create New Blog Post' }}</h3>
          <button @click="closeBlogModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form @submit.prevent="submitBlog" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input v-model="blogForm.title" required class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category (Tags)</label>
            <input v-model="blogForm.category" placeholder="e.g. Urban, Lifestyle" class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Description</label>
            <textarea v-model="blogForm.description" rows="2" class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content (Markdown supported)</label>
            <textarea v-model="blogForm.content" required rows="10" class="block w-full border border-gray-300 dark:border-gray-600 p-3 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"></textarea>
          </div>
          
          <!-- Image Upload / Replacement -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image</label>
            
            <!-- Current Image Preview (in Edit Mode) -->
            <div v-if="isEditingBlog && blogForm.existingImage && !blogForm.image" class="mb-3 relative group w-48 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
              <img :src="getRefUrl(blogForm.existingImage)" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-white text-xs">Current Image</span>
              </div>
            </div>
            
            <input type="file" @change="handleBlogImageUpload" accept="image/*" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-gray-700 dark:file:text-gray-300" />
            <p v-if="isEditingBlog" class="text-xs text-gray-500 mt-1">Leave empty to keep current image.</p>
          </div>
          
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" @click="closeBlogModal" class="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">Cancel</button>
            <button type="submit" :disabled="submitting" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50">
              {{ submitting ? 'Saving...' : (isEditingBlog ? 'Save Changes' : 'Publish Post') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <ConfirmModal 
      :isOpen="showConfirmModal"
      title="Confirm Delete"
      :message="'Are you sure you want to delete this blog post?'"
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
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ApiService from '@/services/api'
import apiConfig from '@/config/api'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const authStore = useAuthStore()
const apiService = new ApiService()

// State
const loading = ref(false)
const submitting = ref(false)
const blogs = ref([])

// Modal states
const showCreateBlog = ref(false)
const isEditingBlog = ref(false)
const editingBlogId = ref(null)
const blogForm = ref({ title: '', category: '', description: '', content: '', image: null, existingImage: '' })

const showConfirmModal = ref(false)
const deletingBlog = ref(null)

const showRejectModal = ref(false)
const rejectReason = ref('')
const rejectingBlog = ref(null)

// Role helpers
const isAdmin = computed(() => authStore.isAdmin)
const isPublisher = computed(() => authStore.isPublisher)

// Permission check
const canEdit = (blog) => {
  return blog.user_id === authStore.user?.sub || blog.user_id === authStore.user?.id || isAdmin.value
}

// Helper functions
const getStatusClass = (status) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-yellow-100 text-yellow-800'
  }
}

const getRefUrl = (filename) => {
  if (!filename) return ''
  if (filename.startsWith('http')) return filename
  if (filename.startsWith('/images/')) return `${apiConfig.rootURL}${filename}`
  return `${apiConfig.rootURL}/images/${filename}`
}

const getBlogImageUrl = (blog) => {
  if (!blog) return 'https://placehold.co/600x400?text=No+Image'
  
  // Check for variants first (with backend URL prefix)
  if (blog.variants?.medium) {
    const url = blog.variants.medium
    if (url.startsWith('http')) return url
    return `${apiConfig.rootURL}${url}`
  }
  
  // Check for image field
  if (blog.image) {
    if (blog.image.startsWith('http')) return blog.image
    if (blog.image.startsWith('/')) return `${apiConfig.rootURL}${blog.image}`
    return `${apiConfig.rootURL}/images/${blog.image}`
  }
  
  // Fallback to photo_filename
  if (blog.photo_filename) return getRefUrl(blog.photo_filename)
  
  return 'https://placehold.co/600x400?text=No+Image'
}

const formatBlogAuthor = (author) => {
  if (!author) return 'Unknown'
  if (typeof author === 'object') {
    return author.username || author.nickname || author.legal_name || 'Publisher'
  }
  if (typeof author === 'string') {
    try {
      const parsed = JSON.parse(author)
      return parsed.username || parsed.nickname || 'Publisher'
    } catch (e) {
      if (author.length < 50 && !author.includes('-')) return author
      return 'Publisher'
    }
  }
  return 'Unknown'
}

// Load blogs
const loadBlogs = async () => {
  loading.value = true
  try {
    const res = isAdmin.value ? await apiService.getAllBlogs() : await apiService.getMyBlogs()
    blogs.value = Array.isArray(res) ? res : (res.data || [])
  } catch (e) {
    console.error('Error loading blogs:', e)
  } finally {
    loading.value = false
  }
}

// Blog actions
const handleBlogImageUpload = (e) => {
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

  blogForm.value.image = file
}

const closeBlogModal = () => {
  showCreateBlog.value = false
  isEditingBlog.value = false
  editingBlogId.value = null
  blogForm.value = { title: '', category: '', description: '', content: '', image: null, existingImage: '' }
}

const openEditBlog = (blog) => {
  isEditingBlog.value = true
  editingBlogId.value = blog.id
  blogForm.value = { 
    title: blog.title, 
    category: blog.tags || '', 
    description: blog.description || blog.mini_desc || '', 
    content: blog.content || '', 
    image: null,
    existingImage: blog.image || blog.photo_filename
  }
  showCreateBlog.value = true
}

const submitBlog = async () => {
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('title', blogForm.value.title)
    fd.append('mini_desc', blogForm.value.description || '')
    fd.append('content', blogForm.value.content)
    fd.append('tags', blogForm.value.category || '')
    
    if (blogForm.value.image) {
      fd.append('image', blogForm.value.image)
    }

    if (isEditingBlog.value) {
      const updatedBlog = await apiService.updateBlog(editingBlogId.value, fd)
      const index = blogs.value.findIndex(b => b.id === updatedBlog.id)
      if (index !== -1) blogs.value[index] = updatedBlog
      alert('Blog updated successfully')
    } else {
      const newBlog = await apiService.createBlog(fd)
      blogs.value.unshift(newBlog)
      alert('Blog published successfully')
    }
    
    closeBlogModal()
  } catch (e) {
    alert(e.message)
  } finally {
    submitting.value = false
  }
}

// Delete
const confirmDelete = (blog) => {
  deletingBlog.value = blog
  showConfirmModal.value = true
}

const executeDelete = async () => {
  if (!deletingBlog.value) return
  try {
    await apiService.deleteBlog(deletingBlog.value.id)
    blogs.value = blogs.value.filter(b => b.id !== deletingBlog.value.id)
  } catch (e) {
    alert(e.message)
  }
  showConfirmModal.value = false
  deletingBlog.value = null
}

// Approval
const handleApprove = async (blog) => {
  try {
    await apiService.approveBlog(blog.id)
    const b = blogs.value.find(x => x.id === blog.id)
    if (b) b.status = 'approved'
    alert('Blog Approved!')
  } catch (e) {
    alert('Action failed: ' + e.message)
  }
}

const confirmReject = (blog) => {
  rejectingBlog.value = blog
  rejectReason.value = ''
  showRejectModal.value = true
}

const executeReject = async () => {
  if (!rejectingBlog.value) return
  try {
    await apiService.rejectBlog(rejectingBlog.value.id, rejectReason.value)
    const b = blogs.value.find(x => x.id === rejectingBlog.value.id)
    if (b) {
      b.status = 'rejected'
      b.approval_reason = rejectReason.value
    }
    showRejectModal.value = false
    rejectReason.value = ''
  } catch (e) {
    alert('Reject failed: ' + e.message)
  }
}

onMounted(loadBlogs)
</script>
