---
title: "在服务器上使用opencode"
tags: []
order: 110
source: https://www.bilibili.com/read/cv52277722/
sourceDate: 2026-08-12
draft: false
---

# 在服务器上使用opencode

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv52277722/) · 2026-08-12
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

我有台云服务器系统比较老，安装不了opencode。不过服务器上有docker环境。安装opencode需要nodejs v20，但centos8 只到 v10。 opencode内置了免费模型，几乎是开箱即用，排查问题会方便很多。 建议将下面内容添加 .bashrc 里面 # vim ~/.bashrc # source ~/.bashrc function opencode() { docker run -it --rm \\ -v "$PWD:$PWD" \\ -w "$PWD" \\ -v "$HOME/.config/opencode:/root/.config/opencode" \\ -v "$HOME/.cache/opencode:/root/.cache/opencode" \\ -v "$HOME/.local/share/opencode:/root/.local/share/opencode" \\ ghcr.io/anomalyco/opencode } cd到对应目录后，执行opencode指令，会自动将当前目录挂载给容器，创建容器，并进入oc的终端界面。完事后按ctrl+c退出，退出时会自动销毁容器。 模型配置、对话记录，也做了持久化，以便回溯。 备注： 这个镜像比较精简，是不带git的。 opencode是tui（终端ui），输入 /models 时可以切换模型。输入 /connect 可以接入DeepSeek等。 后续如何更新，docker pull ghcr.io/anomalyco/opencode 拉取新版docker镜像。 ghcr.io 是github的镜像仓库，所以不走你设置的镜像源，如果pull不了镜像。可以在你本机pull，然后导出tar，上传到服务器上，再 docker load -i xx.tar 进行导入，具体操作步骤，可以复制这句给ai。镜像大概 212mb。 opencode默认模型，api地址应该是 https://opencode.ai/zen 开头的，如果无法访问，请切到deeseek。
