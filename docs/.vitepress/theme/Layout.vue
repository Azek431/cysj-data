<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import PageInfo from "./components/PageInfo.vue";
import PageActions from "./components/PageActions.vue";
import SiteTools from "./components/SiteTools.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #doc-before>
      <PageInfo />
    </template>

    <template #doc-after>
      <PageActions />
    </template>

    <template #aside-top>
      <SiteTools />
    </template>
  </Layout>
</template>
