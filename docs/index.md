---
layout: home

hero:
  name: hf 的笔记
  text: 软件 · 游戏 · 运维
  tagline: 踩过的坑、攒下的经验。方便自己回查，也希望能帮到路过的同好。
  actions:
    - theme: brand
      text: 开始阅读
      link: /software/
    - theme: alt
      text: 关于本站
      link: /about

features:
  - icon: 🧰
    title: 软件
    details: Git、Docker、Obsidian、命令行工具的用法与配置备忘。
    link: /software/
    linkText: 进入
  - icon: 🎮
    title: 游戏
    details: 开服、插件、Docker 化。主要是 Terraria / Starbound 这些。
    link: /games/
    linkText: 进入
  - icon: 🖥️
    title: 运维
    details: Nginx、磁盘、日志、排障流程。生产环境踩过的坑。
    link: /ops/
    linkText: 进入
---

## 这个站是什么

一个 Markdown 笔记仓库：用 [Obsidian](https://obsidian.md) 写作，用 [VitePress](https://vitepress.dev) 发布到 GitHub Pages。

- 左侧按「软件 / 游戏 / 运维」分类，右上角可以直接搜（已针对中文做过分词）
- 笔记之间用 `[[双链]]` 互相关联，跟 Obsidian 里看到的一样
- 源码在 [GitHub](https://github.com/hufang360/notes)，发现错误欢迎提 issue

> [!WARNING]
> 笔记里的命令都是「我在自己机器上跑通过」，不代表对你的环境安全。
> 尤其是 `rm -rf`、`docker system prune`、`DROP TABLE` 这类，请先看懂再执行。

## 怎么写一篇笔记

每篇笔记开头有一段 frontmatter：

```yaml
---
title: 笔记标题
tags: [git, 版本控制]
order: 10        # 侧边栏排序，小的在前
draft: false     # true = 不进构建产物
---
```

> [!IMPORTANT] 关于「隐藏」的一个重要区别
> `draft: true` 只是**不渲染**，文件本身还在 commit 里，翻仓库照样能看到。
> 真正不能公开的东西（密码、私钥、服务器资料）必须放进 `private/` 目录，
> 那个目录已经在 `.gitignore` 里，**永远不会被提交**。
