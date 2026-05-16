<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useData, useRoute } from "vitepress";

type ParticleKind = "node" | "dust" | "spark";

type Particle = {
  kind: ParticleKind;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  size: number;
  alpha: number;
  phase: number;
  speed: number;
  orbitX: number;
  orbitY: number;
  hue: number;
  layer: number;
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

function ease(value: number) {
  return value * value * (3 - 2 * value);
}

function createParticle(kind: ParticleKind, index: number, total: number): Particle {
  const t = total <= 1 ? 0 : index / (total - 1);
  const wave = Math.sin(t * Math.PI * 2.4);

  // 让粒子不再随机满屏乱飞，而是围绕 Hero / 水晶区域形成流线
  let baseX = 0;
  let baseY = 0;

  if (kind === "node") {
    baseX = width * (0.10 + t * 0.84);
    baseY = height * (0.18 + 0.20 * Math.sin(t * Math.PI * 2.1 + 0.8));
  } else if (kind === "spark") {
    // 右侧水晶附近的灵光粒子
    const angle = random(0, Math.PI * 2);
    const radius = random(70, Math.min(width, 520) * 0.42);

    baseX = width * 0.72 + Math.cos(angle) * radius;
    baseY = height * 0.22 + Math.sin(angle) * radius * 0.62;
  } else {
    // 背景尘埃更分散，但仍有对角线方向
    baseX = random(width * 0.02, width * 0.98);
    baseY =
      height * (0.10 + random(0, 0.78)) +
      Math.sin(baseX / Math.max(width, 1) * Math.PI * 2) * 38;
  }

  return {
    kind,
    baseX,
    baseY,
    x: baseX,
    y: baseY,
    size:
      kind === "node"
        ? random(1.25, 2.4)
        : kind === "spark"
          ? random(1.0, 2.8)
          : random(0.55, 1.35),
    alpha:
      kind === "node"
        ? random(0.42, 0.72)
        : kind === "spark"
          ? random(0.34, 0.78)
          : random(0.16, 0.42),
    phase: random(0, Math.PI * 2),
    speed:
      kind === "dust"
        ? random(0.00016, 0.00034)
        : random(0.00022, 0.00046),
    orbitX:
      kind === "spark"
        ? random(14, 36)
        : kind === "node"
          ? random(8, 22)
          : random(10, 26),
    orbitY:
      kind === "spark"
        ? random(10, 28)
        : kind === "node"
          ? random(6, 18)
          : random(8, 22),
    hue: kind === "spark" ? random(188, 232) : random(202, 258),
    layer: kind === "dust" ? random(0.3, 0.8) : random(0.75, 1.2),
  };
}

function getCounts() {
  const area = width * height;
  const scale = clamp(area / 900000, 0.75, 1.25);

  if (coarsePointer) {
    return {
      nodes: Math.round(12 * scale),
      dust: Math.round(18 * scale),
      sparks: Math.round(10 * scale),
    };
  }

  return {
    nodes: Math.round(24 * scale),
    dust: Math.round(34 * scale),
    sparks: Math.round(22 * scale),
  };
}

function rebuildParticles() {
  const counts = getCounts();
  const next: Particle[] = [];

  for (let i = 0; i < counts.nodes; i += 1) {
    next.push(createParticle("node", i, counts.nodes));
  }

  for (let i = 0; i < counts.dust; i += 1) {
    next.push(createParticle("dust", i, counts.dust));
  }

  for (let i = 0; i < counts.sparks; i += 1) {
    next.push(createParticle("spark", i, counts.sparks));
  }

  particles = next;
}

function resize() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  width = window.innerWidth;
  height = Math.max(window.innerHeight, 720);
  dpr = Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.2 : 1.6);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx = canvas.getContext("2d", {
    alpha: true,
  });

  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  rebuildParticles();
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

