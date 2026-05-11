<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import PageInfo from "./components/PageInfo.vue";
import PageActions from "./components/PageActions.vue";
import PerPageHead from "./components/PerPageHead.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <PerPageHead />
    <template #doc-top>
      <PageInfo />
    </template>

    <template #doc-bottom>
      <PageActions />
    </template>
  </Layout>
</template>
