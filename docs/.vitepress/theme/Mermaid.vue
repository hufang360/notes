<script setup>
/**
 * Mermaid 图表。
 *
 * mermaid 本体是动态 import 的 —— 没有图表的页面不会下载它。
 * 跟随 VitePress 的深浅色主题自动重绘。
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useData } from 'vitepress'

const props = defineProps({
  graph: { type: String, required: true },
})

const el = ref(null)
const { isDark } = useData()

let mod = null
let seq = 0
let alive = true

async function getMermaid() {
  if (!mod) {
    const imported = await import('mermaid')
    mod = imported.default
  }
  return mod
}

async function draw() {
  if (!el.value) return
  const token = ++seq
  try {
    const mermaid = await getMermaid()
    if (!alive) return

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: isDark.value ? 'dark' : 'neutral',
      fontFamily: 'inherit',
      flowchart: { useMaxWidth: true },
      sequence: { useMaxWidth: true },
    })

    const id = `mermaid-${Date.now().toString(36)}-${token}`
    const { svg } = await mermaid.render(id, decodeURIComponent(props.graph))
    if (!alive || token !== seq || !el.value) return

    el.value.innerHTML = svg
    el.value.dataset.state = 'done'
  } catch (err) {
    if (!el.value) return
    el.value.dataset.state = 'error'
    el.value.innerHTML = `<pre class="mermaid-error">Mermaid 渲染失败：${String(err?.message ?? err)}</pre>`
  }
}

onMounted(draw)
watch(isDark, draw)
onBeforeUnmount(() => {
  alive = false
})
</script>

<template>
  <div ref="el" class="mermaid-diagram" data-state="loading">
    <div class="mermaid-placeholder">图表加载中…</div>
  </div>
</template>

<style scoped>
.mermaid-diagram {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
  overflow-x: auto;
}

.mermaid-diagram[data-state='done'] .mermaid-placeholder {
  display: none;
}

.mermaid-placeholder {
  font-size: 0.875rem;
  color: var(--vp-c-text-3);
}

.mermaid-diagram :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
