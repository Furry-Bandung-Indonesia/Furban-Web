<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="getToastClass(toast.type)"
          class="flex items-center p-4 rounded-lg shadow-lg backdrop-blur-sm"
          role="alert"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 mr-3">
            <svg v-if="toast.type === 'success'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <svg v-else-if="toast.type === 'error'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
          </div>
          
          <!-- Message -->
          <div class="flex-1 text-sm font-medium">
            {{ toast.message }}
          </div>
          
          <!-- Close button -->
          <button
            @click="removeToast(toast.id)"
            class="ml-3 flex-shrink-0 rounded-md p-1.5 hover:bg-black/10 focus:outline-none transition-colors"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

const getToastClass = (type) => {
  switch (type) {
    case 'success':
      return 'bg-green-500/90 text-white'
    case 'error':
      return 'bg-red-500/90 text-white'
    case 'warning':
      return 'bg-yellow-500/90 text-white'
    default:
      return 'bg-indigo-500/90 text-white'
  }
}

const addToast = (message, type = 'info', duration = 4000) => {
  const id = ++toastId
  toasts.value.push({ id, message, type })
  
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration)
  }
  
  return id
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

// Expose methods for external use
defineExpose({
  addToast,
  removeToast,
  success: (msg) => addToast(msg, 'success'),
  error: (msg) => addToast(msg, 'error'),
  warning: (msg) => addToast(msg, 'warning'),
  info: (msg) => addToast(msg, 'info')
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
