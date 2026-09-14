---
title: "TL Pro 材质包制作指北"
tags: [泰拉瑞亚, 材质包, terraria, tlpro]
order: 140
source: https://www.bilibili.com/read/cv11828472/
sourceDate: 2021-06-22
draft: false
---

# TL Pro 材质包制作指北

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv11828472/) · 2021-06-22
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

TL Pro 是安卓平台上的一款泰拉瑞亚启动器，用它可以加载材质包。材质包的制作方法跟电脑版几乎相同，下面是他们的一些结构上的异同：

![[tlpro-pack-guide-01.webp]]

## **Modified    材质文件夹**

Modified 是修改的意思，即所有的材质文件都放在这里，和电脑版不同的是，不会出现子目录，所有材质文件都是拷贝到这一个文件夹里。材质文件的转换流程大概是这样的：

1、拷贝材质到这个文件夹里；

2、扩展名改成.texture；

3、创建同名json文件，里面标记.texture对应的是哪张图片，例如上图中 1.json标记这 1.texture 是对应 Content/Images/Item\_1；

当材质文件较多时，用数字命名可能很不方便，实际上文件名也可以是 Item\_1.texture, Item\_1.json 这种；

## **Icon.png    图标**

Icon.png 可以直接拷贝过去，图标也可以是 .gif 格式，文件名是 Icon.gif，将图标做成gif动画，wow，有点酷😎。

## **Settings.josn    描述文件**

由于作者来自俄罗斯，于是要求填写 俄语描述 和 英语描述 （descriptionRussian 和 descriptionEnglish），实际上俄语描述可以空着。

![[tlpro-pack-guide-02.webp]]

## **Authors    作者**

存放材质包作者的头像，TL允许配置多个作者，作者头像也支持gif动画，配置如下图：

![[tlpro-pack-guide-03.webp]]

## **Previews    预览图**

预览图的尺寸不固定，支持 .png、.jpg、.gif 和 .webp 格式，建议将文件名改成 1.png、2.png、3.png。

## **要怎么用**

材质包做好了，那要怎么使用呢！

将材质包打包成zip，然后通过QQ发到手机上，在手机上解压后，将文件夹拷贝到 /Android/data/**com.pixelcurves.terlauncher**/tl\_files/packs/ 目录下。

解压和拷贝工作建议使用 **ES文件浏览器** 来完成。

![[tlpro-pack-guide-04.webp]]

![[tlpro-pack-guide-05.webp]]

## **不只是材质**

电脑版的泰拉支持更换bgm和翻译，实际上TL也支持这些。官方额外发布了一个名为“TL Packer”的应用，用它把资源包打包成 .tl格式的文件。

这个app上对资源做了7个分类，其中 纹理和图形用户界面 都是png图片，TL希望跟ui相关的png图片单独命名成.gui，这样在【图形用户界面】就能找到。

![[tlpro-pack-guide-06.webp]]

## **音乐包**

电脑版支持 .mp3、.wav 和 .ogg 三种音频格式，但TL目前只支持mp3，遇到wav和ogg需要先转成mp3后再进行操作。

![[tlpro-pack-guide-07.webp]]

BGM文件对照：

```html
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

## **最后**

除了材质和音乐外，如果对其它类型的资源包感兴趣，可以将tl保存到手机上的资源，拷到电脑上进行分析。

在TLPro上浏览指定类型的资源包，点击下载，下载后的文件就保存在 /Android/data/com.pixelcurves.terlauncher/tl\_files/packs/ 下面， 一个文件夹就是一个资源包，文件夹名以GUID命名的，也可以改名。

![[tlpro-pack-guide-08.webp]]

最后提供两个TL可用的资源包，将zip下载到手机上，解压到对应目录，启动TL就能用了。

链接: https://pan.baidu.com/s/1yGxAxaXt9yr0avMJ6iR7vQ

提取码: cs8y

1、《Jimmarn's Official Texture Pack》

![[tlpro-pack-guide-09.webp]]

![[tlpro-pack-guide-10.webp]]

![[tlpro-pack-guide-11.webp]]

2、《Money Fishron》

![[tlpro-pack-guide-12.webp]]
