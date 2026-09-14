---
title: "Codex和ChatGPT旧版本"
tags: []
order: 180
source: https://www.bilibili.com/read/cv52336444/
sourceDate: 2026-08-14
draft: false
---

# Codex和ChatGPT旧版本

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv52336444/) · 2026-08-14
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

前不久Codex更名为ChatGPT，mac上的那个纯聊天的客户端，已经被Codex-app 夺舍了。 最近觉得Codex更新太频繁了，软件体积很大，想手动更新。搜索时发现好多mac12,13系统的用户，用不了新版的Codex，即使你安装了旧版本，一检测到更新就自动升级了，下次再打开发现不能用了~~~ config.toml 如果你只是想手动升级，只需 在 ~/.codex/config.toml 的头部加一行配置就行。也可以用cc-switch编辑，记得是加到头部。 check\_for\_update\_on\_startup = false 旧版 Codex-app github上有一个仓库，“把官方 Codex 桌面应用安装包，原样、可校验、国内可达地镜像到 GitHub Release”，最后一个支持macos12,13的版本： https://github.com/Wangnov/codex-app-mirror https://github.com/Wangnov/codex-app-mirror/releases/download/codex-app-26.727.51351/Codex-mac-x64.dmg requirements.toml 如果是macos12,13, 要彻底禁用更新，保险的方法是编辑组织策略配置，即 /etc/codex/requirements.toml，参考下图： check\_for\_update\_on\_startup = false \[features\] in\_app\_updates = false \[analytics\] enabled = false 当你尝试 手动检查更新 旧版 ChatGPT 客户端 Codex顶替了ChatGPT客户端，喜欢旧版那种轻量的纯聊天的客户端怎么办，如果你会用brew。 brew install chatgpt-classic （记不住的话就，brew search chatgpt 查询一下)
