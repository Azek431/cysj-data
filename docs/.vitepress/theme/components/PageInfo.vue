<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useData, useRoute } from "vitepress";

const { page, site } = useData();
const route = useRoute();

const wordCount = ref(0);
const readingTime = ref(0);
let timer: ReturnType<typeof setTimeout> | undefined;

const author = computed(() => {
  return (
    page.value?.frontmatter?.author ||
    page.value?.frontmatter?.editor ||
    site.value?.themeConfig?.author ||
    "Azek431"
  );
});

const rawCreated = computed(() => {
  return (
    page.value?.frontmatter?.date || page.value?.frontmatter?.created || ""
  );
});

const rawUpdated = computed(() => {
  return page.value?.frontmatter?.updated || page.value?.lastUpdated || "";
});

function formatDate(value: unknown) {
  if (!value) return "";
  const date = new Date(value as string);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return String(value);
}

const formattedCreated = computed(() => formatDate(rawCreated.value));
const formattedUpdated = computed(() => formatDate(rawUpdated.value));

function countReadableText(text: string) {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return 0;

  const cjkCount = (
    cleaned.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || []
  ).length;

  const englishWordCount = (
    cleaned
      .replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g, " ")
      .match(/[A-Za-z0-9]+(?:[-_./][A-Za-z0-9]+)*/g) || []
  ).length;

  return cjkCount + englishWordCount;
}

function calculatePageStats() {
  if (typeof document === "undefined") return;

  const content = document.querySelector(".vp-doc") as HTMLElement | null;
  if (!content) return;

  const cloned = content.cloneNode(true) as HTMLElement;

  cloned
    .querySelectorAll(
      [
        "script",
        "style",
        "svg",
        ".cysj-meta-line",
        ".cysj-actions",
        ".cysj-tools",
        ".VPDocFooter",
        ".prev-next",
      ].join(","),
    )
    .forEach((el) => el.remove());

  const count = countReadableText(cloned.textContent || "");
  wordCount.value = count;
  readingTime.value = count > 0 ? Math.max(1, Math.ceil(count / 450)) : 0;
}

async function refreshPageStats() {
  if (typeof window === "undefined") return;

  wordCount.value = 0;
  readingTime.value = 0;

  await nextTick();

  if (timer) window.clearTimeout(timer);
  timer = window.setTimeout(calculatePageStats, 120);
}

onMounted(refreshPageStats);

watch(
  () => route.path,
  () => refreshPageStats(),
);

watch(
  () => page.value?.relativePath,
  () => refreshPageStats(),
);

onBeforeUnmount(() => {
  if (timer) window.clearTimeout(timer);
});
</script>

<template>
  <div v-if="page.value?.frontmatter?.layout !== 'home'" class="cysj-meta-line">
    <span>写作日期：{{ formattedCreated || "待补充" }}</span>
    <span>字数：{{ wordCount > 0 ? `约 ${wordCount} 字` : "—" }}</span>
    <span>阅读：{{ readingTime > 0 ? `约 ${readingTime} 分钟` : "—" }}</span>
    <span>维护者：{{ author }}</span>
    <span>更新：{{ formattedUpdated || "待补充" }}</span>
  </div>
</template>
