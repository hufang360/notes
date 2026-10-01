#!/usr/bin/env node
/**
 * 图片工具：来源清单 / 取原图 / 转 WebP / 体检。
 *
 *   node scripts/images.mjs manifest          重建来源清单（需要 B 站 cookie）
 *   node scripts/images.mjs check             体检：孤儿图、大文件、原图不可再获取的
 *   node scripts/images.mjs fetch <关键词>     取原图（匹配文件名或 cv 号）
 *   node scripts/images.mjs prune [--yes]     删掉没被任何笔记引用的图（删文章后用）
 *   node scripts/images.mjs secure            把只被 private/ 引用的图挪出公共目录
 *   node scripts/images.mjs webp [--all]      把 PNG 转 WebP
 *
 * 为什么要「来源清单」：
 *   站点上的图都是压缩过的 WebP，不是原图。B 站导入的还能顺着 URL 重下，
 *   但**你自己粘的图本地那份就是唯一的原图** —— 转了就没了。
 *   清单把这件事记下来，脚本才能区别对待。
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const ROOT = path.resolve(import.meta.dirname, '..')
const DOCS = path.join(ROOT, 'docs')
const ASSETS = path.join(DOCS, 'public/assets')
const MANIFEST = path.join(ROOT, 'scripts/assets-sources.json')
const ORIGINAL_ARCHIVE = path.join(ROOT, 'private/originals')

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const DEFAULT_COOKIES = process.env.BILI_COOKIES || path.join(process.env.HOME ?? '', 'yt-dlp/c-bili.txt')

/* ------------------------------------------------------------------ */
/* 基础                                                                */
/* ------------------------------------------------------------------ */
const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST)) return { generated: null, images: {} }
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
}

function saveManifest(m) {
  m.generated = new Date().toISOString().slice(0, 10)
  const sorted = Object.fromEntries(Object.entries(m.images).sort(([a], [b]) => a.localeCompare(b)))
  fs.writeFileSync(MANIFEST, JSON.stringify({ ...m, images: sorted }, null, 1) + '\n')
}

/** assets 目录下所有图片，键就是文件名（图片平铺，不分子目录） */
function listLocalImages() {
  const out = []
  if (!fs.existsSync(ASSETS)) return out
  const walk = (dir, prefix = '') => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p, prefix ? `${prefix}/${e.name}` : e.name)
      else if (e.isFile() && !e.name.startsWith('.')) out.push(prefix ? `${prefix}/${e.name}` : e.name)
    }
  }
  walk(ASSETS)
  return out.sort()
}

/** 所有笔记里 ![[xxx]] 引用的文件名 */
function listReferencedImages() {
  const used = new Map()
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.md')) {
        const body = fs.readFileSync(p, 'utf8')
        for (const m of body.matchAll(/!\[\[([^\]|]+)/g)) {
          const name = path.basename(m[1].split('|')[0].trim())
          const rel = path.relative(ROOT, p)
          if (!used.has(name)) used.set(name, [])
          used.get(name).push({ file: rel, secret: rel.startsWith('private/') })
        }
      }
    }
  }
  walk(DOCS)
  walk(path.join(ROOT, 'private'))
  return used
}

