<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import PageInfo from './components/PageInfo.vue'
import PageActions from './components/PageActions.vue'
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-top>
      <PageInfo />
    </template>
    <template #doc-bottom>
      <PageActions />
    </template>
  </DefaultTheme.Layout>
</template>
