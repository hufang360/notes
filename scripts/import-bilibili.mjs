#!/usr/bin/env node
/**
 * 把 Bilibili 专栏导入成笔记。
 *
 * 用法：
 *   node scripts/import-bilibili.mjs [选项] <专栏...>
 *
 * 专栏可以写成 cv 号、纯数字、完整链接，或者 opus 链接（会自动换成专栏）：
 *   cv14792889=dst/linux-server
 *   14798689=dst/config
 *   https://www.bilibili.com/read/cv14801260/=dst/windows-server
 *   https://www.bilibili.com/opus/1248545562776567810
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

/**
 * `cv123=dst/foo` / `https://.../cv123/` / `https://.../opus/456/` -> { id, opus, dest }
 * opus 链接里是「动态」id，不是 cv 号，得先换成 cv 号（见 opusToArticleId）。
 */
function parseSpec(raw) {
  const [left, dest] = raw.split('=')
  const s = left.trim()
  const id = /(?:cv)?(\d{4,})/.exec(s)
  if (!id) throw new Error(`看不懂这个专栏标识：${raw}`)
  // opus id 是 1e18 量级，超过 Number 的安全整数，得留着原始字符串
  return {
    id: Number(id[1]),
    idStr: id[1],
    opus: /\/opus\//.test(s),
    dest: dest ? dest.replace(/^\/+|\/+$/g, '') : null,
  }
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

/**
 * opus 链接里的 id 是「动态」id（1e18 量级），不是 cv 号。
 * 专栏类动态的详情接口里，`basic.rid_str` 就是对应的 cv 号。
 */
async function opusToArticleId(opusId, cookies) {
  const url = `https://api.bilibili.com/x/polymer/web-dynamic/v1/detail?id=${opusId}`
  const text = await curlText(url, `https://www.bilibili.com/opus/${opusId}`, cookies)
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`opus ${opusId} 返回的不是 JSON：${text.slice(0, 120)}`)
  }
  if (json.code !== 0) throw new Error(`opus ${opusId} 解析失败：${json.code} ${json.message}`)
  const item = json.data?.item
  if (item?.type !== 'DYNAMIC_TYPE_ARTICLE') throw new Error(`opus ${opusId} 不是专栏（${item?.type ?? '未知'}）`)
  return Number(item.basic.rid_str)
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
 * B 站的「动态」类型内容不是 HTML，而是 Quill Delta（`{"ops":[...]}`）。
 * 这里转成等价 HTML，后面的图片下载和 turndown 流程原样复用。
 * 不是 Delta 就返回 null，让调用方用原内容。
 */
function deltaToHtml(content) {
  if (!content || content[0] !== '{') return null
  let doc
  try {
    doc = JSON.parse(content)
  } catch {
    return null
  }
  if (!Array.isArray(doc?.ops)) return null

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const out = []
  let runs = []
  let codeBuf = null
  let listBuf = null
  let listType = null

  const runHtml = (text, a = {}) => {
    let s = esc(text)
    if (a.code) s = `<code>${s}</code>`
    if (a.bold) s = `<strong>${s}</strong>`
    if (a.italic) s = `<em>${s}</em>`
    if (a.strike) s = `<s>${s}</s>`
    if (a.underline) s = `<u>${s}</u>`
    if (a.link) s = `<a href="${a.link}">${s}</a>`
    return s
  }

  const closeCode = () => {
    if (codeBuf === null) return
    out.push(`<pre><code>${esc(codeBuf.join('\n'))}</code></pre>`)
    codeBuf = null
  }
  const closeList = () => {
    if (listBuf === null) return
    const tag = listType === 'ordered' ? 'ol' : 'ul'
    out.push(`<${tag}>${listBuf.map((t) => `<li><p>${t}</p></li>`).join('')}</${tag}>`)
    listBuf = null
    listType = null
  }

  const flushLine = (attrs = {}) => {
    const html = runs.map((r) => r.html).join('').trim()
    const plain = runs.map((r) => r.text).join('').trim()
    runs = []

    if (attrs['code-block']) {
      closeList()
      if (codeBuf === null) codeBuf = []
      codeBuf.push(plain)
      return
    }
    closeCode()

    if (attrs.list) {
      if (listBuf === null) listBuf = []
      listBuf.push(html)
      listType = attrs.list
      return
    }
    closeList()

    if (!html) return
    // 标题下沉一级，页面顶部由我们自己的 # 标题占位
    const level = Math.min(Number(attrs.header) + 1 || 0, 6)
    if (level) out.push(`<h${level}>${html}</h${level}>`)
    else if (attrs.blockquote) out.push(`<blockquote><p>${html}</p></blockquote>`)
    else out.push(`<p>${html}</p>`)
  }

  for (const op of doc.ops) {
    const ins = op.insert
    if (typeof ins === 'string') {
      const parts = ins.split('\n')
      for (let i = 0; i < parts.length; i++) {
        if (parts[i]) runs.push({ html: runHtml(parts[i], op.attributes), text: parts[i] })
        if (i < parts.length - 1) flushLine(op.attributes ?? {})
      }
    } else if (ins && typeof ins === 'object') {
      if (ins['native-image']?.url) {
        runs.push({ html: `<img src="${ins['native-image'].url}">`, text: '' })
      }
      // cut-off 是 B 站结尾的装饰图，丢掉
    }
  }
  flushLine({})
  closeCode()
  closeList()

  return out.join('\n')
}

