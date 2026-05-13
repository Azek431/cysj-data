<script setup lang="ts">
const links = [
  {
    text: "GitHub",
    href: "https://github.com/Azek431/cysj-data",
  },
  {
    text: "新手路线",
    href: "/总索引与导航/新手阅读路线",
  },
  {
    text: "总目录",
    href: "/总索引与导航/自动生成文档目录",
  },
  {
    text: "OCR",
    href: "/OCR资料/OCR资料导航",
  },
];
</script>

<template>
  <aside class="cysj-tools">
    <div class="cysj-tools__title">站点工具</div>
    <div class="cysj-tools__links">
      <a
        v-for="link in links"
        :key="link.href"
        :href="link.href"
        :target="link.href.startsWith('http') ? '_blank' : undefined"
        :rel="link.href.startsWith('http') ? 'noreferrer' : undefined"
      >
        {{ link.text }}
      </a>
    </div>
  </aside>
</template>
