<template>
  <div class="min-h-screen pt-20 pb-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          {{ $t('about.title') }}
        </h1>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <!-- Image Section -->
        <div class="order-2 lg:order-1">
          <div class="relative">
            <img 
              src="/furban.png" 
              alt="Furban Community" 
              class="w-full max-w-md mx-auto rounded-2xl shadow-2xl"
            >
            <div class="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-transparent rounded-2xl"></div>
          </div>
        </div>
        
        <!-- Content Section -->
        <div class="order-1 lg:order-2">
          <div class="prose prose-lg dark:prose-invert max-w-none">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {{ $t('about.subtitle') }}
            </h2>
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p class="text-gray-600 dark:text-gray-300 mb-8">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
            
            <div class="flex flex-wrap gap-4">
              <div class="bg-primary-100 dark:bg-primary-900 px-4 py-2 rounded-full">
                <span class="text-primary-800 dark:text-primary-200 font-medium">Community</span>
              </div>
              <div class="bg-primary-100 dark:bg-primary-900 px-4 py-2 rounded-full">
                <span class="text-primary-800 dark:text-primary-200 font-medium">Furry</span>
              </div>
              <div class="bg-primary-100 dark:bg-primary-900 px-4 py-2 rounded-full">
                <span class="text-primary-800 dark:text-primary-200 font-medium">Bandung</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About'
}
</script>