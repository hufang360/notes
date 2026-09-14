/**
 * mermaid.mts —— ```mermaid 代码块 -> <Mermaid> 组件
 *
 * 关键是**不**在构建时引入 mermaid 本体：
 * 这里只输出一个组件标签，真正的 mermaid 库在 docs/.vitepress/theme/Mermaid.vue
 * 里用 import() 动态加载。这样没有图表的页面完全不会下载 mermaid（省掉 ~600KB）。
 */
import type MarkdownIt from 'markdown-it'

export function mermaidPlugin(md: MarkdownIt) {
  const fallback = md.renderer.rules.fence!

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const lang = token.info.trim().split(/\s+/)[0]

    if (lang === 'mermaid' || lang === 'mmd') {
      // encodeURIComponent 会把换行变成 %0A，可以安全塞进 HTML 属性
      const graph = encodeURIComponent(token.content)
      return `<Mermaid graph="${graph}" />\n`
    }

    return fallback(tokens, idx, options, env, self)
  }
}
