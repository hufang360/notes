/**
 * vault.mts —— 把 docs/ 当成一个 Obsidian vault 来读
 *
 * 负责：
 *  1. 极简 frontmatter 解析（不引入 gray-matter 依赖）
 *  2. 扫描所有笔记，区分「公开」和「草稿/私密」
 *  3. 建立 [[双链]] 和 ![[图片]] 的解析索引
 *  4. 按目录自动生成侧边栏
 */
import fs from 'node:fs'
import path from 'node:path'

export type Frontmatter = Record<string, unknown>

/** 这些目录不会被当作笔记内容 */
export const SKIP_DIRS = new Set([
  '.vitepress',
  'node_modules',
  'public',
  'private',
  '_templates',
  '.git',
  '.obsidian',
])

/** 递归找出 dir 下所有 .md 文件，返回绝对路径 */
export function walkMarkdown(dir: string): string[] {
  const out: string[] = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      out.push(...walkMarkdown(full))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full)
    }
  }
  return out
}

/** 解析开头的 --- ... --- 块。Obsidian 写出来的都是简单 kv，不用上 yaml 库 */
export function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const m = /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(raw)
  if (!m) return { data: {}, body: raw }
  const data: Frontmatter = {}
  for (const line of m[1].split(/\r?\n/)) {
    if (/^\s*#/.test(line) || !line.trim()) continue
    const kv = /^([A-Za-z0-9_\-.]+)\s*:\s*(.*)$/.exec(line)
    if (!kv) continue
    const key = kv[1]
    let value: unknown = kv[2].trim()
    if (typeof value === 'string') {
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      } else if (value === 'true') value = true
      else if (value === 'false') value = false
      else if (/^-?\d+$/.test(value)) value = Number(value)
      else if (value.startsWith('[') && value.endsWith(']')) {
        value = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean)
      }
    }
    data[key] = value
  }
  return { data, body: raw.slice(m[0].length) }
}

export function readNote(file: string): { data: Frontmatter; body: string } {
  return parseFrontmatter(fs.readFileSync(file, 'utf8'))
}

function isTrue(v: unknown): boolean {
  return v === true || v === 'true' || v === 'yes'
}

/** 判断一篇笔记是否不该出现在公开站点里 */
export function isPrivate(data: Frontmatter): boolean {
  if (isTrue(data.private)) return true
  if (isTrue(data.draft)) return true
  if (data.publish === false || data.publish === 'false' || data.publish === 'no') return true
  return false
}

function firstHeading(body: string): string | undefined {
  const m = /^#{1,6}\s+(.+?)\s*#*\s*$/m.exec(body)
  return m?.[1]?.trim()
}

export interface NoteMeta {
  /** 绝对路径 */
  file: string
  /** 相对 docs/ 的路径，如 software/git-cheatsheet.md */
  rel: string
  title: string
  order: number
  data: Frontmatter
  /** 该笔记是否不公开 */
  private: boolean
}

export interface NoteRef {
  /** 相对 docs/ 的路径 */
  rel: string
  /** frontmatter.title 或第一个标题 */
  title: string
}

export interface Vault {
  root: string
  /** 全部笔记（含私密） */
  all: NoteMeta[]
  /** 只含公开笔记 */
  published: NoteMeta[]
  /** 被 frontmatter 挡下来的笔记 */
  hidden: NoteMeta[]
  /**
   * 双链索引。每个键都是一个可用的写法：
   *   - 完整相对路径           games/terraria/tshock/cmd-warp
   *   - index.md 去掉 /index  games/terraria/tshock
   *   - 文件名（全局唯一时）    cmd-warp
   * 解析时还会做一次后缀匹配（见 obsidian.mts），
   * 所以 [[terraria/tshock]] 这种省略顶层分类的写法也能用。
   */
  noteIndex: Map<string, NoteRef>
  /** 有重名的文件名，用 [[名字]] 引用时会报错提醒写完整路径 */
  ambiguousBases: string[]
  /** 图片等资源索引：小写文件名 -> /xxx/yyy.png 站内 URL */
  assetIndex: Map<string, string>
  warnings: string[]
}

function walkAssets(dir: string, publicRoot: string, into: Map<string, string>, warnings: string[]) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkAssets(full, publicRoot, into, warnings)
    } else if (entry.isFile() && !entry.name.startsWith('.')) {
      const key = entry.name.toLowerCase()
      const url = '/' + path.relative(publicRoot, full).split(path.sep).join('/')
      if (into.has(key) && into.get(key) !== url) {
        warnings.push(
          `[附件重名] ${entry.name} 存在多个副本，![[${entry.name}]] 会解析到 ${into.get(key)}（另一处：${url}）`
        )
        continue
      }
      into.set(key, url)
    }
  }
}

