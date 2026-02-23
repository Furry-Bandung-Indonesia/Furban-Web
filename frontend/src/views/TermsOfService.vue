<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {{ t('terms.title') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('terms.lastUpdated') }}
        </p>
      </div>

      <!-- Content -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
          {{ t('terms.intro') }}
        </p>

        <div v-for="n in 16" :key="n" class="space-y-3">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ t(`terms.section${n}Title`) }}
          </h2>
          <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
            {{ t(`terms.section${n}Content`) }}
          </p>
        </div>
      </div>

      <!-- Back -->
      <div class="text-center mt-8">
        <router-link to="/" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">
          &larr; {{ t('nav.home') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
