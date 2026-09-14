---
title: "泰拉瑞亚：制作字体材质包"
tags: [泰拉瑞亚]
order: 120
source: https://www.bilibili.com/read/cv10334074/
sourceDate: 2021-03-17
draft: false
---

# 泰拉瑞亚：制作字体材质包

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv10334074/) · 2021-03-17
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

本文仅适用于电脑版，支持1.3.5以上版本

泰拉默认字体，数字4和6很接近，经常搞混，最近正好想换换字体，让界面看起来更加舒服。

字体文件共5个，位于 “**Content\\Fonts\\**” 目录：

**Combat\_Crit.xnb**

**Combat\_Text.xnb**    Combat\_Crit 和 Combat\_Text 用于伤害和治疗文字显示（玩家头顶）

**Death\_Text.xnb**    主菜单、死亡提示 和 界面的大标题 等大号文字显示

**Item\_Stack.xnb**   物品堆叠数字等

**Mouse\_Text.xnb**    物品提示、界面大多数文本的显示

![[font-pack-01.webp]]

*字体文件*

![[font-pack-02.webp]]

*Combat\_Crit、Combat\_Text*

![[font-pack-03.webp]]

*Death\_Text*

![[font-pack-04.webp]]

*Death\_Text*

![[font-pack-05.webp]]

*Item\_Stack*

![[font-pack-06.webp]]

*Mouse\_Text*

![[font-pack-07.webp]]

*Mouse\_Text*

![[font-pack-08.webp]]

*Mouse\_Text（左下角的版本号）*

## **xnb是什么**

使用工具（TConvert）将xnb转成png，一个.xnb对应了多张png，游戏文字都排在上面。

![[font-pack-09.webp]]

## 生成xnb

工具下载链接：https://gitee.com/sweellong/DynamicFontGenerator/releases/

![[font-pack-10.webp]]

*主界面*

1、选择自己喜欢的字体

![[font-pack-11.webp]]

2、选择字体文件，如果想生成全部的字体，请先选一个，待生成完成后再生成其它的。

![[font-pack-12.webp]]

3、输入字号，以下字号仅供参考。

**Combat\_Crit.xnb    26**

**Combat\_Text.xnb    20**

**Death\_Text.xnb    40**

**Item\_Stack.xnb    14**

**Mouse\_Text.xnb    16**

![[font-pack-13.webp]]

4、点击“生成描述文件”，此时同目录下会生成“.dfgconfig”格式的描述文件，此文件可以用记事本打开。

5、点击“生成字体文件”，点了之后程序会“假死”（失去响应），等字体文件生成后就恢复了，此时同目录下会生成 .xnb 文件了。

\*6、如果你需要生成多个字体文件，请重复上面的步骤；

7、所有字体均生成后，点击“生成字体材质”，完成后在同目录下会生成“字体\_喜鹊招牌体”之内的文件夹，并会自动打开材质包目录，将这个新生成的字体文件夹拷贝到材质包，启动游戏启用材质包即生效。

## 题外话

DFG字体生成器\_改良版，顾名思义，是DFG字体生成器的改良版，废话……

2333~

工具原名 DynamicSpriteFontGenerator，简称DFG，作者有介绍使用方法：https://tieba.baidu.com/p/5093383365，并且开源了工具的源代码。

![[font-pack-14.webp]]

*原帖*

![[font-pack-15.webp]]

*附件和开源项目*

![[font-pack-16.webp]]

*网盘文件*

下载网盘上的两个文件，将 **SampleFont.dynamicfont** 拷贝到 **DFG\_0.6.7z** 的解压目录，双击 “**DynamicFontGenerator.exe**”

出现命令行界面，看到这，我整个人都蒙了，“SampleFont.dynamicfont”可以使用记事本等文本编辑器打开，里面显示需要使用 **Andy**（安迪）14号字，哦，原来我电脑上没安装这个字体，怪不得会出错~~~

改良版在此基础上做了调整，可以直观地看到电脑上所有已安装的字体名称，如果你对泰拉的字体文件和字体大小有个大概的概念，只需点鼠标就可以完成了。

![[font-pack-17.webp]]

![[font-pack-18.webp]]

*运行报错*

![[font-pack-19.webp]]
