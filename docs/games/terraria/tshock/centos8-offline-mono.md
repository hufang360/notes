---
title: "CentOS8离线安装mono经验分享"
tags: [mono, centos8]
order: 261
source: https://www.bilibili.com/read/cv10638648/
sourceDate: 2021-04-05
draft: false
---

# CentOS8离线安装mono经验分享

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv10638648/) · 2021-04-05
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

\* 本文仅面向服主，是联机服搭建的补充。

> 参考：[Bilibili 专栏 cv9479081](https://www.bilibili.com/read/cv9479081/)

今天在新服务器安装mono，由于网络原因安装老失败，试了很多办法都不奏效，老服务器有安装成功过，把老服务器的缓存拷过去居然成功了！

## 设置yum缓存

首先从老服务器卸载mono，设置缓存后，重装mono以缓存安装包。

```bash
# 卸载mono
yum remove mono

# 编辑yum配置文件
vi /etc/yum.conf

# 配置文件中加入这两行
cachedir=/var/cache/yum/
keepcache=1
```

## 安装mono

参考链接：https://www.mono-project.com/download/stable/#download-lin-centos

```bash
# centos8
rpmkeys --import "http://pool.sks-keyservers.net/pks/lookup?op=get&search=0x3fa7e0328081bff6a14da29aa6a19b38d3d831ef"
su -c 'curl https://download.mono-project.com/repo/centos8-stable.repo | tee /etc/yum.repos.d/mono-centos8-stable.repo'

# 安装mono
yum install mono-devel

# 清理yum缓存，如果没有生成缓存，可以执行一次
yum clean all
```

安装文件会缓存在 \`**/var/cache/yum**\`，下图是mono的rpm文件情况。

拷贝 “**mono-centos8-stable**” 开头的文件夹到新服务器，推荐使用 Finalshell 或 Winscap 连接新服务器，手动创建这些文件夹，并完成文件的拷贝。

![[centos8-offline-mono-01.webp]]

新服务器，也需要设置yum缓存，拷贝文件+设置缓存后，重新安装mono就成功了！

```bash
# 编辑yum配置文件
vi /etc/yum.conf

# 配置文件中加入这两行
cachedir=/var/cache/yum/
keepcache=1

# 安装mono
# centos8
rpmkeys --import "http://pool.sks-keyservers.net/pks/lookup?op=get&search=0x3fa7e0328081bff6a14da29aa6a19b38d3d831ef"
su -c 'curl https://download.mono-project.com/repo/centos8-stable.repo | tee /etc/yum.repos.d/mono-centos8-stable.repo'

# 安装mono
yum install mono-devel
```

我单独把 mono的缓存打了个包，有遇到同样问题的小伙伴可以试试！

链接：https://pan.baidu.com/s/1nRsrTqznHEhkgwYstTR-vQ 

提取码：bili

ps：老服务器是上海的阿里云，新服务器是北京的百度。之前买过一台河北的阿里云，安装mono也是要等很久，似乎上海这边的服务器访问mono-project.com好一些，当然这纯属个人感觉~
