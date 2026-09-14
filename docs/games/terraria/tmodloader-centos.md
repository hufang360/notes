---
title: "tModLoader CentOS服务器搭建"
tags: [泰拉瑞亚, centos, tModLoader]
order: 32
source: https://www.bilibili.com/read/cv9452072/
sourceDate: 2021-01-25
draft: false
---

# tModLoader CentOS服务器搭建

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv9452072/) · 2021-01-25
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

\* 这里以 tModLoader v0.11.8（1.3.5.3）为例

\* 这里以 tModLoader v0.11.8.5（1.3.5.3）为例

首先你得有(mai)一台服务器，且设置好SSH连接，个人推荐使用**FinalShell**来进行SSH连接，首先它不仅是免费的，还有几个非常实用的功能，用它可以直观地看到服务器上文件，上传和下载也很方便，同时还能实时查看**内存**和**CPU**的占用情况。

![[tmodloader-centos-01.webp]]

*FinalShell主界面*

**下载tModLoader**

首先安装wget工具，完成后使用wget直接将tModLoader（后面简称“tmod”）下载到服务器上

**yum install wget**

**wget https://github.com/tModLoader/tModLoader/releases/download/v0.11.8/tModLoader.Linux.v0.11.8.zip**

```bash
yum install wget
wget https://github.com/tModLoader/tModLoader/releases/download/v0.11.8.5/tModLoader.Linux.v0.11.8.5.zip
```

![[tmodloader-centos-02.webp]]

*wget命令截图*

由于我买的服务器在国内，下载经常失败，此时可以手动下载，然后通过FinalShell上传到服务器，文件大小在48mb左右，官方下载地址：https://github.com/tModLoader/tModLoader/releases

**解压tmod**

安装unzip，用它来解压zip

****yum install unzip****

**unzip tModLoader.Linux.v0.11.8.zip -d /root/tModLoader**

```bash
yum install unzip
unzip tModLoader.Linux.v0.11.8.5.zip -d /root/tModLoader
```

![[tmodloader-centos-03.webp]]

*解压截图*

**安装**mono****

tmod需要mono跨平台运行环境，mono安装方法来自：https://www.mono-project.com/download/stable/#download-lin-centos。

首先添加mono的资料信息到centos中

**CentOS8**

**rpmkeys --import "http://pool.sks-keyservers.net/pks/lookup?op=get&search=0x3fa7e0328081bff6a14da29aa6a19b38d3d831ef"**

**su -c 'curl https://download.mono-project.com/repo/centos8-stable.repo | tee /etc/yum.repos.d/mono-centos8-stable.repo'**

**CentOS7**

**rpmkeys --import "http://pool.sks-keyservers.net/pks/lookup?op=get&search=0x3fa7e0328081bff6a14da29aa6a19b38d3d831ef"**

**su -c 'curl https://download.mono-project.com/repo/centos7-stable.repo | tee /etc/yum.repos.d/mono-centos7-stable.repo'**

CentOS8

```bash
# centos8
rpmkeys --import "http://keyserver.ubuntu.com/pks/lookup?op=get&search=0x3fa7e0328081bff6a14da29aa6a19b38d3d831ef"
su -c 'curl https://download.mono-project.com/repo/centos8-stable.repo | tee /etc/yum.repos.d/mono-centos8-stable.repo'
```

CentOS7

```bash
# centos7
rpmkeys --import "http://keyserver.ubuntu.com/pks/lookup?op=get&search=0x3fa7e0328081bff6a14da29aa6a19b38d3d831ef"
su -c 'curl https://download.mono-project.com/repo/centos7-stable.repo | tee /etc/yum.repos.d/mono-centos7-stable.repo'
```

**安装mono**

**yum install mono-devel**

![[tmodloader-centos-04.webp]]

*添加mono资料库截图*

由于网络原因安装mono很容易失败，如果你的也是CentOS8，请阅读我写的这篇文章：

> 参考：[Bilibili 专栏 cv10638648](https://www.bilibili.com/read/cv10638648/)

**启动tmod**

将 相关文件（ tModLoaderServer、tModLoaderServer.bin.x86\_64等）设置为可执行，然后执行启动脚本。

**chmod u+x /root/tModLoader/tModLoaderServer\***

**/root/tModLoader/tModLoaderServer**

![[tmodloader-centos-05.webp]]

*tModLoader文件情况*

![[tmodloader-centos-06.webp]]

*tmod启动截图*

**安装 screen**

tmod服务器开启后，如果我们直接关闭终端，服务器会被强制退出，安装screen后，就能够后台运行tmod。

一般直接安装即可

**yum install screen**

CentOS8上可能提示错误“Error: Unable to find a match: screen”，先安装epel就可以解决了

**yum install epel-release**

**yum install screen**

**screen使用方法**

首先创建一个screen 它的名字是 tmod，执行后会打开一个新的终端会话

**screen -S tmod**

然后执行tmod的开服脚本即可

**/root/tModLoader/tModLoaderServer**

然后断开终端连接，tmod服务器仍然会运行，当我们再次连接终端时，输入以下命令即可恢复

**screen -r**

**上传mod或地图**

运行一次，让tmod创建相关文件夹，然后按 Ctrl+Z 退出

![[tmodloader-centos-07.webp]]

tmod相关的文件会被存放在 （/root/**.local/share/Terraria/ModLoader**）

其中**Mods**目录是mod目录，**Worlds**是地图存档目录

![[tmodloader-centos-08.webp]]

*tmod目录*

在FinalShell的文件窗口，找到mods目录，将你玩mod拖进来，当你松开鼠标左键时，FinalShell会自动将mod传到该目录。上传地图也是同样的操作。

上传进度界面是浮动的，会自动隐藏，可以在软件界面的右上角找到显示开关，当有文件在传输时图标是橙色的。

![[tmodloader-centos-09.webp]]

**启用mod**

运行脚本启动程序，出现超过4个选项，自下而上分别是 **Mod Browser**（模组浏览器）、**Mods Menu**（模组管理）、**Delete World**（删除世界）、**New World**（创建世界）等。

1、输入字母“**m**”，然后敲Enter键，执行“**Mods Menu**”操作，这步相当于在tmod的主界面上点击了**模组管理。**

![[tmodloader-centos-10.webp]]

![[tmodloader-centos-11.webp]]

*tmod主界面*

2、此时会列出mod目录下的相关模组，在模组的名字后面可以看到（disabled）字样，说明该模组未被启用。输入模组名称左边的序号启用对应模组，例如要启用 **Localizer**，首先输入1，然后敲Enter键，此时对应选项变为 "1     Localizer(**enabled**)"。要启用模组，只需输入“e”，然后敲Enter键即可，启用操作几乎是一瞬间完成的，但事实上得执行完重载mod操作才算启用成功，所以选择要要启用的mod后，输入“r”然后敲Enter键，，让刚才的启用操作生效。

![[tmodloader-centos-12.webp]]

![[tmodloader-centos-13.webp]]

mod启用成功后，选择地图进行开服。tmod默认也是使用7777端口的，请记得去服务器后台开放这个端口权限哦！

后续还有些步骤，就暂时写到这吧~~~~

~Enjoy~
