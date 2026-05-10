<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData, useRoute } from 'vitepress'

const { page, site } = useData()
const route = useRoute()
const copied = ref(false)

const repo = computed(() => site.value.repo || 'Azek431/cysj-data')
const currentPath = computed(() => page.value?.relativePath || '')
const editUrl = computed(() => `https://github.com/${repo.value}/edit/main/docs/${currentPath.value}`)
const issueUrl = computed(() => {
  const title = encodeURIComponent(`[文档反馈] ${page.value?.title || route.path}`)
  const body = encodeURIComponent(`页面：${route.path}\n\n请描述你的反馈或建议：\n`)
  return `https://github.com/${repo.value}/issues/new?title=${title}&body=${body}&labels=feedback`
})

const copyLink = async () => {
  try {
    if (navigator.clipboard && window.location.href) {
      await navigator.clipboard.writeText(window.location.href)
      copied.value = true
      window.setTimeout(() => { copied.value = false }, 2200)
    }
  } catch (err) {
    copied.value = false
  }
}
</script>

<template>
  <div class="page-actions-footer">
    <div class="page-actions-links">
      <a :href="editUrl" target="_blank" rel="noreferrer" class="action-link">
        <span class="link-icon">✏️</span>
        编辑此页
      </a>
      <a :href="issueUrl" target="_blank" rel="noreferrer" class="action-link">
        <span class="link-icon">💬</span>
        反馈建议
      </a>
      <button type="button" @click="copyLink" class="action-link copy-btn">
        <span class="link-icon">{{ copied ? '✅' : '🔗' }}</span>
        {{ copied ? '已复制' : '复制链接' }}
      </button>
    </div>
    <div class="page-actions-note">
      发现问题或有补充？欢迎通过 GitHub 提交反馈。
      <a :href="`https://github.com/${repo}`" target="_blank" rel="noreferrer">查看仓库</a>
    </div>
  </div>
</template>
