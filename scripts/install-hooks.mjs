#!/usr/bin/env node
/**
 * 把 hooks/ 下的钩子安装到 .git/hooks/
 * 由 package.json 的 prepare 脚本在 pnpm install 后自动调用。
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'hooks')
const GIT_DIR = path.join(ROOT, '.git')

if (!fs.existsSync(GIT_DIR)) {
  // 还没 git init，或者装在 node_modules 里，静默跳过
  process.exit(0)
}

const DEST = path.join(GIT_DIR, 'hooks')
fs.mkdirSync(DEST, { recursive: true })

for (const name of fs.readdirSync(SRC)) {
  const from = path.join(SRC, name)
  if (!fs.statSync(from).isFile()) continue
  const to = path.join(DEST, name)

  if (fs.existsSync(to)) {
    const old = fs.readFileSync(to, 'utf8')
    if (!old.includes('scripts/install-hooks.mjs') && !old.includes('由 scripts/install-hooks')) {
      console.log(`⚠️  .git/hooks/${name} 已存在且不是本仓库管理的，跳过（要覆盖请手动备份后删除）`)
      continue
    }
  }

  fs.copyFileSync(from, to)
  fs.chmodSync(to, 0o755)
  console.log(`✅ 已安装 .git/hooks/${name}`)
}
