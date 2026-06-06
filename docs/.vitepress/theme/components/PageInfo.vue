<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const { frontmatter, page } = useData()
const route = useRoute()

const wordCount = ref(0)
const authorCardOpen = ref(false)

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
  const text = article?.textContent?.replace(/s+/g, '') ?? ''

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

const authorInitial = computed(() => {
  const name = String(author.value || 'A').trim()
  return name.charAt(0).toUpperCase() || 'A'
})

const authorProfile = computed(() => {
  return {
    name: String(author.value || 'Azek431'),
    role: String(frontmatter.value.authorRole || frontmatter.value.maintainerRole || '创游世界资料库维护者'),
    github: String(frontmatter.value.github || frontmatter.value.authorGithub || 'https://github.com/Azek431'),
    gitee: String(frontmatter.value.gitee || frontmatter.value.authorGitee || 'https://gitee.com/Azek431'),
    telegram: String(frontmatter.value.telegram || frontmatter.value.authorTelegram || 'https://t.me/AzekMain'),
    qqGroup: String(frontmatter.value.qqGroup || frontmatter.value.authorQQGroup || '1097265516')
  }
})

const status = computed(() => frontmatter.value.status || '')
const difficulty = computed(() => frontmatter.value.difficulty || '')
const evidence = computed(() => frontmatter.value.evidence || '')

function handleAuthorFocus() {
  authorCardOpen.value = true
}

function handleAuthorBlur(event: FocusEvent) {
  const next = event.relatedTarget as HTMLElement | null
  if (next && next.closest('.cysj-author-meta')) return
  authorCardOpen.value = false
}

onMounted(() => {
  nextTick(countWords)
})

watch(
  () => route.path,
  () => {
    nextTick(countWords)
    authorCardOpen.value = false
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

    <span
      v-if="author"
      class="cysj-author-meta"
      tabindex="0"
      role="button"
      :aria-expanded="authorCardOpen"
      :aria-label="`维护者 ${author}，按回车查看联系方式`"
      @focus="handleAuthorFocus"
      @blur="handleAuthorBlur"
    >
      维护者：{{ author }}

      <span class="cysj-author-card" role="tooltip">
        <span class="cysj-author-card__avatar" aria-hidden="true">
          {{ authorInitial }}
        </span>
        <span class="cysj-author-card__name">{{ authorProfile.name }}</span>
        <span class="cysj-author-card__role">{{ authorProfile.role }}</span>

        <span class="cysj-author-card__links">
          <a
            :href="authorProfile.github"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>

          <a
            :href="authorProfile.gitee"
            target="_blank"
            rel="noreferrer"
          >
            Gitee
          </a>

          <a
            :href="authorProfile.telegram"
            target="_blank"
            rel="noreferrer"
          >
            Telegram
          </a>
        </span>

        <span class="cysj-author-card__contact">
          QQ 群：<strong>{{ authorProfile.qqGroup }}</strong>
        </span>
      </span>
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
