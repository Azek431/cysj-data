<script setup lang="ts">
import { computed, ref } from "vue";
import { useData, useRoute } from "vitepress";

const { page, site } = useData();
const route = useRoute();
const copied = ref(false);
const copyError = ref(false);

const repo = computed(
  () => site.value?.themeConfig?.repo || "Azek431/cysj-data",
);
const currentPath = computed(() => page.value?.relativePath || "");
const isHome = computed(() => page.value?.frontmatter?.layout === "home");

const editUrl = computed(
  () => `https://github.com/${repo.value}/edit/main/docs/${currentPath.value}`,
);

const issueUrl = computed(() => {
  const title = encodeURIComponent(
    `[文档反馈] ${page.value?.title || route.path}`,
  );
  const body = encodeURIComponent(`页面：${route.path}

问题描述：
请描述你发现的错别字、失效链接、内容过期或补充建议。
`);
  return `https://github.com/${repo.value}/issues/new?title=${title}&body=${body}&labels=feedback`;
});

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copied.value = true;
    copyError.value = false;
    window.setTimeout(() => {
      copied.value = false;
    }, 1800);
  } catch {
    copied.value = false;
    copyError.value = true;
    window.setTimeout(() => {
      copyError.value = false;
    }, 2400);
  }
}
</script>

<template>
  <section v-if="!isHome" class="cysj-actions">
    <div>
      <p class="cysj-actions__eyebrow">参与维护</p>
      <h2 class="cysj-actions__title">发现文档问题？</h2>
      <p class="cysj-actions__desc">
        你可以编辑页面、提交反馈，或复制链接给维护者，帮助这个资料库继续变好。
      </p>
    </div>

    <div class="cysj-actions__buttons">
      <a
        :href="editUrl"
        target="_blank"
        rel="noreferrer"
        class="cysj-action-btn is-primary"
        >编辑此页</a
      >
      <a
        :href="issueUrl"
        target="_blank"
        rel="noreferrer"
        class="cysj-action-btn"
        >反馈建议</a
      >
      <button
        type="button"
        class="cysj-action-btn"
        :class="{ 'is-success': copied }"
        :aria-label="copied ? '链接已复制' : '复制当前页面链接'"
        @click="copyLink"
      >
        <span aria-live="polite" role="status">
          {{ copyError ? "复制失败" : copied ? "已复制" : "复制链接" }}
        </span>
      </button>
    </div>
  </section>
</template>
