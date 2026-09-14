---
title: "TShock新增加了中文支持，快来开启它！"
tags: []
order: 251
source: https://www.bilibili.com/read/cv19260536/
sourceDate: 2022-10-23
draft: false
---

# TShock新增加了中文支持，快来开启它！

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv19260536/) · 2022-10-23
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

2023年4月11日：觉得加参数太麻烦，或者你用的是某些面板服，没法更改参数，可以使用“Lang7”小插件，将.dll文件复制到插件目录下，重启服务器就可以了。

Lang7小插件直接下载地址：https://gitee.com/hufang360/tshock/raw/master/Plugins/Lang7.dll

2022年11月1日：新版的tshock只需在服务器启动的时候加上-lang 7参数，就能自动开启tshock的中文翻译了。

啰嗦一下，估计有部分服主还不知道怎么加参数启动。

**Windows:**

1 在 TShock.Server.exe 所在目录下，新建一个文本文档，并命名为 “开服.txt”。

2 编辑txt，输入下面的内容，然后保存。

```bash
@echo off
TShock.Server.exe -lang 7
pause
```

3 将 “开服.txt” 改名成 “开服.bat”。

4 双击 “开服.bat”，会出现命令行窗口，此时就能看到中文了。

5 对以后就是双击 “开服.bat”来开服。

**Linux：**

1 在 TShock.Server 所在目录下，新建一个名为 “run.sh”文本文档。

2 编辑"run.sh"，输入下面的内容，然后保存。

```bash
#!/bin/bash
TShock.Server -lang 7
```

3 将 run.sh 设置成可执行文件（只需操作一次）

```bash
chmod +x run.sh
```

4 运行 run.sh 就可以了。

也可以用命令来创建，例如 我的TShock.Server 是在 /root/tshock,命令则是这样：

```bash
cd /root/tshock

touch run.sh
echo '#!/bin/bash'>>run.sh
echo './TShock.Server -lang 7'>>run.sh

chmod +x run.sh

./run.sh
```

这几天TShock增加了多语言支持，就在几个小时前，初步的中文翻译已生成。现在介绍下如何开启中文语言。

众所周知，启动服务器的时候加上“-lang 7”参数，可以开启 泰拉内置的中文，于是在tshock的内你便可以用  /item 天顶剑 获得天顶剑。不过这次要通过环境变量设置中文语言。

## Windows

设置环境变量有两种方式。

方式1：

按下图新建环境变量，变量名为 “TSHOCK\_LANGUAGE”，变量值为“zh-CN”。

设置完成后，请重新开服/重新打开命令行。

如果你是双击“TShock.Server.exe”开服的，请使用这种方式。 

![[chinese-support-01.webp]]

方式2：

在命令行设置临时变量，此变量将在命令行关闭时失效。

通过命令行启动前，先执行这行指令“set TSHOCK\_LANGUAGE=zh-CN”，然后再将exe拖入到命令行界面执行。（需要指出的是，直接双击exe启动的话，请使用方式1，方式2无效）

或者你跟我一样，喜欢通过.bat来启动，可以写成这样：

```bash
@echo off
set TSHOCK_LANGUAGE=zh-CN
TShock.Server.exe -lang 7
pause
```

## Linux

同样有两种方法，一种是设置环境变量，另一种是写进脚本或设置终端临时变量。

Linux上设置系统环境变量的方法请自己查询，将“export TSHOCK\_LANGUAGE=zh-CN”加入环境变量中就ok了。

终端上，执行“export TSHOCK\_LANGUAGE=zh-CN”，再运行“./TShock.Server”就ok了。

那么我个人是喜欢用脚本来启动的，大致是写成这样：

```bash
#!/bin/bash

# 获得本sh所在目录
sh_path=$(cd `dirname $0`; pwd)
cd "$sh_path"

# tshock 语言设置成中文
export TSHOCK_LANGUAGE=zh-CN

# 启动服务器
"$sh_path"/TShock.Server -lang 7
```

## 效果

![[chinese-support-02.webp]]

用vscode查看翻译文本：

![[chinese-support-03.webp]]

## 最后

最后 请前往 https://github.com/Pryaxis/TShock/actions 下载最新版本。

10月23日最新版本是：https://github.com/Pryaxis/TShock/actions/runs/3305387294

注意需要登录github账号才能下载。
