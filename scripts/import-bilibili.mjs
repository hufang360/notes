#!/usr/bin/env node
/**
 * 把 Bilibili 专栏导入成笔记。
 *
 * 用法：
 *   node scripts/import-bilibili.mjs [选项] <专栏...>
 *
 * 专栏可以写成 cv 号、纯数字，或者完整链接；用 = 指定落地路径：
 *   cv14792889=dst/linux-server
 *   14798689=dst/config
 *   https://www.bilibili.com/read/cv14801260/=dst/windows-server
 *   15317852                      ← 不写 = 就用标题自动生成文件名
 *
 * 选项：
 *   --section <dir>    放到 docs/ 下的哪个分类，默认 games
 *   --cookies <path>   Netscape 格式 cookie 文件（B站有反爬，建议带上）
 *                      也可用环境变量 BILI_COOKIES，默认找 ~/yt-dlp/c-bili.txt
 *   --tags a,b,c       额外追加的标签
 *   --webp <质量>     截图转 WebP，默认 88（0 或 --no-webp 关闭）
 *                       B 站给的是 1920x1080 的 PNG，转完通常能小 90% 以上，
 *                       需要 ImageMagick（magick）或 cwebp
 *   --draft            以草稿形式导入（frontmatter 写 draft: true）
 *   --delay <秒>       每篇之间的间隔，默认 3
 *   --dry-run          只打印结果，不写文件
 *   --force            覆盖已存在的笔记
 *
 * 例：
 *   node scripts/import-bilibili.mjs 14792889=dst/linux-server 14798689=dst/config
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'
import TurndownService from 'turndown'

const run = promisify(execFile)

const ROOT = path.resolve(import.meta.dirname, '..')
const DOCS = path.join(ROOT, 'docs')
const PUBLIC = path.join(DOCS, 'public')

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/* ------------------------------------------------------------------ */
/* 参数解析                                                            */
/* ------------------------------------------------------------------ */
function parseArgs(argv) {
  const o = {
    specs: [],
    section: 'games',
    cookies: process.env.BILI_COOKIES || path.join(process.env.HOME ?? '', 'yt-dlp/c-bili.txt'),
    tags: [],
    draft: false,
    delay: 3,
    webp: 88,
    dryRun: false,
    force: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--section' || a === '-s') o.section = argv[++i]
    else if (a === '--cookies' || a === '-c') o.cookies = argv[++i]
    else if (a === '--tags' || a === '-t') o.tags = (argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    else if (a === '--delay') o.delay = Number(argv[++i])
    else if (a === '--webp') o.webp = Number(argv[++i] ?? 88)
    else if (a === '--no-webp') o.webp = 0
    else if (a === '--draft') o.draft = true
    else if (a === '--dry-run') o.dryRun = true
    else if (a === '--force') o.force = true
    else if (a === '--help' || a === '-h') o.help = true
    else o.specs.push(a)
  }
  return o
}

/** `cv123=dst/foo` / `https://.../cv123/` -> { id, dest } */
function parseSpec(raw) {
  const [left, dest] = raw.split('=')
  const id = /(?:cv)?(\d{4,})/.exec(left.trim())
  if (!id) throw new Error(`看不懂这个专栏标识：${raw}`)
  return { id: Number(id[1]), dest: dest ? dest.replace(/^\/+|\/+$/g, '') : null }
}

/* ------------------------------------------------------------------ */
/* 抓取                                                                */
/* ------------------------------------------------------------------ */
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000))

/**
 * 走 curl 而不是 Node 自带的 fetch。
 * B 站的风控会看 TLS 指纹，undici 的连接会被直接判成 -509 请求过于频繁，
 * curl 则正常。别改回 fetch。
 */
