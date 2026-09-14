---
title: Terraria
order: 30
---

# Terraria（泰拉瑞亚）

服务端有两条路线：官方/原版的 **TShock**（插件框架，功能强）和 **tModLoader**（跑模组）。

- [[terraria/tshock|TShock 开服笔记]] —— 从裸机到插件跑起来，含 systemd、备份、常用指令
- [[terraria/tmodloader-centos|tModLoader CentOS 搭建]] —— 2021 年记的老步骤
- [[terraria/tmodloader-v14-centos|tModLoader v1.4 简略步骤]] —— 1.4 要额外装 .NET 6.0

> [!WARNING] 版本必须对齐
> TShock / tModLoader 都必须和客户端的 Terraria 版本严格对应，
> 差一个小版本就会在启动或进服时报错。装之前先确认三方版本号。

| 路线 | 用途 | 端口 |
| --- | --- | --- |
| TShock | 原版玩法 + 插件（权限、商店、封禁） | 7777/TCP |
| tModLoader | 跑创意工坊模组 | 7777/TCP |
