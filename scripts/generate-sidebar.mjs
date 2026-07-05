import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const docsDir = path.join(root, 'docs')
const sidebarOut = path.join(docsDir, '.vitepress', 'sidebar.generated.ts')
const catalogOut = path.join(docsDir, '总索引与导航', '自动生成文档目录.md')

const ignoreDirs = new Set([
  '.vitepress',
  'public',
  'AI优化输出',
  'AI生成草稿',
  '草稿',
  '待整理',
  'node_modules',
  'dist',
  'build',
  'site-dist',
  '.git',
  '.stfolder',
  '.backup',
  'backup',
  '.cache',
  '.temp'
])

const topOrder = [
  '总索引与导航',
  '脚本系统',
  '核心研究',
  '教程资料',
  'OCR资料',
  '项目设计',
  '社区分析',
  '引擎更新',
  '元信息',
  '维护与报告',
  'guide'
]

const collator = new Intl.Collator('zh-CN', {
  numeric: true,
  sensitivity: 'base'
})

function isMarkdown(file) {
  return file.endsWith('.md') || file.endsWith('.markdown')
}

function readTitle(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')

  const fm = raw.match(/^---\s*?\n([\s\S]*?)\n---/)
  if (fm) {
    const titleLine = fm[1].match(/^title:\s*["']?(.+?)["']?\s*$/m)
    if (titleLine?.[1]) return titleLine[1].trim()
  }

  const heading = raw.match(/^#\s+(.+)$/m)
  if (heading?.[1]) return heading[1].trim()

  return path.basename(filePath).replace(/\.(md|markdown)$/i, '')
}

function toRoute(filePath) {
  let rel = path.relative(docsDir, filePath).replace(/\\/g, '/')
  rel = rel.replace(/\.(md|markdown)$/i, '')

  if (rel === 'index') return '/'
  if (rel.endsWith('/index')) rel = rel.slice(0, -'/index'.length)

  return '/' + rel
}

function safeReadDir(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true })
}

function sortEntries(entries) {
  return entries.sort((a, b) => collator.compare(a.name, b.name))
}

function buildItems(dir) {
  const entries = sortEntries(safeReadDir(dir))
  const items = []

  for (const entry of entries) {
    const abs = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue

      const childItems = buildItems(abs)
      if (childItems.length) {
        items.push({
          text: entry.name,
          collapsed: true,
          items: childItems
        })
      }
      continue
    }

    if (!entry.isFile() || !isMarkdown(entry.name)) continue

    items.push({
      text: readTitle(abs),
      link: toRoute(abs)
    })
  }

  return items
}

function getTopDirs() {
  return safeReadDir(docsDir)
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !ignoreDirs.has(entry.name))
    .sort((a, b) => {
      const ai = topOrder.indexOf(a.name)
      const bi = topOrder.indexOf(b.name)

      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      }

      return collator.compare(a.name, b.name)
    })
}

function getRootFiles() {
  // 排除不需要出现在侧边栏的根目录文件
  const excluded = new Set(['404.md', 'index.md', '关于.md'])

  return safeReadDir(docsDir)
    .filter((entry) => entry.isFile() && isMarkdown(entry.name) && !excluded.has(entry.name))
    .sort((a, b) => collator.compare(a.name, b.name))
    .map((entry) => {
      const abs = path.join(docsDir, entry.name)
      return {
        text: readTitle(abs),
        link: toRoute(abs)
      }
    })
}

function buildSidebar() {
  const sidebar = []

  const rootFiles = getRootFiles()
  if (rootFiles.length) {
    sidebar.push({
      text: '开始阅读',
      collapsed: false,
      items: rootFiles
    })
  }

  for (const dir of getTopDirs()) {
    const abs = path.join(docsDir, dir.name)
    const items = buildItems(abs)

    if (items.length) {
      sidebar.push({
        text: dir.name,
        collapsed: false,
        items
      })
    }
  }

  return sidebar
}

function flattenItems(items, depth = 0) {
  const lines = []

  for (const item of items) {
    const indent = '  '.repeat(depth)

    if (item.link) {
      lines.push(`${indent}- [${item.text}](${item.link})`)
    } else {
      lines.push(`${indent}- ${item.text}`)
    }

    if (item.items?.length) {
      lines.push(...flattenItems(item.items, depth + 1))
    }
  }

  return lines
}

function writeSidebar(sidebar) {
  fs.mkdirSync(path.dirname(sidebarOut), { recursive: true })

  const content = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run: pnpm run docs:sidebar

export const generatedSidebar = ${JSON.stringify(sidebar, null, 2)}
`

  fs.writeFileSync(sidebarOut, content, 'utf8')
}

function writeCatalog(sidebar) {
  fs.mkdirSync(path.dirname(catalogOut), { recursive: true })

  const today = new Date().toISOString().slice(0, 10)

  const lines = [
    '---',
    'title: 自动生成文档目录',
    'description: 自动扫描 docs 目录生成的文档目录，用于快速查看资料库当前所有页面。',
    'editor: Azek431',
    'status: 持续维护',
    'difficulty: 入门',
    'evidence: 资料整理',
    `updated: ${today}`,
    'category: 总索引与导航',
    'version: v0.2.x',
    'tags:',
    '  - 创游世界',
    '  - 文档目录',
    '  - 自动生成',
    '---',
    '',
    '# 自动生成文档目录',
    '',
    '> 这个页面由 `scripts/generate-sidebar.mjs` 自动生成，用于快速查看当前资料库中的文档结构。',
    '',
    '[[toc]]',
    ''
  ]

  for (const section of sidebar) {
    lines.push(`## ${section.text}`)
    lines.push('')
    lines.push(...flattenItems(section.items || []))
    lines.push('')
  }

  fs.writeFileSync(catalogOut, lines.join('\n'), 'utf8')
}

const sidebar = buildSidebar()
writeSidebar(sidebar)
writeCatalog(sidebar)

console.log(`generated: ${path.relative(root, sidebarOut)}`)
console.log(`generated: ${path.relative(root, catalogOut)}`)
console.log(`sections: ${sidebar.length}`)



