<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useData } from 'vitepress'

const { page, site } = useData()
const wordCount = ref(0)
const readingTime = ref(0)

const author = computed(() => page.value?.frontmatter?.author || site.value.author || 'Azek431')
const created = computed(() => page.value?.frontmatter?.date || page.value?.frontmatter?.created || '')
const updated = computed(() => page.value?.frontmatter?.updated || page.value?.lastUpdated || '')

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
  <div v-if="page.value?.frontmatter?.layout !== 'home'" class="page-meta-bar">
    <div class="page-meta-item">
      <span class="meta-icon">📅</span>
      <span class="meta-label">写作日期</span>
      <span class="meta-value">{{ created || '待补充' }}</span>
    </div>
    <div class="page-meta-item">
      <span class="meta-icon">🔠</span>
      <span class="meta-label">字数</span>
      <span class="meta-value">约 {{ wordCount }} 字</span>
    </div>
    <div class="page-meta-item">
      <span class="meta-icon">⌛</span>
      <span class="meta-label">阅读时长</span>
      <span class="meta-value">约 {{ readingTime }} 分钟</span>
    </div>
    <div class="page-meta-item">
      <span class="meta-icon">🖊</span>
      <span class="meta-label">作者</span>
      <span class="meta-value">{{ author }}</span>
    </div>
  </div>
</template>
