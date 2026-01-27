<template>
  <div>
    <!-- Hero Section -->
    <section id="home" class="relative h-screen flex items-center justify-center overflow-hidden">
      <!-- Background Image -->
      <div 
        class="absolute inset-0 bg-cover bg-center bg-no-repeat"
        :style="{ backgroundImage: 'url(/homepage.png)' }"
      >
        <div class="absolute inset-0 bg-black/40"></div>
      </div>
      
      <!-- Content -->
      <div class="relative z-10 text-center text-white px-4">
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
          {{ $t('home.title') }}
        </h1>
        <p class="text-xl md:text-2xl mb-8 animate-fade-in-delay">
          {{ $t('home.subtitle') }}
        </p>
        <div class="space-x-4 animate-fade-in-delay-2">
          <a href="#about" class="btn-primary">
            {{ $t('home.learnMore') }}
          </a>
          <a href="/gallery" class="btn-secondary">
            {{ $t('home.viewGallery') }}
          </a>
        </div>
      </div>
      
      <!-- Scroll Indicator -->
      <button 
        @click="scrollToSection('about')"
        class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full p-2"
        aria-label="Scroll to about section"
      >
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
    </section>

    <!-- About Section -->
    <section id="about" class="relative py-20 overflow-hidden">
      <!-- Map Background -->
      <div class="absolute inset-0 z-0">
        <img 
            src="/map.png" 
            alt="Map Background" 
            class="w-full h-full object-cover opacity-15 dark:opacity-8 scale-105 animate-pulse"/>
        <div class="absolute inset-0 bg-gradient-to-br from-gray-50/90 via-gray-50/70 to-gray-50/90 dark:from-gray-900/90 dark:via-gray-900/70 dark:to-gray-900/90"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-primary-500/5 to-transparent"></div>
      </div>
      
      <!-- Floating Elements -->
      <div class="absolute inset-0 z-5 pointer-events-none">
        <div class="absolute top-20 left-10 w-20 h-20 bg-primary-400/10 rounded-full blur-xl animate-bounce" style="animation-delay: 0s; animation-duration: 3s;"></div>
        <div class="absolute top-40 right-20 w-16 h-16 bg-blue-400/10 rounded-full blur-lg animate-bounce" style="animation-delay: 1s; animation-duration: 4s;"></div>
        <div class="absolute bottom-32 left-1/4 w-12 h-12 bg-green-400/10 rounded-full blur-md animate-bounce" style="animation-delay: 2s; animation-duration: 5s;"></div>
      </div>
      
      <!-- Content -->
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-gray-900 via-primary-600 to-gray-900 dark:from-white dark:via-primary-400 dark:to-white bg-clip-text text-transparent">
            {{ $t('about.title') }}
          </h2>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <!-- Image Section -->
          <div class="order-2 lg:order-1">
            <div class="relative group">
              <!-- Main Image -->
              <img 
                  src="/furban.png" 
                  alt="Furban Community" 
                  class="w-full max-w-lg mx-auto filter drop-shadow-2xl"
                />
              <!-- Glow Effect -->
              <div class="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-transparent to-blue-500/20 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            
            <!-- Decorative Elements -->
            <div class="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary-400 to-blue-500 rounded-full opacity-20 blur-2xl animate-pulse"></div>
            <div class="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-tr from-green-400 to-primary-500 rounded-full opacity-15 blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
          </div>
          
          <!-- Content Section -->
          <div class="order-1 lg:order-2 space-y-8">
            <!-- Main Content Card -->
            <div class="backdrop-blur-md bg-white/30 dark:bg-gray-800/30 rounded-3xl p-8 border border-white/40 dark:border-gray-700/40 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white/40 dark:hover:bg-gray-800/40">
              <div class="space-y-6">
                
                <p class="text-lg text-gray-700 dark:text-gray-200 leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                </p>
                
                <p class="text-lg text-gray-700 dark:text-gray-200 leading-relaxed">
                  Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
                </p>
              </div>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-4">
              <div class="backdrop-blur-sm bg-white/20 dark:bg-gray-800/20 rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 text-center hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all duration-300">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">100+</div>
                <div class="text-sm text-gray-600 dark:text-gray-300">Community Members</div>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div class="pt-4">
              <button class="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl hover:from-primary-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <span class="relative z-10">Join Our Community</span>
                <div class="absolute inset-0 bg-gradient-to-r from-primary-400 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <svg class="w-5 h-5 ml-2 transform group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Gallery Section -->
    <section id="gallery" class="min-h-screen py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <!-- Background Decorations -->
      <div class="absolute inset-0 opacity-5 dark:opacity-10">
        <div class="absolute top-20 left-10 w-72 h-72 bg-primary-500 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
      </div>
      
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <!-- Section Header -->
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-gray-900 via-primary-600 to-gray-900 dark:from-white dark:via-primary-400 dark:to-white bg-clip-text text-transparent">
            {{ $t('gallery.title') }}
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {{ $t('gallery.subtitle') }}
          </p>
        </div>
        
        <!-- Gallery Filter Tabs -->
        <div class="flex flex-wrap justify-center gap-4 mb-12">
          <button 
            v-for="category in availableCategories" 
            :key="category"
            @click="filterGallery(category)"
            :class="[
              'px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105',
              selectedCategory === category 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' 
                : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-gray-700 backdrop-blur-sm border border-gray-200 dark:border-gray-700'
            ]"
          >
            {{ category }}
          </button>
        </div>
        
        <!-- Gallery Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <div 
            v-for="(item, index) in filteredGalleryItems" 
            :key="index"
            class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-rotate-1 bg-white dark:bg-gray-800"
            :style="{ animationDelay: `${index * 100}ms` }"
          >
            <!-- Image Container -->
            <div class="relative aspect-square overflow-hidden">
              <img 
                :src="getImageUrl(item)" 
                :alt="item.title"
                class="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700 ease-out"
              >
              
              <!-- Gradient Overlay -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              
              <!-- Hover Content -->
              <div class="absolute inset-0 flex flex-col justify-end p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                <div class="space-y-2">
                  <h3 class="text-xl font-bold leading-tight">{{ item.title }}</h3>
                  <div class="flex items-center space-x-2 text-sm">
                    <svg class="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002 2v10a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-primary-300">{{ item.album }}</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-blue-300">{{ item.photographer }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Load More Button -->
        <div class="text-center mt-16">
          <router-link to="/gallery" class="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl hover:from-primary-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
            <span class="relative z-10">Load More</span>
            <div class="absolute inset-0 bg-gradient-to-r from-primary-400 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            <svg class="w-5 h-5 ml-2 transform group-hover:translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Blog Section -->
    <section id="blog" class="min-h-screen py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <!-- Background Decorations -->
      <div class="absolute inset-0 opacity-5 dark:opacity-10">
        <div class="absolute top-32 right-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
        <div class="absolute bottom-32 left-20 w-80 h-80 bg-primary-500 rounded-full blur-3xl animate-pulse" style="animation-delay: 3s;"></div>
      </div>
      
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <!-- Section Header -->
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-gray-900 via-primary-600 to-gray-900 dark:from-white dark:via-primary-400 dark:to-white bg-clip-text text-transparent">
            {{ $t('blog.title') }}
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {{ $t('blog.subtitle') }}
          </p>
        </div>
        
        <!-- Featured Post -->
        <div v-if="featuredPost" class="mb-16">
          <div class="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02] bg-white dark:bg-gray-800">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <!-- Featured Image -->
              <div class="relative overflow-hidden lg:order-1">
                <img 
                  :src="getImageUrl(featuredPost)" 
                  :alt="featuredPost.title"
                  class="w-full h-64 lg:h-full object-cover group-hover:scale-110 transition-transform duration-700"
                >
                <div class="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div class="absolute top-6 left-6">
                  <span class="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    Featured
                  </span>
                </div>
              </div>
              
              <!-- Featured Content -->
              <div class="p-8 lg:p-12 flex flex-col justify-center lg:order-2">
                <div class="flex items-center space-x-4 mb-4">
                  <span class="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full text-sm font-medium">
                    {{ featuredPost.category }}
                  </span>
                  <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                    </svg>
                    {{ formatDate(featuredPost?.date || featuredPost?.created_at) }}
                  </span>
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ featuredPost.readTime || '5 min read' }}</span>
                </div>
                
                <h3 class="text-3xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                  {{ featuredPost.title }}
                </h3>
                
                <p class="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {{ featuredPost.description }}
                </p>
                
                <div class="flex items-center justify-end">
                  <router-link 
                    :to="`/blog/${featuredPost.id}`"
                    class="group/btn inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Read More
                    <svg class="w-4 h-4 ml-2 transform group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Blog Posts Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <article 
            v-for="(post, index) in regularBlogPosts" 
            :key="post.id"
            class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-rotate-1 bg-white dark:bg-gray-800"
            :style="{ animationDelay: `${index * 100}ms` }"
          >
            <!-- Image Container -->
            <div class="relative overflow-hidden">
              <div class="aspect-w-16 aspect-h-10">
                <img 
                  :src="getImageUrl(post)" 
                  :alt="post.title"
                  class="w-full h-48 object-cover group-hover:scale-125 transition-transform duration-700 ease-out"
                >
              </div>
              
              <!-- Gradient Overlay on Hover -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <!-- Hover Description -->
              <div class="absolute inset-0 flex items-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                <p class="text-white text-sm leading-relaxed line-clamp-3">
                  {{ post.description }}
                </p>
              </div>
              
              <!-- Category Badge -->
              <div class="absolute top-4 left-4">
                <span class="bg-primary-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                  {{ post.category }}
                </span>
              </div>
            </div>
            
            <!-- Card Content -->
            <div class="p-6">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                  </svg>
                  {{ formatDate(post.date) }}
                </span>
                <span class="text-xs text-gray-400 dark:text-gray-500">{{ post.readTime || '5 min read' }}</span>
              </div>
              
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 line-clamp-2">
                {{ post.title }}
              </h3>
              
              <!-- Read More Link -->
              <div class="flex justify-end mt-4">
                <router-link 
                  :to="`/blog/${post.id}`"
                  class="group/link inline-flex items-center text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-300"
                >
                  <span class="text-sm">{{ $t('blog.readMore') || 'Read More' }}</span>
                  <svg class="w-4 h-4 ml-1 transform group-hover/link:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </router-link>
              </div>
            </div>
            
            <!-- Decorative Corner -->
            <div class="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </article>
        </div>
        
          
        <div class="text-center mt-16">
          <router-link to="/blog" class="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl hover:from-primary-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
            <span class="relative z-10">Load More</span>
            <div class="absolute inset-0 bg-gradient-to-r from-primary-400 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            <svg class="w-5 h-5 ml-2 transform group-hover:translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Socials Section -->
    <section id="socials" class="min-h-screen py-20 bg-white dark:bg-gray-800">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {{ $t('socials.title') }}
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {{ $t('socials.subtitle') }}
          </p>
        </div>
        
        <!-- Social Links -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <!-- Telegram -->
          <a 
            href="https://t.me/furbanbandung" 
            target="_blank"
            class="card p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
          >
            <div class="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Telegram</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Join our Telegram group for daily discussions and updates
            </p>
            <span class="text-blue-500 font-medium group-hover:text-blue-600 transition-colors">
              @furbanbandung
            </span>
          </a>
          
          <!-- Instagram -->
          <a 
            href="https://instagram.com/furbanbandung" 
            target="_blank"
            class="card p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
          >
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:from-purple-600 group-hover:to-pink-600 transition-colors">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.664.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.664-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.664-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.668.072 4.849.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Instagram</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Follow us for photos and community highlights
            </p>
            <span class="text-pink-500 font-medium group-hover:text-pink-600 transition-colors">
              @furbanbandung
            </span>
          </a>
        </div>
        
        <!-- Contact Info -->
        <div class="mt-16 text-center">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {{ $t('socials.contact') }}
          </h3>
          <p class="text-lg text-gray-600 dark:text-gray-300 mb-4">
            Have questions or want to get involved? Reach out to us!
          </p>
          <a 
            href="mailto:contact@furbanbandung.com" 
            class="inline-flex items-center text-primary-600 dark:text-primary-400 font-medium hover:underline"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            contact@furbanbandung.com
          </a>
        </div>
      </div>
    </section>
  </div>
