<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useData } from 'vitepress'

const { page, site } = useData()
const wordCount = ref(0)
const readingTime = ref(0)

const author = computed(() => page.value.frontmatter.author || site.value.author || 'Azek431')
const created = computed(() => page.value.frontmatter.date || page.value.frontmatter.created || '')
const updated = computed(() => page.value.frontmatter.updated || page.value.lastUpdated || '')
const summary = computed(() => page.value.frontmatter.description || page.value.description || '')

onMounted(() => {
  const content = document.querySelector('.markdown')
  if (content) {
    const text = content.textContent?.replace(/\s+/g, ' ').trim() || ''
    const count = text ? text.split(' ').filter(Boolean).length : 0
    wordCount.value = count
    readingTime.value = Math.max(1, Math.ceil(count / 240))
  }
})
</script>

<template>
  <div v-if="page.value.frontmatter.layout !== 'home'" class="page-info-card">
    <div class="page-info-grid">
      <div class="page-info-label">页面标题</div>
      <div class="page-info-value">{{ page.value.title || '未命名页面' }}</div>
      <div class="page-info-label">作者</div>
      <div class="page-info-value">{{ author }}</div>
      <div class="page-info-label">写作日期</div>
      <div class="page-info-value">{{ created || '待补充' }}</div>
      <div class="page-info-label">更新日期</div>
      <div class="page-info-value">{{ updated || '无更新记录' }}</div>
      <div class="page-info-label">字数估算</div>
      <div class="page-info-value">{{ wordCount }} 字</div>
      <div class="page-info-label">阅读时长</div>
      <div class="page-info-value">约 {{ readingTime }} 分钟</div>
      <div class="page-info-label">摘要</div>
      <div class="page-info-value page-info-summary">{{ summary || '本文为创游世界资料库内容整理与实战经验总结，建议结合目录与模块入口快速导航。' }}</div>
    </div>
  </div>
</template>
