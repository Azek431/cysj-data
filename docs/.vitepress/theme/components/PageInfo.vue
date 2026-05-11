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

  try {
    const date = new Date(value as string);

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }

    return String(value);
  } catch {
    return String(value);
  }
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

  if (!content) {
    wordCount.value = 0;
    readingTime.value = 0;
    return;
  }

  const cloned = content.cloneNode(true) as HTMLElement;

  cloned
    .querySelectorAll(
      [
        "script",
        "style",
        "svg",
        ".cysj-meta-line",
        ".cysj-actions",
        ".VPDocFooter",
        ".prev-next",
      ].join(","),
    )
    .forEach((el) => el.remove());

  const text = cloned.textContent || "";
  const count = countReadableText(text);

  wordCount.value = count;
  readingTime.value = count > 0 ? Math.max(1, Math.ceil(count / 450)) : 0;
}

async function refreshPageStats() {
  if (typeof window === "undefined") return;

  wordCount.value = 0;
  readingTime.value = 0;

  await nextTick();

  if (timer) window.clearTimeout(timer);

  timer = window.setTimeout(() => {
    calculatePageStats();
  }, 120);
}

onMounted(() => {
  refreshPageStats();
});

watch(
  () => route.path,
  () => {
    refreshPageStats();
  },
);

watch(
  () => page.value?.relativePath,
  () => {
    refreshPageStats();
  },
);

onBeforeUnmount(() => {
  if (timer) window.clearTimeout(timer);
});
</script>

<template>
  <div v-if="page.value?.frontmatter?.layout !== 'home'" class="cysj-meta-line">
    <span class="cysj-meta-item">
      <span class="cysj-meta-label">写作日期</span>
      <span class="cysj-meta-value">{{ formattedCreated || "待补充" }}</span>
    </span>

    <span class="cysj-meta-dot">·</span>

    <span class="cysj-meta-item">
      <span class="cysj-meta-label">字数</span>
      <span class="cysj-meta-value">
        <template v-if="wordCount > 0">约 {{ wordCount }} 字</template>
        <template v-else>—</template>
      </span>
    </span>

    <span class="cysj-meta-dot">·</span>

    <span class="cysj-meta-item">
      <span class="cysj-meta-label">阅读时长</span>
      <span class="cysj-meta-value">
        <template v-if="readingTime > 0">约 {{ readingTime }} 分钟</template>
        <template v-else>—</template>
      </span>
    </span>

    <span class="cysj-meta-dot">·</span>

    <span class="cysj-meta-item">
      <span class="cysj-meta-label">维护者</span>
      <span class="cysj-meta-value">{{ author }}</span>
    </span>

    <span class="cysj-meta-dot">·</span>

    <span class="cysj-meta-item">
      <span class="cysj-meta-label">最后更新</span>
      <span class="cysj-meta-value">{{ formattedUpdated || "待补充" }}</span>
    </span>
  </div>
</template>
