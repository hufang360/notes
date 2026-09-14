---
title: "dsh：分身"
tags: []
order: 200
source: https://www.bilibili.com/read/cv52420075/
sourceDate: 2026-08-17
draft: false
---

# dsh：分身

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv52420075/) · 2026-08-17
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

装插件、写插件、改错文件，会导致dsh无法启动。 装插件老导致崩溃，有点绷不住~ 以往是借助其他agent来帮忙修复，codex，pi-agent都试过。 翻文档时看到 DSH\_HOME 变量，那么可以创建一个 分身 来修复启动错误。 插件、聊天记录、agent预设等都存放在 DSH\_HOME 目录里，默认是 用户/.dsh 目录，指定一个新的目录，然后重开新的webui，就是一个分身。 export DSH\_HOME=$HOME/dsh2 dsh web --port 3082
