---
title: "[极简]Claude Desktop接入国产模型"
tags: []
order: 150
source: https://www.bilibili.com/read/cv50383919/
sourceDate: 2026-06-11
draft: false
---

# [极简]Claude Desktop接入国产模型

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv50383919/) · 2026-06-11
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

算了，你们肯定觉得没意思，那我就简略点! #!/bin/bash # 创建目录 mkdir -p "$HOME/Library/Application Support/Claude-3p/configLibrary" # 进入目录 cd "$HOME/Library/Application Support/Claude-3p/configLibrary" # 写入 \_meta.json cat > '\_meta.json' << 'EOF' { "appliedId": "12345678-1234-1234-1234-123456789012", "entries": \[{"id":"12345678-1234-1234-1234-123456789012","name":"config"}\] } EOF # 写入配置文件 cat > '12345678-1234-1234-1234-123456789012.json' << 'EOF' { "coworkEgressAllowedHosts": \["\*"\], "disableDeploymentModeChooser": true, "inferenceProvider": "gateway", "inferenceGatewayAuthScheme": "bearer", "inferenceGatewayApiKey": "sk-xxx", "inferenceGatewayBaseUrl": "https://api.xx.com/anthropic", "inferenceModels": \[ { "labelOverride": "deepseek-v4-flash", "name": "claude-haiku-4-5", "supports1m": true }, { "labelOverride": "deepseek-v4-pro", "name": "claude-opus-4-8", "supports1m": true }, { "labelOverride": "deepseek-v4-pro", "name": "claude-sonnet-4-6", "supports1m": true } \] } EOF
