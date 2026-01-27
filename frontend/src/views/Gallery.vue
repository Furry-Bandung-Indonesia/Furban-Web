<template>
  <div class="min-h-screen pt-20 pb-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          {{ $t('gallery.title') }}
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {{ $t('gallery.subtitle') }}
        </p>
      </div>
      
      <!-- Category Filter -->
      <div class="flex flex-wrap justify-center gap-3 mb-10">
        <button 
          @click="filterGallery('all')" 
          :class="[selectedCategory === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300', 'px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200']">
          All
        </button>
        <button 
          v-for="category in availableCategories" 
          :key="category" 
          @click="filterGallery(category)" 
          :class="[selectedCategory === category ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300', 'px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200']">
          {{ category }}
        </button>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-300">Loading gallery...</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-500">{{ error }}</p>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="filteredGalleryItems.length === 0" class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-300">No gallery items found for this category.</p>
      </div>
      
      <!-- Gallery Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="(item, index) in filteredGalleryItems" 
          :key="item.id"
          class="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <div class="aspect-w-16 aspect-h-12">
            <img 
              :src="getImageUrl(item)" 
              :alt="item.title"
              class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
              @error="handleImageError"
            >
          </div>
          
          <!-- Hover Overlay -->
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-end">
            <div class="p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <h3 class="text-xl font-bold mb-2">{{ item.title || item.mini_desc || 'Untitled' }}</h3>
              <p class="text-sm mb-1" v-if="item.album || item.tags">Album: {{ item.album || item.tags }}</p>
              <p class="text-sm mb-1" v-if="item.camera">Camera: {{ item.camera }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Load More Button -->
      <div class="text-center mt-12">
        <button @click="loadMore" class="btn-primary">
          {{ $t('gallery.loadMore') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import ApiService from '../services/api.js'
import apiConfig from '../config/api.js'

export default {
  name: 'Gallery',
  setup() {
    const apiService = new ApiService()
    const galleryItems = ref([])
    const loading = ref(true)
    const error = ref(null)
    const page = ref(1)
    const limit = ref(9)
    const selectedCategory = ref('all')
    const albumCategories = ref([])
    
    // Use the fetched album categories instead of extracting from gallery items
    const availableCategories = computed(() => {
      return albumCategories.value.map(album => album.album)
    })
    
    // Filter gallery items by selected category
    const filteredGalleryItems = computed(() => {
      if (selectedCategory.value === 'all') {
        // Return shuffled gallery items for 'all' category
        return [...galleryItems.value].sort(() => Math.random() - 0.5)
      }
      return galleryItems.value
        .filter(item => item.album === selectedCategory.value)
    })
    
    // Function to get complete image URL handling variants and relative paths
    const getImageUrl = (itemOrPath) => {
      if (!itemOrPath) {
        console.error('Empty image input')
        return '/furban.png'
      }
      
      let path = itemOrPath
      
      // If passing the whole item object
      if (typeof itemOrPath === 'object') {
         if (itemOrPath.variants && itemOrPath.variants.medium) {
             path = itemOrPath.variants.medium
         } else if (itemOrPath.url) {
             path = itemOrPath.url
         } else if (itemOrPath.image) {
             path = itemOrPath.image
         } else if (itemOrPath.filename) {
             path = itemOrPath.filename
         }
      }
      
      if (!path) return '/furban.png'

      // If the image is already a base64 string or full URL
      if (path.startsWith('data:') || path.startsWith('http')) {
        return path
      }
      
      const baseServerUrl = apiConfig.baseURL.split('/api')[0]
      
      // If it's a relative path from our new backend (starts with /images)
      if (path.startsWith('/')) {
         return `${baseServerUrl}${path}`
      }
      
      // Fallback for any legacy paths
      return `${baseServerUrl}/uploads/gallery/${path}`
    }
    
    // Handle image loading errors with more debugging
    const handleImageError = (e) => {
      console.error('Image failed to load in DOM:', e.target.src)
      console.error('Image alt text:', e.target.alt)
      console.error('Original image path:', e.target.dataset.originalPath)
      // Fallback to a default image
      e.target.src = '/furban.png'
    }
    
    // Set the selected category and fetch images for that album
    const filterGallery = async (category) => {
      selectedCategory.value = category
      loading.value = true
      error.value = null
      
      try {
        if (category === 'all') {
          // Fetch all gallery items
          await fetchGallery()
        } else {
          // Fetch gallery items for the selected album
          const response = await apiService.getGalleryByAlbum(category)
          const galleryData = Array.isArray(response) ? response : (response.data || [])
          
          if (galleryData && galleryData.length > 0) {
            galleryItems.value = galleryData
          } else {
            console.warn('No gallery items returned for album:', category)
            galleryItems.value = []
          }
        }
      } catch (err) {
        console.error('Error filtering gallery:', err)
        error.value = `Failed to load gallery items for ${category}. Please try again later.`
      } finally {
        loading.value = false
      }
    }
    
    // Fetch all album categories
    const fetchAlbumCategories = async () => {
      try {
        const response = await apiService.getGalleryAlbums()
        const albumData = Array.isArray(response) ? response : (response.data || [])
        
        if (albumData && albumData.length > 0) {
          albumCategories.value = albumData
        } else {
          console.warn('No album categories returned from API')
          albumCategories.value = []
        }
      } catch (err) {
        console.error('Error fetching album categories:', err)
      }
    }
    
    // Fetch gallery data with debugging
    const fetchGallery = async () => {
      try {
        loading.value = true
        console.log('Fetching gallery data...')
        const response = await apiService.getGallery({ 
          page: page.value, 
          limit: limit.value 
        })
        console.log('Gallery API response:', response)
        
        const galleryData = Array.isArray(response) ? response : (response.data || [])
        
        if (galleryData && galleryData.length > 0) {
          // If it's the 'all' category, shuffle the items
          if (selectedCategory.value === 'all') {
            galleryItems.value = galleryData.sort(() => Math.random() - 0.5)
          } else {
            galleryItems.value = galleryData
          }
        } else {
          console.warn('No gallery items returned from API')
          galleryItems.value = []
        }
        
        loading.value = false
      } catch (err) {
        console.error('Error fetching gallery:', err)
        error.value = 'Failed to load gallery items. Please try again later.'
        loading.value = false
      }
    }
    
    // Load more items
    const loadMore = async () => {
      page.value++
      try {
        const response = await apiService.getGallery({ 
          page: page.value, 
          limit: limit.value 
        })
        
        const galleryData = Array.isArray(response) ? response : (response.data || [])
        
        if (galleryData && galleryData.length > 0) {
          galleryItems.value = [...galleryItems.value, ...galleryData]
        }
      } catch (err) {
        console.error('Error loading more items:', err)
      }
    }
    
    onMounted(() => {
      fetchAlbumCategories() // Fetch album categories first
      fetchGallery() // Then fetch all gallery items
    })
    
    return {
      galleryItems,
      loading,
      error,
      page,
      limit,
      selectedCategory,
      availableCategories,
      filteredGalleryItems,
      getImageUrl,
      handleImageError,
      filterGallery,
      loadMore
    }
  }
}
</script>

<style scoped>
.btn-primary {
  @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 inline-block;
}
</style>