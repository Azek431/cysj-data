<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useData } from "vitepress";

const { frontmatter } = useData();
const isDoc = ref(false);
const progress = ref(0);

let raf = 0;
let ticking = false;
let lastScrollY = -1;
let lastComputedProgress = -1;

function compute() {
  ticking = false;
  if (!isDoc.value) {
    progress.value = 0;
    lastScrollY = -1;
    lastComputedProgress = -1;
    return;
  }

  const article = document.querySelector(".vp-doc");
  if (!article) {
    progress.value = 0;
    return;
  }

  const rect = article.getBoundingClientRect();
  if (rect.height <= 0) {
    progress.value = 0;
    return;
  }

  const docHeight = rect.height - window.innerHeight;
  if (docHeight <= 0) {
    progress.value = 0;
    return;
  }

  const scrolled = window.scrollY;
  const ratio = Math.max(0, Math.min(scrolled / docHeight, 1));

  // 仅在变化超过阈值时更新 DOM（减少重排）
  if (Math.abs(ratio - lastComputedProgress) > 0.008) {
    progress.value = ratio;
    lastComputedProgress = ratio;
  }
}

function onScroll() {
  lastScrollY = window.scrollY;
  if (!ticking) {
    ticking = true;
    raf = window.requestAnimationFrame(compute);
  }
}

function onResize() {
  if (!ticking) {
    ticking = true;
    raf = window.requestAnimationFrame(compute);
  }
}

function updateDocFlag() {
  isDoc.value = frontmatter.value?.layout !== "home";
  if (!isDoc.value) {
    progress.value = 0;
    lastComputedProgress = -1;
    lastScrollY = -1;
  } else {
    onScroll();
  }
}

onMounted(() => {
  updateDocFlag();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onResize);
  if (raf) window.cancelAnimationFrame(raf);
});
</script>

<template>
  <div
    v-show="isDoc"
    class="cysj-reading-progress"
    role="progressbar"
    :aria-valuenow="Math.round(progress * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="文档阅读进度"
  >
    <div
      class="cysj-reading-progress__bar"
      :style="{ transform: `scaleX(${progress})` }"
    />
  </div>
</template>

<style scoped>
.cysj-reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 200;
  background: transparent;
  pointer-events: none;
}

.cysj-reading-progress__bar {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #3b6ef5 0%, #7c3aed 50%, #06b6d4 100%);
  transform-origin: left center;
  transform: scaleX(0);
  transition: transform 80ms linear;
  box-shadow: 0 1px 8px rgba(59, 110, 245, 0.4);
}

@media (prefers-reduced-motion: reduce) {
  .cysj-reading-progress__bar {
    transition: none;
  }
}
</style>
