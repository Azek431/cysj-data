<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, page } = useData()

const showMeta = computed(() => {
  return frontmatter.value.layout !== 'home' && frontmatter.value.meta !== false
})

const title = computed(() => frontmatter.value.title || page.value.title || '')
const description = computed(() => frontmatter.value.description || '')

const editor = computed(() => frontmatter.value.editor || frontmatter.value.author || 'Azek431')
const editorUrl = computed(() => frontmatter.value.editorUrl || frontmatter.value.authorUrl || 'https://github.com/Azek431')
const editorGithub = computed(() => frontmatter.value.editorGithub || 'https://github.com/Azek431')
const editorEmail = computed(() => frontmatter.value.editorEmail || '')
const hasEditorContact = computed(() => editorGithub.value || editorEmail.value)

const status = computed(() => frontmatter.value.status || '持续维护')
const difficulty = computed(() => frontmatter.value.difficulty || '')
const evidence = computed(() => frontmatter.value.evidence || frontmatter.value.source || '')
const category = computed(() => frontmatter.value.category || '')
const version = computed(() => frontmatter.value.version || '')

const tags = computed(() => {
  const value = frontmatter.value.tags
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return [value]
  return []
})

const formatDate = (value: unknown) => {
  if (!value) return ''

  if (typeof value === 'number') {
    return new Date(value).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return String(value)
}

const updated = computed(() => {
  return formatDate(frontmatter.value.updated || page.value.lastUpdated)
})

const statusType = computed(() => {
  const value = String(status.value)

  if (value.includes('待验证') || value.includes('草稿')) return 'warning'
  if (value.includes('旧') || value.includes('过期') || value.includes('废弃')) return 'danger'
  if (value.includes('已整理') || value.includes('完成') || value.includes('稳定')) return 'success'

  return 'info'
})

const evidenceType = computed(() => {
  const value = String(evidence.value)

  if (value.includes('官方')) return 'success'
  if (value.includes('待验证')) return 'warning'
  if (value.includes('社区') || value.includes('观察')) return 'info'
  if (value.includes('OCR') || value.includes('截图')) return 'purple'

  return 'neutral'
})
</script>

<template>
  <section v-if="showMeta" class="doc-meta-card">
    <div class="doc-meta-glow"></div>

    <div class="doc-meta-header">
      <div>
        <p class="doc-meta-kicker">文档档案</p>
        <h2 class="doc-meta-title">{{ title }}</h2>
      </div>

      <div class="doc-meta-status" :class="`is-${statusType}`">
        {{ status }}
      </div>
    </div>

    <p v-if="description" class="doc-meta-description">
      {{ description }}
    </p>

    <div class="doc-meta-grid">
      <div class="doc-meta-field doc-meta-editor-field">
        <span class="doc-meta-label">维护者</span>

        <span class="doc-meta-editor-wrap">
          <a
            v-if="editorUrl"
            class="doc-meta-editor-link"
            :href="editorUrl"
            target="_blank"
            rel="noreferrer"
          >
            {{ editor }}
            <span class="doc-meta-editor-arrow">↗</span>
          </a>

          <span v-else class="doc-meta-value">
            {{ editor }}
          </span>

          <span v-if="hasEditorContact" class="doc-meta-contact-card">
            <span class="doc-meta-contact-title">维护者信息</span>

            <a
              v-if="editorGithub"
              :href="editorGithub"
              target="_blank"
              rel="noreferrer"
            >
              GitHub：Azek431
            </a>

            <a
              v-if="editorEmail"
              :href="`mailto:${editorEmail}`"
            >
              邮箱：{{ editorEmail }}
            </a>
          </span>
        </span>
      </div>

      <div v-if="updated" class="doc-meta-field">
        <span class="doc-meta-label">最后更新</span>
        <span class="doc-meta-value">{{ updated }}</span>
      </div>

      <div v-if="difficulty" class="doc-meta-field">
        <span class="doc-meta-label">阅读难度</span>
        <span class="doc-meta-value">{{ difficulty }}</span>
      </div>

      <div v-if="category" class="doc-meta-field">
        <span class="doc-meta-label">所属分类</span>
        <span class="doc-meta-value">{{ category }}</span>
      </div>

      <div v-if="version" class="doc-meta-field">
        <span class="doc-meta-label">适用版本</span>
        <span class="doc-meta-value">{{ version }}</span>
      </div>

      <div v-if="evidence" class="doc-meta-field">
        <span class="doc-meta-label">证据等级</span>
        <span class="doc-meta-value evidence" :class="`is-${evidenceType}`">
          {{ evidence }}
        </span>
      </div>
    </div>

    <div v-if="tags.length" class="doc-meta-tags">
      <span
        v-for="tag in tags"
        :key="tag"
        class="doc-meta-tag"
      >
        #{{ tag }}
      </span>
    </div>
  </section>
</template>
