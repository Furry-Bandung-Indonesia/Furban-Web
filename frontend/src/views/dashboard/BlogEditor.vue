<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-[#101622] text-white">
    <!-- Top Header Bar -->
    <header class="shrink-0 bg-[#111318] border-b border-slate-800 px-6 py-4 z-10">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <router-link
            to="/dashboard/blogs"
            class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Back to Blogs"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </router-link>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-bold tracking-tight text-white">
                {{ isEditing ? 'Edit Blog Post' : 'Create New Blog Post' }}
              </h2>
              <span
                v-if="isEditing && form.status"
                :class="getStatusBadgeClass(form.status)"
                class="px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider"
              >
                {{ form.status }}
              </span>
            </div>
            <p class="text-slate-400 text-xs mt-0.5">
              {{ isEditing ? 'Update post content, status, tags, and banner image' : 'Draft or publish a new article for your readers' }}
            </p>
          </div>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-3 self-end sm:self-auto">
          <!-- Delete button (only when editing) -->
          <button
            v-if="isEditing"
            type="button"
            @click="showDeleteModal = true"
            class="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>

          <!-- Save Draft Button -->
          <button
            type="button"
            @click="saveBlog('draft')"
            :disabled="saving"
            class="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Draft
          </button>

          <!-- Publish / Submit Button -->
          <button
            type="button"
            @click="saveBlog('publish')"
            :disabled="saving"
            class="px-5 py-2 bg-[#0df2f2] text-[#101622] hover:bg-[#0bd8d8] rounded-lg text-sm font-bold shadow-lg shadow-[#0df2f2]/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {{ isAdmin ? (isEditing ? 'Save & Approve' : 'Publish') : 'Submit for Review' }}
          </button>
        </div>
      </div>
    </header>

    <!-- Scrollable Editor Form Content -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0df2f2]"></div>
        <p class="text-slate-400 text-sm mt-4">Loading blog post details...</p>
      </div>

      <template v-else>
        <!-- Form Container -->
        <form @submit.prevent="saveBlog('publish')" class="space-y-6 max-w-5xl mx-auto">
          <!-- Main Details Section -->
          <section class="bg-[#111318] border border-slate-800 rounded-xl p-6 space-y-5">
            <h3 class="text-lg font-bold text-white border-b border-slate-800 pb-3">General Details</h3>
            
            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Title *</label>
              <input
                v-model="form.title"
                required
                placeholder="Enter post title"
                class="w-full h-11 px-4 rounded-lg bg-[#101622] text-white border border-slate-700 focus:border-[#0df2f2] focus:ring-1 focus:ring-[#0df2f2] outline-none text-base font-semibold"
              />
            </div>

            <!-- Tags & Category -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Tags / Category</label>
                <input
                  v-model="form.tags"
                  placeholder="e.g. Urban, Fursuit, Meetup, Tech"
                  class="w-full h-11 px-4 rounded-lg bg-[#101622] text-white border border-slate-700 focus:border-[#0df2f2] focus:ring-1 focus:ring-[#0df2f2] outline-none text-sm"
                />
                <p class="text-xs text-slate-500 mt-1">Separate multiple tags with commas.</p>
              </div>

              <!-- Author / Info display -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Author</label>
                <input
                  :value="authorDisplayName"
                  disabled
                  class="w-full h-11 px-4 rounded-lg bg-[#161e2c] text-slate-400 border border-slate-800 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <!-- Short Description -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Short Description (Summary)</label>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="Write a brief summary of this article. This will be shown on the blog cards and search engine previews."
                class="w-full p-4 rounded-lg bg-[#101622] text-white border border-slate-700 focus:border-[#0df2f2] focus:ring-1 focus:ring-[#0df2f2] outline-none text-sm leading-relaxed resize-y"
              ></textarea>
            </div>
          </section>

          <!-- Banner / Cover Image Section -->
          <section class="bg-[#111318] border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 class="text-lg font-bold text-white border-b border-slate-800 pb-3">Cover Image</h3>
            
            <!-- Existing or Selected Image Preview -->
            <div v-if="coverPreviewUrl" class="relative rounded-xl overflow-hidden border border-slate-700 max-h-64 bg-slate-900">
              <img :src="coverPreviewUrl" alt="Cover Preview" class="w-full h-64 object-cover" />
              <button
                type="button"
                @click="removeCoverImage"
                class="absolute top-3 right-3 p-2 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition-colors shadow-lg"
                title="Remove Image"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Upload Dropzone -->
            <div v-else>
              <label
                class="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 bg-[#101622]"
                :class="isDragging ? 'border-[#0df2f2] bg-[#0df2f2]/5 scale-[1.005]' : 'border-slate-700 hover:border-[#0df2f2]/50'"
                @dragover.prevent="isDragging = true"
                @dragenter.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleCoverDrop"
              >
                <div class="text-center pointer-events-none p-4">
                  <svg
                    class="mx-auto w-10 h-10 mb-2 transition-colors"
                    :class="isDragging ? 'text-[#0df2f2]' : 'text-slate-400'"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="text-sm font-medium" :class="isDragging ? 'text-[#0df2f2]' : 'text-slate-300'">
                    {{ isDragging ? 'Drop image here' : 'Click or drag & drop cover image' }}
                  </span>
                  <span class="block text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP (Max 8MB)</span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="hidden"
                  @change="handleCoverFileSelect"
                />
              </label>
            </div>
          </section>

          <!-- Rich Content Editor Section -->
          <section class="bg-[#111318] border border-slate-800 rounded-xl p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 class="text-lg font-bold text-white">Post Content</h3>
                <p class="text-xs text-slate-400 mt-0.5">Supports rich text, headings, lists, inline image uploads, links, blockquotes, and Mermaid diagrams.</p>
              </div>
            </div>

            <TipTapEditor
              v-model="form.content"
              :upload-handler="handleInlineImageUpload"
              placeholder="Write your article content here..."
            />
          </section>
        </form>
      </template>
    </div>

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :isOpen="showDeleteModal"
      title="Delete Blog Post"
      message="Are you sure you want to permanently delete this blog post? This action cannot be undone."
      @confirm="executeDelete"
      @close="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ApiService from '@/services/api'
