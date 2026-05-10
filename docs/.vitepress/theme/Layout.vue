<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import DocMeta from './components/DocMeta.vue'
import DocFeedback from './components/DocFeedback.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #doc-before>
      <DocMeta />
    </template>

    <template #doc-after>
      <DocFeedback />
    </template>
  </Layout>
</template>
