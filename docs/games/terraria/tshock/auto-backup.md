---
title: "TShock：自动备份地图"
tags: [泰拉瑞亚, terraria, crontab, tshock]
order: 191
source: https://www.bilibili.com/read/cv15693208/
sourceDate: 2022-03-17
draft: false
---

# TShock：自动备份地图

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv15693208/) · 2022-03-17
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

原来tshock自带地图备份功能，修改配置文件即可开启自动备份功能。

## 开启功能

找到 配置文件（config.json）（第16行和第17行），修改这两个字段的值。

例如：每隔1分钟备份一次，自动删除5分钟前的备份，就这样写：

```json
"BackupInterval": 1,
"BackupKeepFor": 5,
```

地图将备份在 tshock/backups/ 目录，大致如下图：

![[auto-backup-01.webp]]

## 文件名

细心的你应该能发现，文件名上显示的时间要少（早）8个小时，因为tshock用的是 UTC时间（协调世界时），而我们的北京时间，在东八区，所以**实际时间要加上8个小时**。

## 更智能的备份

默认情况下，没人联机时，世界的时间不会走，自动备份功能也不会备份地图（世界）存档。

备注：在启动参数加上 “-forceupdate”，可以让强制更新世界时间，即使是没人联机的时候。

## 两个提示

改成这样：

```json
"ShowBackupAutosaveMessages": true,
```

当在备份时则出现这个提示：

![[auto-backup-02.webp]]

控制台上则会显示成这样：

```bash
Backing up world...
World backed up.
```

改成这样：

```json
"AutoSave": true,
"AnnounceSave": true,
```

当在自动保存地图时会出现这个提示：

![[auto-backup-03.webp]]

控制台上则会显示成这样：

```bash
Saving world...
World saved.
```

这两个提示，都**不建议打开**，我的配置大概是这样的：

```json
"AutoSave": true,
"AnnounceSave": false,
"ShowBackupAutosaveMessages": false,
"BackupInterval": 30,
"BackupKeepFor": 2880,
```