const human = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)}MB` : `${(b / 1024).toFixed(0)}KB`)

/* ------------------------------------------------------------------ */
/* manifest：从 B 站专栏重建来源清单                                    */
/* ------------------------------------------------------------------ */
function imageUrlsOf(content) {
  const out = []
  if (typeof content !== 'string' || !content) return out
  const seen = new Set()
  if (content.trimStart().startsWith('{"ops"')) {
    for (const m of content.matchAll(/"native-image":\{[^}]*\}/g)) {
      const u = /"url":"([^"]+)"/.exec(m[0])?.[1]
      if (u && !seen.has(u)) {
        seen.add(u)
        out.push({ url: u.startsWith('//') ? 'https:' + u : u })
      }
    }
    return out
  }
  const strip = (u) => {
    const at = u.indexOf('@')
    return at === -1 ? u : u.slice(0, at)
  }
  for (const m of content.matchAll(/<img\b([^>]*)>/g)) {
    const a = m[1]
    const src = /\bsrc="([^"]*)"/.exec(a)?.[1]
    const cls = /\bclass="([^"]*)"/.exec(a)?.[1] ?? ''
    const aid = /\baid="(\d+)"/.exec(a)?.[1]
    if (!src) continue
    if (/(^|\s)cut-off-\d+/.test(cls)) continue
    if (/\barticle-card\b/.test(cls) || aid) continue
    let u = strip(src)
    if (u.startsWith('//')) u = 'https:' + u
    else if (!u.startsWith('http')) u = 'https://' + u.replace(/^\/+/, '')
    if (seen.has(u)) continue
    seen.add(u)
    out.push({ url: u })
  }
  return out
}

async function curlJson(url, cookies) {
  const args = ['-sS', '--compressed', '--max-time', '60', '-H', `User-Agent: ${UA}`, '-H', 'Referer: https://www.bilibili.com/']
  if (fs.existsSync(cookies)) args.push('-b', cookies)
  args.push(url)
  const { stdout } = await run('curl', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return JSON.parse(stdout)
}

async function cmdManifest({ cookies = DEFAULT_COOKIES } = {}) {
  const notes = []
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.md')) {
        const m = /^source: https:\/\/www\.bilibili\.com\/read\/cv(\d+)\//m.exec(fs.readFileSync(p, 'utf8'))
        if (m) notes.push({ cv: Number(m[1]), file: p })
      }
    }
  }
  walk(DOCS)
  notes.sort((a, b) => a.cv - b.cv)
  console.log(`从 ${notes.length} 篇专栏文章重建来源清单…\n`)

  const manifest = loadManifest()
  let added = 0
  let missing = []

  for (const [i, note] of notes.entries()) {
    let data
    try {
      data = (await curlJson(`https://api.bilibili.com/x/article/view?id=${note.cv}`, cookies)).data
    } catch {
      missing.push(note.cv)
      continue
    }
    const urls = imageUrlsOf(data.content)
    if (data.content == null) console.log(c.yellow(`\n   cv${note.cv} 正文为空，跳过`))
    for (const [n, img] of urls.entries()) {
      const parts = path.basename(img.url).split('.')
      const ext = parts.length > 1 ? '.' + parts.pop() : ''
      const key = `cv${note.cv}-${String(n + 1).padStart(2, '0')}${ext}`
      const webpKey = key.replace(/\.(png|jpe?g)$/i, '.webp')
      const local = fs.existsSync(path.join(ASSETS, webpKey)) ? webpKey : key
      if (manifest.images[local]?.source === img.url) continue
      manifest.images[local] = {
        source: img.url,
        cv: note.cv,
        original: path.basename(img.url),
      }
      added++
    }
    process.stdout.write(`\r  已处理 ${i + 1}/${notes.length}  cv${note.cv}   `)
    await new Promise((r) => setTimeout(r, 2500))
  }
  console.log()
  saveManifest(manifest)
  console.log(`\n✅ 清单已写入 ${path.relative(ROOT, MANIFEST)}`)
  console.log(`   条目 ${Object.keys(manifest.images).length} 个（本次新增 ${added}）`)
  if (missing.length) console.log(c.red(`   抓取失败：${missing.map((x) => 'cv' + x).join(' ')}`))
}

