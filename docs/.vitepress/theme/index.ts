import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Mermaid from './Mermaid.vue'
import { SCOPED_SECTIONS } from '../sections.mts'
import './custom.css'

/**
 * 侧边栏标题被 CSS 截成一行（见 custom.css）。
 * 这里把每个条目的溢出量算出来：
 *   - 补一个原生 title，鼠标悬停能直接看到全文；
 *   - 打上 data-overflow 并写好 --marquee-shift / --marquee-duration，
 *     CSS 据此在悬停时左右滚动。
 * 没截断的什么都不加。
 */
function addSidebarTitles() {
  // SSR（pnpm build 时）也会走到这里，那时没有 document
  if (typeof document === 'undefined') return
  for (const el of document.querySelectorAll<HTMLElement>('.VPSidebarItem .text')) {
    const text = el.textContent?.trim()
    if (!text) continue
    // scrollWidth 是文字实际宽度，clientWidth 是可见宽度，差值就是要滚的距离
    const overflow = el.scrollWidth - el.clientWidth
    // 只要真被截断了（出现省略号）就能滚。
    // 之前那个 48px 阈值是为了躲 text-indent 的 scroll anchoring bug，
    // 换成 transform 后不需要了。
    if (overflow > 1) {
      el.title = text
      el.dataset.overflow = ''
      el.style.setProperty('--marquee-shift', `-${overflow}px`)
      // 约 50px/秒；下限 1s，免得短距离一闪而过
      el.style.setProperty(
        '--marquee-duration',
        `${Math.min(6, Math.max(1, overflow / 50)).toFixed(1)}s`
      )
    } else {
      el.removeAttribute('title')
      delete el.dataset.overflow
      el.style.removeProperty('--marquee-shift')
      el.style.removeProperty('--marquee-duration')
    }
  }
}

let watching = false

/**
 * 侧边栏按栏目收窄靠 <html data-section>。构建时会按当前页写好，
 * 但那是静态 HTML —— SPA 切页（不刷新）时 <html> 不会重渲染，
 * 标记会一直停在上一次的值，于是侧边栏会出现「还停在上一个栏目 /
 * 显示全部 / 空」。这里每次路由变化后按当前页的源路径重写一遍。
 */
function syncSection(filePath: string | undefined) {
  if (typeof document === 'undefined') return
  const section = String(filePath ?? '')
    .split('/')[0]
    .replace(/\.md$/, '')
  const root = document.documentElement
  if (SCOPED_SECTIONS.includes(section)) root.setAttribute('data-section', section)
  else root.removeAttribute('data-section')
}

/**
 * 侧边栏节点默认折叠，折叠时 clientWidth 是 0，量不出截断。
 * 展开/折叠、切页高亮都会改 section 的 class，所以监听 class 变化、
 * 变化后再量一次 —— 这样就不用赌「mount 完成了没有」。
 */
function watchSidebar() {
  if (typeof document === 'undefined' || watching) return
  const nav = document.getElementById('VPSidebarNav')
  if (!nav) return
  watching = true
  addSidebarTitles()
  new MutationObserver(addSidebarTitles).observe(nav, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  })
  window.addEventListener('resize', addSidebarTitles)
}

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    // 供 ```mermaid 代码块生成的 <Mermaid> 标签使用
    app.component('Mermaid', Mermaid)

    router.onAfterRouteChange = () => {
      // route.data.filePath 是源路径（如 bv1/cv11045619.md）
      syncSection((router.route?.data as { filePath?: string } | undefined)?.filePath)
      watchSidebar()
      addSidebarTitles()
    }

    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') watchSidebar()
      else window.addEventListener('load', watchSidebar, { once: true })
    }
  },
} satisfies Theme
