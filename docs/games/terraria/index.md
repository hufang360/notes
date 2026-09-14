---
title: Terraria
order: 30
---

# Terraria（泰拉瑞亚）

服务端有两条路线：**TShock**（原版 + 插件框架）和 **tModLoader**（跑模组）。客户端相关的版本/物品/玩法，和汉化资源包，各成一组。

- [[tshock/index|TShock 服务端]] —— 搭建、指令、备份、REST API，共 23 篇
- [[plugins/index|TShock 插件]] —— 自己写的插件，开发向的适配参考
- [[client/index|客户端与版本]] —— 版本更新日志、新增物品、玩法考据
- [[resource-pack/index|汉化与资源包]] —— 语言包、音乐包、字体、材质包
- [[tmodloader/index|tModLoader]] —— 模组服务端与客户端改动

> [!WARNING] 版本三方对齐
> 服务端、插件、客户端三者的版本必须严格对应，差一个小版本就会报错。
> 装之前先确认三方版本号。

| 路线 | 用途 | 端口 |
| --- | --- | --- |
| TShock | 原版玩法 + 插件（权限、商店、封禁） | 7777/TCP |
| tModLoader | 跑创意工坊模组 | 7777/TCP |

## 关于时效

这批笔记横跨 2020–2026 年，写得都很具体。**看的时候先看日期**：

- 开服流程（`tshock/`）—— 思路仍然有效，但 TShock 从 mono 换到 .NET 6/9，命令和依赖变了
- 版本更新日志（`client/version-*`）—— 历史记录，别当现状
- 插件（`plugins/`）—— 只适配了 TShock 5.x，老版本的可能已经跑不起来
