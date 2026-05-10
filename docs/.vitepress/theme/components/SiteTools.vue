<script setup lang="ts">
import { computed, ref } from "vue";
import { useData, useRoute } from "vitepress";

const { page } = useData();
const route = useRoute();
const copied = ref(false);

const issueUrl = computed(() => {
  const title = encodeURIComponent(
    `[文档反馈] ${page.value.title || route.path}`,
  );
  const body = encodeURIComponent(`页面：${route.path}

问题描述：
请描述你发现的问题、错别字、失效链接、内容过期或补充建议。
`);

  return `https://github.com/Azek431/cysj-data/issues/new?title=${title}&body=${body}&labels=feedback`;
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

const links = [
  {
    icon: "🏠",
    text: "GitHub 仓库",
    desc: "查看源码、历史提交和项目结构",
    href: "https://github.com/Azek431/cysj-data",
  },
  {
    icon: "🧭",
    text: "新手阅读路线",
    desc: "第一次阅读建议从这里开始",
    href: "/总索引与导航/新手阅读路线",
  },
  {
    icon: "🧩",
    text: "知识库总导航",
    desc: "按主题快速进入资料区域",
    href: "/总索引与导航/创游世界知识库总导航",
  },
  {
    icon: "📝",
    text: "更新日志",
    desc: "查看资料库维护与版本变化",
    href: "/维护与报告/更新日志入口导航",
  },
];
</script>

<template>
  <aside class="cysj-tools cysj-tools--v4">
    <div class="cysj-tools__header">
      <span class="cysj-tools__badge">站点工具</span>
      <p>快速访问常用入口，帮助你阅读、反馈和参与维护。</p>
    </div>

    <div class="cysj-tools__list">
      <a
        v-for="link in links"
        :key="link.href"
        class="cysj-tools__item"
        :href="link.href"
        :target="link.href.startsWith('http') ? '_blank' : undefined"
        :rel="link.href.startsWith('http') ? 'noreferrer' : undefined"
      >
        <span class="cysj-tools__icon">{{ link.icon }}</span>
        <span class="cysj-tools__body">
          <strong>{{ link.text }}</strong>
          <span>{{ link.desc }}</span>
        </span>
      </a>
    </div>

    <div class="cysj-tools__actions">
      <a :href="issueUrl" target="_blank" rel="noreferrer">反馈问题</a>
      <button type="button" @click="copyLink">
        {{ copied ? "已复制" : "复制链接" }}
      </button>
    </div>
  </aside>
</template>
