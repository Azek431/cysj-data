<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import PageInfo from "./components/PageInfo.vue";
import PageActions from "./components/PageActions.vue";
import SiteTools from "./components/SiteTools.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #doc-top>
      <PageInfo />
    </template>

    <template #aside-outline-before>
      <SiteTools />
    </template>

    <template #doc-bottom>
      <PageActions />
    </template>
  </Layout>
</template>
