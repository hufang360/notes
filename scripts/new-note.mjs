#!/usr/bin/env node
/**
 * 新建一篇笔记。
 *
 *   pnpm new                      # 全交互
 *   pnpm new "Nginx 限流配置" --section ops --slug nginx-rate-limit
 *   pnpm new "服务器资料" --private
 *
 * 默认写成 draft: true。写完了把 frontmatter 里的 draft 改成 false（或删掉）再提交。
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createInterface } from 'node:readline/promises'

const ROOT = path.resolve(import.meta.dirname, '..')
const DOCS = path.join(ROOT, 'docs')
const TEMPLATE = path.join(ROOT, '_templates', 'note.md')
const SKIP = new Set(['.vitepress', 'public', 'private', '_templates', 'node_modules'])

function sections() {
  return fs
    .readdirSync(DOCS, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !SKIP.has(e.name) && !e.name.startsWith('.'))
    .map((e) => e.name)
}

function parseArgs(argv) {
  const out = { _: [], section: null, slug: null, private: false, draft: true, tags: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--section' || a === '-s') out.section = argv[++i]
    else if (a === '--slug') out.slug = argv[++i]
    else if (a === '--tags' || a === '-t') out.tags = (argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    else if (a === '--private') out.private = true
    else if (a === '--publish') out.draft = false
    else if (a === '--help' || a === '-h') out.help = true
    else out._.push(a)
  }
  return out
}

/** 中文标题没法自动转 slug，退化成日期名，并提示手动指定 */
function slugify(title) {
  const ascii = title
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
  if (ascii) return ascii
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `untitled-${stamp}`
}

function nextOrder(dir) {
  if (!fs.existsSync(dir)) return 100
  let max = 0
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue
    const m = /^order:\s*(\d+)/m.exec(fs.readFileSync(path.join(dir, name), 'utf8'))
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max ? max + 10 : 100
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n'))
    return
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const ask = async (q, fallback) => {
    if (fallback) return fallback
    const a = (await rl.question(q)).trim()
    return a
  }

  try {
    const list = sections()

    let title = args._.join(' ').trim()
    if (!title) title = await ask('笔记标题: ')
    if (!title) throw new Error('标题不能为空')

    let section = args.section
    if (!args.private) {
      if (!section) {
        console.log(`\n可选分类: ${list.join(' / ')}`)
        section = await ask('放到哪个分类: ', list.length === 1 ? list[0] : null)
      }
      if (!list.includes(section)) throw new Error(`分类 "${section}" 不存在。现有: ${list.join(', ')}`)
    }

    let slug = args.slug
    if (!slug) {
      const auto = slugify(title)
      if (auto.startsWith('untitled-')) {
        console.log('⚠️  标题里没有 ASCII 字符，自动生成了日期文件名。')
        console.log('   想要好看的 URL，下次用：pnpm new "标题" --slug your-english-slug')
      }
      slug = auto
    }
    slug = slug.replace(/\.md$/, '')

    const dir = args.private ? path.join(ROOT, 'private') : path.join(DOCS, section)
    const file = path.join(dir, slug + '.md')
    if (fs.existsSync(file)) throw new Error(`已存在: ${path.relative(ROOT, file)}`)

    fs.mkdirSync(dir, { recursive: true })

    let body = fs.readFileSync(TEMPLATE, 'utf8')
    body = body
      .replace(/^title:.*$/m, `title: ${title}`)
      .replace(/^tags:.*$/m, `tags: [${args.tags.join(', ')}]`)
      .replace(/^order:.*$/m, `order: ${args.private ? 100 : nextOrder(dir)}`)
      .replace(/^draft:.*$/m, `draft: ${args.draft}`)

    fs.writeFileSync(file, body)

    const rel = path.relative(ROOT, file)
    console.log(`\n✅ 已创建 ${rel}`)
    if (args.private) {
      console.log('   该目录在 .gitignore 里，不会被提交。')
    } else {
      console.log(`   写完后把 frontmatter 的 draft 改成 false 再提交。`)
      console.log(`   双链引用写法： [[${slug}|${title}]]`)
    }
  } finally {
    rl.close()
  }
}

main().catch((err) => {
  console.error('❌ ' + err.message)
  process.exit(1)
})
