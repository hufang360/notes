---
title: "泰拉瑞亚：音乐包制作摘要"
tags: []
order: 110
source: https://www.bilibili.com/read/cv10554566/
sourceDate: 2021-03-31
draft: false
---

# 泰拉瑞亚：音乐包制作摘要

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv10554566/) · 2021-03-31
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

音乐包（Music Packs）是1.4.2新增功能，就想把墓地的bgm改成“黑人抬棺”，之后又想把神圣之地的bgm改成《阳光彩虹小白马》，一通尝试后发现，TConvert释放的bgm，bgm序号并不是现在音乐包的序号，好家伙。才发现官方有写说明：https://forums.terraria.org/index.php?threads/100652/#resourcepack

```js
Music_1 = Overworld Day = 人间日（白天在森林中）
Music_2 = Eerie = 恐惧（陨石、血月）
Music_3 = Night = 暗夜（夜晚期间在地表的森林和神圣之地中）
Music_4 = Underground = 地下（地下、洞穴）
Music_5 = Boss 1 = 史莱姆王、克苏鲁之眼、世界吞噬怪、骷髅王、机械骷髅王
Music_6 = Title (Classic) = 标题（1.3版主界面）
Music_7 = Jungle = 丛林（白天）
Music_8 = Corruption = 腐化之地
Music_9 = The Hallow = 神圣之地（白天）
Music_10 = Underground Corruption = 地下腐化之地
Music_11 = Underground Hallow = 地下神圣之地
Music_12 = Boss 2 = 血肉墙、双子魔眼
Music_13 = Boss 3 = 毁灭者、雪人军团、克苏鲁之脑、火把神
Music_14 = Snow = 雪原
Music_15 = Space Night = 夜间太空
Music_16 = Crimson = 猩红之地
Music_17 = Boss 4 = 石巨人、拜月教邪教徒
Music_18 = Alt Overworld Day = 人间日备选曲（白天在森林中（当不在播放《Overworld Day》时））
Music_19 = Rain = 雨（下雨时在森林生物群落中）
Music_20 = Ice = 冰雪（下雨时在森林生物群落中）
Music_21 = Desert = 沙漠
Music_22 = Ocean Day = 日间海洋
Music_23 = Dungeon = 地牢
Music_24 = Plantera = 世纪之花
Music_25 = Boss 5 = 蜂王
Music_26 = Temple = 丛林神庙
Music_27 = Eclipse = 日食
Music_28 = Rain (Ambient) = 雨（下雨时在森林生物群落中）
Music_29 = Mushroom = 蘑菇
Music_30 = Pumpkin Moon = 南瓜月
Music_31 = Alt Underground = 地下备选曲(地下、洞穴（当不在播放《Underground》时）
Music_32 = Frost Moon = 霜月
Music_33 = Underground Crimson = 地下猩红之地
Music_34 = The Towers = 神塔（四柱）
Music_35 = Pirate Invasion = 海盗入侵
Music_36 = Hell = 地狱
Music_37 = Martian Madness = 火星暴乱
Music_38 = Lunar Boss = 月亮领主
Music_39 = Goblin Invasion = 哥布林入侵
Music_40 = Sandstorm = 沙尘暴
Music_41 = Old One's Army = 撒旦军队
Music_42 = Space Day = 日间太空
Music_43 = Ocean Night = 夜间海洋
Music_44 = Windy Day = 大风天
Music_45 = Wind (Ambience)
Music_46 = Town Day = 日间小镇（白天在城镇中）
Music_47 = Town Night = 夜间小镇（夜晚在城镇中）
Music_48 = Slime Rain = 史莱姆雨
Music_49 = Day Remix = 日间混合曲
Music_50 = Journey's Beginning w/ Relogic Intro
Music_51 = Journey's Beginning = 旅程开始
Music_52 = Storm = 暴风雨
Music_53 = Graveyard = 墓地
Music_54 = Underground Jungle = 地下丛林
Music_55 = Jungle Night = 夜间丛林
Music_56 = Queen Slime = 史莱姆皇后
Music_57 = Empress of Light = 光之女皇
Music_58 = Duke Fishron = 猪鲨
Music_59 = Morning Rain = 晨雨
Music_60 = Alt Title = 标题备选曲
Music_61 = Underground Desert = 地下沙漠
Music_62 = (Otherworldly) Rain
Music_63 = (Otherworldly) Day
Music_64 = (Otherworldly) Night
Music_65 = (Otherworldly) Underground
Music_66 = (Otherworldly) Desert
Music_67 = (Otherworldly) Ocean
Music_68 = (Otherworldly) Mushroom
Music_69 = (Otherworldly) Dungeon
Music_70 = (Otherworldly) Space
Music_71 = (Otherworldly) Underworld
Music_72 = (Otherworldly) Snow
Music_73 = (Otherworldly) Corruption
Music_74 = (Otherworldly) Underground Corruption
Music_75 = (Otherworldly) Crimson
Music_76 = (Otherworldly) Underground Crimson
Music_77 = (Otherworldly) Ice
Music_78 = (Otherworldly) Underground Hallow
Music_79 = (Otherworldly) Eerie
Music_80 = (Otherworldly) Boss 2
Music_81 = (Otherworldly) Boss 1
Music_82 = (Otherworldly) Invasion
Music_83 = (Otherworldly) The Towers
Music_84 = (Otherworldly) Lunar Boss
Music_85 = (Otherworldly) Plantera
Music_86 = (Otherworldly) Jungle
Music_87 = (Otherworldly) Wall of Flesh
Music_88 = (Otherworldly) Hallow
Music_89 = Journey's End = 旅程的终点（制作人员）
```

例如 **Music\_53** 是墓地的bgm，将黑人抬棺音频文件改名为 “Music\_53.mp3”，放到 **Content\\Music\\** 目录下，目前支持 **.wav**、**.mp3** 和 **.ogg** 3种格式的音频。
