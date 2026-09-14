---
title: "Code-Server: 网页版vscode"
tags: []
order: 130
source: https://www.bilibili.com/read/cv51604493/
sourceDate: 2026-07-18
draft: false
---

# Code-Server: 网页版vscode

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv51604493/) · 2026-07-18
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

本文假设你有使用云服务器的经验。 安装在云服务器上的第三方vscode，然后使用网页访问，除了电脑，手机也能用。 注意哈，即使你电脑上不安装vscode，也能通过网页访问的哈~ Code-Server 是一个docker应用，对于新手，我建议先安装1panel。服务器内存建议在2GB以上。 docker-compose: services: coder: # codercom/code-server:latest = ghcr.io/coder/code-server:latest image: ghcr.io/coder/code-server:latest container\_name: coder restart: always ports: - "28080:8080" environment: - PASSWORD=你的密码 - TZ=Asia/Shanghai user: root volumes: - ./data/root/:/root/ # 映射项目目录 # - /opt/project/001:/root/project/001 # 共享主机上的ssh配置 # - /root/.ssh/:/root/.ssh/