async function curlText(url, referer, cookies) {
  const args = ['-sS', '--compressed', '--max-time', '60', '-H', `User-Agent: ${UA}`]
  if (referer) args.push('-H', `Referer: ${referer}`)
  args.push('-H', 'Accept: application/json, text/plain, */*')
  if (cookies && fs.existsSync(cookies)) args.push('-b', cookies)
  args.push(url)
  const { stdout } = await run('curl', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return stdout
}

async function checkCurl() {
  try {
    await run('curl', ['--version'], { encoding: 'utf8' })
  } catch {
    throw new Error('这个脚本需要 curl（B 站风控会拦 Node 的 fetch）。请先安装 curl。')
  }
}

/* ------------------------------------------------------------------ */
/* 图片压缩                                                            */
/* ------------------------------------------------------------------ */
/**
 * B 站原图是 1920x1080 的 PNG，一张两三兆，直接进仓库太胖。
 * 转成 WebP 一般能小三到五成，终端截图肉眼看不出差别。
 * @returns 'magick' | 'cwebp' | null
 */
async function detectImageTool() {
  for (const tool of ['magick', 'cwebp']) {
    try {
      await run(tool, ['-version'], { encoding: 'utf8' })
      return tool
    } catch {
      /* 换下一个 */
    }
  }
  return null
}

async function toWebp(tool, src, quality) {
  const out = src.replace(/\.(png|jpe?g)$/i, '.webp')
  if (tool === 'magick') {
    await run('magick', [src, '-quality', String(quality), '-define', 'webp:method=6', out])
  } else {
    await run('cwebp', ['-quiet', '-q', String(quality), src, '-o', out])
  }
  const size = fs.statSync(out).size
  fs.unlinkSync(src)
  return { file: out, size }
}

async function fetchArticle(id, cookies, { tries = 5 } = {}) {
  const url = `https://api.bilibili.com/x/article/view?id=${id}`
  const referer = `https://www.bilibili.com/read/cv${id}/`

  for (let t = 0; t < tries; t++) {
    const text = await curlText(url, referer, cookies)
    let json
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error(`返回的不是 JSON：${text.slice(0, 120)}`)
    }
    if (json.code === 0) return json.data

    // -352 / -509 都是限流，等一会儿再来
    const retriable = json.code === -352 || json.code === -509 || /频繁/.test(json.message ?? '')
    if (!retriable || t === tries - 1) throw new Error(`cv${id} 抓取失败：${json.code} ${json.message}`)
    const wait = 10 * (t + 1)
    process.stdout.write(`  ${json.message}，${wait}s 后重试…\n`)
    await sleep(wait)
  }
}

/* ------------------------------------------------------------------ */
/* HTML 处理                                                           */
/* ------------------------------------------------------------------ */
/** B 站把代码存进属性里时转义了一层，序列化 HTML 时又转义了一层，所以要解两次 */
function decodeEntities(input) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#34': '"' }
  const once = (s) =>
    s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (all, ent) => {
      if (ent[0] === '#') {
        const code = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10)
        return Number.isFinite(code) ? String.fromCodePoint(code) : all
      }
      return named[ent] ?? all
    })
  return once(once(input))
}

const LANG_ALIAS = {
  shell: 'bash',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  console: 'bash',
  javascript: 'js',
  js: 'js',
  typescript: 'ts',
  ts: 'ts',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  ini: 'ini',
  conf: 'ini',
  config: 'ini',
  nginx: 'nginx',
  sql: 'sql',
  xml: 'xml',
  html: 'html',
  css: 'css',
  python: 'python',
  py: 'python',
  java: 'java',
  lua: 'lua',
  csharp: 'csharp',
  powershell: 'powershell',
  ps1: 'powershell',
  bat: 'bat',
}

/** `shell@shell@Shell` -> `bash` */
function mapLang(dataLang) {
  if (!dataLang) return 'text'
  const last = dataLang.split('@').pop().trim().toLowerCase()
  return LANG_ALIAS[last] ?? (last.replace(/[^a-z0-9+#]/g, '') || 'text')
}

/** B 站给文章结尾插的装饰图（B站娘横幅），没有信息量，丢掉 */
function isDecoration(node) {
  const cls = node.getAttribute?.('class') ?? ''
  return /(^|\s)cut-off-\d+/.test(cls)
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const FIGURE_RE = /<figure([^>]*)>([\s\S]*?)<\/figure>/gi

/**
 * 把 B 站的代码块从「属性」搬回「文本」。
 *
 * B 站存代码的方式是 <figure class="code-box"><pre codecontent="真实代码"><code></code></pre></figure>，
 * 元素本身在 DOM 里是空的。turndown 在 collapseWhitespace 阶段会调用 isBlank()
 * 把这些「空白块」直接删掉 —— 元素都到不了规则层，所以必须在这里先动手。
 *
 * 搬完之后换成标准写法 <pre><code class="language-xxx">，交给 turndown 默认的围栏代码块规则。
 */
function inlineCodeBlocks(html) {
  return html.replace(FIGURE_RE, (all, figAttrs, inner) => {
    const figClass = /\bclass="([^"]*)"/.exec(figAttrs)?.[1] ?? ''
    if (!/\bcode-box\b/.test(figClass)) return all

    const preAttrs = /<pre([^>]*)>/.exec(inner)?.[1]
    if (preAttrs === undefined) return all

    const code = decodeEntities(/\bcodecontent="([\s\S]*?)"/.exec(preAttrs)?.[1] ?? '')
    if (!code.trim()) return ''

    const lang = mapLang(/\bdata-lang="([^"]*)"/.exec(preAttrs)?.[1])
    return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
  })
}

function absoluteUrl(src) {
  if (!src) return null
  if (src.startsWith('//')) return 'https:' + src
  if (src.startsWith('http')) return src
  return 'https://' + src.replace(/^\/+/, '')
}

/**
 * 扫出正文里所有需要下载的图片。
 * article-card 是「引用了另一篇专栏」的卡片图，不下载，转成链接。
 */
function collectImages(html) {
  const out = []
  const seen = new Set()
  const re = /<img\b([^>]*)>/gi
  let m
  while ((m = re.exec(html))) {
    const attrs = m[1]
    const src = /\bsrc="([^"]*)"/.exec(attrs)?.[1]
    const cls = /\bclass="([^"]*)"/.exec(attrs)?.[1] ?? ''
    const aid = /\baid="(\d+)"/.exec(attrs)?.[1]
    const url = absoluteUrl(src)
    if (!url) continue
    if (/(^|\s)cut-off-\d+/.test(cls)) continue
    if (/\barticle-card\b/.test(cls) || aid) {
      out.push({ kind: 'card', url, aid: aid ? Number(aid) : null })
      continue
    }
    if (seen.has(url)) {
      out.push({ kind: 'dup', url })
      continue
    }
    seen.add(url)
    out.push({ kind: 'image', url })
  }
  return out
}