function drawNebula(time: number) {
  if (!ctx) return;

  const gradient = ctx.createRadialGradient(
    width * 0.72 + Math.sin(time * 0.00035) * 36,
    height * 0.18 + Math.cos(time * 0.00028) * 24,
    0,
    width * 0.72,
    height * 0.18,
    Math.min(width * 0.58, 760),
  );

  gradient.addColorStop(0, `rgba(37, 99, 235, ${0.050 + mouseActive * 0.025})`);
  gradient.addColorStop(0.32, `rgba(124, 58, 237, ${0.038 + mouseActive * 0.018})`);
  gradient.addColorStop(0.68, `rgba(6, 182, 212, ${0.020 + mouseActive * 0.014})`);
  gradient.addColorStop(1, "rgba(6, 182, 212, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 柔和流光曲线，模仿“背景有方向”的感觉
  for (let i = 0; i < 3; i += 1) {
    const offset = i * 90;
    const alpha = 0.055 - i * 0.010;

    const line = ctx.createLinearGradient(width * 0.10, 0, width * 0.90, height * 0.45);
    line.addColorStop(0, `rgba(59, 130, 246, 0)`);
    line.addColorStop(0.38, `rgba(96, 165, 250, ${alpha})`);
    line.addColorStop(0.62, `rgba(168, 85, 247, ${alpha * 0.8})`);
    line.addColorStop(1, `rgba(6, 182, 212, 0)`);

    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();

    const y = height * 0.18 + offset + Math.sin(time * 0.0004 + i) * 12;

    ctx.moveTo(width * 0.04, y);
    ctx.bezierCurveTo(
      width * 0.28,
      y - 86,
      width * 0.54,
      y + 88,
      width * 0.92,
      y - 26,
    );
    ctx.stroke();
  }
}

function updateParticle(p: Particle, time: number) {
  const orbitTime = time * p.speed + p.phase;

  const driftX = Math.cos(orbitTime) * p.orbitX;
  const driftY = Math.sin(orbitTime * 1.18) * p.orbitY;

  const parallaxX = (mouseX / Math.max(width, 1) - 0.5) * 16 * p.layer * mouseActive;
  const parallaxY = (mouseY / Math.max(height, 1) - 0.5) * 10 * p.layer * mouseActive;

  let x = p.baseX + driftX + parallaxX;
  let y = p.baseY + driftY + parallaxY;

  // 鼠标附近不是“吸一团”，而是轻微形成能量场：外推 + 亮度增强
  const dx = x - mouseX;
  const dy = y - mouseY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const force = mouseActive * ease(clamp(1 - dist / 260, 0, 1));

  x += (dx / dist) * force * 18;
  y += (dy / dist) * force * 14;

  p.x = x;
  p.y = y;

  return force;
}

function drawParticle(p: Particle, time: number) {
  if (!ctx) return;

  const force = updateParticle(p, time);
  const pulse = 0.72 + Math.sin(time * 0.0014 + p.phase) * 0.28;

  const alpha = clamp(p.alpha * pulse * (1 + force * 1.8), 0.03, 0.95);
  const size = p.size * (1 + force * 1.2);

  if (p.kind === "dust") {
    ctx.fillStyle = `hsla(${p.hue}, 92%, 74%, ${alpha * 0.55})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 9);
  halo.addColorStop(0, `hsla(${p.hue}, 95%, 78%, ${alpha})`);
  halo.addColorStop(0.32, `hsla(${p.hue}, 90%, 66%, ${alpha * 0.26})`);
  halo.addColorStop(1, `hsla(${p.hue}, 90%, 58%, 0)`);

  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(p.x, p.y, size * 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.82})`;
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(0.65, size * 0.58), 0, Math.PI * 2);
  ctx.fill();
}

function drawConstellationLines() {
  if (!ctx || coarsePointer) return;

  const nodes = particles.filter((p) => p.kind !== "dust");
  const maxDist = 138;

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxDist) continue;

      const alpha = (1 - dist / maxDist) * 0.105;

      const line = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      line.addColorStop(0, `rgba(96, 165, 250, ${alpha})`);
      line.addColorStop(0.5, `rgba(168, 85, 247, ${alpha * 0.85})`);
      line.addColorStop(1, `rgba(34, 211, 238, ${alpha})`);

      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

function drawMouseAura() {
  if (!ctx || mouseActive < 0.03 || coarsePointer) return;

  const radius = 120 + mouseActive * 34;
  const aura = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, radius);

  aura.addColorStop(0, `rgba(96, 165, 250, ${0.080 * mouseActive})`);
  aura.addColorStop(0.38, `rgba(168, 85, 247, ${0.040 * mouseActive})`);
  aura.addColorStop(1, "rgba(6, 182, 212, 0)");

  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, radius, 0, Math.PI * 2);
  ctx.fill();
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

  mouseX += (targetMouseX - mouseX) * 0.07;
  mouseY += (targetMouseY - mouseY) * 0.07;
  mouseActive += (targetMouseActive - mouseActive) * 0.065;

  ctx.clearRect(0, 0, width, height);

  drawNebula(time);
  drawMouseAura();

  for (const p of particles) {
    drawParticle(p, time);
  }

  drawConstellationLines();

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

    nextTick(() => {
      resize();
    });
  },
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
  opacity: 0.92;
  mix-blend-mode: normal;
}

:global(.Layout),
:global(.VPHome),
:global(.VPNav),
:global(.VPFooter) {
  position: relative;
}

:global(.VPHome) {
  z-index: 1;
}

@media (max-width: 960px) {
  .cysj-home-particles {
    opacity: 0.46;
  }
}

@media (max-width: 640px) {
  .cysj-home-particles {
    opacity: 0.24;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cysj-home-particles {
    display: none;
  }
}
</style>
