import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'
import { loadVault, buildSidebar, rewritePath } from './vault.mts'
import { obsidianPlugin } from './obsidian.mts'
import { mermaidPlugin } from './mermaid.mts'
import { SCOPED_SECTIONS } from './sections.mts'

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

/**
 * 顶部导航。只有首页和关于 —— 内容导航全交给左侧边栏，
 * 不再分「软件 / 游戏 / 运维」那种大分类。
 */
const NAV = [
  { text: '首页', link: '/' },
  { text: '一箩筐', link: '/misc/' },
  { text: '腐竹计划', link: '/bv1/' },
  { text: '游戏笔记', link: '/bv2/' },
  { text: '关于', link: '/about' },
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

  // 节点目录不进 URL：bv1/cv11045619.md -> /notes/cv11045619
  // 文件仍按节点分文件夹（Obsidian 里好找），只是输出地址拍平了。
  // 同名的 rewritePath 在 vault.mts 里，侧边栏链接用它生成，两边必须一致。
  rewrites: rewritePath,

  // 附件的下载链接指向 public/ 下的真实文件，不是页面，别当死链报错。
  // 附件不存在时插件会打「找不到笔记」，漏网不了。
  ignoreDeadLinks: [/\/files\//],

  sitemap: { hostname: SITE_URL },

  /**
   * 给 <html> 打个 data-section，让侧边栏能按节点收窄（CSS 在 custom.css）。
   *
   * 为什么不用 VitePress 原生的 multi-sidebar：它按 page.relativePath 匹配，
   * 而这个值被 rewrites 拍平了（bv1/cv11045619.md → cv11045619.md），
   * '/bv1/' 永远命中不了。给每篇加一个 sidebar key 倒是能命中，
   * 但站点数据会从 6.6KB 涨到 123KB。所以改成构建时打标记。
   */
  transformHtml(code, _id, ctx) {
    // 顶层目录名；根目录下的 .md 取文件名（about.md → about）
    const section = String(ctx.pageData.filePath ?? '')
      .split('/')[0]
      .replace(/\.md$/, '')
    if (!SCOPED_SECTIONS.includes(section)) return
    return code.replace(/<html(\s|>)/, `<html data-section="${section}"$1`)
  },

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
    nav: NAV,

    // 顶栏标题左边的「笔记本」小图标（public/logo.svg，VPImage 会自动补 base）
    logo: '/logo.svg',

    // 侧边栏全自动：docs/ 下的一级子目录就是节点，见 vault.mts 的 buildSidebar
    sidebar: buildSidebar(vault),

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
