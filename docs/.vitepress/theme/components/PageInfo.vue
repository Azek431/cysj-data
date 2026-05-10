<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useData } from "vitepress";

const { page, frontmatter } = useData();

const wordCount = ref(0);
const readingTime = ref(0);

const showMeta = computed(() => {
  return (
    frontmatter.value.layout !== "home" && frontmatter.value.meta !== false
  );
});

const author = computed(() => {
  return frontmatter.value.editor || frontmatter.value.author || "Azek431";
});

const authorUrl = computed(() => {
  return (
    frontmatter.value.editorUrl ||
    frontmatter.value.authorUrl ||
    "https://github.com/Azek431"
  );
});

const formatDate = (value: unknown) => {
  if (!value) return "";

  if (typeof value === "number") {
    return new Date(value).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const date = new Date(String(value));
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return String(value);
};

const created = computed(() => {
  return formatDate(
    frontmatter.value.created ||
      frontmatter.value.date ||
      frontmatter.value.updated ||
      page.value.lastUpdated,
  );
});

const updated = computed(() => {
  return formatDate(frontmatter.value.updated || page.value.lastUpdated);
});

onMounted(() => {
  const content = document.querySelector(".vp-doc");
  const text = content?.textContent?.replace(/\s+/g, "").trim() || "";

  if (text) {
    wordCount.value = text.length;
    readingTime.value = Math.max(1, Math.ceil(text.length / 500));
  }
});
</script>

<template>
  <div v-if="showMeta" class="cysj-doc-meta-line">
    <span v-if="created" class="cysj-doc-meta-item">
      <span class="cysj-doc-meta-label">写作日期</span>
      <span>{{ created }}</span>
    </span>

    <span class="cysj-doc-meta-item">
      <span class="cysj-doc-meta-label">字数</span>
      <span v-if="wordCount">约 {{ wordCount }} 字</span>
      <span v-else>计算中</span>
    </span>

    <span class="cysj-doc-meta-item">
      <span class="cysj-doc-meta-label">阅读时间</span>
      <span v-if="readingTime">约 {{ readingTime }} 分钟</span>
      <span v-else>计算中</span>
    </span>

    <span v-if="updated" class="cysj-doc-meta-item">
      <span class="cysj-doc-meta-label">最后更新</span>
      <span>{{ updated }}</span>
    </span>

    <span class="cysj-doc-meta-item">
      <span class="cysj-doc-meta-label">维护者</span>
      <a :href="authorUrl" target="_blank" rel="noreferrer">
        {{ author }}
      </a>
    </span>
  </div>
</template>
