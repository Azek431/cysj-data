<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const root = ref<HTMLElement | null>(null)

const currentX = ref(0)
const currentY = ref(0)
const targetX = ref(0)
const targetY = ref(0)
const hover = ref(false)

let raf = 0

function animate() {
  currentX.value += (targetX.value - currentX.value) * 0.08
  currentY.value += (targetY.value - currentY.value) * 0.08
  raf = requestAnimationFrame(animate)
}

function handleMouseMove(e: MouseEvent) {
  const w = window.innerWidth
  const h = window.innerHeight

  const nx = (e.clientX / w - 0.5) * 2
  const ny = (e.clientY / h - 0.5) * 2

  targetX.value = nx
  targetY.value = ny
}

function handleMouseLeave() {
  targetX.value = 0
  targetY.value = 0
  hover.value = false
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  window.addEventListener('mouseleave', handleMouseLeave)
  animate()
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseleave', handleMouseLeave)
  cancelAnimationFrame(raf)
})

const crystalStyle = computed(() => {
  const tx = currentX.value * 18
  const ty = currentY.value * 14
  const rx = currentY.value * -8
  const ry = currentX.value * 10
  const scale = hover.value ? 1.03 : 1

  return {
    transform: `translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`
  }
})

const glowStyle = computed(() => {
  const tx = currentX.value * 30
  const ty = currentY.value * 24

  return {
    transform: `translate3d(${tx}px, ${ty}px, 0)`
  }
})
</script>

<template>
  <div
    ref="root"
    class="cysj-home-crystal"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <div class="cysj-home-crystal__glow" :style="glowStyle" />
    <div class="cysj-home-crystal__rings" :style="glowStyle">
      <span></span>
      <span></span>
      <span></span>
    </div>

    <div class="cysj-home-crystal__body" :style="crystalStyle">
      <div class="cysj-home-crystal__inner"></div>
      <div class="cysj-home-crystal__core"></div>
      <div class="cysj-home-crystal__shine"></div>
      <div class="cysj-home-crystal__spark s1"></div>
      <div class="cysj-home-crystal__spark s2"></div>
      <div class="cysj-home-crystal__spark s3"></div>
    </div>
  </div>
</template>

<style scoped>
.cysj-home-crystal {
  position: relative;
  width: min(34vw, 420px);
  aspect-ratio: 1 / 1;
  pointer-events: auto;
  perspective: 1200px;
  transform-style: preserve-3d;
}

.cysj-home-crystal__glow {
  position: absolute;
  inset: 14%;
  border-radius: 999px;
  background:
    radial-gradient(circle at 35% 35%, rgba(255,255,255,0.72), transparent 18%),
    radial-gradient(circle at 50% 50%, rgba(59,130,246,0.34), transparent 42%),
    radial-gradient(circle at 70% 40%, rgba(124,58,237,0.32), transparent 38%),
    radial-gradient(circle at 42% 70%, rgba(6,182,212,0.28), transparent 42%);
  filter: blur(34px);
  opacity: 0.95;
  animation: cysjGlowPulse 7s ease-in-out infinite;
}

.cysj-home-crystal__rings {
  position: absolute;
  inset: 0;
}

.cysj-home-crystal__rings span {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 999px;
  transform: translate(-50%, -50%);
  box-shadow: inset 0 0 24px rgba(255,255,255,0.05);
}

.cysj-home-crystal__rings span:nth-child(1) {
  width: 76%;
  height: 76%;
  animation: cysjRingFloat 8s linear infinite;
}

.cysj-home-crystal__rings span:nth-child(2) {
  width: 92%;
  height: 92%;
  animation: cysjRingFloat 12s linear infinite reverse;
}

.cysj-home-crystal__rings span:nth-child(3) {
  width: 108%;
  height: 108%;
  opacity: 0.55;
  animation: cysjRingFloat 16s linear infinite;
}

.cysj-home-crystal__body {
  position: absolute;
  inset: 18%;
  border-radius: 34% 66% 58% 42% / 42% 38% 62% 58%;
  background:
    linear-gradient(145deg, rgba(255,255,255,0.62), rgba(255,255,255,0.12)),
    radial-gradient(circle at 30% 25%, rgba(255,255,255,0.82), transparent 20%),
    radial-gradient(circle at 70% 30%, rgba(59,130,246,0.22), transparent 36%),
    radial-gradient(circle at 50% 72%, rgba(124,58,237,0.26), transparent 42%),
    radial-gradient(circle at 38% 62%, rgba(6,182,212,0.18), transparent 44%);
  border: 1px solid rgba(255,255,255,0.22);
  box-shadow:
    0 28px 80px rgba(15, 23, 42, 0.20),
    inset 0 2px 0 rgba(255,255,255,0.36),
    inset 0 -18px 40px rgba(59,130,246,0.08);
  backdrop-filter: blur(10px) saturate(1.15);
  -webkit-backdrop-filter: blur(10px) saturate(1.15);
  transform-style: preserve-3d;
  animation: cysjCrystalFloat 6s ease-in-out infinite;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
  overflow: hidden;
}

