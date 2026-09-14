---
title: "TShock插件：大地动 | quake"
tags: [泰拉瑞亚, terraria, tshock]
order: 230
source: https://www.bilibili.com/read/cv16022901/
sourceDate: 2022-04-07
draft: false
---

# TShock插件：大地动 | quake

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv16022901/) · 2022-04-07
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

“大地动”就是地震的意思，安装插件后，击败boss就会重建世界。

首次击败这些boss会触发大地动：

史莱姆王、克苏鲁之眼、克苏鲁之脑、世界吞噬怪、蜂王、骷髅王、鹿角怪、血肉墙、

毁灭者、双子魔眼、机械骷髅王、世界之花、石巨人、史莱姆皇后、光之女皇、猪龙鱼公爵 和 拜月教邪教徒。

事件不会触发。

## 基本功能

**阶段一：**

击败boss时，聊天区会出现如下提示，此时玩家要在30秒内拾取宝藏袋以及搬家，不然倒计时结束后这些都会被清除，注意老家的箱子和建筑都会没了，切记：

![[quake-01.webp]]

**阶段二：**

世界正在解体时，玩家依然可以操作背包，但是不要开宝藏袋以及丢物品出来，可能会被清掉。

世界正在重建时，地图图格会显示不正确，这个时候其实是在创建新的地图，建议选择中地图或小地图游玩，在我的服务器上中地图大概要创建80s左右，大地图可能要好几分钟。

![[quake-02.webp]]

**全员禁足**，为防止玩家在此期间挖方块及钓鱼等操作对创建世界照成影响，会对玩家进行禁足，全部玩家会传回出生点，并获得“恍惚（石化）”“阻塞”（视野范围变小）这两个buff，待重建完成后，这两个buff会被解除，这个功能默认是开启的，修改配置文件可以关闭。

![[quake-03.webp]]

**阶段三：**

世界重建完成后，就恢复正常了，此时地图已重建，也会自动将玩家传回出生点。

提示信息会告知，重建时间花了多长时间，以及地图的种子是什么。下面的4行提示则是一些提示，这4条提示都写在配置文件里，且支持修改。 /wi 和 /bi 是 WorldModify插件的功能，/spawn 和 /home 则是系统自带的指令，这些都需要服主授权，玩家才能使用。

有时重建完成后，有些玩家不一定会传回出生点，玩家可能会卡在方块里，授权使用回城指令，以及使用回城镜可以解决卡主问题。

![[quake-04.webp]]

**npc小套间**，世界重建完毕后，会在出生点创建玻璃小监狱，大地动前有多少个npc就会创建多少个小监狱，这个功能默认是不开启的，修改配置文件可以打开。

![[quake-05.webp]]

## 配置文件

配置文件位于 ./tshock/quake/config.json

```json
{
  "seeds": [
    "5162020",
    "5162021",
    "for the worthy",
    "not the bees",
    "constant"
  ],
  "size": 0,
  "keepFTW": true,
  "keepNTB": false,
  "keepDST": false,
  "keep2020": false,
  "keep2021": false,
  "successTips": "[i:3611]输入 /wi 查看 世界信息\n[i:149]输入 /bi 查看 boss进度\n[i:50]输入 /spawn 回出生点\n[i:3199]输入 /home 回家",
  "autoCreateRoom": false,
  "freezePlayer": true,
  "freezeBuffs": [156, 163]
}
```

**seeds**，重建世界用的种子有几率随机，也有几率从这里面挑选。

**size**，世界大小，0表示自动即使用当前世界大小，1表示小，2表示中，3表示大。

**keepFTW**、**keepNTB**、**keepDST**、**keep2020**、**keep2021** 重建世界后会要附加的彩蛋属性，默认会自动加上ftw，注意1405没有 ntb、2021和dst。

**successTips**，创建后的提示文字，多行文字用“\\n”换行。

**autoCreateRoom**，创建出生点 npc小套间，默认是false，改成true表示开启。

**freezePlayer**，是否全员禁足，默认是true，改成false表示关闭。

**freezeBuffs**，禁足buff，156是恍惚（石化），163是阻塞（视野范围变小）。

## 指令

给服主准备了几个指令，可以用作测试，以及世界重建后初期的一些过渡。

```json
/quake trigger，触发大地动
/quake room <数量>，生成玻璃小房间
/quake spawnroom，出生点玻璃小套间
/quake freeze，全员禁足
/quake size <1/2/3>，设置创建世界的大小
```

输入 /quake room 默认会创建3个玻璃小房间。

输入 /quake room 10 则是创建10个玻璃小房间。

## 下载插件

那么，在哪里可以买到呢？

no，no，no 插件是免费的，且代码也已经开源了。

下载地址：https://gitee.com/hufang360/TShockQuake/releases

开源地址：https://gitee.com/hufang360/TShockQuake

电脑版下载 Quake-v1.0.dll 即可。

pe版请下载 Quake-v1.0-1.4.0.5.dll。

最后插件可能还不完善的地方，花了一些时间测试，我们自己也用它开荒，有bug请一定反馈给我。

## 不足的地方

重建世界后，大地图的视野不会刷新，这就导致，你在大地图上看到的结果可能不正确。

目前还没找到解决方法。

或许这也是一种玩法（bushi）。

![[quake-06.webp]]
