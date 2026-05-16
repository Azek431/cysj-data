<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import DefaultTheme from "vitepress/theme";

import PageInfo from "./components/PageInfo.vue";
import PageActions from "./components/PageActions.vue";
import SiteTools from "./components/SiteTools.vue";

const { Layout } = DefaultTheme;

let raf = 0;
let currentX = 0;
let currentY = 0;
let targetX = 0;
let targetY = 0;
let currentActive = 0;
let targetActive = 0;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function tickCrystal() {
  currentX += (targetX - currentX) * 0.12;
  currentY += (targetY - currentY) * 0.12;
  currentActive += (targetActive - currentActive) * 0.12;

  const style = document.documentElement.style;

  // 控制得更克制：只轻微移动，不改变原球大小
  style.setProperty("--cysj-crystal-move-x", `${(currentX * 14).toFixed(2)}px`);
  style.setProperty("--cysj-crystal-move-y", `${(currentY * 10).toFixed(2)}px`);
  style.setProperty("--cysj-crystal-aura-x", `${(currentX * 20).toFixed(2)}px`);
  style.setProperty("--cysj-crystal-aura-y", `${(currentY * 14).toFixed(2)}px`);
  style.setProperty("--cysj-crystal-shine-x", `${(35 + currentX * 8).toFixed(2)}%`);
  style.setProperty("--cysj-crystal-shine-y", `${(35 + currentY * 6).toFixed(2)}%`);
  style.setProperty("--cysj-crystal-rotate-x", `${(currentY * -2.2).toFixed(2)}deg`);
  style.setProperty("--cysj-crystal-rotate-y", `${(currentX * 2.8).toFixed(2)}deg`);
  style.setProperty("--cysj-crystal-glow", `${(0.9 + currentActive * 0.08).toFixed(3)}`);

  raf = window.requestAnimationFrame(tickCrystal);
}

function handlePointerMove(event: PointerEvent) {
  const width = window.innerWidth || 1;
  const height = window.innerHeight || 1;

  targetX = clamp((event.clientX / width - 0.5) * 2, -1, 1);
  targetY = clamp((event.clientY / height - 0.5) * 2, -1, 1);
  targetActive = 1;
}

function handlePointerLeave() {
  targetX = 0;
  targetY = 0;
  targetActive = 0;
}

onMounted(() => {
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (isTouch) return;

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave);

  raf = window.requestAnimationFrame(tickCrystal);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerleave", handlePointerLeave);

  if (raf) {
    window.cancelAnimationFrame(raf);
  }
});
</script>

<template>
  <Layout>
    <template #doc-before>
      <PageInfo />
    </template>

    <template #aside-top>
      <SiteTools />
    </template>

    <template #doc-after>
      <PageActions />
    </template>
  </Layout>
</template>
