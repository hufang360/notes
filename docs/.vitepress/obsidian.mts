/**
 * obsidian.mts —— 让 VitePress 直接吃 Obsidian 的写法
 *
 * 支持的语法：
 *   [[笔记名]]                  双链，自动解析成相对链接
 *   [[笔记名|显示文字]]          带别名的双链
 *   [[笔记名#标题]]              锚点链接
 *   ![[图片.png]]               图片嵌入（去 docs/public/ 里找）
 *   ![[图片.png|300]]           指定宽度
 *   > [!note] / [!warning] ...  Obsidian callout -> VitePress alert
 *   %%注释%%                    注释，构建时删掉
 *   ==高亮==                    -> <mark>
 *
 * 找不到目标时不会瞎猜：原样保留文字，并在构建日志里打一条警告。
 */
import path from 'node:path'
import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import type { NoteRef } from './vault.mts'

export interface ObsidianOptions {
  /** 见 vault.mts 的 noteIndex */
  noteIndex: Map<string, NoteRef>
  /** 有重名的文件名 */
  ambiguousBases: string[]
  /** 见 vault.mts 的 assetIndex */
  assetIndex: Map<string, string>
}

const CALLOUT_MAP: Record<string, string> = {
  note: 'NOTE',
  info: 'NOTE',
  todo: 'NOTE',
  abstract: 'NOTE',
  summary: 'NOTE',
  tldr: 'NOTE',
  example: 'NOTE',
  quote: 'NOTE',
  cite: 'NOTE',
  tip: 'TIP',
  hint: 'TIP',
  success: 'TIP',
  check: 'TIP',
  done: 'TIP',
  important: 'IMPORTANT',
  question: 'IMPORTANT',
  help: 'IMPORTANT',
  faq: 'IMPORTANT',
  warning: 'WARNING',
  caution: 'WARNING',
  attention: 'WARNING',
  danger: 'CAUTION',
  error: 'CAUTION',
  failure: 'CAUTION',
  fail: 'CAUTION',
  missing: 'CAUTION',
  bug: 'CAUTION',
}

/** URL 片段用：尽量贴近 rehype-slug 的行为 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\p{L}\p{N}\-_]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

function withExtension(name: string): string {
  return /\.(md|markdown)$/i.test(name) ? name : name + '.md'
}

function normalizeKey(name: string): string {
  return name.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/\.(md|markdown)$/i, '').toLowerCase()
}

/** 把 [[target]] 的 target 解析成相对当前页面的链接和默认显示名 */
function resolveNoteLink(
  rawTarget: string,
  currentRel: string,
  noteIndex: Map<string, NoteRef>,
  ambiguousBases: string[],
  warn: (msg: string) => void
): { href: string; title: string } | null {
  let target = rawTarget.trim()
  let anchor = ''
  const hash = target.indexOf('#')
  if (hash !== -1) {
    anchor = target.slice(hash + 1).trim()
    target = target.slice(0, hash).trim()
  }

  // 去掉 Obsidian 的块引用 ^block-id
  if (anchor.startsWith('^')) anchor = ''

  const key = normalizeKey(target)
  let found = noteIndex.get(key)

  // 后缀匹配：允许省略顶层分类，例如 [[terraria/tshock]] -> games/terraria/tshock
  if (!found && key.includes('/')) {
    const hits = [...noteIndex.entries()].filter(([k]) => k.includes('/') && k.endsWith('/' + key))
    if (hits.length === 1) found = hits[0][1]
    else if (hits.length > 1) {
      warn(`[[${rawTarget}]] 有歧义，同时匹配到：${hits.map(([k]) => k).join('、')}`)
      return null
    }
  }

  if (!found) {
    warn(
      ambiguousBases.includes(key)
        ? `[[${rawTarget}]] 不明确：仓库里有多个叫 ${key}.md 的笔记，请写完整路径`
        : `找不到笔记 [[${rawTarget}]]`
    )
    return null
  }

  const fromDir = path.posix.dirname(currentRel)
  let href = path.posix.relative(fromDir === '.' ? '' : fromDir, found.rel)
  if (!href.startsWith('.')) href = './' + href
  if (anchor) href += '#' + slugify(anchor)

  return { href, title: found.title }
}

function resolveAsset(
  rawTarget: string,
  assetIndex: Map<string, string>,
  warn: (msg: string) => void
): { src: string; alt: string; width?: string } | null {
  const parts = rawTarget.split('|')
  const name = parts[0].trim()
  const extra = (parts[1] ?? '').trim()
  const key = name.replace(/\\/g, '/').split('/').pop()!.toLowerCase()
  const src = assetIndex.get(key)
  if (!src) {
    warn(`找不到附件 ![[${rawTarget}]]（请把图片放进 docs/public/assets/ 下）`)
    return null
  }
  // `![[图.png|300]]` 里 | 后面是数字 -> 宽度；否则当作 alt 文字
  const isWidth = /^\d+$/.test(extra)
  return {
    src,
    alt: isWidth ? name.split('/').pop()! : extra || name.split('/').pop()!,
    width: isWidth ? extra : undefined,
  }
}

