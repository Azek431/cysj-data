<script setup lang="ts">
import { computed, ref } from "vue";
import { useData, useRoute } from "vitepress";

const { page, site } = useData();
const route = useRoute();
const copied = ref(false);

const showActions = computed(() => {
  return page.value?.frontmatter?.layout !== "home";
});

const repo = computed(() => {
  return String(site.value?.themeConfig?.repo || "Azek431/cysj-data");
});

const currentPath = computed(() => page.value?.relativePath || "");

const editUrl = computed(() => {
  return `https://github.com/${repo.value}/edit/main/docs/${currentPath.value}`;
});

const issueUrl = computed(() => {
  const pageTitle =
    page.value?.frontmatter?.title || page.value?.title || route.path;

  const title = encodeURIComponent(`[文档反馈] ${pageTitle}`);
  const body = encodeURIComponent(`页面：${route.path}

问题描述：
请描述你发现的错别字、失效链接、内容过期或补充建议。
`);

  return `https://github.com/${repo.value}/issues/new?title=${title}&body=${body}&labels=feedback`;
});

const repoUrl = computed(() => {
  return `https://github.com/${repo.value}`;
});

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copied.value = true;

    window.setTimeout(() => {
      copied.value = false;
    }, 1800);
  } catch {
    copied.value = false;
  }
};
</script>

<template>
  <section v-if="showActions" class="cysj-doc-actions-line">
    <div class="cysj-doc-actions-text">
      <strong>参与维护</strong>
      <span>发现错别字、失效链接或内容过期？欢迎一起完善。</span>
    </div>

    <div class="cysj-doc-actions-buttons">
      <a :href="editUrl" target="_blank" rel="noreferrer">编辑此页</a>
      <a :href="issueUrl" target="_blank" rel="noreferrer">反馈建议</a>
      <button type="button" @click="copyLink">
        {{ copied ? "已复制" : "复制链接" }}
      </button>
      <a :href="repoUrl" target="_blank" rel="noreferrer">GitHub</a>
    </div>
  </section>
</template>
