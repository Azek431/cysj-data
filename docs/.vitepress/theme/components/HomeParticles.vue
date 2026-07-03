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
  lane: number;
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
let spriteCache = new Map<string, HTMLCanvasElement>();

let backdropCanvas: HTMLCanvasElement | null = null;

let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;
let mouseActive = 0;
let targetMouseActive = 0;

let reduceMotion = false;
let coarsePointer = false;
let pageHidden = false;
let prefersReducedMotion = false;
let isMobile = false;

const TAU = Math.PI * 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function random(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function ease(value: number) {
  const v = clamp(value, 0, 1);
  return v * v * (3 - 2 * v);
}

function getCounts() {
  const area = width * height;
  const scale = clamp(area / 900000, 0.72, 1.24);

  // 移动端/粗指针设备大幅减少粒子数以降低渲染压力
  if (isMobile) {
    return {
      nodes: Math.round(6 * scale),
      dust: Math.round(8 * scale),
      sparks: Math.round(4 * scale),
    };
  }

  if (coarsePointer) {
    return {
      nodes: Math.round(10 * scale),
      dust: Math.round(14 * scale),
      sparks: Math.round(8 * scale),
    };
  }

  return {
    nodes: Math.round(22 * scale),
    dust: Math.round(28 * scale),
    sparks: Math.round(18 * scale),
  };
}

function createParticle(kind: ParticleKind, index: number, total: number): Particle {
  const t = total <= 1 ? 0 : index / (total - 1);
  const phase = random(0, TAU);
  const lane = random(-1, 1);

  let baseX = 0;
  let baseY = 0;

  if (kind === "node") {
    // 主节点沿首页 Hero 方向形成“星轨骨架”，避免随机满屏飘。
    const ribbon = index % 2;
    const wave = Math.sin(t * Math.PI * (1.45 + ribbon * 0.25) + 0.65);

    baseX = width * (0.08 + t * 0.86);
    baseY =
      height * (0.17 + ribbon * 0.085) +
      wave * height * 0.075 +
      lane * 18;
  } else if (kind === "spark") {
    // 右侧水晶附近的灵光粒子：围绕水晶区域形成视觉聚焦。
    const angle = random(0, TAU);
    const radius = random(70, Math.min(width, 520) * 0.36);

    baseX = width * 0.72 + Math.cos(angle) * radius;
    baseY = height * 0.22 + Math.sin(angle) * radius * 0.58;
  } else {
    // 背景尘埃沿对角流场分布，不再像雪花一样完全随机。
    baseX = random(width * 0.02, width * 0.98);
    baseY =
      height * random(0.10, 0.86) +
      Math.sin((baseX / Math.max(width, 1)) * Math.PI * 2) * 34 +
      lane * 24;
  }

  return {
    kind,
    baseX,
    baseY,
    x: baseX,
    y: baseY,
    size:
      kind === "node"
        ? random(1.15, 2.2)
        : kind === "spark"
          ? random(1.0, 2.65)
          : random(0.55, 1.15),
    alpha:
      kind === "node"
        ? random(0.38, 0.66)
        : kind === "spark"
          ? random(0.34, 0.72)
          : random(0.13, 0.34),
    phase,
    speed:
      kind === "dust"
        ? random(0.12, 0.30)
        : kind === "spark"
          ? random(0.00028, 0.00058)
          : random(0.00018, 0.00038),
    orbitX:
      kind === "spark"
        ? random(14, 34)
        : kind === "node"
          ? random(7, 20)
          : random(8, 18),
    orbitY:
      kind === "spark"
        ? random(10, 26)
        : kind === "node"
          ? random(6, 16)
          : random(7, 16),
    hue: kind === "spark" ? random(186, 228) : random(204, 258),
    layer: kind === "dust" ? random(0.28, 0.72) : random(0.75, 1.18),
    lane,
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

function getGlowSprite(kind: ParticleKind, hue: number) {
  const hueBucket = Math.round(hue / 10) * 10;
  const key = `${kind}-${hueBucket}`;

  const cached = spriteCache.get(key);
  if (cached) return cached;

  const size = kind === "dust" ? 40 : 72;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = size;
  canvas.height = size;

  if (!context) return canvas;

  const center = size / 2;
  const radius = center;

  const gradient = context.createRadialGradient(center, center, 0, center, center, radius);

  if (kind === "dust") {
    gradient.addColorStop(0, `hsla(${hueBucket}, 92%, 78%, 0.74)`);
    gradient.addColorStop(0.38, `hsla(${hueBucket}, 88%, 66%, 0.18)`);
    gradient.addColorStop(1, `hsla(${hueBucket}, 88%, 58%, 0)`);
  } else {
    gradient.addColorStop(0, `hsla(${hueBucket}, 96%, 82%, 0.95)`);
    gradient.addColorStop(0.18, `rgba(255, 255, 255, 0.74)`);
    gradient.addColorStop(0.42, `hsla(${hueBucket}, 92%, 66%, 0.24)`);
    gradient.addColorStop(1, `hsla(${hueBucket}, 88%, 56%, 0)`);
  }

  context.fillStyle = gradient;
  context.beginPath();
  context.arc(center, center, radius, 0, TAU);
  context.fill();

  context.fillStyle = kind === "dust" ? "rgba(255,255,255,0.36)" : "rgba(255,255,255,0.82)";
  context.beginPath();
  context.arc(center, center, kind === "dust" ? 1.2 : 1.8, 0, TAU);
  context.fill();

  spriteCache.set(key, canvas);
  return canvas;
}

function renderBackdrop() {
  backdropCanvas = document.createElement("canvas");
  backdropCanvas.width = Math.floor(width * dpr);
  backdropCanvas.height = Math.floor(height * dpr);

  const bctx = backdropCanvas.getContext("2d");
  if (!bctx) return;

  bctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  bctx.clearRect(0, 0, width, height);

  const heroGlow = bctx.createRadialGradient(
    width * 0.72,
    height * 0.18,
    0,
    width * 0.72,
    height * 0.18,
    Math.min(width * 0.62, 820),
  );
  heroGlow.addColorStop(0, "rgba(37, 99, 235, 0.080)");
  heroGlow.addColorStop(0.34, "rgba(124, 58, 237, 0.046)");
  heroGlow.addColorStop(0.68, "rgba(6, 182, 212, 0.024)");
  heroGlow.addColorStop(1, "rgba(6, 182, 212, 0)");

  bctx.fillStyle = heroGlow;
  bctx.fillRect(0, 0, width, height);

  const leftGlow = bctx.createRadialGradient(
    width * 0.12,
    height * 0.26,
    0,
    width * 0.12,
    height * 0.26,
    Math.min(width * 0.48, 620),
  );
  leftGlow.addColorStop(0, "rgba(59, 130, 246, 0.034)");
  leftGlow.addColorStop(0.55, "rgba(6, 182, 212, 0.015)");
  leftGlow.addColorStop(1, "rgba(6, 182, 212, 0)");

  bctx.fillStyle = leftGlow;
  bctx.fillRect(0, 0, width, height);

  // 预渲染极淡背景纹理，避免每帧重复生成。
  bctx.globalAlpha = 0.10;
  bctx.strokeStyle = "rgba(96, 165, 250, 0.26)";
  bctx.lineWidth = 1;

  for (let i = 0; i < 4; i += 1) {
    const y = height * (0.14 + i * 0.11);

    bctx.beginPath();
    bctx.moveTo(width * 0.04, y);
    bctx.bezierCurveTo(
      width * 0.26,
      y - 84,
      width * 0.58,
      y + 92,
      width * 0.94,
      y - 20,
    );
    bctx.stroke();
  }

  bctx.globalAlpha = 1;
}

function resize() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  width = window.innerWidth;
  height = Math.max(window.innerHeight, 720);

  // 控制 DPR，避免高分屏下粒子层像素量暴涨。
  // 移动端限制 DPR 为 1 以降低渲染压力。
  dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : coarsePointer ? 1.15 : 1.55);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx = canvas.getContext("2d", { alpha: true });

  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  spriteCache.clear();
  renderBackdrop();
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

function handleVisibilityChange() {
  pageHidden = document.hidden;
}

function flowAngle(x: number, y: number, time: number, phase: number) {
  return (
    Math.sin(x * 0.0032 + time * 0.00018 + phase) * 0.85 +
    Math.cos(y * 0.0042 - time * 0.00016 + phase * 0.7) * 0.70 +
    Math.PI * 0.08
  );
}

function wrapParticle(p: Particle) {
  const margin = 64;

  if (p.baseX < -margin) p.baseX = width + margin;
  if (p.baseX > width + margin) p.baseX = -margin;
  if (p.baseY < -margin) p.baseY = height + margin;
  if (p.baseY > height + margin) p.baseY = -margin;
}

function updateParticle(p: Particle, time: number) {
  let x = p.baseX;
  let y = p.baseY;

  if (p.kind === "dust") {
    const angle = flowAngle(p.baseX, p.baseY, time, p.phase);

    p.baseX += Math.cos(angle) * p.speed;
    p.baseY += Math.sin(angle) * p.speed * 0.62;

    wrapParticle(p);

    x = p.baseX + Math.cos(time * 0.0003 + p.phase) * p.orbitX;
    y = p.baseY + Math.sin(time * 0.00036 + p.phase) * p.orbitY;
  } else {
    const orbitTime = time * p.speed + p.phase;

    x = p.baseX + Math.cos(orbitTime) * p.orbitX;
    y = p.baseY + Math.sin(orbitTime * 1.18) * p.orbitY;
  }

  const parallaxX = (mouseX / Math.max(width, 1) - 0.5) * 18 * p.layer * mouseActive;
  const parallaxY = (mouseY / Math.max(height, 1) - 0.5) * 12 * p.layer * mouseActive;

  x += parallaxX;
  y += parallaxY;

  const dx = x - mouseX;
  const dy = y - mouseY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const force = mouseActive * ease(1 - dist / 310);

  if (force > 0) {
    const nx = dx / dist;
    const ny = dy / dist;
    const tx = -ny;
    const ty = nx;

    // 鼠标附近形成轻微旋涡，而不是单纯吸过去/弹出去。
    x += nx * force * 10 + tx * force * 12;
    y += ny * force * 8 + ty * force * 10;
  }

  p.x = x;
  p.y = y;

  return force;
}

function drawBackdrop(time: number) {
  if (!ctx) return;

  if (backdropCanvas) {
    ctx.drawImage(backdropCanvas, 0, 0, width, height);
  }

  // 动态星云层，只画少量渐变。
  const breathing = 0.5 + Math.sin(time * 0.00042) * 0.5;

  const dynamicGlow = ctx.createRadialGradient(
    width * 0.72 + Math.sin(time * 0.00028) * 28,
    height * 0.18 + Math.cos(time * 0.00022) * 18,
    0,
    width * 0.72,
    height * 0.18,
    Math.min(width * 0.56, 760),
  );

  dynamicGlow.addColorStop(0, `rgba(37, 99, 235, ${0.030 + breathing * 0.018 + mouseActive * 0.018})`);
  dynamicGlow.addColorStop(0.42, `rgba(124, 58, 237, ${0.020 + breathing * 0.012 + mouseActive * 0.012})`);
  dynamicGlow.addColorStop(1, "rgba(6, 182, 212, 0)");

  ctx.fillStyle = dynamicGlow;
  ctx.fillRect(0, 0, width, height);
}

function drawLightStreams(time: number) {
  if (!ctx) return;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < 3; i += 1) {
    const t = (time * (0.000045 + i * 0.000008) + i * 0.31) % 1;
    const prevT = Math.max(0, t - 0.035);

    const x1 = width * (0.10 + prevT * 0.82);
    const y1 =
      height * (0.16 + i * 0.075) +
      Math.sin(prevT * Math.PI * 2.1 + i) * height * 0.055;

    const x2 = width * (0.10 + t * 0.82);
    const y2 =
      height * (0.16 + i * 0.075) +
      Math.sin(t * Math.PI * 2.1 + i) * height * 0.055;

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, "rgba(96, 165, 250, 0)");
    gradient.addColorStop(0.55, "rgba(168, 85, 247, 0.12)");
    gradient.addColorStop(1, "rgba(34, 211, 238, 0.24)");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
    ctx.beginPath();
    ctx.arc(x2, y2, 1.2, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

function drawMouseAura() {
  if (!ctx || mouseActive < 0.03 || coarsePointer) return;

  const radius = 118 + mouseActive * 42;
  const aura = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, radius);

  aura.addColorStop(0, `rgba(96, 165, 250, ${0.080 * mouseActive})`);
  aura.addColorStop(0.38, `rgba(168, 85, 247, ${0.044 * mouseActive})`);
  aura.addColorStop(1, "rgba(6, 182, 212, 0)");

  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, radius, 0, TAU);
  ctx.fill();
}

function drawParticle(p: Particle, time: number) {
  if (!ctx) return;

  const force = updateParticle(p, time);
  const pulse = 0.72 + Math.sin(time * 0.00135 + p.phase) * 0.28;

  const alpha = clamp(p.alpha * pulse * (1 + force * 1.45), 0.025, 0.9);
  const sprite = getGlowSprite(p.kind, p.hue);

  const baseSize =
    p.kind === "dust"
      ? p.size * 13
      : p.kind === "spark"
        ? p.size * 18
        : p.size * 16;

  const renderSize = baseSize * (1 + force * 0.85);

  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, p.x - renderSize / 2, p.y - renderSize / 2, renderSize, renderSize);

  if (p.kind !== "dust") {
    ctx.globalAlpha = Math.min(1, alpha * 0.9);
    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.55, p.size * 0.45), 0, TAU);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawConstellationLines() {
  if (!ctx || coarsePointer) return;

  const nodes = particles.filter((p) => p.kind !== "dust");
  const maxDist = 136;
  let drawn = 0;
  const maxLines = 92;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      if (drawn >= maxLines) {
        ctx.restore();
        return;
      }

      const a = nodes[i];
      const b = nodes[j];

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxDist) continue;

      const alpha = (1 - dist / maxDist) * 0.075;

      const line = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      line.addColorStop(0, `rgba(96, 165, 250, ${alpha})`);
      line.addColorStop(0.5, `rgba(168, 85, 247, ${alpha * 0.82})`);
      line.addColorStop(1, `rgba(34, 211, 238, ${alpha})`);

      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      drawn += 1;
    }
  }

  ctx.restore();
}

