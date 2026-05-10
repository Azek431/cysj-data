<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData, useRoute } from 'vitepress'

const { page, site } = useData()
const route = useRoute()
const copied = ref(false)

const repo = computed(() => site.value.repo || 'Azek431/cysj-data')
const currentPath = computed(() => page.value?.relativePath || '')
const currentUrl = computed(() => typeof window !== 'undefined' ? window.location.href : '')
const editUrl = computed(() => `https://github.com/${repo.value}/edit/main/docs/${currentPath.value}`)
const issueUrl = computed(() => {
  const title = encodeURIComponent(`[文档反馈] ${page.value?.title || route.path}`)
  const body = encodeURIComponent(`页面：${route.path}\n\n请描述你的反馈或建议：\n`)
  return `https://github.com/${repo.value}/issues/new?title=${title}&body=${body}&labels=feedback`
})
const discussUrl = computed(() => {
  const title = encodeURIComponent(`[文档问题] ${page.value?.title || route.path}`)
  const body = encodeURIComponent(`页面：${route.path}\n\n问题描述：\n`)
  return `https://github.com/${repo.value}/issues/new?title=${title}&body=${body}&labels=documentation`
})

const copyLink = async () => {
  try {
    if (navigator.clipboard && currentUrl.value) {
      await navigator.clipboard.writeText(currentUrl.value)
      copied.value = true
      window.setTimeout(() => { copied.value = false }, 2200)
    }
  } catch (err) {
    copied.value = false
  }
}
</script>

<template>
  <div class="page-actions-panel">
    <div class="page-actions-row">
      <a class="action-button action-button-primary" :href="editUrl" target="_blank" rel="noreferrer">在 GitHub 上编辑</a>
      <a class="action-button action-button-outline" :href="issueUrl" target="_blank" rel="noreferrer">报告文档反馈</a>
      <a class="action-button action-button-outline" :href="discussUrl" target="_blank" rel="noreferrer">提交问题或补充</a>
      <button class="action-button action-button-alt" type="button" @click="copyLink">{{ copied ? '已复制链接' : '复制当前链接' }}</button>
    </div>
    <div class="page-actions-note">
      你也可通过 GitHub issue 直接提供内容补充、OCR 来源、脚本示例或使用场景。欢迎贡献。 
      <a :href="`https://github.com/${repo.value}`" target="_blank" rel="noreferrer">仓库主页</a>
    </div>
  </div>
</template>
