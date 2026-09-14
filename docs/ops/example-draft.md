---
title: 这是一篇草稿示例
tags: [示例]
order: 90
draft: true
---

# 这是一篇草稿示例

这篇笔记的 frontmatter 里写了 `draft: true`，所以：

- 它不会出现在侧边栏
- 它不会出现在搜索结果里
- 它不会出现在构建产物 `docs/.vitepress/dist/` 里

你可以把 `draft` 改成 `false`（或删掉这一行）再重新构建，就能看到它出现了。

> [!CAUTION]
> **注意：文件本身仍然提交在 git 仓库里。**
> 别人 clone 仓库就能读到这段文字。
> `draft: true` 只是「不上网站」，不是「保密」。
>
> 需要保密的内容请放进 `private/` 目录 —— 那个目录被 `.gitignore` 排除，永远不会被提交。
