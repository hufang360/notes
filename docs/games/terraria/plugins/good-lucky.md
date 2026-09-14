---
title: "TShock插件：GoodLucky | 好运来"
tags: [泰拉瑞亚, terraria, tshock]
order: 270
source: https://www.bilibili.com/read/cv15428863/
sourceDate: 2022-02-26
draft: false
---

# TShock插件：GoodLucky | 好运来

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv15428863/) · 2022-02-26
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

啧啧啧~ 这喜庆的名字，不愧是我~~~

言归正传，这个插件的主要目的是给进服的玩家加buff，刚进服 和 重生 时会自动加上你配置的buff，首次运行插件会生成一个默认配置，默认配置是一个 52分钟时长的好运buff，因此插件名为 “好运来”。

配置文件保存在： ./tshock/GoodLucky/config.json

示例：

```json
{
  "buff": [
    {
      "id": 257,
      "seconds": 3120
    },
    {
      "id": 11,
      "seconds": -1
    }
  ]
}
```

一看配置就知道插件允许配置多个buff，还能设置每个buff的时长。

id为257的buff是 好运，id为11的是光芒。

时长单位是秒：

3120=52\*60，即52分钟的buff持续时间。

\-1表示无限时间，泰拉最大持续时长是 415天，即 35791393 秒 。

插件开源了，可前往 码云（gitee）下载。

开源地址：https://gitee.com/hufang360/TShockGoodLucky

插件下载：https://gitee.com/hufang360/TShockGoodLucky/releases

配置buff 用到了 id，可以从官方wiki（百科）上找到：

https://terraria.fandom.com/zh/wiki/Buff\_IDs

泰拉里 宠物、坐骑、仆从等都是buff，用这个插件搞出什么好玩法，记得留言哦！

哦对了，典藏版送的 宠物兔（胡萝卜）没法通过 胡萝卜 物品召唤，给id为40的buff就可以哦！
