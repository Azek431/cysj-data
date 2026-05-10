<script setup lang="ts">
const links = [
  {
    text: "GitHub 仓库",
    desc: "查看源码、提交反馈与历史版本",
    href: "https://github.com/Azek431/cysj-data",
  },
  {
    text: "新手阅读路线",
    desc: "第一次阅读建议从这里开始",
    href: "/总索引与导航/新手阅读路线",
  },
  {
    text: "更新日志",
    desc: "查看资料库维护与版本变化",
    href: "/维护与报告/更新日志入口导航",
  },
];
</script>

<template>
  <aside class="cysj-tools">
    <div class="cysj-tools__label">站点工具</div>

    <a
      v-for="link in links"
      :key="link.href"
      class="cysj-tools__item"
      :href="link.href"
      :target="link.href.startsWith('http') ? '_blank' : undefined"
      :rel="link.href.startsWith('http') ? 'noreferrer' : undefined"
    >
      <strong>{{ link.text }}</strong>
      <span>{{ link.desc }}</span>
    </a>
  </aside>
</template>
