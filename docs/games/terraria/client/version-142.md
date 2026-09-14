---
title: "泰拉瑞亚：1.4.2更新 ;-）"
tags: [泰拉瑞亚, 创意工坊]
order: 110
source: https://www.bilibili.com/read/cv10533737/
sourceDate: 2021-03-30
draft: false
---

# 泰拉瑞亚：1.4.2更新 ;-）

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv10533737/) · 2021-03-30
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

## **1.4.2更新了~**

更新“创意工坊” 功能，可以从Steam上订阅和发布**资源包**和**世界**（地图），资源包类型有 材质包、音乐包和语言包。

更新日志：

![[version-142-01.webp]]

![[version-142-02.webp]]

主菜单微调

原来的“纹理包”改成了“创意工坊”，纹理包被收进了二级菜单里，并且改名为“资源包”。

![[version-142-03.webp]]

*“纹理包”->“创意工坊”*

![[version-142-04.webp]]

从Steam创意工坊订阅的材质包后，就会出现在这里了。

![[version-142-05.webp]]

![[version-142-06.webp]]

## 发布问题

不久前自己动手生成了几个字体材质包，尝试发布上去，在创意工坊始终看不到发布结果，仔细一看原来右下角有个警告小图标，点击后显示“无法将该物品发布到Steam！**你需要接受创意工坊的服务条款”**。同意条款后，在游戏的右下角会有上传进度显示。

![[version-142-07.webp]]

*资源发布异常*

![[version-142-08.webp]]

*报告页面*

![[version-142-09.webp]]

*发布进度*

**同意条款**

大致步骤看下图

![[version-142-10.webp]]

*1、进入“创意工坊”*

![[version-142-11.webp]]

*2、点击“您的创意工坊文件”*

![[version-142-12.webp]]

*3、点击“查看法律协议”*

![[version-142-13.webp]]

*4、点击“接受”*

直接访问网址：https://steamcommunity.com/workshop/workshoplegalagreement/

4月6日更新

点击这里会直接使用默认浏览器，打开服务条款链接。

![[version-142-14.webp]]

## 有趣的材质包

通过创意工坊订阅的材质包会保存在这 C:\\Program Files (x86)\\Steam\\**steamapps\\workshop\\content\\105600**

首先是**官方提供的材质包**，第一个材质包作者是jim，对就是，1.4的官方壁纸的作者，开发者物品时牛头人（蟋蟀）那位，材质包料很足，**总之墙裂大家体验一下这个材质包**。

https://steamcommunity.com/sharedfiles/filedetails/?id=2434616874

![[version-142-15.webp]]

只放几张明显的，其它的订阅后慢慢欣赏吧。

![[version-142-16.webp]]

![[version-142-17.webp]]

![[version-142-18.webp]]

![[version-142-19.webp]]

第二个材质包来自 Lazure（拉热尔），对就是女武神套的那位开发者。

https://steamcommunity.com/sharedfiles/filedetails/?id=2434613351

![[version-142-20.webp]]

![[version-142-21.gif]]

![[version-142-22.gif]]

**我的世界** 材质包，我的世界说，我好方。

https://steamcommunity.com/sharedfiles/filedetails/?id=2439772075

![[version-142-23.webp]]

**彩色圣物**，不用多介绍看图就知道了。

https://steamcommunity.com/sharedfiles/filedetails/?id=2439811907

![[version-142-24.webp]]

![[version-142-25.webp]]

**Super Mario Bros 1**，这个是世界（地图），前段时间直播的时候有体验过这张图，原作者是Copters，哇就是原作者上传的。不断跳跃闯关最后营救公主，hh，1.4.1.2更新了公主NPC，这图就有点圆满了，。

https://steamcommunity.com/sharedfiles/filedetails/?id=2439862221

![[version-142-26.webp]]

还有很多有趣的内容，大家找找吧！

## 多人联机问题

服主们注意了，由于更新过快，tshock新版还未发布，1.4.2会进不了服务器，使用**同服插件**可以解除限制。插件下载地址见泰拉中文论坛：www.bbstr.net/r/noversionlimit.44/

极少数情况下，启用了一些资源包后，会出现游戏无法启动的情况，可以尝试修改配置文件，手动禁用材质包，具体步骤是打开泰拉存档目录，一般是：**%userprofile%\\Documents\\My Games\\Terraria**，找到 **config.json** 文件，打开方式选择记事本，找到“ResourcesPacks”，将对应材质包名字下方的Enabled改成 false。

![[version-142-27.webp]]
