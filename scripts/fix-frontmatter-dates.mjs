import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const docsDir = path.join(root, 'docs')
const write = process.argv.includes('--write')
const today = new Date().toISOString().slice(0, 10)

const ignoreDirs = new Set([
  '.vitepress',
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

function runGit(args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  } catch {
    return ''
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []

  const files = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue
      files.push(...walk(abs))
      continue
    }

    if (entry.isFile() && /\.(md|markdown)$/i.test(entry.name)) {
      files.push(abs)
    }
  }

  return files
}

function toGitPath(abs) {
  return path.relative(root, abs).replace(/\\/g, '/')
}

function getGitDates(rel) {
  const out = runGit(['log', '--follow', '--format=%cs', '--', rel])
  const dates = out.split(/\r?\n/).filter(Boolean)

  return {
    last: dates[0] || '',
    first: dates[dates.length - 1] || ''
  }
}

function fileDate(abs, type = 'mtime') {
  const stat = fs.statSync(abs)
  const value = type === 'birthtime' ? stat.birthtime : stat.mtime
  return value.toISOString().slice(0, 10)
}

function normalizeDate(value) {
  const raw = String(value || '').trim()
  const match = raw.match(/^['"]?(\d{4}-\d{2}-\d{2})['"]?/)
  return match?.[1] || ''
}

function isBadDate(value) {
  const date = normalizeDate(value)
  if (!date) return true
  return date > today
}

function findKeyIndexes(lines, key) {
  const indexes = []
  const re = new RegExp(`^${key}\\s*:`)

  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) indexes.push(i)
  }

  return indexes
}

function setDateKey(lines, key, value, options = {}) {
  const { insertIfMissing = false, onlyIfBad = false } = options
  const indexes = findKeyIndexes(lines, key)

  if (!value) return false

  let changed = false

  if (!indexes.length) {
    if (insertIfMissing) {
      lines.push(`${key}: ${value}`)
      changed = true
    }

    return changed
  }

  const first = indexes[0]
  const oldValue = lines[first].replace(new RegExp(`^${key}\\s*:\\s*`), '').trim()
  const shouldUpdate = !onlyIfBad || isBadDate(oldValue)

  if (shouldUpdate && lines[first] !== `${key}: ${value}`) {
    lines[first] = `${key}: ${value}`
    changed = true
  }

  for (let i = indexes.length - 1; i >= 1; i--) {
    lines.splice(indexes[i], 1)
    changed = true
  }

  return changed
}

let checked = 0
let changed = 0

for (const file of walk(docsDir)) {
  checked++

  const raw = fs.readFileSync(file, 'utf8')
  const match = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)([\s\S]*)$/)

  if (!match) continue

  const start = match[1]
  const frontmatter = match[2]
  const end = match[3]
  const body = match[4]

  const rel = toGitPath(file)
  const gitDates = getGitDates(rel)

  const lastDate = gitDates.last || fileDate(file, 'mtime')
  const firstDate = gitDates.first || fileDate(file, 'birthtime')

  const lines = frontmatter.split(/\r?\n/)
  let fileChanged = false

  // updated 表示最近更新日期：统一改成 Git 最近提交日期
  fileChanged = setDateKey(lines, 'updated', lastDate, {
    insertIfMissing: true,
    onlyIfBad: false
  }) || fileChanged

  // date / created 表示创建日期：只修明显错误，例如未来日期、非法日期、重复字段
  if (findKeyIndexes(lines, 'date').length) {
    fileChanged = setDateKey(lines, 'date', firstDate, {
      insertIfMissing: false,
      onlyIfBad: true
    }) || fileChanged
  }

  if (findKeyIndexes(lines, 'created').length) {
    fileChanged = setDateKey(lines, 'created', firstDate, {
      insertIfMissing: false,
      onlyIfBad: true
    }) || fileChanged
  }

  if (fileChanged) {
    changed++

    console.log(`${write ? 'fixed' : 'would fix'}: ${rel}`)
    console.log(`  updated => ${lastDate}`)
    console.log(`  created/date fallback => ${firstDate}`)

    if (write) {
      const next = start + lines.join('\n') + end + body
      fs.writeFileSync(file, next, 'utf8')
    }
  }
}

console.log('')
console.log(`checked: ${checked}`)
console.log(`${write ? 'fixed' : 'would fix'} files: ${changed}`)

if (!write) {
  console.log('')
  console.log('Dry run only. Run with --write to apply changes.')
}
