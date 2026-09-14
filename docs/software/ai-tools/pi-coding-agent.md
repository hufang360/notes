---
title: "在服务器上使用 pi-coding-agent"
tags: []
order: 100
source: https://www.bilibili.com/read/cv52283536/
sourceDate: 2026-08-12
draft: false
---

# 在服务器上使用 pi-coding-agent

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv52283536/) · 2026-08-12
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

选 opencode 还是 pi coding agent呢 ？我都要！ pi非常轻量，核心只有 读文件/写文件/修改文件/bash运行指令 这4个tool use。 资源占用优势确实明显，实乃“小鸡良药“（😭服务器只有2G）。对比： 直接安装cli不更节约。只是在centos8上面，虽然安装上了，但没法启动，报这个错误。 跟上篇文章的opencode类似，将下面内容添加 .bashrc 里面 # vim ~/.bashrc # source ~/.bashrc function pix() { docker run -it --rm \\ -v "$PWD:$PWD" \\ -w "$PWD" \\ -v "$HOME/.pi:/home/node/.pi" \\ -v "$HOME/.gitconfig:/home/node/.gitconfig" \\ michaelwadman/pi-agent } cd到对应目录，执行 pix 指令，会自动将当前目录挂载给容器，创建容器，并进入终端界面。 完事后按ctrl+c退出，退出后会自动销毁容器。 模型和对话记录已做了持久化。 如何配置模型呢，参考下图： 备注： 容器自带git。好评。镜像大小大概322mb。 后续执行 docker pull michaelwadman/pi-agent 拉取新版本。 该镜像，会走镜像源。 pi的官网，pi.dev，哭死，连网址都这么简洁~
