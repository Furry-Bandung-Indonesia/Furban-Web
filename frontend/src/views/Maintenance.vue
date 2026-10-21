<template>
  <div class="page min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center">
    <img src="/heri-small.png" alt="Heri" class="w-[220px] flex-shrink-0" />
    <div class="text max-w-[480px]">
      <h1 class="text-3xl font-bold mb-4 text-gray-900 dark:text-white">We will return shortly</h1>
      <p class="leading-relaxed text-gray-600 dark:text-gray-300">
        Furban Web Community is currently under temporary maintenance. This maintenance
        is scheduled to end on <strong class="text-gray-900 dark:text-white">24 October at 22:00 UTC+7</strong>. This
        temporary suspension is to ensure safety while we patch an update on our server.
      </p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.page {
  gap: 2.5rem;
  padding: 2rem;
}

@media (max-width: 600px) {
  .page {
    flex-direction: column;
    text-align: center;
  }
}
</style>