</template>




<script>
import { ref, onMounted, computed } from 'vue'
import ApiService from '../services/api.js'
import apiConfig from '../config/api.js'

export default {
  setup() {
    const apiService = new ApiService()
    const galleryItems = ref([])
    const recentBlogs = ref([])
    const selectedCategory = ref('All')
    const albumCategories = ref([])
    const loading = ref(true)
    const error = ref(null)
    
    // Filter gallery items by category
    const filteredGalleryItems = computed(() => {
      if (selectedCategory.value === 'All') {
        // Return shuffled gallery items for 'All' category
        return [...galleryItems.value].sort(() => Math.random() - 0.5)
      }
      return galleryItems.value
        .filter(item => item.album === selectedCategory.value)
    })
    
    // Add computed property for available categories
    const availableCategories = computed(() => {
      return ['All', ...albumCategories.value.map(album => album.album)]
    })
    
    // Add computed properties for blog posts
    const featuredPost = computed(() => {
      return recentBlogs.value.length > 0 ? recentBlogs.value[0] : null
    })
    
    const regularBlogPosts = computed(() => {
      return recentBlogs.value.length > 1 ? recentBlogs.value.slice(1) : []
    })
    
    const filterGallery = async (category) => {
      selectedCategory.value = category
      
      try {
        if (category === 'All') {
          // Fetch all featured gallery items
          const galleryData = await apiService.getFeaturedGallery(8)
          // Handle both direct array and wrapped object responses with null checking
          const items = Array.isArray(galleryData) ? galleryData : (galleryData && galleryData.data ? galleryData.data : [])
          // Shuffle the items
          galleryItems.value = items.sort(() => Math.random() - 0.5)
        } else {
          // Fetch gallery items for the selected album
          const response = await apiService.getGalleryByAlbum(category)
          const galleryData = Array.isArray(response) ? response : (response.data || [])
          
          // Limit to 8 items for the homepage
          galleryItems.value = galleryData.slice(0, 8)
        }
      } catch (err) {
        console.error('Error filtering gallery:', err)
        error.value = `Failed to load gallery items for ${category}.`
      }
    }
    
    // Fetch album categories
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
    
    // Fetch data from backend
    const fetchData = async () => {
      try {
        loading.value = true
        
        // Fetch album categories
        await fetchAlbumCategories()
        
        // Fetch gallery items
        const galleryData = await apiService.getFeaturedGallery(8)
        // Handle both direct array and wrapped object responses with null checking
        galleryItems.value = Array.isArray(galleryData) ? galleryData : 
                            (galleryData && galleryData.data ? galleryData.data : []) 
        // Fetch recent blogs
        const blogsData = await apiService.getRecentBlogs(4)
        // Handle both direct array and wrapped object responses
        recentBlogs.value = Array.isArray(blogsData) ? blogsData.map(blog => ({
        ...blog,
        date: blog.date || blog.created_at || blog.createdAt
        })) : (blogsData.data || []).map(blog => ({
        ...blog,
        date: blog.date || blog.created_at || blog.createdAt
        }))
        
        loading.value = false
      } catch (err) {
        console.error('Error fetching landing page data:', err)
        error.value = 'Failed to load content. Please try again later.'
        loading.value = false
      }
    }

    // Function to get complete image URL
    const getImageUrl = (itemOrPath) => {
      if (!itemOrPath) return ''

      let path = itemOrPath

      if (typeof itemOrPath === 'object') {
         if (itemOrPath.variants && itemOrPath.variants.medium) {
             path = itemOrPath.variants.medium
         } else if (itemOrPath.image) {
             path = itemOrPath.image
         } else if (itemOrPath.url) {
             path = itemOrPath.url
         }
      }

      if (!path) return ''

      // If the image is already a base64 string
      if (path.startsWith('data:')) {
        return path
      }

      // For backward compatibility with old image paths
      if (path.startsWith('http')) {
        return path
      } else {
        const baseServerUrl = apiConfig.baseURL.split('/api')[0]
        if (path.startsWith('/')) {
             return `${baseServerUrl}${path}`
        }
        // For old image paths stored as filenames
        return `${baseServerUrl}/uploads/gallery/${path}`
      }
    }
    
    onMounted(() => {
      fetchData()
    })
    
      // Define formatDate function before the return statement
  const formatDate = (dateString) => {
    if (!dateString) return 'No date'
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Add the scrollToSection function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
    
    // Single return statement with all properties
    return {
      galleryItems,
      recentBlogs,
      selectedCategory,
      availableCategories,
      filteredGalleryItems,
      filterGallery,
      getImageUrl,
      loading,
      error,
      featuredPost,
      regularBlogPosts,
      formatDate,
      scrollToSection
    }
  }
}
</script>



<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 1s ease-out;
}

.animate-fade-in-delay {
  animation: fade-in 1s ease-out 0.3s both;
}

.animate-fade-in-delay-2 {
  animation: fade-in 1s ease-out 0.6s both;
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md;
}

.btn-primary {
  @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 inline-block;
}

.btn-secondary {
  @apply bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 border border-white/30 inline-block;
}
</style>