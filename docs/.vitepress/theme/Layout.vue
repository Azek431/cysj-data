<script setup lang="ts">
import DefaultTheme from "vitepress/theme";

import PageInfo from "./components/PageInfo.vue";
import PageActions from "./components/PageActions.vue";
import SiteTools from "./components/SiteTools.vue";
import HomeCrystal from "./components/HomeCrystal.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <!-- 首页 Hero 右侧水晶视觉组件 -->
    <template #home-hero-image>
      <div class="cysj-home-crystal-wrap">
        <HomeCrystal />
      </div>
    </template>

    <!-- 文档正文顶部信息 -->
    <template #doc-before>
      <PageInfo />
    </template>

    <!-- 右侧工具区 -->
    <template #aside-top>
      <SiteTools />
    </template>

    <!-- 文档底部操作区 -->
    <template #doc-after>
      <PageActions />
    </template>
  </Layout>
</template>

<style scoped>
.cysj-home-crystal-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 360px;
  pointer-events: auto;
}

@media (max-width: 960px) {
  .cysj-home-crystal-wrap {
    min-height: 300px;
    margin-top: 8px;
  }
}

@media (max-width: 640px) {
  .cysj-home-crystal-wrap {
    min-height: 260px;
  }
}
</style>