async function downloadImage(url, dest, cookies) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const args = ['-sS', '--compressed', '--max-time', '120', '-H', `User-Agent: ${UA}`, '-H', 'Referer: https://www.bilibili.com/']
  if (fs.existsSync(cookies)) args.push('-b', cookies)
  args.push('-o', dest, url)
  await run('curl', args, { encoding: 'utf8' })
  const size = fs.statSync(dest).size
  if (size === 0) throw new Error('下载到 0 字节')
  return size
}

/* ------------------------------------------------------------------ */
/* HTML -> Markdown                                                    */
/* ------------------------------------------------------------------ */
function makeTurndown(imageMap) {
  const td = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full',
  })

  // figure 本身不是 HTML 块级元素，turndown 默认会当行内处理，手动隔开
  td.addRule('figure', {
    filter: 'figure',
    replacement: (content) => (content.trim() ? `\n\n${content.trim()}\n\n` : ''),
  })

  // 图：装饰图丢掉，引用卡片转链接，其余换成下载到本地的附件名
  td.addRule('biliImage', {
    filter: 'img',
    replacement: (_content, node) => {
      if (isDecoration(node)) return ''
      const url = absoluteUrl(node.getAttribute('src'))
      if (!url) return ''

      const aid = node.getAttribute('aid')
      if (aid || /\barticle-card\b/.test(node.getAttribute('class') ?? '')) {
        return aid ? `\n\n> 参考：[Bilibili 专栏 cv${aid}](https://www.bilibili.com/read/cv${aid}/)\n\n` : ''
      }

      const local = imageMap.get(url)
      if (!local) return ''
      return `\n\n![[${local}]]\n\n`
    },
  })

  // 标题整体下沉一级：正文的 h1 变成 h2，页面顶部由我们自己的 # 标题占位
  for (const lvl of [1, 2, 3, 4, 5]) {
    td.addRule(`h${lvl}Title`, {
      filter: `h${lvl}`,
      replacement: (content) => `\n\n${'#'.repeat(lvl + 1)} ${content.trim()}\n\n`,
    })
  }

  // figcaption 留空就整块删掉，别留下空行
  td.addRule('biliCaption', {
    filter: 'figcaption',
    replacement: (content) => (content.trim() ? `\n\n*${content.trim()}*\n\n` : ''),
  })

  // <li><p>文字</p></li> 里的 p 会产生多余空行，把列表撑成「松散列表」
  td.addRule('paragraphInListItem', {
    filter: (node) => node.nodeName === 'P' && node.parentNode?.nodeName === 'LI',
    replacement: (content) => content.trim(),
  })

  return td
}

