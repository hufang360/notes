---
title: "TShock插件：FastDeploy | 快速开服"
tags: [泰拉瑞亚, terraria, tshock]
order: 260
source: https://www.bilibili.com/read/cv15714973/
sourceDate: 2022-03-18
draft: false
---

# TShock插件：FastDeploy | 快速开服

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv15714973/) · 2022-03-18
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

写这个插件目的是为了节约服主的开服时间。

之前我在 这篇文章中 贴出我个人的开服设置，收到一些反馈，说是不知道怎么操作。

那，这个插件可以快速完成这些设置。

> 参考：[Bilibili 专栏 cv10687110](https://www.bilibili.com/read/cv10687110/)

## 快速设置（/fd init）

1、安装插件（建议同时安装自动注册插件）

2、在命令行界面，输入“**/fd init**”，然后敲Enter键：

![[fast-deploy-01.webp]]

3、服主进入服务器，完成注册和登录，新服主建议同时安装自动注册，便可省去手动注册登录的麻烦。如果你还不会注册和登录，请恕我啰嗦一下：

注册：进游戏后在聊天框里输入 “**/register 4321**”，然后敲Enter键；

登录：聊天框输入 “**login 4321**”，然后敲Enter键；

4、获取服主权限，例如我的人物名叫 **hf**，则在**命令行界面**输入 **/user group** **hf GM** 。

5、在命令行界面输入 **/exit** 关服，然后重启服务器，至此一个强制开荒的tshock服务器就开好了。

## 插件下载地址

开源地址：https://gitee.com/hufang360/TShockFastDeploy/

下载地址：https://gitee.com/hufang360/TShockFastDeploy/releases

插件文件名格式是 FastDeploy-v1.1.dll

鉴于pe即将更新至1.4.3.2，因此会做 1.4.0.5的兼容。

如果你是新服主，看到这就可以了 ；-）

## 快速授权（/fd perm）

上一个步骤会同时修改 config.json 和 ssconfig.json，见上一张图片的第1点和第2点内容。

如果你只是想设置权限，并新增GM超管组，执行这个指令就可以了。

![[fast-deploy-02.webp]]

## 指令授权（/fd add | /fd del）

有时想让小伙伴能够使用部分指令

例如：授权使用 **/tpnpc** 指令

授权：输入“**/fd allow tpnpc**”，然后敲Enter键。

取消：输入 “**/fd del tpnpc**”，然后敲Enter键。

![[fast-deploy-03.webp]]

注意，目前只能够处理 主指令的权限，那些二级指令的权限还没处理。

目前能够处理的二级指令，只有warp这一个，例如：

**/fd add warp** 会授权 tshock.admin.warp

**/fd add** **warp add** 会授权 tshock.admin.warp

也欢迎提供你想要处理的二级指令。

## 授权参考（/fd refer）

目前只提供journey、ignore 和 tp 这 3个主题的授权参考。

在命令行上（或服主在游戏内）输入 **/fd refer jour** 将列出13条和旅行模式相关的权限：

例如：

允许玩家开关无敌，输入 **/fd add jgod**。

不允许玩家开关无敌，输入 **/fd del jgod**。

（/godmode 指令 可以通过 /fd add godmode 来授权）

![[fast-deploy-04.webp]]

*/fd refer jour*

**/fd refer ignore**

![[fast-deploy-05.webp]]

*/fd refer ig*

**/fd refer tp**

![[fast-deploy-06.webp]]

*/fd refer tp*

## 配置文件（高级用法）

现在我每次开新服，都会复制下上个服的文件夹，然后逐个删掉不需要的文件。

tshock/**config.json** 和 tshock/**tshock.sqlite** 是一定要删除的，为了方便将必要的权限和设置，写进插件配置文件 tshock**/FastDeploy/config.json**，插件会自动创建这么一个配置文件，初始的设置大概是这样的。

```json
{
  "Group": "default",
  "Permissions": [
    "tshock.tp.pylon",
    "tshock.tp.tppotion",
    "tshock.tp.magicconch",
    "tshock.tp.demonconch",
    "tshock.tp.rod",
    "tshock.world.toggleparty",
    "tshock.world.time.usesundial",
    "tshock.world.editspawn",
    "tshock.world.movenpc",
    "tshock.npc.hurttown",
    "tshock.npc.startinvasion",
    "tshock.npc.startdd2",
    "tshock.npc.spawnpets",
    "tshock.ignore.removetile",
    "tshock.ignore.liquid",
    "tshock.ignore.paint",
    "tshock.ignore.placetile",
    "tshock.ignore.projectile",
    "tshock.ignore.damage",
    "tshock.ignore.sendtilesquare"
  ],
  "GMPermissions": [
    "*",
    "!tshock.ignore.ssc"
  ],
  "SSCEnable": true,
  "RequireLogin": true,
  "LogPath": "tshock/logs",
  "DebugLogs": false,
  "AnnounceSave": false,
  "ShowBackupAutosaveMessages": false,
  "EnableChatAboveHeads": true,
  "DisablePrimeBombs": true,
  "RespawnSeconds": 5,
  "RespawnBossSeconds": 10
}
```

部分配置解释：

**"Group": "default"**, 插件的默认组，通过**/fd group <组名称>**，能够更改这个设置值。

这个默认组是相对于本插件的，作用于 /fd init、/fd perm、/fd add、/fd del 操作。

场景1：让不注册玩家就能正常玩耍，只需执行 **/fd group guest** ，然后执行 **/fd perm** 。

场景2：给本地人物刷一把天顶剑，执行 **/fd group guest**，执行 **/fd add item**，进入游戏后执行 **/item zenith** （不要用这个去联机服作弊哈~~卑鄙的作弊者，不要使用我这个插件~~气~）

**"Permissions": \[\]**，给默认组（本插件）添加的权限，**/fd perm** 指令添加的权限就是来自这里。

有啥好建议，欢迎留言！；-）
