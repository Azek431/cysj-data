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

function updateCrystalVars() {
  currentX += (targetX - currentX) * 0.08;
  currentY += (targetY - currentY) * 0.08;

  document.documentElement.style.setProperty("--cysj-crystal-x", currentX.toFixed(4));
  document.documentElement.style.setProperty("--cysj-crystal-y", currentY.toFixed(4));

  raf = window.requestAnimationFrame(updateCrystalVars);
}

function handlePointerMove(event: PointerEvent) {
  const width = window.innerWidth || 1;
  const height = window.innerHeight || 1;

  targetX = (event.clientX / width - 0.5) * 2;
  targetY = (event.clientY / height - 0.5) * 2;
}

function handlePointerLeave() {
  targetX = 0;
  targetY = 0;
}

onMounted(() => {
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave);
  raf = window.requestAnimationFrame(updateCrystalVars);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerleave", handlePointerLeave);
  window.cancelAnimationFrame(raf);
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