function render(time = 0) {
  if (!ctx) {
    raf = window.requestAnimationFrame(render);
    return;
  }

  // 页面隐藏、非首页、减少动画偏好或移动端直接跳过渲染循环
  if (pageHidden || !isHome.value || reduceMotion || isMobile) {
    if (!isMobile) {
      ctx.clearRect(0, 0, width, height);
    }
    raf = window.requestAnimationFrame(render);
    return;
  }

  mouseX += (targetMouseX - mouseX) * 0.075;
  mouseY += (targetMouseY - mouseY) * 0.075;
  mouseActive += (targetMouseActive - mouseActive) * 0.07;

  ctx.clearRect(0, 0, width, height);

  drawBackdrop(time);
  drawMouseAura();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const p of particles) {
    drawParticle(p, time);
  }

  ctx.restore();

  drawConstellationLines();
  drawLightStreams(time);

  raf = window.requestAnimationFrame(render);
}

function setup() {
  reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  pageHidden = document.hidden;
  prefersReducedMotion = reduceMotion;
  isMobile = window.innerWidth < 768;

  // 监听窗口大小变化，进入移动端范围时暂停渲染
  const mqListener = (e: MediaQueryListEvent) => {
    isMobile = e.matches;
  };
  const mq = window.matchMedia("(max-width: 767px)");
  mq.addEventListener("change", mqListener);
  isMobile = mq.matches;

  targetMouseX = window.innerWidth * 0.72;
  targetMouseY = 180;
  mouseX = targetMouseX;
  mouseY = targetMouseY;

  resize();

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  raf = window.requestAnimationFrame(render);
}

onMounted(() => {
  nextTick(setup);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerleave", handlePointerLeave);
  document.removeEventListener("visibilitychange", handleVisibilityChange);

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
  opacity: 0.9;
  mix-blend-mode: normal;
  contain: strict;
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
    opacity: 0.42;
  }
}

@media (max-width: 640px) {
  .cysj-home-particles {
    opacity: 0.22;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cysj-home-particles {
    display: none;
  }
}
</style>