/* ------------------------------------------------------------------ */
/* check：体检                                                          */
/* ------------------------------------------------------------------ */
async function cmdCheck() {
  const manifest = loadManifest()
  const local = listLocalImages()
  const used = listReferencedImages()
  const usedNames = new Set(used.keys())

  console.log(c.bold('\n🖼  图片体检\n'))

  // 1) 没被任何笔记引用的图
  const orphans = local.filter((k) => !usedNames.has(path.basename(k)))
  // 1b) 只被 private/ 里的笔记引用 —— 图会被发布，但笔记是私密的，这是泄漏
  const secretOnly = local.filter((k) => {
    const refs = used.get(path.basename(k))
    return refs && refs.length > 0 && refs.every((r) => r.secret)
  })
  // 2) 原图不可再获取的（没有来源 URL，也没有本地归档）
  const noSource = local.filter((k) => !manifest.images[k]?.source)
  // 归档里存的是转换前的原名（xxx.png），所以按主文件名比，不能带扩展名
  const archivedStems = new Set(
    fs.existsSync(ORIGINAL_ARCHIVE) ? fs.readdirSync(ORIGINAL_ARCHIVE).map((f) => path.parse(f).name) : []
  )
  const noArchive = noSource.filter((k) => !archivedStems.has(path.parse(k).name))
  // 3) 大文件
  const big = local
    .map((k) => ({ k, size: fs.statSync(path.join(ASSETS, k)).size }))
    .filter((x) => x.size > 800 * 1024)
    .sort((a, b) => b.size - a.size)
  // 4) 规模
  const total = local.reduce((a, k) => a + fs.statSync(path.join(ASSETS, k)).size, 0)
  const byExt = {}
  for (const k of local) {
    const e = path.extname(k).slice(1)
    byExt[e] = byExt[e] ?? { n: 0, size: 0 }
    byExt[e].n++
    byExt[e].size += fs.statSync(path.join(ASSETS, k)).size
  }

  const section = (title, items, render, hint) => {
    console.log(`${items.length ? c.yellow('⚠️ ') : c.green('✅ ')}${title}  ${c.dim(`(${items.length})`)}`)
    for (const it of items.slice(0, 8)) console.log('   ' + render(it))
    if (items.length > 8) console.log(c.dim(`   … 还有 ${items.length - 8} 个`))
    if (items.length && hint) console.log(c.dim('   ' + hint))
    console.log()
  }

  section(
    '没被任何笔记引用的图',
    orphans,
    (k) => `${k}  ${c.dim(human(fs.statSync(path.join(ASSETS, k)).size))}`,
    '这些图仍然会被发布到网站（docs/public/ 是原样拷贝）。'
  )
  section(
    '只被 private/ 笔记引用的图 —— 会被发布到网站',
    secretOnly,
    (k) => `${k}  ${c.dim(`<- ${used.get(path.basename(k)).map((r) => r.file).join(', ')}`)}`,
    '笔记是私密的，图却在公共资源目录里、会被提交并发布。把图移到 private/ 下再改引用。'
  )
  section(
    '原图已不可再获取的图',
    noArchive,
    (k) => `${k}`,
    '没有记录来源 URL，本地也没有归档。转成 WebP 后就拿不回原图了。'
  )
  section('体积超过 800KB 的图', big, (x) => `${x.k}  ${c.dim(human(x.size))}`)

  console.log(c.bold('  规模'))
  for (const [e, v] of Object.entries(byExt).sort((a, b) => b[1].size - a[1].size)) {
    console.log(`   ${e.padEnd(6)} ${String(v.n).padStart(4)} 张   ${human(v.size)}`)
  }
  console.log(`   ${c.bold('合计')}   ${String(local.length).padStart(4)} 张   ${c.bold(human(total))}`)
  console.log(`\n   已记录来源：${Object.keys(manifest.images).length} / ${local.length}`)
  if (fs.existsSync(ORIGINAL_ARCHIVE)) {
    console.log(`   本地原图归档：${fs.readdirSync(ORIGINAL_ARCHIVE).length} 个（private/originals/，不进 git）`)
  }

  const problems = orphans.length + secretOnly.length + noArchive.length
  console.log(problems ? c.yellow(`\n共 ${problems} 项待处理\n`) : c.green('\n没有问题 🎉\n'))
  process.exit(0)
}

