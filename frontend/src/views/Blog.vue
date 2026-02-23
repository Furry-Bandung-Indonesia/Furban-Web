<template>
  <div class="min-h-screen pt-20 pb-12 bg-white dark:bg-gray-900 transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <h1 class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-gray-900 via-primary-600 to-gray-900 dark:from-white dark:via-primary-400 dark:to-white bg-clip-text text-transparent">
          {{ $t('blog.title') }}
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          {{ $t('blog.subtitle') }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-300">Loading blog posts...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-500">{{ error }}</p>
      </div>

      <!-- Blog Posts Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <article v-for="post in blogPosts" :key="post.id" 
          class="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <!-- Post Image -->
          <div class="aspect-w-16 aspect-h-9 overflow-hidden">
             <img :src="getImageUrl(post)" :alt="post.title"
               class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
               @error="(e) => e.target.src = 'https://placehold.co/600x400?text=No+Image'">
          </div>

          <!-- Post Content -->
          <div class="p-6">
            <div class="mb-4">
              <span class="bg-primary-600 dark:bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {{ post.category }}
              </span>
            </div>

            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ post.title }}
            </h2>

            <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
              {{ post.description }}
            </p>

            <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <time :datetime="post.created_at">{{ formatDate(post.created_at) }}</time>
              <span class="mx-2">•</span>
              <span>by {{ formatAuthor(post.author) }}</span>
            </div>

            <router-link :to="`/blog/${post.id}`" 
              class="mt-4 inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              Read More
              <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </router-link>
          </div>
        </article>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMorePosts" class="text-center mt-12">
        <button @click="loadMore" 
          class="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl hover:from-primary-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
          <span class="relative z-10">Load More</span>
          <div class="absolute inset-0 bg-gradient-to-r from-primary-400 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
          <svg class="w-5 h-5 ml-2 transform group-hover:translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>

import { ref, onMounted } from 'vue'
import ApiService from '../services/api.js'
import apiConfig from '../config/api.js'

export default {
  name: 'Blog',
  setup() {
    const apiService = new ApiService()
    const blogPosts = ref([])
    const loading = ref(true)
    const error = ref(null)
    const page = ref(1)
    const limit = ref(9)
    const hasMorePosts = ref(true)

    const fetchPosts = async () => {
      try {
        loading.value = true
        const response = await apiService.getBlogs({ 
          page: page.value, 
          limit: limit.value 
        })
        
        const posts = Array.isArray(response) ? response : (response.data || [])
        
        if (posts.length < limit.value) {
          hasMorePosts.value = false
        }

        if (page.value === 1) {
          blogPosts.value = posts
        } else {
          blogPosts.value = [...blogPosts.value, ...posts]
        }
      } catch (err) {
        console.error('Error fetching blog posts:', err)
        error.value = 'Failed to load blog posts. Please try again later.'
      } finally {
        loading.value = false
      }
    }

    const loadMore = async () => {
      page.value++
      await fetchPosts()
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'No date'
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return 'Invalid date'
        const options = { year: 'numeric', month: 'long', day: 'numeric' }
        return date.toLocaleDateString(undefined, options)
      } catch (err) {
        console.error('Error formatting date:', err)
        return 'Invalid date'
      }
    }

    const formatAuthor = (author) => {
      if (!author) return 'Unknown Author'
      try {
        // If author is a JSON string, parse it
        if (typeof author === 'string' && author.startsWith('{')) {
          const authorObj = JSON.parse(author)
          return authorObj.username || authorObj.nickname || 'Unknown'
        }
        // If author is already an object
        if (typeof author === 'object') {
          return author.username || author.nickname || 'Unknown'
        }
        // If it's just a plain string (user_id), show abbreviated
        if (typeof author === 'string' && author.length > 20) {
          return 'Author'
        }
        return author
      } catch (err) {
        return 'Unknown Author'
      }
    }

    const getImageUrl = (itemOrPath) => {
      if (!itemOrPath) return '/furban.png'
      
      let path = itemOrPath
      
      if (typeof itemOrPath === 'object') {
         // Prefer variants for blog grid (thumbnail/medium)
         if (itemOrPath.variants && itemOrPath.variants.medium) {
             path = itemOrPath.variants.medium
         } else if (itemOrPath.image) {
             path = itemOrPath.image
         }
      }
      
      if (!path) return '/furban.png'
      if (path.startsWith('data:') || path.startsWith('http')) return path
      
      const baseServerUrl = apiConfig.rootURL
      if (path.startsWith('/')) {
         return `${baseServerUrl}${path}`
      }
      
      // Fallback
      return `${baseServerUrl}/uploads/gallery/${path}`
    }

    onMounted(() => {
      fetchPosts()
    })

    return {
      blogPosts,
      loading,
      error,
      hasMorePosts,
      loadMore,
      formatDate,
      formatDate,
      formatAuthor,
      getImageUrl
    }
  }
}
</script>