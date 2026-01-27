<template>
    <div class="min-h-screen pt-20 pb-12 bg-white dark:bg-gray-900 transition-colors duration-300">
      
      <article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Back Button -->
      <div class="mb-8">
        <button 
          @click="$router.go(-1)"
          class="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>
      </div>
      
      <!-- Article Header -->
      <header class="mb-8">
        <div class="mb-4">
          <span class="bg-primary-600 dark:bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {{ post.category }}
          </span>
        </div>
        
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          {{ post.title }}
        </h1>
        
        <div class="flex items-center text-gray-600 dark:text-gray-300 mb-8 text-sm">
          <span>{{ formatDate(post.created_at) }}</span>
          <span class="mx-2">•</span>
          <span>by {{ formatAuthor(post.author) }}</span>
        </div>
        <div class="aspect-w-16 aspect-h-9 mb-8">
          <img 
            :src="getPostImageUrl(post)" 
            :alt="post.title"
            class="w-full h-96 object-cover rounded-lg shadow-lg"
          >
        </div>
      </header>
      
      <!-- Article Content -->
      <div class="prose prose-lg dark:prose-invert max-w-none">
        <p class="text-xl text-gray-700 dark:text-gray-200 mb-8 font-medium leading-relaxed">
          {{ post.description }}
        </p>
        
        <div 
          v-html="post.content" 
          class="blog-content text-gray-800 dark:text-gray-100 leading-relaxed overflow-x-hidden whitespace-pre-wrap break-words"
        ></div>
      </div>
    
      
      <!-- Article Footer -->
      <footer class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <span class="text-gray-600 dark:text-gray-300">Share this post:</span>
            <button class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </button>
            <button class="text-blue-800 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors duration-200">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </article>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiService from '../services/api.js'
import apiConfig from '../config/api.js'

export default {
  name: 'BlogPost',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const apiService = new ApiService()
    const post = ref({})
    const previousPost = ref(null)
    const nextPost = ref(null)
    const loading = ref(true)
    const error = ref(null)
    
    const formatDate = (dateString) => {
      if (!dateString) return 'No date'
      try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' }
        return new Date(dateString).toLocaleDateString(undefined, options)
      } catch (err) {
        return 'Invalid date'
      }
    }
    
    const getPostImageUrl = (postData) => {
      if (!postData) return '/furban.png'
      
      let path = postData.image || postData.photo_filename
      if (!path) return '/furban.png'
      
      // If variants exist, prefer medium
      if (postData.variants && postData.variants.medium) {
        path = postData.variants.medium
      }
      
      if (path.startsWith('data:') || path.startsWith('http')) return path
      
      const baseServerUrl = apiConfig.baseURL.split('/api')[0]
      if (path.startsWith('/')) {
        return `${baseServerUrl}${path}`
      }
      
      // Legacy fallback
      return `${baseServerUrl}/images/${path}`
    }
    
    const fetchBlogPost = async () => {
      try {
        loading.value = true
        // Use route param directly (can be UUID or slug)
        const currentId = route.params.id
        
        // Fetch current blog post first
        const postResponse = await apiService.getBlog(currentId)
        post.value = postResponse
        
        // Adjacent posts feature not yet implemented
        previousPost.value = null
        nextPost.value = null
        
        loading.value = false
      } catch (err) {
        console.error('Error fetching blog post:', err)
        error.value = 'Failed to load blog post. Please try again later.'
        loading.value = false
      }
    }
    
    const navigateToPost = (postId) => {
      router.push(`/blog/${postId}`)
    }
    
    // Watch for route changes to refetch data
    watch(() => route.params.id, () => {
      if (route.name === 'BlogPost') {
        fetchBlogPost()
      }
    })
    
    onMounted(() => {
      fetchBlogPost()
    })
    
    const formatAuthor = (author) => {
      if (!author) return 'Unknown'
      try {
        if (typeof author === 'string') {
          const authorObj = JSON.parse(author)
          return authorObj.username || 'Unknown'
        }
        if (typeof author === 'object') {
          return author.username || 'Unknown'
        }
        return author
      } catch (err) {
        console.error('Error formatting author:', err)
        return 'Unknown'
      }
    }

    return {
      post,
      previousPost,
      nextPost,
      loading,
      error,
      formatDate,
      formatAuthor,
      navigateToPost,
      getPostImageUrl
    }
  }
}
</script>

<style>
.blog-content h1,
.blog-content h2,
.blog-content h3,
.blog-content h4,
.blog-content h5,
.blog-content h6 {
  color: rgb(17 24 39); /* gray-900 */
  font-weight: bold;
  margin-bottom: 1rem;
}

.dark .blog-content h1,
.dark .blog-content h2,
.dark .blog-content h3,
.dark .blog-content h4,
.dark .blog-content h5,
.dark .blog-content h6 {
  color: rgb(255 255 255); /* white */
}

.blog-content p {
  color: rgb(31 41 55); /* gray-800 */
  margin-bottom: 1rem;
  line-height: 1.625;
}

.dark .blog-content p {
  color: rgb(243 244 246); /* gray-100 */
}

.blog-content a {
  color: rgb(37 99 235); /* blue-600 */
}

.dark .blog-content a {
  color: rgb(96 165 250); /* blue-400 */
}

.blog-content ul,
.blog-content ol {
  color: rgb(31 41 55); /* gray-800 */
  margin-bottom: 1rem;
}

.dark .blog-content ul,
.dark .blog-content ol {
  color: rgb(243 244 246); /* gray-100 */
}

.blog-content li {
  color: rgb(31 41 55); /* gray-800 */
  margin-bottom: 0.5rem;
}

.dark .blog-content li {
  color: rgb(243 244 246); /* gray-100 */
}

.blog-content strong,
.blog-content b {
  color: rgb(17 24 39); /* gray-900 */
  font-weight: bold;
}

.dark .blog-content strong,
.dark .blog-content b {
  color: rgb(255 255 255); /* white */
}

.blog-content em,
.blog-content i {
  color: rgb(31 41 55); /* gray-800 */
  font-style: italic;
}

.dark .blog-content em,
.dark .blog-content i {
  color: rgb(243 244 246); /* gray-100 */
}
</style>