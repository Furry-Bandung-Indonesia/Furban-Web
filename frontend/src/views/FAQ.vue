<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {{ $t('faq.title') }}
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300">
          {{ $t('faq.subtitle') }}
        </p>
      </div>

      <!-- FAQ Items -->
      <div class="space-y-4">
        <div 
          v-for="n in 4" 
          :key="n"
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-all duration-300"
        >
          <button
            @click="toggle(n)"
            class="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none focus:ring-2 focus:ring-primary-500/50 rounded-2xl"
          >
            <span class="text-lg font-semibold text-gray-900 dark:text-white pr-4">
              {{ $t(`faq.q${n}`) }}
            </span>
            <svg 
              class="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-300"
              :class="{ 'rotate-180': openItems.includes(n) }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div 
            v-show="openItems.includes(n)"
            class="px-6 pb-5"
          >
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
              {{ $t(`faq.a${n}`) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Contact CTA -->
      <div class="mt-12 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {{ $t('socials.contact') }}
        </h3>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          {{ $t('faq.subtitle') }}
        </p>
        <a 
          href="mailto:contact@furban.my.id"
          class="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all duration-300"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          contact@furban.my.id
        </a>
      </div>

      <!-- Back -->
      <div class="text-center mt-8">
        <router-link to="/" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">
          &larr; {{ $t('nav.home') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'FAQ',
  setup() {
    const openItems = ref([1])

    const toggle = (n) => {
      const idx = openItems.value.indexOf(n)
      if (idx === -1) {
        openItems.value.push(n)
      } else {
        openItems.value.splice(idx, 1)
      }
    }

    return { openItems, toggle }
  }
}
</script>