.cysj-home-crystal__body:hover {
  box-shadow:
    0 36px 100px rgba(15, 23, 42, 0.26),
    inset 0 2px 0 rgba(255,255,255,0.42),
    inset 0 -24px 48px rgba(59,130,246,0.10);
  filter: brightness(1.03);
}

.cysj-home-crystal__inner {
  position: absolute;
  inset: 10%;
  border-radius: 38% 62% 60% 40% / 44% 34% 66% 56%;
  background:
    radial-gradient(circle at 36% 30%, rgba(255,255,255,0.38), transparent 18%),
    radial-gradient(circle at 70% 42%, rgba(255,255,255,0.12), transparent 24%),
    linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02));
  transform: translateZ(12px);
}

.cysj-home-crystal__core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 34%;
  height: 34%;
  transform: translate(-50%, -50%) translateZ(28px);
  border-radius: 999px;
  background:
    radial-gradient(circle at 40% 40%, rgba(255,255,255,0.86), transparent 24%),
    radial-gradient(circle at 50% 50%, rgba(37,99,235,0.44), transparent 48%),
    radial-gradient(circle at 58% 58%, rgba(124,58,237,0.42), transparent 52%);
  filter: blur(2px);
  box-shadow:
    0 0 24px rgba(59,130,246,0.34),
    0 0 54px rgba(124,58,237,0.20);
  animation: cysjCorePulse 5s ease-in-out infinite;
}

.cysj-home-crystal__shine {
  position: absolute;
  inset: -10%;
  background: linear-gradient(
    115deg,
    transparent 0%,
    transparent 36%,
    rgba(255,255,255,0.08) 42%,
    rgba(255,255,255,0.46) 50%,
    rgba(255,255,255,0.10) 58%,
    transparent 64%,
    transparent 100%
  );
  transform: translateX(-120%) rotate(8deg);
  animation: cysjShineSweep 6.6s ease-in-out infinite;
}

.cysj-home-crystal__spark {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.92);
  box-shadow:
    0 0 12px rgba(255,255,255,0.8),
    0 0 28px rgba(59,130,246,0.5);
  animation: cysjSparkBlink 3.8s ease-in-out infinite;
}

.cysj-home-crystal__spark.s1 {
  left: 24%;
  top: 26%;
  animation-delay: 0s;
}

.cysj-home-crystal__spark.s2 {
  right: 22%;
  top: 34%;
  animation-delay: 1.2s;
}

.cysj-home-crystal__spark.s3 {
  left: 46%;
  bottom: 20%;
  animation-delay: 2s;
}

@keyframes cysjCrystalFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes cysjGlowPulse {
  0%, 100% {
    opacity: 0.88;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}

@keyframes cysjCorePulse {
  0%, 100% {
    transform: translate(-50%, -50%) translateZ(28px) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) translateZ(28px) scale(1.08);
  }
}

@keyframes cysjShineSweep {
  0% {
    transform: translateX(-120%) rotate(8deg);
    opacity: 0;
  }
  16% {
    opacity: 1;
  }
  42% {
    transform: translateX(120%) rotate(8deg);
    opacity: 1;
  }
  55%, 100% {
    opacity: 0;
  }
}

@keyframes cysjSparkBlink {
  0%, 100% {
    opacity: 0.45;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes cysjRingFloat {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.dark .cysj-home-crystal__body {
  border-color: rgba(255,255,255,0.14);
}

@media (max-width: 960px) {
  .cysj-home-crystal {
    width: min(52vw, 320px);
  }

  .cysj-home-crystal__rings span:nth-child(3) {
    display: none;
  }
}

@media (max-width: 640px) {
  .cysj-home-crystal {
    width: min(68vw, 280px);
  }

  .cysj-home-crystal__glow {
    filter: blur(24px);
  }

  .cysj-home-crystal__body {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cysj-home-crystal__glow,
  .cysj-home-crystal__rings span,
  .cysj-home-crystal__body,
  .cysj-home-crystal__core,
  .cysj-home-crystal__shine,
  .cysj-home-crystal__spark {
    animation: none !important;
  }
}
</style>
