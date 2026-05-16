<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useData, useRoute } from "vitepress";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  twinkle: number;
  hue: number;
};

const { frontmatter } = useData();
const route = useRoute();

const canvasRef = ref<HTMLCanvasElement | null>(null);

const isHome = computed(() => frontmatter.value.layout === "home");

let ctx: CanvasRenderingContext2D | null = null;
let raf = 0;
let width = 0;
let height = 0;
let dpr = 1;
let particles: Particle[] = [];
let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;
let mouseActive = 0;
let targetMouseActive = 0;
let reduceMotion = false;
let coarsePointer = false;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function random(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getParticleCount() {
  const area = width * height;
  const base = Math.round(area / 52000);

  if (coarsePointer) return clamp(base, 12, 22);

  return clamp(base, 22, 44);
}

function createParticle(): Particle {
  return {
    x: random(0, width),
    y: random(0, height),
    vx: random(-0.10, 0.10),
    vy: random(-0.08, 0.08),
    size: random(0.7, 2.2),
    alpha: random(0.22, 0.72),
    twinkle: random(0, Math.PI * 2),
    hue: random(196, 245),
  };
}

function resize() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  width = window.innerWidth;
  height = Math.max(window.innerHeight, 720);
  dpr = Math.min(window.devicePixelRatio || 1, 1.75);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const count = getParticleCount();

  if (particles.length > count) {
    particles = particles.slice(0, count);
  }

  while (particles.length < count) {
    particles.push(createParticle());
  }
}

function handlePointerMove(event: PointerEvent) {
  if (!isHome.value || coarsePointer) return;

  targetMouseX = event.clientX;
  targetMouseY = event.clientY;
  targetMouseActive = 1;
}

function handlePointerLeave() {
  targetMouseActive = 0;
}

function drawParticle(p: Particle, time: number) {
  if (!ctx) return;

  const dx = mouseX - p.x;
  const dy = mouseY - p.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const influence = mouseActive * clamp(1 - dist / 280, 0, 1);

  p.vx += (dx / dist) * influence * 0.008;
  p.vy += (dy / dist) * influence * 0.008;

  p.vx *= 0.988;
  p.vy *= 0.988;

  p.x += p.vx;
  p.y += p.vy;

  if (p.x < -40) p.x = width + 40;
  if (p.x > width + 40) p.x = -40;
  if (p.y < -40) p.y = height + 40;
  if (p.y > height + 40) p.y = -40;

  const pulse = 0.62 + Math.sin(time * 0.0012 + p.twinkle) * 0.38;
  const alpha = clamp(p.alpha * (0.72 + influence * 0.95) * pulse, 0.05, 0.92);
  const size = p.size * (1 + influence * 1.6);

  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 8);
  gradient.addColorStop(0, `hsla(${p.hue}, 95%, 76%, ${alpha})`);
  gradient.addColorStop(0.38, `hsla(${p.hue}, 90%, 64%, ${alpha * 0.28})`);
  gradient.addColorStop(1, `hsla(${p.hue}, 80%, 56%, 0)`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(p.x, p.y, size * 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.72})`;
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(0.55, size * 0.62), 0, Math.PI * 2);
  ctx.fill();
}

function drawLines() {
  if (!ctx || coarsePointer) return;

  const maxDist = 118;

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxDist) continue;

      const alpha = (1 - dist / maxDist) * 0.12;

      ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

function render(time = 0) {
  if (!ctx) {
    raf = window.requestAnimationFrame(render);
    return;
  }

  if (!isHome.value || reduceMotion) {
    ctx.clearRect(0, 0, width, height);
    raf = window.requestAnimationFrame(render);
    return;
  }

  mouseX += (targetMouseX - mouseX) * 0.08;
  mouseY += (targetMouseY - mouseY) * 0.08;
  mouseActive += (targetMouseActive - mouseActive) * 0.08;

  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createRadialGradient(width * 0.72, 120, 0, width * 0.72, 120, Math.min(width, 760));
  bg.addColorStop(0, `rgba(37, 99, 235, ${0.035 + mouseActive * 0.025})`);
  bg.addColorStop(0.5, `rgba(124, 58, 237, ${0.025 + mouseActive * 0.018})`);
  bg.addColorStop(1, "rgba(6, 182, 212, 0)");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  drawLines();

  for (const p of particles) {
    drawParticle(p, time);
  }

  raf = window.requestAnimationFrame(render);
}

function setup() {
  reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  targetMouseX = window.innerWidth * 0.72;
  targetMouseY = 180;
  mouseX = targetMouseX;
  mouseY = targetMouseY;

  resize();

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave);

  raf = window.requestAnimationFrame(render);
}

onMounted(() => {
  nextTick(setup);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerleave", handlePointerLeave);

  if (raf) {
    window.cancelAnimationFrame(raf);
  }
});

watch(
  () => route.path,
  () => {
    targetMouseActive = 0;
    nextTick(resize);
  }
);
</script>

<template>
  <canvas
    v-show="isHome"
    ref="canvasRef"
    class="cysj-home-particles"
    aria-hidden="true"
  />
</template>

<style scoped>
.cysj-home-particles {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.9;
  mix-blend-mode: normal;
}

:global(.VPHome),
:global(.VPDoc),
:global(.VPNav),
:global(.Layout) {
  position: relative;
}

:global(.VPHome) {
  z-index: 1;
}

@media (max-width: 960px) {
  .cysj-home-particles {
    opacity: 0.42;
  }
}

@media (max-width: 640px) {
  .cysj-home-particles {
    opacity: 0.26;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cysj-home-particles {
    display: none;
  }
}
</style>