/**
 * 有些文章（B 站新版编辑器写的）`content` 是**纯文本**，一个 HTML 标签都没有。
 * 直接交给 markdown-it，几十个换行会被当成软换行挤成一坨 —— 排版就毁了。
 *
 * 处理方式：
 *   1. 认出代码段落 -> 围栏代码块。这一步不只是"好看"：不进代码块的话，
 *      `$targetDir` 会被 MathJax 当行内公式吃掉、`x86*` 会变斜体、`# 注释` 会变标题。
 *   2. 其余按散文处理：保留原换行（行尾两空格 = 硬换行），
 *      并转义行首行尾会被 markdown 当语法的字符。
 *
 * 代码的判定：(a) 以 `#` 开头（这类文里不会有 markdown 标题），或 (b) 整行没有中文。
 * 这比"看缩进"可靠 —— 这批文里 `# 切换工作目录` 是带中文的 shell 注释，
 * 按 ASCII 分隔只会把代码和它的注释拆开。
 */
function plainTextToMarkdown(text) {
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n')

  const isCode = (l) => {
    const s = l.trim()
    if (!s) return false
    // 单独一行的链接当散文，这样 linkify 能把它变成可点的链接
    if (/^https?:\/\/\S+$/.test(s)) return false
    if (s.startsWith('#')) return true
    return !/[\u4e00-\u9fff]/.test(s)
  }

  const escapeProse = (line) =>
    line
      .replace(/^(\s*)(#{1,6})(\s)/, (_, a, b, c) => `${a}\\${b}${c}`)
      .replace(/^(\s*)([-+*])(\s)/, (_, a, b, c) => `${a}\\${b}${c}`)
      .replace(/^(\s*)(\d+)\.(\s)/, (_, a, b, c) => `${a}${b}\\.${c}`)
      .replace(/^(\s*)>/, (_, a) => `${a}\\>`)
      .replace(/^(\s*)\|/, (_, a) => `${a}\\|`)
      // $ 会被 MathJax 当公式定界符，转义掉
      .replace(/\$/g, () => '\\$')
      // 行尾反斜杠（shell 续行）会被 markdown 当硬换行，多补一个以字面显示
      .replace(/\\+$/, (m) => m + '\\')

  const out = []
  let i = 0
  while (i < lines.length) {
    if (isCode(lines[i])) {
      const buf = []
      // 代码段中间的空行不切断，否则 heredoc / 多段命令会被拆成好几个块
      while (i < lines.length) {
        if (isCode(lines[i])) {
          buf.push(lines[i])
          i++
          continue
        }
        if (!lines[i].trim()) {
          let j = i
          while (j < lines.length && !lines[j].trim()) j++
          if (j < lines.length && isCode(lines[j])) {
            for (; i < j; i++) buf.push('')
            continue
          }
        }
        break
      }
      while (buf.length && !buf[buf.length - 1].trim()) buf.pop()
      const lang = buf.some((l) => /^(services|volumes|version):/.test(l)) ? 'yaml' : 'bash'
      out.push('```' + lang, ...buf.map((l) => l.replace(/\s+$/, '')), '```', '')
    } else if (!lines[i].trim()) {
      out.push('')
      i++
    } else {
      const next = lines[i + 1]
      out.push(next !== undefined && next.trim() ? escapeProse(lines[i]) + '  ' : escapeProse(lines[i]))
      i++
    }
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

/** 正文里一个 HTML 标签都没有，当纯文本处理 */
function isPlainText(content) {
  return !/<[a-zA-Z][^>]*>/.test(content)
}

/**
 * 新版编辑器的文章 `content` 是纯文本，标题和代码块的边界全丢了：
 * `# 镜像tag` 后面跟着中文列表项时，`plainTextToMarkdown` 会把代码块切断，
 * 标题也会被当成正文。好在同一份响应里的 `opus.content.paragraphs` 有结构。
 *
 * 段落：1 文本 / 2 图片 / 3 分割线 / 6 列表项 / 7 引用卡片 / 8 代码 / 9 标题；
 * 节点：1 文字 / 4 链接。认不出的段落或节点跳过，不整篇放弃。
 * 图片要用 `imageMap`（importOne 里下好的），见 `collectOpusImages`。
 */
function opusToMarkdown(paragraphs, imageMap) {
  if (!Array.isArray(paragraphs) || !paragraphs.length) return null

  // 反引号里是行内代码，原样留；外面转义掉会被 markdown / MathJax 当语法的字符
  const escapeProse = (s) =>
    s
      .split(/(`[^`]*`)/g)
      .map((seg, i) => (i % 2 ? seg : seg.replace(/\$/g, '\\$')))
      .join('')
      .replace(/^(\s*)(#{1,6}\s|[-+*]\s|\d+\.\s|>|\|)/, (_, a, b) => `${a}\\${b}`)

  const renderNodes = (nodes) =>
    (nodes ?? [])
      .map((n) => {
        if (n.node_type === 4) {
          const { show_text: text = '', link = '' } = n.link ?? {}
          // 链接卡片的显示文字固定是「网页链接」，没有信息量，直接露出 URL
          return !text || text === '网页链接' ? link : `[${text}](${link})`
        }
        return escapeProse(n.word?.words ?? '')
      })
      .join('')

  const out = []
  const blank = () => {
    if (out.length && out[out.length - 1] !== '') out.push('')
  }
  let inList = false

  for (const p of paragraphs) {
    // 图片：正文里的图已经在 importOne 里下好了，这里只引用
    if (p.para_type === 2) {
      const imgs = (p.pic?.pics ?? [])
        .map((pic) => imageMap?.get(absoluteUrl(pic.url)))
        .filter(Boolean)
        .map((name) => `![[${name}]]`)
      if (imgs.length) {
        blank()
        out.push(...imgs)
        blank()
      }
      continue
    }

    // 分割线；带 pic 的是 B 站自己插的装饰图（比如结尾横幅），丢掉
    if (p.para_type === 3) {
      if (p.line?.line_type) {
        blank()
        out.push('---')
        blank()
      }
      continue
    }

    // 引用其它专栏 / 动态的卡片
    if (p.para_type === 7) {
      const card = p.link_card?.card
      if (card?.link) {
        blank()
        out.push(`[${card.show_text || card.link}](${card.link})`)
        blank()
      }
      continue
    }

    if (p.para_type === 8) {
      blank()
      const code = String(p.code?.content ?? '').replace(/^\n+/, '').replace(/\s+$/, '')
      out.push('```' + mapLang(p.code?.lang), code, '```')
      blank()
      continue
    }

    if (p.para_type === 9) {
      // heading_type 2 是 B 站的章节标题，对应其它笔记里的 ##
      const level = Math.min(Math.max(Number(p.format?.heading_type) || 2, 2), 6)
      const text = renderNodes(p.text?.nodes).trim()
      blank()
      if (text) out.push(`${'#'.repeat(level)} ${text}`)
      blank()
      continue
    }

    if (p.para_type === 6) {
      const lf = p.format?.list_format ?? {}
      const indent = '  '.repeat(Math.max((lf.level ?? 1) - 1, 0))
      const bullet = lf.theme === 'dot' ? '-' : `${lf.order ?? 1}.`
      out.push(`${indent}${bullet} ${renderNodes(p.text?.nodes).trim()}`)
      inList = true
      continue
    }

    // para_type 1（文本），空段落只当分隔，不留空行
    const text = renderNodes(p.text?.nodes).trim()
    if (inList) {
      blank()
      inList = false
    }
    if (text) {
      out.push(text)
      blank()
    }
  }

  return out.join('\n').trim() + '\n'
}

/**
 * 新版编辑器的图片不在 HTML 里，在 opus 段落的 `para_type: 2`。
 * 和 `collectImages` 返回同一种结构，复用后面的下载流程。
 */
function collectOpusImages(paragraphs) {
  const out = []
  const seen = new Set()
  for (const p of Array.isArray(paragraphs) ? paragraphs : []) {
    if (p.para_type !== 2) continue
    for (const pic of p.pic?.pics ?? []) {
      const url = absoluteUrl(pic.url)
      if (!url || seen.has(url)) continue
      seen.add(url)
      out.push({ kind: 'image', url })
    }
  }
  return out
}

/**
 * 把 B 站代码块从「属性」搬回「文本」的。
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
  let url = src
  if (url.startsWith('//')) url = 'https:' + url
  else if (!url.startsWith('http')) url = 'https://' + url.replace(/^\/+/, '')
  // B 站网页版会在原图 URL 后拼处理参数，例如
  //   xxx.png@1192w.avif   -> 缩放到 1192 宽并转成 avif
  //   xxx.png@1192w_1080h.webp
  // 要的是原图，把 @ 之后那段砍掉。实测 API 返回的 content 里不带这个后缀，
  // 但手写的笔记里可能会出现，所以在这里统一处理。
  const at = url.indexOf('@')
  return at === -1 ? url : url.slice(0, at)
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

async function importOne(spec, opts) {
  const cvId = spec.opus ? await opusToArticleId(spec.idStr, opts.cookies) : spec.id
  console.log(`\n📥 ${spec.opus ? `opus${spec.idStr} → cv${cvId}` : `cv${spec.id}`}`)
  const data = await fetchArticle(cvId, opts.cookies)

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
  const plain = isPlainText(data.content)
  const opusParas = plain ? data.opus?.content?.paragraphs : null
  const html = plain ? '' : deltaToHtml(data.content) ?? data.content
  // 纯文本正文里没有 HTML，图片要从 opus 段落里捞
  const found = plain ? collectOpusImages(opusParas) : collectImages(html)
  const imageMap = new Map()
  // 图片平铺在 docs/public/assets/ 下，不按节点分子目录
  const assetDir = path.join(PUBLIC, 'assets')
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
  // 纯文本文章（B 站新版编辑器写的）没有任何结构可依，按原样保留换行；
  // 其余走 turndown。
  const td = makeTurndown(imageMap)
  // 新版编辑器的纯文本正文优先用 opus 段落结构还原，实在不行再退回启发式
  const body = plain
    ? opusToMarkdown(opusParas, imageMap) ?? plainTextToMarkdown(data.content)
    : tidy(td.turndown(inlineCodeBlocks(html)))

  /* --- 3. 组装 --- */
  const tags = [...new Set([...(data.tags ?? []).map((t) => t.name), ...opts.tags])].slice(0, 6)
  const url = `https://www.bilibili.com/read/cv${data.id}/`

  // 不写 order：vault.mts 里「没写 order 的采集笔记」按 cv 号倒序，
  // 新文章自动排到最前。要钉住位置再手动加 order。
  const frontmatter = [
    '---',
    `title: "${data.title.replace(/"/g, '\\"')}"`,
    `tags: [${tags.join(', ')}]`,
    `source: ${url}`,
    `sourceDate: ${fmtDate(data.publish_time)}`,
    `draft: ${opts.draft}`,
    '---',
  ].join('\n')

  // 刚发的文章不用挂「成文较早」的免责声明
  const stale = Date.now() / 1000 - data.publish_time > 365 * 24 * 3600
  const header = [
    `# ${data.title}`,
    '',
    '> [!NOTE] 本文原载于 Bilibili 专栏',
    `> [阅读原文](${url}) · ${fmtDate(data.publish_time)}`,
    ...(stale ? ['> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。'] : []),
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

export {
  makeTurndown,
  tidy,
  collectImages,
  mapLang,
  decodeEntities,
  parseSpec,
  inlineCodeBlocks,
  deltaToHtml,
  absoluteUrl,
  plainTextToMarkdown,
  isPlainText,
  opusToMarkdown,
  collectOpusImages,
  opusToArticleId,
}

const isEntry = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isEntry) {
  main().catch((err) => {
    console.error('❌ ' + err.message)
    process.exit(1)
  })
}
