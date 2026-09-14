#!/usr/bin/env node
/**
 * 看一眼笔记仓库的现状：
 *   - 有多少篇公开笔记、多少篇草稿
 *   - 每个分类下有几篇
 *   - private/ 里有多少本地文件（不会提交）
 *
 *   pnpm status
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { loadVault } from '../docs/.vitepress/vault.mts'

const ROOT = path.resolve(import.meta.dirname, '..')
const DOCS = path.join(ROOT, 'docs')
const SKIP = new Set(['.vitepress', 'public', 'private', '_templates', 'node_modules'])

const vault = loadVault(DOCS)

const sections = {}
for (const n of vault.published) {
  const top = n.rel.includes('/') ? n.rel.split('/')[0] : '(顶层)'
  sections[top] = (sections[top] ?? 0) + 1
}

const bar = '─'.repeat(52)
console.log(`\n📚 笔记仓库现状\n${bar}`)
console.log(`  公开笔记   ${String(vault.published.length).padStart(3)} 篇`)
console.log(`  草稿/隐藏  ${String(vault.hidden.length).padStart(3)} 篇`)

console.log(`\n  分类分布`)
for (const [name, count] of Object.entries(sections).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${name.padEnd(16)} ${String(count).padStart(3)} 篇`)
}

if (vault.hidden.length) {
  console.log(`\n  被 frontmatter 挡下的笔记`)
  for (const n of vault.hidden) console.log(`    - ${n.rel}`)
}

/* private/ 目录 */
const privDir = path.join(ROOT, 'private')
const countPrivate = (dir) => {
  if (!fs.existsSync(dir)) return 0
  let n = 0
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countPrivate(path.join(dir, e.name))
    else if (e.name !== '.gitkeep') n++
  }
  return n
}
console.log(`\n  本地私密文件  ${countPrivate(privDir)} 个（在 private/，不会被提交）`)

console.log(`\n  附件  ${vault.assetIndex.size} 个（docs/public/assets/ 等）`)
console.log(bar)
console.log(`  本地预览  pnpm dev`)
console.log(`  新建笔记  pnpm new "标题" --section ops --slug english-slug`)
console.log(`  提交自查  pnpm check\n`)
