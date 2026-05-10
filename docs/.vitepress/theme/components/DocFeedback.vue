<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page, frontmatter } = useData()

const showFeedback = computed(() => {
  return frontmatter.value.layout !== 'home' && frontmatter.value.feedback !== false
})

const issueUrl = computed(() => {
  const title = encodeURIComponent(`文档反馈：${page.value.title || page.value.relativePath}`)
  const body = encodeURIComponent(
`页面：${page.value.relativePath}

问题描述：
请在这里描述你发现的问题、错别字、失效链接、内容过期或补充建议。`
  )

  return `https://github.com/Azek431/cysj-data/issues/new?title=${title}&body=${body}`
})
</script>

<template>
  <div v-if="showFeedback" class="doc-feedback">
    <div>
      <strong>发现文档问题？</strong>
      <p>如果你发现错别字、失效链接、内容过期或资料缺失，可以提交反馈。</p>
    </div>

    <a :href="issueUrl" target="_blank" rel="noreferrer">
      提交 Issue
    </a>
  </div>
</template>