/* ------------------------------------------------------------------ */
/* fetch：取原图                                                        */
/* ------------------------------------------------------------------ */
async function cmdFetch(pattern, { out, all = false, cookies = DEFAULT_COOKIES } = {}) {
  // 不指定就等于全量下载 443 张 —— 太容易误触，必须显式 --all
  if (!pattern && !all) {
    console.log(c.red('\n要指定取哪张：文件名片段或 cv 号\n'))
    console.log(c.dim('   pnpm images:fetch cv14798689            # 这一篇的全部原图'))
    console.log(c.dim('   pnpm images:fetch cv14798689-01         # 单张'))
    console.log(c.dim('   pnpm images:fetch --all --out=~/orig    # 全部（443 张）\n'))
    process.exit(1)
  }
  const manifest = loadManifest()
  const entries = Object.entries(manifest.images)
  const hit = (k, v) =>
    !pattern || k.includes(pattern) || (v.cv && `cv${v.cv}` === pattern) || (v.cv && `cv${v.cv}`.includes(pattern))
  const keys = entries.filter(([k, v]) => hit(k, v)).map(([k]) => k)

  // 清单里没有的，看看本地归档有没有（自己粘的图走这条）
  const archivedNames = fs.existsSync(ORIGINAL_ARCHIVE) ? fs.readdirSync(ORIGINAL_ARCHIVE) : []
  const archivedHits = pattern ? archivedNames.filter((n) => n.includes(pattern) || path.parse(n).name.includes(pattern)) : []

  if (!keys.length && !archivedHits.length) {
    console.log(c.red(`没有匹配「${pattern}」的图片`))
    process.exit(1)
  }
  const dir = out ?? path.join(ROOT, 'originals')
  fs.mkdirSync(dir, { recursive: true })
  for (const n of archivedHits) fs.copyFileSync(path.join(ORIGINAL_ARCHIVE, n), path.join(dir, n))
  if (archivedHits.length) console.log(c.green(`从本地归档取回 ${archivedHits.length} 张：${archivedHits.join(', ')}`))
  if (!keys.length) {
    console.log(c.dim(`\n-> ${dir}`))
    return
  }
  console.log(`取原图 ${keys.length} 张 -> ${dir}\n`)

  let ok = 0
  let restored = 0
  const failed = []
  for (const key of keys) {
    const meta = manifest.images[key]
    const name = meta.original ?? path.basename(key)
    const dest = path.join(dir, name)
    // 1) 优先本地归档（自己粘的图走这条）
    const archivedOrig =
      meta.archived && fs.existsSync(path.join(ORIGINAL_ARCHIVE, meta.archived))
        ? meta.archived
        : fs.existsSync(ORIGINAL_ARCHIVE)
          ? fs.readdirSync(ORIGINAL_ARCHIVE).find((f) => path.parse(f).name === path.parse(key).name)
          : null
    if (archivedOrig) {
      fs.copyFileSync(path.join(ORIGINAL_ARCHIVE, archivedOrig), path.join(dir, archivedOrig))
      restored++
      continue
    }
    // 2) 从来源 URL 重下
    if (!meta.source) {
      failed.push(`${key}  (没有来源记录，也没本地归档)`)
      continue
    }
    const args = ['-sS', '--compressed', '--max-time', '120', '-H', `User-Agent: ${UA}`, '-H', 'Referer: https://www.bilibili.com/']
    if (fs.existsSync(cookies)) args.push('-b', cookies)
    args.push('-o', dest, meta.source)
    try {
      await run('curl', args, { encoding: 'utf8' })
      const size = fs.statSync(dest).size
      if (size === 0) throw new Error('0 字节')
      ok++
      process.stdout.write(`\r  下载中 ${ok + failed.length}/${keys.length}   `)
    } catch (e) {
      failed.push(`${key}  (${e.message})`)
    }
  }
  console.log()
  console.log(c.green(`\n✅ 从来源下载 ${ok} 张` + (restored ? `，从本地归档恢复 ${restored} 张` : '')))
  if (failed.length) {
    console.log(c.yellow(`\n⚠️  ${failed.length} 张取不到：`))
    for (const f of failed.slice(0, 10)) console.log('   ' + f)
  }
}

