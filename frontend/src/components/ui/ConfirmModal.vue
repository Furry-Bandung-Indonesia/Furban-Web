<template>
  <div v-if="isOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center backdrop-blur-sm">
    <div class="p-5 border w-96 shadow-xl rounded-xl bg-white dark:bg-gray-800 transform transition-all scale-100">
      <div class="mt-3 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <svg class="h-6 w-6 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <h3 class="text-lg leading-6 font-bold text-gray-900 dark:text-white">{{ title }}</h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ message }}
          </p>
        </div>
        <div class="items-center px-4 py-3 space-y-3">
          <button @click="$emit('confirm')" class="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-lg w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">
            {{ confirmText }}
          </button>
          <button @click="$emit('close')" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-base font-medium rounded-lg w-full shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors">
            {{ cancelText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Are you sure?'
  },
  message: {
    type: String,
    default: 'Do you really want to delete this item? This process cannot be undone.'
  },
  confirmText: {
    type: String,
    default: 'Delete'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  }
})

defineEmits(['confirm', 'close'])
</script>
