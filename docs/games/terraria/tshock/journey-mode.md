---
title: "TShock：旅行模式浅析"
tags: [泰拉瑞亚, terraria, tshock]
order: 201
source: https://www.bilibili.com/read/cv11229441/
sourceDate: 2021-05-10
draft: false
---

# TShock：旅行模式浅析

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv11229441/) · 2021-05-10
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

## 权限分配

旅行模式下需要给玩家分配对应权限，才能使用旅行模式的力量菜单（PowerMenu），由于超级管理员拥有服务器全部权限，如果这些操作都是超管来操作，则可略过。

```bash
# 物品研究
tshock.journey.research

# 调节难度（旅行、普通、专家、大师）
tshock.journey.setdifficulty

# 生态蔓延 开关
tshock.journey.biomespreadfreeze

# 雨量调节开关
tshock.journey.rain.freeze
# 雨量
tshock.journey.rain.strength

# 风速调节 开关
tshock.journey.wind.freeze
# 风速调节
tshock.journey.wind.strength

# 时间冻结 开关
tshock.journey.time.freeze
# 改时间（黎明、正午、黄昏、午夜）
tshock.journey.time.set
# 时间流速
tshock.journey.time.setspeed

# 无敌模式 开关
tshock.journey.godmode

# 扩大放置范围
tshock.journey.placementrange

# 刷怪速率
tshock.journey.setspawnrate
```

给普通玩家分配权限

```bash
/group addperm default tshock.journey.research
```

## 力量菜单（PowerMenu）回顾

![[journey-mode-01.webp]]

![[journey-mode-02.webp]]

## 作用范围

以怪物生成速率为例，玩家A开了12倍生成速率，玩家B将生成速率调到0。当 玩家B 距离 玩家A 足够远时，玩家B附近不会刷怪，但是但两人汇合时，由于玩家A开了12倍，于是玩家B附近亦会有怪物生成。

于是可以推断 时间、风速、雨量 生效逻辑都是取交集。

无敌模式，只对自己生效，另外新版的tshock（支持泰拉1.4.2后的）的/godmode指令效果已经改成旅行模式的godmode，这次你真的无敌了。。。

## 物品研究

需要开启SSC（强制开荒）才能使用物品研究，研究是共享的，一人研究全员共享。

研究记录保存在 tshock.sqlite 数据库中。

![[journey-mode-03.webp]]

![[journey-mode-04.webp]]

**WorldId** 是世界ID，通过 /worldinfo 指令可以找到WorldId，另外你可以使用 TEdit地图编辑器来更改 WorldId，意味着如果你更换地图后，研究就没了。

**PlayerId** 是玩家ID，表示服务器第几个注册玩家，通过匹配User表中的ID可以找到玩家的名字。

**ItemId** 是物品ID，泰拉的每个物品都有一个ID。

**AmountSacrificed** 是已研究的数量。

**TimeSacrificed** 是最后一次研究的时间。

**能否导出物品研究**

tshock服，可以通过编辑数据库来实现复制。人物存档暂时还没有办法。

强制开荒的人物数据需借助插件才能来导出，不过这款插件暂时不支持将物品研究进度导出到人物存档。

将TS云存档导出为本地存档：https://www.bbstr.net/r/playerexport-ts.42/
