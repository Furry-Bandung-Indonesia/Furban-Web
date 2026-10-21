<template>
  <div class="maintenance-wrapper">
    <div class="maintenance-card">
      <div class="maintenance-content">
        <!-- Text side -->
        <div class="text-side">
          <h1 class="main-heading">We will return shortly</h1>
          <p class="maintenance-message">
            Furban Web Community is currently under temporary maintenance. This maintenance
            is scheduled to end on <strong>24 October at 22:00 UTC+7</strong>. This
            temporary suspension is to ensure safety while we patch an update on our server.
          </p>
          <div class="status-badge">
            <span class="pulse-dot"></span>
            <span>Maintenance in progress</span>
          </div>
        </div>

        <!-- Image side -->
        <div class="image-side">
          <img
            src="/heri-small.png"
            alt="Heri the Furban mascot"
            class="mascot-image"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No logic needed — purely static display
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.maintenance-wrapper {
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
  width: 100%;
  background: #0d0d12;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

/* Subtle ambient glow in background */
.maintenance-wrapper::before {
  content: '';
  position: absolute;
  top: -20%;
  left: -10%;
  width: 60%;
  height: 60%;
  background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.maintenance-wrapper::after {
  content: '';
  position: absolute;
  bottom: -20%;
  right: -10%;
  width: 60%;
  height: 60%;
  background: radial-gradient(ellipse at center, rgba(168, 85, 247, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.maintenance-card {
  position: relative;
  z-index: 1;
  max-width: 900px;
  width: 100%;
}

.maintenance-content {
  display: flex;
  align-items: center;
  gap: 4rem;
}

/* Text side */
.text-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.main-heading {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: #ffffff;
  line-height: 1.15;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.maintenance-message {
  font-size: 1rem;
  color: #94a3b8;
  line-height: 1.75;
  font-weight: 400;
}

.maintenance-message strong {
  color: #c7d2fe;
  font-weight: 600;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 999px;
  padding: 0.45rem 1rem;
  font-size: 0.8rem;
  color: #a5b4fc;
  font-weight: 500;
  width: fit-content;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #818cf8;
  display: inline-block;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

/* Image side */
.image-side {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 4s ease-in-out infinite;
}

.mascot-image {
  width: clamp(200px, 25vw, 300px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 20px 40px rgba(99, 102, 241, 0.2));
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

/* Responsive */
@media (max-width: 640px) {
  .maintenance-content {
    flex-direction: column-reverse;
    gap: 2rem;
    text-align: center;
  }

  .status-badge {
    margin: 0 auto;
  }

  .mascot-image {
    width: 180px;
  }
}
</style>
