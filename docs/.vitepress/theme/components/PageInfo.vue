<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const { frontmatter, page } = useData()
const route = useRoute()

const wordCount = ref(0)

function formatShortDate(value: unknown) {
  if (!value) return ''

  const date =
    typeof value === 'number'
      ? new Date(value)
      : new Date(String(value))

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function formatFullDateTime(value: unknown) {
  if (!value) return ''

  const date =
    typeof value === 'number'
      ? new Date(value)
      : new Date(String(value))

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

function countWords() {
  if (typeof document === 'undefined') return

  const article = document.querySelector('.vp-doc')
  const text = article?.textContent?.replace(/\s+/g, '') ?? ''

  wordCount.value = text.length
}

const createdSource = computed(() => {
  return frontmatter.value.createdAt || frontmatter.value.created || frontmatter.value.date
})

const updatedSource = computed(() => {
  return frontmatter.value.updatedAt || frontmatter.value.updated || page.value.lastUpdated
})

const created = computed(() => formatShortDate(createdSource.value))
const createdFull = computed(() => formatFullDateTime(createdSource.value))

const updated = computed(() => formatShortDate(updatedSource.value))
const updatedFull = computed(() => formatFullDateTime(updatedSource.value))

const readingTime = computed(() => {
  if (!wordCount.value) return ''
  return `${Math.max(1, Math.ceil(wordCount.value / 450))} 分钟`
})

const author = computed(() => {
  return frontmatter.value.author || frontmatter.value.maintainer || 'Azek431'
})

const status = computed(() => frontmatter.value.status || '')
const difficulty = computed(() => frontmatter.value.difficulty || '')
const evidence = computed(() => frontmatter.value.evidence || '')

onMounted(() => {
  nextTick(countWords)
})

watch(
  () => route.path,
  () => {
    nextTick(countWords)
  }
)
</script>

<template>
  <div class="cysj-meta-line" aria-label="文档信息">
    <span v-if="created" :title="createdFull || created">
      写作日期：{{ created }}
    </span>

    <span v-if="updated" :title="updatedFull || updated">
      更新日期：{{ updated }}
    </span>

    <span v-if="wordCount" :title="`约 ${wordCount.toLocaleString('zh-CN')} 字`">
      字数：{{ wordCount.toLocaleString('zh-CN') }}
    </span>

    <span v-if="readingTime">
      阅读时间：{{ readingTime }}
    </span>

    <span v-if="author">
      维护者：{{ author }}
    </span>

    <span v-if="status">
      状态：{{ status }}
    </span>

    <span v-if="difficulty">
      难度：{{ difficulty }}
    </span>

    <span v-if="evidence">
      证据：{{ Array.isArray(evidence) ? evidence.join(' / ') : evidence }}
    </span>
  </div>
</template>