/* ------------------------------------------------------------------ */
/* prune：删掉没被引用的图                                              */
/* ------------------------------------------------------------------ */
async function cmdPrune({ yes = false } = {}) {
  const local = listLocalImages()
  const used = listReferencedImages()
  const usedNames = new Set(used.keys())
  const orphans = local
    .filter((k) => !usedNames.has(path.basename(k)))
    .map((k) => ({ k, size: fs.statSync(path.join(ASSETS, k)).size }))

  console.log(c.bold('\n🧹 没被任何笔记引用的图\n'))
  if (!orphans.length) {
    console.log(c.green('  没有，不用清理 🎉\n'))
    return
  }
  const total = orphans.reduce((a, x) => a + x.size, 0)
  for (const x of orphans.slice(0, 20)) console.log(`   ${x.k}  ${c.dim(human(x.size))}`)
  if (orphans.length > 20) console.log(c.dim(`   … 还有 ${orphans.length - 20} 个`))
  console.log(`\n   共 ${orphans.length} 个，${human(total)}`)

  if (!yes) {
    console.log(c.yellow('\n   这是预览。确认要删就加 --yes：'))
    console.log(c.dim('      pnpm images prune --yes\n'))
    return
  }
  for (const x of orphans) fs.unlinkSync(path.join(ASSETS, x.k))
  console.log(c.green(`\n✅ 已删除 ${orphans.length} 个，回收 ${human(total)}\n`))
}

/* ------------------------------------------------------------------ */
/* secure：把私密图挪出公共资源目录                                      */
/* ------------------------------------------------------------------ */
async function cmdSecure() {
  const local = listLocalImages()
  const used = listReferencedImages()
  const secretOnly = local.filter((k) => {
    const refs = used.get(path.basename(k))
    return refs?.length && refs.every((r) => r.secret)
  })
  console.log(c.bold('\n🔒 只被 private/ 笔记引用的图\n'))
  if (!secretOnly.length) {
    console.log(c.green('  没有 🎉\n'))
    return
  }
  const dest = path.join(ROOT, 'private/assets')
  fs.mkdirSync(dest, { recursive: true })
  for (const k of secretOnly) {
    const src = path.join(ASSETS, k)
    const name = path.basename(k)
    fs.renameSync(src, path.join(dest, name))
    const files = used.get(name).map((r) => r.file)
    console.log(`   ${k}`)
    console.log(c.dim(`      -> private/assets/${name}   (引用它的：${files.join(', ')})`))
  }
  console.log(
    c.green(`\n✅ 挪走 ${secretOnly.length} 张到 private/assets/`) +
      c.dim('（Obsidian 按文件名找得到，引用不用改；这个目录不进 git）')
  )
  console.log(c.yellow('   记得跑一次 pnpm build 和 pnpm images:check\n'))
}

/* ------------------------------------------------------------------ */
/* webp：转格式                                                         */
/* ------------------------------------------------------------------ */
async function detectTool() {
  for (const t of ['magick', 'cwebp']) {
    try {
      await run(t, ['-version'], { encoding: 'utf8' })
      return t
    } catch {
      /* 下一个 */
    }
  }
  return null
}

