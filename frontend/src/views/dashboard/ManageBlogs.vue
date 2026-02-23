<template>
  <div class="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">{{ isAdmin ? 'All Blogs' : 'My Blogs' }}</h2>
        <p class="text-slate-400 text-sm mt-1">{{ blogs.length }} post{{ blogs.length !== 1 ? 's' : '' }} total</p>
      </div>
      <button @click="showCreateBlog = true"
        class="bg-[#0df2f2] hover:bg-[#0bd8d8] text-[#101622] px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#0df2f2]/20 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        New Blog Post
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0df2f2] mx-auto"></div>
      <p class="text-slate-500 mt-4 text-sm">Loading blogs...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="blogs.length === 0" class="text-center py-16 bg-[#111318] border border-slate-800 rounded-xl">
      <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
      <p class="text-slate-400">No blog posts found</p>
      <p class="text-slate-500 text-sm mt-1">Create your first blog post to get started.</p>
    </div>

    <!-- Blog Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="blog in blogs" :key="blog.id"
        class="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all flex flex-col">
        <!-- Cover Image -->
        <div class="h-44 w-full bg-slate-800 relative">
          <img :src="getBlogImageUrl(blog)" class="w-full h-full object-cover" @error="(e) => e.target.src = 'https://placehold.co/600x400/111318/334155?text=No+Image'" />
          <span :class="getStatusClass(blog.status)" class="absolute top-3 right-3 px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
            {{ blog.status }}
          </span>
        </div>
        <div class="p-5 flex-1 flex flex-col">
          <div class="flex-1">
            <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span>{{ formatBlogAuthor(blog.author) }}</span>
              <span>&bull;</span>
              <span>{{ new Date(blog.created_at).toLocaleDateString() }}</span>
            </div>
            <h4 class="text-lg font-bold text-white mb-2 line-clamp-1">{{ blog.title }}</h4>
            <p class="text-sm text-slate-400 line-clamp-2 mb-3">{{ blog.description || blog.mini_desc }}</p>
            <div v-if="blog.status === 'rejected' && blog.approval_reason"
              class="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2.5 rounded-lg">
              <span class="font-bold">Rejected:</span> {{ blog.approval_reason }}
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
            <!-- Admin Approval -->
            <div v-if="isAdmin && blog.status === 'pending'" class="flex gap-2">
              <button @click="handleApprove(blog)" class="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/25 transition-colors">Approve</button>
              <button @click="confirmReject(blog)" class="px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/25 transition-colors">Reject</button>
            </div>
            <div v-else></div>
            <!-- Actions -->
            <div class="flex gap-1">
              <button v-if="canEdit(blog)" @click="openEditBlog(blog)" class="p-2 text-slate-500 hover:text-[#0df2f2] transition-colors rounded-lg hover:bg-[#0df2f2]/10" title="Edit">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button v-if="isAdmin" @click="confirmDelete(blog)" class="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10" title="Delete">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Blog Form Modal -->
    <div v-if="showCreateBlog" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div class="bg-[#111318] border border-slate-700 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-white">{{ isEditingBlog ? 'Edit Blog Post' : 'Create New Blog Post' }}</h3>
          <button @click="closeBlogModal" class="text-slate-400 hover:text-white p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form @submit.prevent="submitBlog" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
            <input v-model="blogForm.title" required class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Category (Tags)</label>
            <input v-model="blogForm.category" placeholder="e.g. Urban, Lifestyle" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Short Description</label>
            <textarea v-model="blogForm.description" rows="2" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none resize-none"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Content (Markdown supported)</label>
            <textarea v-model="blogForm.content" required rows="10" class="block w-full border border-slate-700 p-3 rounded-lg bg-[#101622] text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0df2f2]/40 focus:border-[#0df2f2]/50 outline-none font-mono text-sm resize-none"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">Cover Image</label>
            <div v-if="isEditingBlog && blogForm.existingImage && !blogForm.image" class="mb-3 w-48 h-32 rounded-lg overflow-hidden border border-slate-700">
              <img :src="getRefUrl(blogForm.existingImage)" class="w-full h-full object-cover" />
            </div>
            <input type="file" @change="handleBlogImageUpload" accept="image/*" class="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#0df2f2]/10 file:text-[#0df2f2] hover:file:bg-[#0df2f2]/20 cursor-pointer" />
            <p v-if="isEditingBlog" class="text-xs text-slate-500 mt-1">Leave empty to keep current image.</p>
          </div>
          <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" @click="closeBlogModal" class="px-5 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 font-medium transition-colors">Cancel</button>
            <button type="submit" :disabled="submitting" class="px-5 py-2.5 bg-[#0df2f2] text-[#101622] rounded-lg hover:bg-[#0bd8d8] font-bold shadow-lg shadow-[#0df2f2]/20 transition-all disabled:opacity-50">
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
    case 'approved': return 'bg-emerald-500/20 text-emerald-400'
    case 'rejected': return 'bg-red-500/20 text-red-400'
    default: return 'bg-yellow-500/20 text-yellow-400'
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
