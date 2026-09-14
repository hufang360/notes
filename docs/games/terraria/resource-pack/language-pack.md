---
title: "泰拉瑞亚：语言包制作摘要"
tags: [泰拉瑞亚, terraria, Language Packs]
order: 100
source: https://www.bilibili.com/read/cv10681818/
sourceDate: 2021-04-07
draft: false
---

# 泰拉瑞亚：语言包制作摘要

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv10681818/) · 2021-04-07
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

\* 本文描述偏简略，详细操作需要自己稍微摸索一下

**语言包**（Language Packs）是1.4.2新增功能，可以覆盖游戏内的文本翻译，制作方式跟材质包类似。

语言包支持csv和json两种格式，这里以csv为例，csv位于 **\\Content\\Localization\\zh-Hans\\**，可放入0~7个csv文件，结构如下图。

![[language-pack-01.webp]]

游戏里有几个翻译错误，例如 **外星弯刀** 应该翻译成 **异域弯刀**，**坚固头盔** 应该翻译成 **坚固****化石**，**星云燃料** 应该翻译成 **星云染料**，以这些修复这些错误为例。

用记事本新建一个**Items.csv**的文本文档，并将文本的编码格式改为 **UTF-8**，然后填入如下内容：

```bash
key,translation
ItemName.DyeTradersScimitar,异域弯刀
ItemName.FossilOre,坚固化石
ItemName.NebulaDrill,星云染料
```

wiki上有个翻译错误合集：https://terraria.fandom.com/zh/wiki/翻译错误

**如何获得全部的翻译文本**

将**Terraria.exe**拖进反编译工具 **ILSpy**，如下图所示，选中带 **zh-Hans** 字样的json，然后点击右侧的保存，挨个导出json。其中 **Game.json** 对应 **Game.csv**，**Items.json** 对应 **Items.csv**，**Terraria.Localization.Content.zh-Hans.json** 对应 **Main.csv。**

![[language-pack-02.webp]]

**ILSpy 以及 json**

链接：https://pan.baidu.com/s/1Z2M2X5qihfgUFsJZJ4L5qw 

提取码：hans

本文参考：

https://forums.terraria.org/index.php?threads/100652/#languagepack

https://www.bejson.com/jsonviewernew/
