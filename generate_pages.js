const fs = require('fs');

let i18nContent = fs.readFileSync('frontend/src/i18n/index.js', 'utf8');
// Strip import
i18nContent = i18nContent.replace(/import.*?vue-i18n['"];?/, '');
// Replace everything after messages with module.exports
i18nContent = i18nContent.replace(/const i18n = createI18n\([\s\S]*$/, 'module.exports = messages;\n');

fs.writeFileSync('temp_i18n.js', i18nContent);
const messages = require('./temp_i18n.js');

function generateComponent(key, numSections) {
  const en = messages.en[key];
  const id = messages.id[key];
  
  let template = `<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- English Version -->
      <template v-if="locale === 'en'">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">${en.title}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">${en.lastUpdated}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${en.intro}</p>
`;
  for (let n = 1; n <= numSections; n++) {
    template += `          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">${en[`section${n}Title`]}</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">${en[`section${n}Content`]}</p>
          </div>\n`;
  }
  template += `        </div>
      </template>

      <!-- Indonesian Version -->
      <template v-else>
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">${id.title}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">${id.lastUpdated}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${id.intro}</p>
`;
  for (let n = 1; n <= numSections; n++) {
    template += `          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">${id[`section${n}Title`]}</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">${id[`section${n}Content`]}</p>
          </div>\n`;
  }
  template += `        </div>
      </template>

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
const { t, locale } = useI18n()
</script>
`;
  return template;
}

const privacyVue = generateComponent('privacy', 11);
const termsVue = generateComponent('terms', 16);

fs.writeFileSync('frontend/src/views/PrivacyPolicy.vue', privacyVue);
fs.writeFileSync('frontend/src/views/TermsOfService.vue', termsVue);
console.log('Successfully generated standalone Vue components for Privacy Policy and Terms of Service');
