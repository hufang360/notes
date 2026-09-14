---
title: 饥荒联机版
order: 10
---

# 饥荒联机版（Don't Starve Together）

三篇一套，从零搭到能玩。原载于 Bilibili 专栏，成文于 2022 年初。

- [[dst/linux-server|上篇 · 搞定 CentOS 8 运行环境]] —— steamcmd、依赖库、screen 托管
- [[dst/config|下篇 · 搞懂配置文件]] —— `cluster.ini`、`worldgenoverride.lua`、模组
- [[dst/windows-server|Windows 篇]] —— 在 Windows 上开服的另一条路

> [!TIP] 从哪篇开始
> 在 Linux 服务器上开服就看上篇 → 下篇；只有 Windows 机器就直接看 Windows 篇。
> 三篇的图都是当时截的，界面可能和现在的版本有出入。

## 几个关键点

| 事情 | 结论 |
| --- | --- |
| 需要公网 IP 吗 | 不需要。服务器起来后会把房间注册到饥荒大厅，玩家搜房间加入 |
| 端口 | 默认 `10999/udp`（主世界）+ `10998/udp`（洞穴），要在防火墙放行 |
| 依赖 | 32 位运行库（glibc.i686 / libstdc++.i686 / libcurl.i686）最容易漏 |
| 长期运行 | 用 `screen` 或 systemd，别直接挂在 SSH 会话里 |
