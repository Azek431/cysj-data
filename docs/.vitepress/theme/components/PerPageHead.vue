<script setup lang="ts">
import { onMounted } from 'vue'
import { useData } from 'vitepress'

const { page, site } = useData()

function setMeta(name: string, content: string | null, attr = 'name') {
  if (!content) return
  let selector = `${attr}="${name}"`
  let el = document.querySelector(`meta[${selector}]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

onMounted(() => {
  const title = page.value?.frontmatter?.title || page.value?.title || site.value?.title
  const siteTitle = site.value?.title || ''
  if (title && siteTitle) {
    document.title = `${title} · ${siteTitle}`
  } else if (title) {
    document.title = title
  }

  const description = page.value?.frontmatter?.description || site.value?.description || ''
  setMeta('description', description)
  setMeta('og:description', description, 'property')
  setMeta('twitter:description', description)

  const image = page.value?.frontmatter?.image || page.value?.frontmatter?.heroImage || site.value?.themeConfig?.logo || ''
  if (image) {
    // ensure absolute URL if starts with /
    const imageUrl = image.startsWith('/') ? (site.value?.base || '/') + image.replace(/^\//, '') : image
    setMeta('og:image', imageUrl, 'property')
    setMeta('twitter:image', imageUrl)
  }
})
</script>

<template>
  <!-- empty: this component only manipulates head/meta on mount -->
  <div style="display:none" aria-hidden="true"></div>
</template>