/** 扫描整个 vault */
export function loadVault(root: string): Vault {
  const warnings: string[] = []
  const all: NoteMeta[] = []

  for (const file of walkMarkdown(root)) {
    const rel = path.relative(root, file).split(path.sep).join('/')
    const { data, body } = readNote(file)
    all.push({
      file,
      rel,
      title: String(data.title ?? firstHeading(body) ?? path.basename(rel, '.md')),
      order: typeof data.order === 'number' ? data.order : Number.MAX_SAFE_INTEGER,
      data,
      private: isPrivate(data),
    })
  }

  const published = all.filter((n) => !n.private)
  const hidden = all.filter((n) => n.private)

  const noteIndex = new Map<string, NoteRef>()
  const byBase = new Map<string, NoteRef[]>()

  for (const n of published) {
    const ref: NoteRef = { rel: n.rel, title: n.title }
    const full = n.rel.replace(/\.md$/, '').toLowerCase()

    if (!noteIndex.has(full)) noteIndex.set(full, ref)
    // 目录的落地页：允许用目录名直呼，例如 [[terraria/tshock]]
    if (full.endsWith('/index')) {
      const dirKey = full.slice(0, -'/index'.length)
      if (!noteIndex.has(dirKey)) noteIndex.set(dirKey, ref)
    }

    const base = path.basename(n.rel, '.md').toLowerCase()
    if (!byBase.has(base)) byBase.set(base, [])
    byBase.get(base)!.push(ref)
  }

  // 文件名只在不重名时才作为键，否则 [[config]] 到底指哪一篇全靠运气
  const ambiguousBases: string[] = []
  for (const [base, refs] of byBase) {
    if (refs.length === 1) {
      if (!noteIndex.has(base)) noteIndex.set(base, refs[0])
    } else if (!noteIndex.has(base)) {
      ambiguousBases.push(base)
    }
  }

  const assetIndex = new Map<string, string>()
  walkAssets(path.join(root, 'public'), path.join(root, 'public'), assetIndex, warnings)

  return { root, all, published, hidden, noteIndex, ambiguousBases, assetIndex, warnings }
}

export interface SidebarItem {
  text: string
  link?: string
  collapsed?: boolean
  items?: SidebarItem[]
}

/**
 * 节点目录不进 URL。
 *
 * `bv1/cv11045619.md` -> `cv11045619.md`，页面地址就是 /notes/cv11045619，
 * 不再带 bv1 那一层。
 *
 * 这样做的好处是两边都讨好：**文件在 Obsidian 里仍按节点分文件夹**（一个目录里
 * 堆 76 篇笔记很难找），而**分享出去的地址是平的**。
 *
 * 节点的 index.md 不动 —— 拍平后会变成顶层的 index.md，和首页撞车。
 * config.mts 的 rewrites 和侧边栏链接都用这个函数，两边必须一致。
 */
export function rewritePath(rel: string): string {
  const parts = rel.split('/')
  return parts.length === 2 && parts[1] !== 'index.md' ? parts[1] : rel
}

/** 源码相对路径 -> 站内 URL（不带 base 前缀）。index.md 会得到带尾斜杠的目录地址 */
export function pageUrl(rel: string): string {
  return '/' + rewritePath(rel).replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')
}

/**
 * 生成侧边栏。
 *
 * 全站只有一棵树：`docs/` 下的一级子目录就是节点，根目录下的 .md 直接列出来。
 * 没有「软件 / 游戏 / 运维」那种大分类了 —— 层次越少越好找。
 */
export function buildSidebar(vault: Vault): Record<string, SidebarItem[]> {
  return { '/': buildTree(vault.published, '') }
}

function buildTree(notes: NoteMeta[], prefix: string): SidebarItem[] {
  const direct: NoteMeta[] = []
  const dirs = new Map<string, NoteMeta[]>()

  for (const n of notes) {
    const rest = n.rel.slice(prefix.length)
    if (rest === 'index.md') continue
    const slash = rest.indexOf('/')
    if (slash === -1) direct.push(n)
    else {
      const dir = rest.slice(0, slash)
      if (!dirs.has(dir)) dirs.set(dir, [])
      dirs.get(dir)!.push(n)
    }
  }

  // 笔记和子目录分组放在一起按 order 排序，而不是「笔记在前、分组在后」，
  // 这样侧边栏的顺序完全由 frontmatter.order 决定。
  // 分组的 order 取它自己 index.md 的 order。
  interface Entry {
    order: number
    tie: string
    item: SidebarItem
  }
  const entries: Entry[] = []

  for (const n of direct) {
    entries.push({
      order: n.order,
      tie: n.rel,
      item: { text: n.title, link: pageUrl(n.rel) },
    })
  }

  for (const [dir, list] of dirs) {
    const dirPrefix = prefix + dir + '/'
    const indexNote = list.find((n) => n.rel === dirPrefix + 'index.md')
    const children = buildTree(list, dirPrefix)
    if (!children.length) continue

    // 有 index.md 时，把分组标题本身做成链接，而不是把 index 再当作第一项塞进
    // children —— 那样分组的标题会和第一项重复一遍。
    entries.push({
      order: indexNote?.order ?? Number.MAX_SAFE_INTEGER,
      tie: dirPrefix,
      item: {
        text: indexNote ? indexNote.title : dir,
        link: indexNote ? pageUrl(indexNote.rel) : undefined,
        // 默认折叠。VitePress 会在当前页属于该节点时自动展开，
        // 否则 40 多篇平铺展开会把侧边栏拉得很长。
        collapsed: true,
        items: children,
      },
    })
  }

  entries.sort((a, b) => a.order - b.order || a.tie.localeCompare(b.tie, 'zh'))
  return entries.map((e) => e.item)
}