/** 把一段纯文本里的 [[...]] 拆成 token */
function expandText(
  state: { Token: typeof Token },
  content: string,
  ctx: { currentRel: string; opts: ObsidianOptions; warn: (m: string) => void }
): Token[] | null {
  const re = /(!?)\[\[([^[\]\n]+?)\]\]/g
  if (!re.test(content)) return null
  re.lastIndex = 0

  const out: Token[] = []
  let last = 0
  let m: RegExpExecArray | null

  const pushText = (s: string) => {
    if (!s) return
    const t = new state.Token('text', '', 0)
    t.content = s
    out.push(t)
  }

  while ((m = re.exec(content))) {
    pushText(content.slice(last, m.index))
    last = m.index + m[0].length

    const embed = m[1] === '!'
    const inner = m[2]
    const pipe = inner.indexOf('|')

    if (embed) {
      const isImage = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(inner.split('|')[0].trim())
      if (isImage) {
        const asset = resolveAsset(inner, ctx.opts.assetIndex, ctx.warn)
        if (asset) {
          const img = new state.Token('image', 'img', 0)
          img.attrs = [
            ['src', asset.src],
            ['alt', asset.alt],
          ]
          if (asset.width) img.attrs.push(['width', asset.width])
          const altTok = new state.Token('text', '', 0)
          altTok.content = asset.alt
          img.children = [altTok]
          img.content = asset.alt
          out.push(img)
          continue
        }
      } else {
        // ![[整篇笔记]] 的嵌入：静态站做不了内联转写，退化成链接
        const target = resolveNoteLink(
          pipe === -1 ? inner : inner.slice(0, pipe),
          ctx.currentRel,
          ctx.opts.noteIndex,
          ctx.opts.ambiguousBases,
          ctx.warn
        )
        if (target) {
          const label = pipe === -1 ? target.title : inner.slice(pipe + 1).trim()
          out.push(...linkTokens(state, target.href, '📄 ' + label))
          continue
        }
      }
    } else {
      const target = resolveNoteLink(
        pipe === -1 ? inner : inner.slice(0, pipe),
        ctx.currentRel,
        ctx.opts.noteIndex,
        ctx.opts.ambiguousBases,
        ctx.warn
      )
      if (target) {
        // 不写别名时，用笔记的标题做显示文字（比显示文件名友好）
        const label = pipe === -1 ? target.title : inner.slice(pipe + 1).trim()
        out.push(...linkTokens(state, target.href, label))
        continue
      }
    }

    // 解析失败：原样保留，让人一眼能看到
    pushText(m[0])
  }

  pushText(content.slice(last))
  return out
}

function linkTokens(state: { Token: typeof Token }, href: string, label: string): Token[] {
  const open = new state.Token('link_open', 'a', 1)
  open.attrs = [['href', href]]
  const text = new state.Token('text', '', 0)
  text.content = label
  const close = new state.Token('link_close', 'a', -1)
  return [open, text, close]
}

/**
 * 预处理：callout / 注释 / 高亮
 * 必须跳过代码块，否则代码里的 %% 和 == 会被误伤。
 */
function preprocess(src: string): string {
  const lines = src.split('\n')
  const out: string[] = []
  let fence: string | null = null
  let inComment = false

  for (let line of lines) {
    const fenceMatch = /^\s{0,3}(`{3,}|~{3,})/.exec(line)
    if (fenceMatch) {
      const marker = fenceMatch[1]
      if (!fence) fence = marker
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null
      out.push(line)
      continue
    }
    if (fence) {
      out.push(line)
      continue
    }

    // 多行 %% 注释
    if (inComment) {
      const end = line.indexOf('%%')
      if (end === -1) continue
      line = line.slice(end + 2)
      inComment = false
    }

    // 单行 %% 注释（可能有多段）
    line = line.replace(/%%[^%]*(?:%(?!%)[^%]*)*%%/g, '')
    // 未闭合 -> 进入跨行注释模式
    const openIdx = line.indexOf('%%')
    if (openIdx !== -1 && !line.includes('%%', openIdx + 2)) {
      line = line.slice(0, openIdx)
      inComment = true
    }

    // callout: > [!note] 标题  ->  > [!NOTE] 标题
    line = line.replace(
      /^(\s*(?:>\s*)*)\[!([A-Za-z]+)\]([+-]?)/,
      (_all, prefix: string, type: string) => `${prefix}[!${CALLOUT_MAP[type.toLowerCase()] ?? 'NOTE'}]`
    )

    // ==高亮== -> <mark>
    line = line.replace(/==(?!=)([^=\n]+?)==/g, '<mark>$1</mark>')

    out.push(line)
  }

  return out.join('\n')
}

export function obsidianPlugin(md: MarkdownIt, opts: ObsidianOptions) {
  const warned = new Set<string>()
  const warn = (msg: string) => {
    if (warned.has(msg)) return
    warned.add(msg)
    console.warn('  ⚠️  ' + msg)
  }

  md.core.ruler.before('block', 'obsidian_preprocess', (state) => {
    state.src = preprocess(state.src)
  })

  md.core.ruler.push('obsidian_inline', (state) => {
    const env = (state.env ?? {}) as { relativePath?: string }
    const currentRel = (env.relativePath ?? '').replace(/\\/g, '/')
    const ctx = { currentRel, opts, warn }

    for (const token of state.tokens) {
      if (token.type !== 'inline' || !token.children) continue
      const next: Token[] = []
      let changed = false
      for (const child of token.children) {
        if (child.type !== 'text' || !child.content.includes('[[')) {
          next.push(child)
          continue
        }
        const expanded = expandText(state, child.content, ctx)
        if (expanded) {
          next.push(...expanded)
          changed = true
        } else {
          next.push(child)
        }
      }
      if (changed) token.children = next
    }
  })
}
