<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useData } from 'vitepress'

const { page, site } = useData()
const wordCount = ref(0)
const readingTime = ref(0)

const author = computed(() => page.value?.frontmatter?.author || site.value?.author || 'Azek431')

// safe created/updated formatting, prefer frontmatter then page meta
const rawCreated = computed(() => page.value?.frontmatter?.date || page.value?.frontmatter?.created || page.value?.created || '')
const formattedCreated = computed(() => {
  const d = rawCreated.value
  if (!d) return ''
  try {
    const dt = new Date(d)
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
    return d
  } catch (e) {
    return d
  }
})

const rawUpdated = computed(() => page.value?.frontmatter?.updated || page.value?.lastUpdated || '')
const formattedUpdated = computed(() => {
  const d = rawUpdated.value
  if (!d) return ''
  try {
    const dt = new Date(d)
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
    return d
  } catch (e) {
    return d
  }
})

// compute client-side word count when mounted; leave 0 during SSR (we render placeholders)
onMounted(() => {
  const content = document.querySelector('.markdown') || document.querySelector('.vp-doc') || document.querySelector('.content')
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
      <span class="meta-value">{{ formattedCreated || '待补充' }}</span>
    </div>
    <div class="page-meta-item">
      <span class="meta-icon">🔠</span>
      <span class="meta-label">字数</span>
      <span class="meta-value">
        <span v-if="wordCount > 0">约 {{ wordCount }} 字</span>
        <span v-else>—</span>
      </span>
    </div>
    <div class="page-meta-item">
      <span class="meta-icon">⌛</span>
      <span class="meta-label">阅读时长</span>
      <span class="meta-value">
        <span v-if="readingTime > 0">约 {{ readingTime }} 分钟</span>
        <span v-else>—</span>
      </span>
    </div>
    <div class="page-meta-item">
      <span class="meta-icon">🖊</span>
      <span class="meta-label">作者</span>
      <span class="meta-value">{{ author }}</span>
    </div>
  </div>
</template>