import apiConfig from '@/config/api'
import TipTapEditor from '@/components/TipTapEditor.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const apiService = new ApiService()

// Form & View state
const blogId = computed(() => route.params.id)
const isEditing = computed(() => Boolean(blogId.value))
const loading = ref(false)
const saving = ref(false)
const showDeleteModal = ref(false)
const isDragging = ref(false)

const form = ref({
  title: '',
  tags: '',
  description: '',
  content: '',
  status: 'draft',
  coverFile: null,
  existingImage: '',
})

const authorDisplayName = computed(() => {
  const u = authStore.user
  return u ? (u.nickname || u.legal_name || u.email || 'You') : 'Author'
})

const isAdmin = computed(() => authStore.isAdmin)

const coverPreviewUrl = computed(() => {
  if (form.value.coverFile) {
    return URL.createObjectURL(form.value.coverFile)
  }
  if (!form.value.existingImage) return ''
  const img = form.value.existingImage
  if (img.startsWith('http') || img.startsWith('data:')) return img
  if (img.startsWith('/')) return `${apiConfig.rootURL}${img}`
  return `${apiConfig.rootURL}/images/${img}`
})

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    case 'rejected':
      return 'bg-red-500/20 text-red-400 border border-red-500/30'
    case 'draft':
      return 'bg-slate-700 text-slate-300 border border-slate-600'
    default:
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
  }
}

// Inline image handler for TipTapEditor
const handleInlineImageUpload = async (file) => {
  try {
    const res = await apiService.uploadBlogContentImage(file)
    // Return absolute URL for editor image preview
    let url = res.url
    if (url && !url.startsWith('http')) {
      url = `${apiConfig.rootURL}${url}`
    }
    return url
  } catch (err) {
    console.error('Inline image upload error:', err)
    throw err
  }
}

// Cover image upload handlers
const handleCoverFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (file) setCoverFile(file)
}

const handleCoverDrop = (e) => {
  isDragging.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) setCoverFile(file)
}

const setCoverFile = (file) => {
  if (file.size > 8 * 1024 * 1024) {
    alert('Cover image size too large. Maximum size is 8MB.')
    return
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    alert('Invalid image type. Only JPG, PNG, and WEBP are allowed.')
    return
  }
  form.value.coverFile = file
}

const removeCoverImage = () => {
  form.value.coverFile = null
  form.value.existingImage = ''
}

// Load data for edit mode
const loadBlogData = async () => {
  if (!isEditing.value) return
  loading.value = true
  try {
    const blog = await apiService.getBlog(blogId.value)
    if (blog) {
      form.value.title = blog.title || ''
      form.value.tags = blog.tags || blog.category || ''
      form.value.description = blog.mini_desc || blog.description || ''
      form.value.content = blog.content || ''
      form.value.status = blog.status || 'draft'
      form.value.existingImage = blog.photo_filename || blog.image || ''
    }
  } catch (err) {
    console.error('Failed to fetch blog details:', err)
    alert('Failed to load blog post. Returning to blogs list.')
    router.push('/dashboard/blogs')
  } finally {
    loading.value = false
  }
}

// Save / Publish post
const saveBlog = async (targetAction) => {
  if (!form.value.title.trim()) {
    alert('Please enter a title for the blog post.')
    return
  }

  saving.value = true
  try {
    const targetStatus = targetAction === 'draft' ? 'draft' : 'published'
    const fd = new FormData()
    fd.append('title', form.value.title)
    fd.append('tags', form.value.tags || '')
    fd.append('mini_desc', form.value.description || '')
    fd.append('content', form.value.content || '')
    fd.append('status', targetStatus)

    if (form.value.coverFile) {
      fd.append('image', form.value.coverFile)
    }

    if (isEditing.value) {
      await apiService.updateBlog(blogId.value, fd)
      alert(targetAction === 'draft' ? 'Draft saved successfully!' : 'Blog post updated!')
    } else {
      await apiService.createBlog(fd)
      alert(targetAction === 'draft' ? 'Draft saved successfully!' : 'Blog post created!')
    }

    router.push('/dashboard/blogs')
  } catch (err) {
    console.error('Save Blog Error:', err)
    alert(err.message || 'Failed to save blog post.')
  } finally {
    saving.value = false
  }
}

// Delete post
const executeDelete = async () => {
  if (!blogId.value) return
  try {
    await apiService.deleteBlog(blogId.value)
    showDeleteModal.value = false
    router.push('/dashboard/blogs')
  } catch (err) {
    console.error('Delete Blog Error:', err)
    alert(err.message || 'Failed to delete blog post.')
  }
}

onMounted(() => {
  if (isEditing.value) {
    loadBlogData()
  }
})
</script>
