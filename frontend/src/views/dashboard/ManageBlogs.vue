<template>
  <div class="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">{{ isAdmin ? 'All Blogs' : 'My Blogs' }}</h2>
        <p class="text-slate-400 text-sm mt-1">{{ blogs.length }} post{{ blogs.length !== 1 ? 's' : '' }} total</p>
      </div>
      <router-link
        to="/dashboard/blogs/create"
        class="bg-[#0df2f2] hover:bg-[#0bd8d8] text-[#101622] px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#0df2f2]/20 flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        New Blog Post
      </router-link>
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
              <span>{{ blog.created_at ? new Date(blog.created_at).toLocaleDateString() : 'Draft' }}</span>
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
              <router-link
                v-if="canEdit(blog)"
                :to="`/dashboard/blogs/edit/${blog.id}`"
                class="p-2 text-slate-500 hover:text-[#0df2f2] transition-colors rounded-lg hover:bg-[#0df2f2]/10"
                title="Edit"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </router-link>
              <button v-if="isAdmin" @click="confirmDelete(blog)" class="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10" title="Delete">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        </div>
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
const blogs = ref([])

const showConfirmModal = ref(false)
const deletingBlog = ref(null)

const showRejectModal = ref(false)
const rejectReason = ref('')
const rejectingBlog = ref(null)

// Role helpers
const isAdmin = computed(() => authStore.isAdmin)

// Permission check
const canEdit = (blog) => {
  return blog.user_id === authStore.user?.sub || blog.user_id === authStore.user?.id || isAdmin.value
}

// Helper functions
const getStatusClass = (status) => {
  switch (status) {
    case 'approved': return 'bg-emerald-500/20 text-emerald-400'
    case 'rejected': return 'bg-red-500/20 text-red-400'
    case 'draft': return 'bg-slate-700/50 text-slate-300'
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
  
  if (blog.variants?.medium) {
    const url = blog.variants.medium
    if (url.startsWith('http')) return url
    return `${apiConfig.rootURL}${url}`
  }
  
  if (blog.image) {
    if (blog.image.startsWith('http')) return blog.image
    if (blog.image.startsWith('/')) return `${apiConfig.rootURL}${blog.image}`
    return `${apiConfig.rootURL}/images/${blog.image}`
  }
  
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
