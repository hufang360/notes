import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Mermaid from './Mermaid.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 供 ```mermaid 代码块生成的 <Mermaid> 标签使用
    app.component('Mermaid', Mermaid)
  },
} satisfies Theme
