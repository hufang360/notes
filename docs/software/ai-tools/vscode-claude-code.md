---
title: "? VSCode + Claude Code，no TUI ?"
tags: []
order: 160
source: https://www.bilibili.com/read/cv50078491/
sourceDate: 2026-06-04
draft: false
---

# ? VSCode + Claude Code，no TUI ?

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv50078491/) · 2026-06-04
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

之前买了某家国产coding plan。搭配cc插件，用vscode改代码，写脚本，还挺舒服的，今天分享下！ 碎碎念 cc就是Claude Code啦。以面板的形式出现在vscode右侧，不用TUI（Terminal UI），不用敲命令。 vscode里打开任意文件，在tab的右侧能找到cc图标，点击后cc就以panel的形式出现在右侧了。 像 deepseek、kimi、智谱等国产大模型，都有“Anthropic API”端点，可以作为cc的api。网络没魔法，也能用。国产agent模型能力有不少进步。继续加油啊💪！ 只有你主动打开cc，不然不会主动索引你的文件，数据相对安全。 这种集成方式虽然比较轻盈，但也是agent，请留意token的消耗。记得看看各家的coding plan。 5月初被水友安利了「百万亿 Token 创造者激励计划」，申请得到mimo token plan 标准版 一个月的体验权限。本来之前1个月只有2亿token，27号重置后白送了110亿token。几天高强度vibecoding 给整爽了。 怎么玩 安装 Claude Code 插件，认准“Anthropic”这个作者。 设置-第一步 设置-第二步 deepseek： "claudeCode.environmentVariables": \[ { "name": "ANTHROPIC\_BASE\_URL", "value": "https://api.deepseek.com/anthropic" }, { "name": "ANTHROPIC\_AUTH\_TOKEN", "value": "你的api密钥" }, { "name": "ANTHROPIC\_DEFAULT\_SONNET\_MODEL", "value": "deepseek-v4-pro\[1m\]" }, { "name": "ANTHROPIC\_DEFAULT\_OPUS\_MODEL", "value": "deepseek-v4-pro\[1m\]" }, { "name": "ANTHROPIC\_DEFAULT\_HAIKU\_MODEL", "value": "deepseek-v4-flash" } \], "claudeCode.preferredLocation": "panel", "claudeCode.disableLoginPrompt": true, 智谱 coding-plan： "claudeCode.environmentVariables": \[ { "name": "ANTHROPIC\_BASE\_URL", "value": "https://open.bigmodel.cn/api/anthropic" }, { "name": "ANTHROPIC\_AUTH\_TOKEN", "value": "你的apikey" }, { "name": "ANTHROPIC\_DEFAULT\_SONNET\_MODEL", "value": "glm-5.1\[1M\]" }, { "name": "ANTHROPIC\_DEFAULT\_OPUS\_MODEL", "value": "glm-5.1\[1M\]" }, { "name": "ANTHROPIC\_DEFAULT\_HAIKU\_MODEL", "value": "GLM-5.1" } \], "claudeCode.preferredLocation": "panel", "claudeCode.disableLoginPrompt": true, mimo token plan： "claudeCode.environmentVariables": \[ { "name": "ANTHROPIC\_BASE\_URL", "value": "https://token-plan-cn.xiaomimimo.com/anthropic" }, { "name": "ANTHROPIC\_AUTH\_TOKEN", "value": "tp-xxx" }, { "name": "ANTHROPIC\_DEFAULT\_SONNET\_MODEL", "value": "mimo-v2.5-pro\[1m\]" }, { "name": "ANTHROPIC\_DEFAULT\_OPUS\_MODEL", "value": "mimo-v2.5-pro\[1m\]" }, { "name": "ANTHROPIC\_DEFAULT\_HAIKU\_MODEL", "value": "mimo-v2.5" } \], "claudeCode.preferredLocation": "panel", "claudeCode.disableLoginPrompt": true, Demo1 Demo2
