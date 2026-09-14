---
title: 游戏
order: 1
---

# 游戏

主要是**开服**：装环境、配端口、托管进程、备份存档。踩过的坑比游戏本身还多。

Terraria 一个游戏就占了 60 多篇，所以在里面又分了 TShock / 插件 / 客户端 / 资源包 / tModLoader 几组。

- [[terraria/index|Terraria（泰拉瑞亚）]] —— 体量最大的一组
- [[dst/index|饥荒联机版]] —— 开服三篇：CentOS 环境 / 配置文件 / Windows
- [[starbound/index|Starbound]] —— 手工开服、Docker 化、汉化、存档格式
- [[minecraft/index|Minecraft]] —— Forge 服务端手工搭建

## 为什么记这些

开服这件事坑特别密：32 位运行库、UDP 端口、时区、存档权限、插件版本对不上……
隔半年再来一次全忘光。写下来省的是自己的时间。

## 通用的几条经验

> [!TIP]
> 1. **服务端别用 root 跑**，建个专用用户
> 2. **端口记得是 TCP 还是 UDP**，一半的问题都出在这里
> 3. **用 systemd 或 screen 托管**，别让进程挂在 SSH 会话上
> 4. **存档目录单独备份**，而且要在停服状态下备
> 5. **版本三方对齐**：服务端、插件、客户端

相关：[[docker-compose-tips|Docker Compose 实用片段]]、[[nginx-reverse-proxy|Nginx 反代模板]]、[[steam-store-access|解决 Steam 商店访问问题]]
