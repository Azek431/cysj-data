<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useData } from "vitepress";

const { frontmatter } = useData();
const isDoc = ref(false);
const progress = ref(0);

let raf = 0;
let pending = false;

function compute() {
  pending = false;
  if (!isDoc.value) return;

  const article = document.querySelector(".vp-doc");
  if (!article) {
    progress.value = 0;
    return;
  }

  const doc = document.documentElement;
  const rect = article.getBoundingClientRect();
  const total = rect.height + window.innerHeight * 0.4;
  const scrolled = window.scrollY + window.innerHeight * 0.6 - rect.top;

  if (total <= 0) {
    progress.value = 0;
    return;
  }

  const ratio = scrolled / total;
  const next = Math.max(0, Math.min(1, ratio));

  if (Math.abs(next - progress.value) > 0.005) {
    progress.value = next;
  }
}

function onScroll() {
  if (pending) return;
  pending = true;
  raf = window.requestAnimationFrame(compute);
}

function updateDocFlag() {
  isDoc.value = frontmatter.value?.layout !== "home";
  progress.value = 0;
  onScroll();
}

onMounted(() => {
  updateDocFlag();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
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
