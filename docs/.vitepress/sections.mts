/**
 * 侧边栏需要「按栏目收窄」的顶层 section。
 *
 * 值是目录名；根目录下的 .md 取文件名（about.md → about）。
 *
 * - config.mts 用它决定给哪些页面在 <html> 上打 data-section（构建时，避免首屏闪）
 * - theme/index.ts 用它决定 SPA 切页时要不要更新这个标记（客户端，否则会停在上一个栏目）
 *
 * 两处必须用同一份，所以抽到这里。这个模块不能 import node 的东西，
 * 因为它会被打进客户端 bundle。
 */
export const SCOPED_SECTIONS = ['bv1', 'bv2', 'misc', 'about']
