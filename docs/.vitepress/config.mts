import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'
import { loadVault, buildSidebar, type SidebarSection } from './vault.mts'
import { obsidianPlugin } from './obsidian.mts'
import { mermaidPlugin } from './mermaid.mts'

/* ------------------------------------------------------------------ *
 * 1. 站点基本信息 —— 换仓库名 / 改标题，只改这一段
 * ------------------------------------------------------------------ */

/** GitHub 仓库名。仓库改名后这里要同步改，否则 CSS/图片路径会 404 */
const REPO = 'notes'
const OWNER = 'hufang360'
/** 只有「用户名.github.io」这个仓库才是根域名，其它都是 /仓库名/ 子路径 */
const BASE = `/${REPO}/`
const SITE_URL = `https://${OWNER}.github.io${BASE}`
const SITE_TITLE = 'hf 的笔记'
const SITE_DESC = '软件 / 游戏 / 运维 —— 踩过的坑和攒下的经验'

/** 顶部分类。加分类时在这里加一行，并建同名目录 */
const SECTIONS: SidebarSection[] = [
  { dir: 'software', text: '软件' },
  { dir: 'games', text: '游戏' },
  { dir: 'ops', text: '运维' },
  { dir: 'essay', text: '随笔' },
]

/* ------------------------------------------------------------------ *
 * 2. 定位 docs 目录
 *    VitePress 会把 config 打包到临时文件，import.meta.url 不一定指向原位置，
 *    所以优先用 cwd（npm scripts 和 CI 都在仓库根目录执行）
 * ------------------------------------------------------------------ */
function resolveDocsRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), 'docs'),
    fileURLToPath(new URL('..', import.meta.url)),
    process.cwd(),
  ]
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, '.vitepress'))) return dir
  }
  throw new Error('找不到 docs 目录，请在仓库根目录执行 pnpm dev / pnpm build')
}

const DOCS_ROOT = resolveDocsRoot()

/* ------------------------------------------------------------------ *
 * 3. 扫描 vault：找出草稿、建立双链索引、生成侧边栏
 * ------------------------------------------------------------------ */
const vault = loadVault(DOCS_ROOT)

if (vault.hidden.length) {
  console.log(`\n🔒 已按 frontmatter 隐藏 ${vault.hidden.length} 篇笔记（不会进构建产物）：`)
  for (const n of vault.hidden) console.log(`   - ${n.rel}  (${n.title})`)
}
for (const w of vault.warnings) console.warn('⚠️  ' + w)

/* ------------------------------------------------------------------ *
 * 4. 配置
 * ------------------------------------------------------------------ */
export default defineConfig({
  lang: 'zh-CN',
  title: SITE_TITLE,
  description: SITE_DESC,
  base: BASE,
  cleanUrls: true,
  lastUpdated: true,

  // 不参与构建的文件：草稿 + private/ + 模板
  srcExclude: ['private/**', '_templates/**', '**/README.md', ...vault.hidden.map((n) => n.rel)],

  sitemap: { hostname: SITE_URL },

  vite: {
    build: {
      // mermaid 及其布局引擎（elk 等）是几个 600KB~1.4MB 的 chunk，
      // 但都是**按需**加载的（只有带图表的页面才下载），不影响首屏。
      // 调高阈值免得每次构建都刷警告。
      chunkSizeWarningLimit: 1600,
    },
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: SITE_TITLE }],
    ['meta', { property: 'og:description', content: SITE_DESC }],
  ],

  markdown: {
    lineNumbers: true,
    math: true,
    config(md) {
      md.use(mathjax3) // $$ 公式
      md.use(mermaidPlugin) // ```mermaid -> <Mermaid>，按需加载
      md.use(obsidianPlugin, {
        // [[双链]] / ![[图片]] / callout / %%注释%% / ==高亮==
        noteIndex: vault.noteIndex,
        ambiguousBases: vault.ambiguousBases,
        assetIndex: vault.assetIndex,
      })
    },
  },

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      ...SECTIONS.map((s) => ({ text: s.text, link: `/${s.dir}/` })),
      { text: '关于', link: '/about' },
    ],

    // 侧边栏按目录自动生成，见 vault.mts 的 buildSidebar
    sidebar: buildSidebar(vault, SECTIONS),

    outline: { level: [2, 3], label: '本页目录' },
    lastUpdated: { text: '最后更新' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    externalLinkIcon: true,

    footer: {
      message: '笔记内容按「所见即所得」分享，请自行判断风险后操作。',
      copyright: `© ${new Date().getFullYear()} ${OWNER}`,
    },

    editLink: {
      pattern: `https://github.com/${OWNER}/${REPO}/edit/main/docs/:path`,
      text: '在 GitHub 上编辑此页',
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '清除条件',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
        miniSearch: {
          options: {
            // 默认分词器按空格切，中文整段会变成一个词，搜不到。
            // 这里把汉字逐字拆开，等价于「字级搜索」。
            tokenize: (text: string) =>
              text
                .split(/[\s\-_/.,:;!?()[\]{}<>|\\'"]+/u)
                .filter(Boolean)
                .flatMap((w) => (/\p{Script=Han}/u.test(w) ? [...w] : [w])),
          },
        },
      },
    },

    socialLinks: [{ icon: 'github', link: `https://github.com/${OWNER}/${REPO}` }],
  },
})