function tidy(markdown) {
  return (
    markdown
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      // 空标题、空段落留下的碎片
      .replace(/^#{2,6}\s*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  )
}

/* ------------------------------------------------------------------ */
/* 主流程                                                              */
/* ------------------------------------------------------------------ */
function fmtDate(ts) {
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function slugifyAscii(title) {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return s || 'untitled-' + Date.now().toString(36)
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

async function importOne(spec, opts) {
  console.log(`\n📥 cv${spec.id}`)
  const data = await fetchArticle(spec.id, opts.cookies)

  const dest = spec.dest ?? slugifyAscii(data.title)
  const parts = dest.split('/')
  const fileBase = parts.pop()
  const subDir = parts.join('/')
  const noteDir = path.join(DOCS, opts.section, subDir)
  const noteFile = path.join(noteDir, `${fileBase}.md`)
  const rel = path.relative(ROOT, noteFile)

  if (fs.existsSync(noteFile) && !opts.force && !opts.dryRun) {
    console.log(`   ⏭  已存在，跳过（要覆盖加 --force）：${rel}`)
    return { skipped: true }
  }

  console.log(`   ${data.title}`)
  console.log(`   ${data.stats.view} 阅读 · ${fmtDate(data.publish_time)} · ${data.words} 字`)

  /* --- 1. 下载图片 --- */
  const found = collectImages(data.content)
  const imageMap = new Map()
  const assetDir = path.join(PUBLIC, 'assets', opts.section, subDir)
  const webpTool = opts.webp ? await detectImageTool() : null
  let n = 0
  let bytes = 0

  if (opts.webp && !webpTool && !opts.dryRun) {
    console.warn('   ⚠️  没找到 magick/cwebp，图片保留原格式（会大很多）')
    console.warn('      macOS: brew install imagemagick')
  }

  for (const item of found) {
    if (item.kind !== 'image') continue
    const srcExt = (path.extname(new URL(item.url).pathname) || '.png').toLowerCase()
    const convert = webpTool && /\.(png|jpe?g)$/i.test(srcExt)
    n += 1
    const name = `${fileBase}-${String(n).padStart(2, '0')}${convert ? '.webp' : srcExt}`
    const target = path.join(assetDir, name)
    imageMap.set(item.url, name)
    if (opts.dryRun) continue
    try {
      const rawPath = path.join(assetDir, `${fileBase}-${String(n).padStart(2, '0')}${srcExt}`)
      await downloadImage(item.url, rawPath, opts.cookies)
      if (convert) {
        const res = await toWebp(webpTool, rawPath, opts.webp)
        bytes += res.size
      } else {
        bytes += fs.statSync(rawPath).size
      }
    } catch (err) {
      console.warn(`   ⚠️  图片处理失败 ${name}: ${err.message}`)
      imageMap.delete(item.url)
    }
    await sleep(0.3)
  }
  if (n) console.log(`   🖼  图片 ${imageMap.size}/${n} 张，${(bytes / 1024 / 1024).toFixed(1)} MB`)

  /* --- 2. 转 Markdown --- */
  const td = makeTurndown(imageMap)
  const body = tidy(td.turndown(inlineCodeBlocks(data.content)))

  /* --- 3. 组装 --- */
  const tags = [...new Set([...(data.tags ?? []).map((t) => t.name), ...opts.tags])].slice(0, 6)
  const url = `https://www.bilibili.com/read/cv${data.id}/`
  const order = opts.dryRun ? 100 : nextOrder(noteDir)

  const frontmatter = [
    '---',
    `title: "${data.title.replace(/"/g, '\\"')}"`,
    `tags: [${tags.join(', ')}]`,
    `order: ${order}`,
    `source: ${url}`,
    `sourceDate: ${fmtDate(data.publish_time)}`,
    `draft: ${opts.draft}`,
    '---',
  ].join('\n')

  const header = [
    `# ${data.title}`,
    '',
    '> [!NOTE] 本文原载于 Bilibili 专栏',
    `> [阅读原文](${url}) · ${fmtDate(data.publish_time)}`,
    '> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。',
    '',
  ].join('\n')

  const out = `${frontmatter}\n\n${header}\n${body}`

  if (opts.dryRun) {
    console.log('   (dry-run) ' + rel)
    console.log(out.split('\n').slice(0, 24).map((l) => '      | ' + l).join('\n'))
    return { rel, count: n }
  }

  fs.mkdirSync(noteDir, { recursive: true })
  fs.writeFileSync(noteFile, out)
  console.log(`   ✅ ${rel}`)
  return { rel, count: n, bytes }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help || !opts.specs.length) {
    const lines = fs
      .readFileSync(new URL(import.meta.url), 'utf8')
      .split('\n')
      .slice(1, 32)
      .map((l) => l.replace(/^ \*\/?/, ''))
    console.log(lines.join('\n'))
    process.exit(opts.specs.length ? 0 : 1)
  }

  await checkCurl()

  if (!fs.existsSync(opts.cookies)) {
    console.warn(`⚠️  没找到 cookie 文件 ${opts.cookies}，B 站大概率会限流。`)
  }

  const specs = opts.specs.map(parseSpec)
  const done = []
  for (const spec of specs) {
    try {
      const r = await importOne(spec, opts)
      if (!r.skipped) done.push(r)
    } catch (err) {
      console.error(`   ❌ cv${spec.id}: ${err.message}`)
    }
    await sleep(opts.delay)
  }

  const total = done.reduce((a, b) => a + (b.bytes ?? 0), 0)
  console.log(`\n完成 ${done.length}/${specs.length} 篇，图片合计 ${(total / 1024 / 1024).toFixed(1)} MB`)
  console.log('接着跑一下：pnpm status && pnpm build')
}

export { makeTurndown, tidy, collectImages, mapLang, decodeEntities, parseSpec, inlineCodeBlocks }

const isEntry = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isEntry) {
  main().catch((err) => {
    console.error('❌ ' + err.message)
    process.exit(1)
  })
}
