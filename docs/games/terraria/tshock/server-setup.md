---
title: "泰拉瑞亚：多人联机服务器搭建"
tags: [联机, 泰拉瑞亚, tshock]
order: 41
source: https://www.bilibili.com/read/cv9479081/
sourceDate: 2021-01-27
draft: false
---

# 泰拉瑞亚：多人联机服务器搭建

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv9479081/) · 2021-01-27
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

服务端程序：TShock

服务器系统：CentOS7/8

游戏版本：v1.4.0.5，v1.4.3.2，**v1.4.3.6**

服务端程序版本：TShock4.4.0\_Pre12，TShock4.5.13， **TShock4.5.17**

本文最后编辑时间是：2022年4月27日 12点

2022年12月23日：TShock5.0的搭建方法请先看文本的补充篇，再来回看本文。

> 参考：[Bilibili 专栏 cv20692064](https://www.bilibili.com/read/cv20692064/)

起初是通过Steam进行联机，2，3个人还算顺畅，人多以后就卡了，加速器也没帮上什么忙。之前看过一篇专栏，是教怎么搭服务器的，于是按图索骥，找来搭建试试。饮水思源，原文链接：[https://www.bilibili.com/read/cv6990509](https://www.bilibili.com/read/cv6990509)。

搭服务器的好处很明显，小伙伴只需输入IP就能联机，延迟更低，多人联机体验好。不过搭建服务器是技术活，而且买服务器还是一笔花销。这里分享下个人经验。

首先搞（mai）一台服务器，个人是阿里云，由于账号买过阿里家的其它服务，不符合首购条件，好家伙，买台服务器并不便宜，家境贫寒，能省就省……打听到朋友没用过阿里云，新账号首次购买服务器，优惠很大，一台服务器租一年不到200，最低月均¥17左右。有条件尽可能选择更高的配置，根据我最近的10人联机情况来看，配置最好是4G内存，带宽4M。可以先买1M的带宽，需要多人联机前临时升级带宽，大带宽主要是为了多人打Boss不卡，多人联机时射弹太多，特别吃带宽，其它时候1M也差不多够，另外地区尽量选离你家近的地区。

下面是服务器搭建部分。

首先通过SSH连接服务器，个人推荐使用**FinalShell**，用它管理服务器上的文件体验太好了，还能查看内存和cpu的占用情况，上传和下载文件都非常方便，且支持使用本地编辑器编辑文件，最后它是免费的。

![[server-setup-01.webp]]

*FinalShell主界面*

## **准备工作**

**安装 wget 和 unzip**

wget是下载工具，unzip是解压工具，输入这行命令进行安装

```bash
yum -y install wget unzip
```

**安装 mono**

mono是跨平台运行环境。首先添加mono的资料信息到系统中。

CentOS8

```bash
rpmkeys --import "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x3fa7e0328081bff6a14da29aa6a19b38d3d831ef"

su -c 'curl https://download.mono-project.com/repo/centos8-stable.repo | tee /etc/yum.repos.d/mono-centos8-stable.repo'
```

CentOS7

```bash
rpmkeys --import "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x3fa7e0328081bff6a14da29aa6a19b38d3d831ef"

su -c 'curl https://download.mono-project.com/repo/centos7-stable.repo | tee /etc/yum.repos.d/mono-centos7-stable.repo'
```

执行安装

```bash
yum install mono-devel
```

安装方法来自：https://www.mono-project.com/download/stable/#download-lin-centos。

**安装screen**

服务器开启后，如果直接关闭终端，服务器会被迫强制退出，使用screen可以实现后台运行。一般直接安装即可

```bash
yum install screen
```

CentOS8上可能提示错误“Error: Unable to find a match: screen”，先安装epel即可解决。

```bash
yum install epel-release
yum install screen
```

## **下载TShock**

TShock是泰拉的服务端程序，使用命令将其下载到服务器上

**v1.4.3.6（4.5.17）**

```bash
wget https://github.com/Pryaxis/TShock/releases/download/v4.5.17/TShock4.5.17_Terraria_1.4.3.6.zip

# 备用下载地址
# https://gitee.com/hufang360/tshock-mirror/attach_files/1000726/download/TShock4.5.17_Terraria_1.4.3.6.zip
```

**v1.4.3.2**

```bash
wget https://github.com/Pryaxis/TShock/releases/download/v4.5.13/TShock4.5.13_Terraria1.4.3.2.zip

# 备用下载地址
# https://gitee.com/hufang360/tshock-mirror/attach_files/971183/download/TShock4.5.13_Terraria1.4.3.2.zip
```

**v1.4.0.5**

```bash
wget https://github.com/Pryaxis/TShock/releases/download/v4.4.0-pre12/TShock4.4.0_Pre12_Terraria1.4.0.5.zip # 备用下载地址 # https://gitee.com/hufang360/tshock-mirror/attach_files/806801/download/TShock4.4.0_Pre12_Terraria1.4.0.5.zip
```

文件名带有pre字样，是个预览版（preview），后期还会有更新，官方Github：https://github.com/Pryaxis/TShock/releases

![[server-setup-02.webp]]

*wget下文件*

## **解压TShock**

解压下载完的zip，并将解压后的目录命名成 **tshock-client**

**v1.4.3.6**

```bash
mkdir tshock-client
unzip TShock4.5.17_Terraria_1.4.3.6.zip -d ./tshock-client
mono ./tshock-client/TerrariaServer.exe
```

**v1.4.3.2**

```bash
mkdir tshock-client
unzip TShock4.5.13_Terraria1.4.3.2.zip -d ./tshock-client
mono ./tshock-client/TerrariaServer.exe
```

**v1.4.0.5**

```bash
mkdir tshock-client unzip TShock4.4.0_Pre12_Terraria1.4.0.5.zip -d ./tshock-client mono ./tshock-client/TerrariaServer.exe
```

![[server-setup-03.webp]]

## **首次运行TShock**

先运行一次，以生成相关文件和目录，运行命令后，按Ctrl+Z，退出运行。

```bash
mono ./tshock-client/TerrariaServer.exe
```

![[server-setup-04.webp]]

地图保存在：/root/.local/share/Terraria/Worlds

TShock配置位于：/root/tshock

在FinalShell里打开存档文件夹，将本地存档拖到FinalShell，松开鼠标左键，即可将存档上传到对应目录。

![[server-setup-05.webp]]

\* 为什么要命名成 **tshock-client**？

服务器启动后会在运行目录下创建一个名为**tshock**的目录，服务器的配置文件都会在里面，每次开服此文件夹都会多出一个日志文件，开服次数多了后文件数量就比较多了，所以和tshock程序目录隔开。

也可以用tshock创建地图，下面是示意图。

![[server-setup-06.webp]]

## **开服**

用screen创建一个会话，比如会话名字为 tr

```bash
screen -S tr
```

启动服务器

```bash
mono ./tshock-client/TerrariaServer.exe
```

下面是操作示意图，一般来说选择好地图后，一路敲Enter键就可以了。

![[server-setup-07.webp]]

恭喜你看到这里，如果以上操作都成功的话，就可以召唤小伙伴联机了。

后面还有些服务器配置相关的内容，先挖个坑，待后面补上。

泰拉瑞亚1.4 centos7 服务器搭建（tshcok）：[https://www.bilibili.com/read/cv6990509](https://www.bilibili.com/read/cv6990509)

官方wiki（中文）：https://terraria-zh.gamepedia.com/服务器

官方wiki（英文，内容更全）：https://terraria.gamepedia.com/Server

tshock官方Github：https://github.com/Pryaxis/TShock/releases

tshock命令行启动参数：https://tshock.readme.io/docs/command-line-parameters
