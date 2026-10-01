import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Mermaid from './Mermaid.vue'
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
    // 只溢出几十像素的就别滚了 —— 距离太短、速度再快也像在颤；tooltip 照给
    const marquee = overflow > 48
    if (overflow > 1) el.title = text
    else el.removeAttribute('title')
    if (marquee) {
      el.dataset.overflow = ''
      el.style.setProperty('--marquee-shift', `-${overflow}px`)
      // 约 50px/秒；下限 1.6s，免得短距离一闪而过
      el.style.setProperty(
        '--marquee-duration',
        `${Math.min(6, Math.max(1.6, overflow / 50)).toFixed(1)}s`
      )
    } else {
      delete el.dataset.overflow
      el.style.removeProperty('--marquee-shift')
      el.style.removeProperty('--marquee-duration')
    }
  }
}

let watching = false

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
      watchSidebar()
      addSidebarTitles()
    }

    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') watchSidebar()
      else window.addEventListener('load', watchSidebar, { once: true })
    }
  },
} satisfies Theme
