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
let targetActive = 0;
let currentActive = 0;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function setCrystalVars() {
  // 提高跟随速度：之前太慢，这里从 0.08 提到 0.18
  currentX += (targetX - currentX) * 0.18;
  currentY += (targetY - currentY) * 0.18;
  currentActive += (targetActive - currentActive) * 0.16;

  const moveX = currentX * 30;
  const moveY = currentY * 22;
  const auraX = currentX * 44;
  const auraY = currentY * 34;
  const rotateX = currentY * -7;
  const rotateY = currentX * 9;
  const shineX = 42 + currentX * 12;
  const shineY = 34 + currentY * 10;
  const glow = 0.78 + Math.abs(currentX + currentY) * 0.08 + currentActive * 0.18;
  const scale = 1 + currentActive * 0.035;

  const style = document.documentElement.style;

  style.setProperty("--cysj-crystal-move-x", `${moveX.toFixed(2)}px`);
  style.setProperty("--cysj-crystal-move-y", `${moveY.toFixed(2)}px`);
  style.setProperty("--cysj-crystal-aura-x", `${auraX.toFixed(2)}px`);
  style.setProperty("--cysj-crystal-aura-y", `${auraY.toFixed(2)}px`);
  style.setProperty("--cysj-crystal-rotate-x", `${rotateX.toFixed(2)}deg`);
  style.setProperty("--cysj-crystal-rotate-y", `${rotateY.toFixed(2)}deg`);
  style.setProperty("--cysj-crystal-shine-x", `${shineX.toFixed(2)}%`);
  style.setProperty("--cysj-crystal-shine-y", `${shineY.toFixed(2)}%`);
  style.setProperty("--cysj-crystal-glow", glow.toFixed(3));
  style.setProperty("--cysj-crystal-scale", scale.toFixed(3));

  raf = window.requestAnimationFrame(setCrystalVars);
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

function handlePointerDown() {
  targetActive = 1.8;
}

function handlePointerUp() {
  targetActive = 1;
}

onMounted(() => {
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  // 手机/触屏设备不启用全局鼠标跟随，避免浪费性能
  if (isCoarsePointer) return;

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave);
  window.addEventListener("pointerdown", handlePointerDown, { passive: true });
  window.addEventListener("pointerup", handlePointerUp, { passive: true });

  raf = window.requestAnimationFrame(setCrystalVars);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerleave", handlePointerLeave);
  window.removeEventListener("pointerdown", handlePointerDown);
  window.removeEventListener("pointerup", handlePointerUp);

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