async function cmdWebp({ all = false, quality = 88 } = {}) {
  const tool = await detectTool()
  if (!tool) {
    console.log(c.red('需要 ImageMagick（magick）或 cwebp'))
    process.exit(1)
  }
  const manifest = loadManifest()
  const local = listLocalImages().filter((k) => /\.(png|jpe?g)$/i.test(k))
  if (!local.length) {
    console.log(c.green('\n✅ 没有需要转换的 PNG/JPEG\n'))
    return
  }

  const safe = local.filter((k) => manifest.images[k]?.source || fs.existsSync(path.join(ORIGINAL_ARCHIVE, path.basename(k))))
  const risky = local.filter((k) => !safe.includes(k))

  console.log(c.bold(`\n找到 ${local.length} 张 PNG/JPEG\n`))
  console.log(`  ${c.green('可转')}：${safe.length} 张 ${c.dim('（有来源 URL 或本地归档，原图拿得回来）')}`)
  console.log(`  ${c.yellow('不建议转')}：${risky.length} 张 ${c.dim('（本地这份就是唯一原图）')}`)
  for (const k of risky.slice(0, 5)) console.log(c.dim(`     ${k}`))
  if (risky.length > 5) console.log(c.dim(`     … 还有 ${risky.length - 5} 张`))
  if (risky.length && !all) {
    console.log(
      c.yellow(
        `\n跳过 ${risky.length} 张。要连它们一起转用 --all（原图会先归档到 private/originals/，但不进 git）。`
      )
    )
  }
  if (!safe.length && !(all && risky.length)) return

  // 先归档，再换引用，最后删原文件
  let converted = 0
  let bytesBefore = 0
  let bytesAfter = 0
  const renames = new Map()
  const targets = all ? local : safe

  fs.mkdirSync(ORIGINAL_ARCHIVE, { recursive: true })
  for (const key of targets) {
    const src = path.join(ASSETS, key)
    // 自己粘的图先把原图归档，转了也拿得回来
    if (!manifest.images[key]?.source) {
      fs.copyFileSync(src, path.join(ORIGINAL_ARCHIVE, path.basename(key)))
      // 登记一下：没有来源 URL，但原图在本机归档里
      manifest.images[key] = { ...(manifest.images[key] ?? {}), archived: path.basename(key) }
    }
    const dst = src.replace(/\.(png|jpe?g)$/i, '.webp')
    if (tool === 'magick') {
      await run('magick', [src, '-quality', String(quality), '-define', 'webp:method=6', dst])
    } else {
      await run('cwebp', ['-quiet', '-q', String(quality), src, '-o', dst])
    }
    bytesBefore += fs.statSync(src).size
    bytesAfter += fs.statSync(dst).size
    renames.set(path.basename(src), path.basename(dst))
    fs.unlinkSync(src)
    converted++
  }

  // 更新笔记里的引用
  let refs = 0
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.md')) {
        let s = fs.readFileSync(p, 'utf8')
        const orig = s
        for (const [from, to] of renames) s = s.replaceAll(`![[${from}]]`, `![[${to}]]`)
        if (s !== orig) {
          fs.writeFileSync(p, s)
          refs++
        }
      }
    }
  }
  walk(DOCS)

  // 更新清单的键
  for (const [from, to] of renames) {
    const entry = Object.entries(manifest.images).find(([k]) => path.basename(k) === from)
    if (entry) {
      delete manifest.images[entry[0]]
      manifest.images[entry[0].replace(path.basename(entry[0]), to)] = entry[1]
    }
  }
  saveManifest(manifest)

  const pct = bytesBefore ? Math.round((1 - bytesAfter / bytesBefore) * 100) : 0
  console.log(c.green(`\n✅ 转换 ${converted} 张：${human(bytesBefore)} -> ${human(bytesAfter)}（省 ${pct}%）`))
  console.log(`   更新了 ${refs} 篇笔记的引用`)
  if (all) console.log(c.dim(`   原图已归档到 ${path.relative(ROOT, ORIGINAL_ARCHIVE)}/（在 private/ 下，不进 git）`))
  console.log(c.yellow('\n   记得跑一次 pnpm build 和 pnpm images:check'))
}

/* ------------------------------------------------------------------ */
const [cmd, ...rest] = process.argv.slice(2)
const flags = Object.fromEntries(
  rest.filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v === undefined ? true : v]
  })
)
const positional = rest.filter((a) => !a.startsWith('--'))

const usage = () => {
  const lines = fs
    .readFileSync(new URL(import.meta.url), 'utf8')
    .split('\n')
    .slice(1, 12)
    .map((l) => l.replace(/^ \*\/?/, ''))
  console.log(lines.join('\n'))
}

if (flags.help || flags.h || cmd === 'help') {
  usage()
  process.exit(0)
}

switch (cmd) {
  case 'manifest':
    await cmdManifest({ cookies: flags.cookies })
    break
  case 'check':
    await cmdCheck()
    break
  case 'fetch':
    await cmdFetch(positional[0], { out: flags.out, all: !!flags.all, cookies: flags.cookies })
    break
  case 'prune':
    await cmdPrune({ yes: !!flags.yes })
    break
  case 'secure':
    await cmdSecure()
    break
  case 'webp':
    await cmdWebp({ all: !!flags.all, quality: Number(flags.webp ?? 88) })
    break
  default:
    usage()
}
