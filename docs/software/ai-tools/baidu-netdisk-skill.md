---
title: "试了下 百度网盘官方skill"
tags: []
order: 140
source: https://www.bilibili.com/read/cv51604377/
sourceDate: 2026-07-18
draft: false
---

# 试了下 百度网盘官方skill

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv51604377/) · 2026-07-18
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

> [!WARNING] 结尾有一条链接丢失了
> 正文末尾的「网页链接」是 B 站导出时的占位符，原始 URL 拿不到，得手动补。

今天试了下 百度网盘官方skill (baidu-drive) 仓库地址：🐙/baidu-netdisk/bdpan-storage 起因呢，是想把云服务器上的1个电影，转到网盘上，3m的带宽是，下到本地，满速也就400kb/s。如果能在服务器上直接上传到网盘，应该速度不错，然而实际测下了来只有 395 KB/s，计划落空~ AnyWay，还可以用screen或tmux挂机让它传嘛，再说了难得官方愿意开这么一个口子 用的是vscode+cc+openrouter（hy3:free模型） 目前仅支持linux和macOS，Windows的朋友可以切到wsl试试~ 碎碎念 首次使用需安装 bdpan 命令行工具，安装完成后，建议彻底退出vscode，然后重启让命令行环境能找到 bdpan命令 授权登录 链接可以在本地电脑上打开，然后将得到的授权码发给agent，授权码有效期30天 bdpan的 “增删改查”权限仅限 “我的应用数据/bdpan/” 参考链接： https://pan.baidu.com/apaastobui/developer#/developer/skill https://modelscope.cn/skills/BaiduDrive/baidu-drive 网页链接
