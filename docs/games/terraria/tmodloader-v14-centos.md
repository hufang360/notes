---
title: "tModLoader v1.4 CentOS服务器搭建简略步骤"
tags: [terraria, tModLoader]
order: 33
source: https://www.bilibili.com/read/cv17352028/
sourceDate: 2022-07-01
draft: false
---

# tModLoader v1.4 CentOS服务器搭建简略步骤

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv17352028/) · 2022-07-01
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

有小伙伴看了我之前写的文章，提出了一个问题，文章里是1.3的，那1.4的要怎么操作呢。这里我简略回答一下。

> 参考：[Bilibili 专栏 cv9452072](https://www.bilibili.com/read/cv9452072/)

个人经验，开服的难点在于1.4的tmod要下载dotnet6.0，像我的服务器就总下载不了，最后是先在我电脑上下载，再传到服务器上解决的。下面是简略的步骤。

## 1、下载1.4的tmod

推荐去tmod的官方仓库下载，地址如下：

https://github.com/tModLoader/tModLoader/releases

目前最新直接下载地址是：

https://github.com/tModLoader/tModLoader/releases/download/v2022.05.103.34/tModLoader.zip

2023年1月4日：

https://github.com/tModLoader/tModLoader/releases/download/v2022.09.47.16/tModLoader.zip

2023年1月30日：

https://github.com/tModLoader/tModLoader/releases/download/v2022.09.47.26/tModLoader.zip

![[tmodloader-v14-centos-01.webp]]

下载完成后，拷贝到服务器上，然后解压。

我的操作是：

1、将 tModloader.zip 上传到 /root/tml/ 目录下。
2、执行指令

cd /root/tml

unzip tModLoader.zip -d client

（此时 /root/tml/client/ 目录下能找到 tml相关文件）

## 2、下载 dotnet 6.0.0 linux版本

在自己电脑上下载 dotnet6.0.0，然后拷贝到服务器上。

把下面的地址，粘贴到浏览器地址栏，并访问，就可以触发下载。

下载地址：https://dotnetcli.azureedge.net/dotnet/Runtime/6.0.0/dotnet-runtime-6.0.0-linux-x64.tar.gz

我的操作是：

1、执行指令（下面的指令主要是为了创建文件夹）

cd /root/tml/client

mkdir dotnet && cd dotnet

mkdir 6.0.0 && cd 6.0.0

2、将 **dotnet-runtime-6.0.0-linux-x64.tar.gz** 拷贝到 **/root/tml/client/dotnet/6.0.0/**目录下。

3、执行指令

cd /root/tml/client/dotnet/6.0.0

tar -xvf dotnet-runtime-6.0.0-linux-x64.tar.gz

文件情况大致如下：

![[tmodloader-v14-centos-02.webp]]

## 3、运行tmod

1、运行指令（首次运行）

cd /root/tml/client

chmod +x \*.sh

./start-tModLoaderServer.sh

（如果是第二次运行， chmod +x \*.sh 可以不执行）

2、此时会提示 “Use Steam Server (y)/(n) ”，输入字母“**n**”，然后敲Enter键。

3、看到“Choose World:”字样说明tml启动成功了。

![[tmodloader-v14-centos-03.webp]]

4、如果无法启动，可以尝试将这两个目录改名

/root/.local/share/Terraria/ModLoader

/root/.local/share/Terraria/tModLoader

例如：

/root/.local/share/Terraria/ModLoader-beifen

/root/.local/share/Terraria/tModLoader-beifen

另外1.4 的mod目录位于

/root/.local/share/Terraria/tModLoader/Mods

![[tmodloader-v14-centos-04.webp]]

## \* 一键启动脚本

个人习惯写个脚本，把mod和地图串起来，下面是一个示例：

将下面的脚本保存为 **run.sh**，并放到 **/root/tml/run.sh**

```bash
#!/bin/bash
# https://github.com/tModLoader/tModLoader/wiki/Command-Line

# 获得本sh所在目录
sh_path=$(cd `dirname $0`; pwd)
cd "$sh_path"

"$sh_path/client/start-tModLoaderServer.sh" \
 -savedirectory "$sh_path/" \
 -modpath "$sh_path/tModLoader/Mods/" \
 -world "$sh_path/ModLoader/Worlds/hallow.wld" \
 -lang 7 \
 -port 7777 \
 -maxplayers 10
```

注意：

1、脚本中指定 /root/tml/tModLoader/ 作为模组配置目录。

2、脚本中指定 /root/tml/tModLoader/Mods/ 作为模组目录。

3、脚本中指定 /root/tml/tModLoader/Worlds/hallow.wld 作为地图，需要根据你的实际情况修改这部分。我一般是电脑上安装相同模组后，用电脑创建地图，然后将文件拷贝到服务器上，注意mod的地图一般是由“.wld”和“.twld”这两个文件组成。目录大概是这样：

/root/tml/tModLoader/Worlds/hallow.wld

/root/tml/tModLoader/Worlds/hallow.twld

本段落，于2023年1月30日最后更新。

## \* 备份脚本

```bash
#!/bin/bash

# 获得本sh所在目录
sh_path=$(cd `dirname $0`; pwd)
sh_name="${sh_path##*/}"

# 备份世界
wldName=hallow

# 存档目录
# xx_20210117_1514_45.wld
sourceDir="$sh_path"/tModLoader/Worlds
sourceFile="$sourceDir"/"$wldName".wld
sourceFile2="$sourceDir"/"$wldName".twld

timeStr=$(date -d today +"%Y%m%d_%H%M_%S")
backDir="$sourceDir"/Backups
backFile="$backDir"/"$wldName"_"$timeStr".wld
backFile2="$backDir"/"$wldName"_"$timeStr".twld

# 如果文件夹不存在，则创建
if [[ ! -d "$backDir" ]]; then
mkdir "$backDir"
fi

# 备份
echo "正在备份wld：""$sourceFile"
cp "$sourceFile" "$backFile"
echo "正在备份twld：""$sourceFile2"
cp "$sourceFile2" "$backFile2"

# 检查备份
if [[ ! -f "$backFile" ]]; then
echo "备份失败，""$backFile"
fi
if [[ ! -f "$backFile2" ]]; then
echo "备份失败，""$backFile2"
fi

echo "操作完成！"
```

每次运行此脚本时，就会拷贝指定的“.wld”和“.twld”到 /root/tml/tModLoader/Worlds/Backups/ 目录下，例如：“hallow\_20230127\_2324\_01.wld”和“hallow\_20230127\_2324\_01.twld”。

注意，请修改脚本中的地图名称（文件名）“hallow”。

本段于2023年1月30日新增

本文写得比较简略，需要一定基础！！！
