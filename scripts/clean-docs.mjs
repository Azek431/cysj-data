import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const targets = [
  'docs/.vitepress/dist',
  'docs/.vitepress/cache',
  'docs/.vitepress/.temp',
  'site-dist'
]

for (const target of targets) {
  const fullPath = path.join(root, target)

  if (!fs.existsSync(fullPath)) {
    console.log(`skip: ${target}`)
    continue
  }

  try {
    fs.rmSync(fullPath, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 300
    })

    console.log(`removed: ${target}`)
  } catch (error) {
    console.error(`failed: ${target}`)
    console.error(error)
    process.exitCode = 1
  }
}
