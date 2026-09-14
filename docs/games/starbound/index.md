---
title: Starbound
order: 20
---

# Starbound（星界边境）

官方只发 Linux 二进制，没有现成 Docker 镜像，所以开服有两条路。

- [[server|手工开服（CentOS + steamcmd）]] —— 跟着官方指引一步步来
- [[docker|服务端 Docker 化]] —— 自己封镜像，存档挂出来，升级就是换个 tag
- [[save-format|关于存档格式]] —— 怎么备份、怎么搬家
- [[chinese-font|汉化与自定义字体]] —— 换字体的坑

> [!NOTE]
> 服务端端口是 **21025/UDP**，排查时记得 `ss -lunp` 而不是 `-ltnp`。

## 存档位置

```
storage/
├── universe/     # 星球数据（.world 和 .world.metadata 必须成对备份）
└── player/       # 玩家存档
```

丢了这个目录等于删档，两条路线的备份方式都在各自那篇里。
