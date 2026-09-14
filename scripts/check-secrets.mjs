#!/usr/bin/env node
/**
 * 提交前自查：
 *   1. 有没有 private/ 下的文件被 git 跟踪
 *   2. gitleaks 扫全仓库历史
 *   3. 有没有 .gitignore 兜底规则失效的情况
 *
 *   pnpm check
 */
import { execFileSync, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = path.resolve(import.meta.dirname, '..')
process.chdir(ROOT)

let failed = false
const ok = (m) => console.log('  ✅ ' + m)
const bad = (m) => {
  failed = true
  console.log('  ❌ ' + m)
}

console.log('\n🔍 私密内容自查\n')

/* ---- 1. private/ 有没有被跟踪 ---- */
console.log('1. private/ 目录')
try {
  // .gitkeep 是故意提交的，用来占位保持目录存在，不算泄露
  const tracked = execSync('git ls-files private/', { encoding: 'utf8' })
    .split('\n')
    .filter((f) => f && path.basename(f) !== '.gitkeep')
  if (tracked.length) {
    bad('以下 private/ 文件已经被 git 跟踪，必须移除：')
    for (const f of tracked) console.log('       ' + f)
    console.log('     处理：git rm -r --cached private/ && git commit -m "移除误提交的私密文件"')
    console.log('     ⚠️  如果已经 push 过，光删除不够，历史里还在，需要 filter-repo 或直接当作已泄露处理。')
  } else {
    ok('没有任何 private/ 文件被跟踪')
  }
} catch {
  ok('private/ 目录不存在或尚未 git init')
}

/* ---- 2. 检查 .gitignore 是否真的生效 ---- */
console.log('\n2. .gitignore 规则')
if (fs.existsSync(path.join(ROOT, 'private'))) {
  const files = execSync('git status --ignored --porcelain private/ 2>/dev/null || true', {
    encoding: 'utf8',
  })
    .split('\n')
    .filter((l) => l.startsWith('!!'))
  if (files.length) ok(`private/ 下有 ${files.length} 项被正确忽略`)
  else ok('private/ 当前为空')
}

/* ---- 3. gitleaks 全量扫描 ---- */
console.log('\n3. gitleaks 扫描')
try {
  execSync('gitleaks version', { stdio: 'ignore' })
} catch {
  console.log('  ⚠️  未安装 gitleaks，跳过。安装：brew install gitleaks')
  process.exit(failed ? 1 : 0)
}

try {
  execFileSync('gitleaks', ['git', '--no-banner', '--redact', '--exit-code', '1', '--log-level', 'warn', '.'], {
    stdio: 'inherit',
  })
  ok('没有发现密钥')
} catch {
  bad('gitleaks 报了问题，请查看上面的输出')
  console.log('     误报可以在该行加注释： # gitleaks:allow')
  console.log('     也可以把路径加进 .gitleaks.toml 的 allowlists')
}

/* ---- 4. 敏感文件扩展名扫描 ---- */
console.log('\n4. 敏感文件扩展名')
// 只看「像凭据」的文件名。注意别把本项目自己的脚本扫进来。
const RISKY = [
  /\.(key|pem|p12|pfx|jks|keystore|env)$/i,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)(\.|$)/i,
  /(credential|secret|password|passwd|token)s?\.(json|ya?ml|txt|ini|conf|env)$/i,
  /serviceaccount.*\.json$/i,
  /\.npmrc$|\.pypirc$/,
]
const ALLOWED = [/\.(example|sample|template|dist)$/i, /^scripts\//, /^hooks\//, /^\.gitleaks\.toml$/]

let hits = []
try {
  hits = execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .filter((f) => f && RISKY.some((re) => re.test(f)) && !ALLOWED.some((re) => re.test(f)))
} catch {}
if (hits.length) {
  bad('仓库里有这些看起来像凭据的文件，确认一下是否该提交：')
  for (const f of hits) console.log('       ' + f)
} else {
  ok('没有可疑的凭据文件名')
}

console.log(failed ? '\n❌ 自查未通过\n' : '\n🎉 自查通过\n')
process.exit(failed ? 1 : 0)
