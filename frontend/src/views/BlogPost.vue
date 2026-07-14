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
          v-html="renderedContent" 
          class="blog-content text-gray-800 dark:text-gray-100 leading-relaxed overflow-x-hidden break-words"
        ></div>
      </div>
    
      
      <!-- Article Footer -->
      <footer class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
          
          </div>
        </div>
      </footer>
    </article>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import mermaid from 'mermaid'
import ApiService from '../services/api.js'
import apiConfig from '../config/api.js'

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
})

// Initialize markdown-it with common options
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
})

const allowedIframeSrcPattern = /^https:\/\/(www\.)?google\.com\/maps\/(embed|d\/embed)(\?.*)?$/i

let iframeSanitizerHookRegistered = false

const registerIframeSanitizerHook = () => {
  if (iframeSanitizerHookRegistered) return

  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName !== 'iframe') return

    const src = node.getAttribute && node.getAttribute('src')
    if (!src || !allowedIframeSrcPattern.test(src)) {
      node.parentNode?.removeChild(node)
    }
  })

  iframeSanitizerHookRegistered = true
}

registerIframeSanitizerHook()

// Custom fence renderer: turn ```mermaid blocks into <pre class="mermaid">
const defaultFence = md.renderer.rules.fence?.bind(md.renderer.rules) || 
  function(tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options) }

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  if (token.info.trim().toLowerCase() === 'mermaid') {
    return `<pre class="mermaid">${md.utils.escapeHtml(token.content)}</pre>`
  }
  return defaultFence(tokens, idx, options, env, self)
}

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

    // Render markdown content to sanitized HTML
    const renderedContent = computed(() => {
      if (!post.value.content) return ''
      const rawHtml = md.render(post.value.content)
      return DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ['pre', 'iframe'],
        ADD_ATTR: ['class', 'src', 'width', 'height', 'style', 'loading', 'title', 'frameborder', 'allow', 'allowfullscreen', 'referrerpolicy'],
      })
    })

    // Re-render mermaid diagrams whenever content changes
    const renderMermaid = async () => {
      await nextTick()
      try {
        // Reset mermaid IDs to avoid conflicts on re-render
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
          securityLevel: 'loose',
        })
        await mermaid.run({ querySelector: '.blog-content .mermaid' })
      } catch (e) {
        console.warn('Mermaid rendering error:', e)
      }
    }

    watch(renderedContent, () => {
      renderMermaid()
    })
    
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
      
      const baseServerUrl = apiConfig.rootURL
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
      renderedContent,
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

.blog-content iframe {
  display: block;
  width: 100%;
  max-width: 100%;
  border: 0;
  border-radius: 0.75rem;
  margin: 1.5rem 0;
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
  color: rgb(243 244 246);
}

.blog-content code {
  background-color: rgb(243 244 246);
  color: rgb(220 38 38);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.dark .blog-content code {
  background-color: rgb(31 41 55);
  color: rgb(251 146 60);
}

.blog-content pre {
  background-color: rgb(31 41 55);
  color: rgb(229 231 235);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.blog-content pre code {
  background-color: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: 0.875em;
}

.blog-content blockquote {
  border-left: 4px solid rgb(99 102 241);
  padding-left: 1rem;
  margin: 1rem 0;
  color: rgb(107 114 128);
  font-style: italic;
}

.dark .blog-content blockquote {
  border-left-color: rgb(129 140 248);
  color: rgb(156 163 175);
}

.blog-content hr {
  border-color: rgb(229 231 235);
  margin: 2rem 0;
}

.dark .blog-content hr {
  border-color: rgb(55 65 81);
}

.blog-content ul {
  list-style-type: disc;
  padding-left: 1.5rem;
}

.blog-content ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
}

.blog-content h1 { font-size: 2rem; }
.blog-content h2 { font-size: 1.5rem; margin-top: 2rem; }
.blog-content h3 { font-size: 1.25rem; margin-top: 1.5rem; }
.blog-content h4 { font-size: 1.125rem; margin-top: 1.25rem; }
</style>