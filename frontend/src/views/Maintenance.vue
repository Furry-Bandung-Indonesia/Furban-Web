<template>
  <div class="page">
    <img src="/heri-small.png" alt="Heri" />
    <div class="text">
      <h1>We will return shortly</h1>
      <p>
        Furban Web Community is currently under temporary maintenance. This maintenance
        is scheduled to end on <strong>24 October at 22:00 UTC+7</strong>. This
        temporary suspension is to ensure safety while we patch an update on our server.
      </p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
  padding: 2rem;
}

.page img {
  width: 220px;
  flex-shrink: 0;
}

.text {
  max-width: 480px;
}

.text h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.text p {
  line-height: 1.7;
}

@media (max-width: 600px) {
  .page {
    flex-direction: column;
    text-align: center;
  }
}
</style>
