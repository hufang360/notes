---
title: 腐竹计划
order: 10
---

# 腐竹计划

> 服主计划，分享个人当服主的一些经验！
>
> —— 文集在 B 站的原始简介

[Bilibili 原文集](https://www.bilibili.com/read/readlist/rl400396) · 42 篇 · 2021-01 ~ 2026-01

围绕 Terraria / TShock 开服的一整套经验。文集在 B 站是按**发表时间**排的，跳着看容易断线；
这里是按**阅读顺序**重排的导读。

> [!TIP] 只想开个服玩玩
> 看第一节的 1、2、4 三篇就够了，其余等真遇到问题再回来查。
> 这套笔记默认你已经有一台 Linux 服务器和一点命令行基础。

## 一、把服务器开起来

1. [[games/terraria/tshock/server-setup|泰拉瑞亚：多人联机服务器搭建]] —— 从零开始的完整流程
2. [[games/terraria/tshock/server-config|配置篇]] —— 存档、端口、世界参数的配置
3. [[games/terraria/tshock/tshock5-setup|TShock 5.0 补充]] —— TShock 升到 5.x 之后的变化
4. [[games/terraria/tshock/getting-started|TShock 上手玩（一）]] —— 装好之后的第一次实操
5. [[games/terraria/tshock/raspberry-pi|在树莓派上运行 TShock 5.0]] —— 低配设备也能开
6. [[games/terraria/tshock/centos8-offline-mono|CentOS 8 离线安装 mono]] —— 服务器没有外网时的依赖问题

## 二、日常管理

- [[games/terraria/tshock/reference|TShock 参考]] —— 配置项与权限组速查
- [[games/terraria/tshock/backup-and-anticheat|备份 和 反作弊]]
- [[games/terraria/tshock/auto-backup|自动备份地图]]
- [[games/terraria/tshock/whitelist-and-ban|白名单 和 ban]] —— 怎么把捣乱的人挡在外面
- [[games/terraria/tshock/forced-fresh-start|强制开荒的玩家存档长啥样？]]
- [[games/terraria/tshock/import-save-to-fresh-start|问答：把存档导入到强制开荒]]
- [[games/terraria/tshock/journey-mode|旅行模式浅析]]

## 三、指令

- [[games/terraria/tshock/cmd-worldinfo|/worldinfo、/worldmode]] —— 查世界状态、切难度
- [[games/terraria/tshock/cmd-worldevent|/worldevent]] —— 手动触发血月、日食、入侵
- [[games/terraria/tshock/cmd-summon|/sb、/sm]] —— 召唤 BOSS、敌怪和 NPC
- [[games/terraria/tshock/cmd-warp|/warp]] —— 传送点

## 四、插件

先看这两篇建立概念：

- [[games/terraria/plugins/index|我写过的插件]] —— 全部插件的总览与版本说明
- [[games/terraria/plugins/dev-adaptation|插件适配参考 · 开发向]] —— TShock 更新后怎么自己改插件

**世界与玩法**

- [[games/terraria/plugins/world-modify|WorldModify]] —— 简易的世界修改器
- [[games/terraria/plugins/world-modify-v13|WorldModify V1.3]] —— 版本更新
- [[games/terraria/plugins/quake|大地动]] —— 首次击败 BOSS 时创建新世界
- [[games/terraria/plugins/quake-v11|大地动 v1.1]]
- [[games/terraria/plugins/double-boss|DoubleBoss]] —— 召唤 BOSS 时多生成一个
- [[games/terraria/plugins/disable-npc|禁 NPC]] —— 禁 NPC、物品和放置物
- [[games/terraria/plugins/pylon|指令晶塔]] —— NPC 不在、BOSS 战时也能传送
- [[games/terraria/plugins/share-buff|同服插件]] —— Buff 全服共享
- [[games/terraria/plugins/good-lucky|GoodLucky]] —— 祝你好运来

**玩家管理**

- [[games/terraria/plugins/player-manager|PlayerManager]] —— 查看玩家背包、导出玩家数据
- [[games/terraria/plugins/player-manager-v13|PlayerManager V1.3]]
- [[games/terraria/plugins/check-bag|检查背包]] —— 定时检查并封禁

**工具**

- [[games/terraria/plugins/search|查一查]] —— 查物品名、物品 ID、合成
- [[games/terraria/plugins/fishshop-config|鱼店配置编辑器]]
- [[games/terraria/plugins/fast-deploy|FastDeploy]] —— 快速开服
- [[games/terraria/plugins/show-me|显示力量菜单]]
- [[games/terraria/plugins/live-stream|直播插件]]

## 五、进阶

- [[games/terraria/tshock/rest-api|TShock 高阶应用：REST API]] —— 用 HTTP 接口从外部控制服务器
- [[games/terraria/client/tile-animation|揭秘「图格动画」]] —— 用 120×68 的图格拼出《Bad Apple》

## 六、连载：腐竹的回忆

2026 年初的月度记录，写得很散但有意思。

- [[games/terraria/tshock/vol26001-fuzhu-memories|vol26001 · 腐竹的回忆1]]
- [[games/terraria/tshock/vol26002-52hz-whale|vol26002 · 52赫兹的鲸]] —— 从 tshock 的 docker 部署命令说起
- [[games/terraria/tshock/vol26003-mcsmanager|vol26003 · MCSManager + tshock]]
- [[games/terraria/tshock/vol26004-vanilla-server|vol26004 · 泰拉原版服务器]] —— TShock 没跟上版本时用原版顶

## 相关

- [[games/terraria/index|Terraria]] —— 按主题分组的完整目录（还有客户端与资源包部分）
- [[games/terraria/plugins/index|TShock 插件]] —— 插件侧边栏分组
