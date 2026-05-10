<script setup lang="ts">
import { computed, ref } from "vue";
import { useData, useRoute } from "vitepress";

const { page, site } = useData();
const route = useRoute();
const copied = ref(false);

const showActions = computed(() => {
  return page.value.frontmatter?.layout !== "home";
});

const repo = computed(() => {
  const themeConfig = site.value?.themeConfig || {};
  return themeConfig.repo || "Azek431/cysj-data";
});

const currentPath = computed(() => page.value?.relativePath || "");

const editUrl = computed(() => {
  return `https://github.com/${repo.value}/edit/main/docs/${currentPath.value}`;
});

const issueUrl = computed(() => {
  const pageTitle =
    page.value?.frontmatter?.title || page.value?.title || route.path;
  const title = encodeURIComponent(`[文档反馈] ${pageTitle}`);
  const body = encodeURIComponent(
    `页面：${route.path}

问题描述：
请描述你发现的错别字、失效链接、内容过期或补充建议。
`,
  );

  return `https://github.com/${repo.value}/issues/new?title=${title}&body=${body}&labels=feedback`;
});

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    copied.value = false;
  }
};
</script>

<template>
  <section v-if="showActions" class="cysj-actions">
    <div class="cysj-actions__content">
      <p class="cysj-actions__eyebrow">参与维护</p>
      <h2 class="cysj-actions__title">发现文档问题？</h2>
      <p class="cysj-actions__desc">
        如果你发现错别字、失效链接、内容过期或资料缺失，可以直接编辑页面、提交反馈，或复制链接分享给维护者。
      </p>
    </div>

    <div class="cysj-actions__buttons">
      <a
        :href="editUrl"
        target="_blank"
        rel="noreferrer"
        class="cysj-action-btn is-primary"
      >
        编辑此页
      </a>

      <a
        :href="issueUrl"
        target="_blank"
        rel="noreferrer"
        class="cysj-action-btn"
      >
        反馈建议
      </a>

      <button type="button" class="cysj-action-btn" @click="copyLink">
        {{ copied ? "已复制" : "复制链接" }}
      </button>
    </div>
  </section>
</template>
