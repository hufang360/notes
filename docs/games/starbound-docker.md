---
title: Starbound 服务端 Docker 化
tags: [starbound, docker, 游戏, 开服]
order: 20
---

# Starbound 服务端 Docker 化

Starbound 官方只给 Linux 二进制，没有 Docker 镜像。自己封一个，好处是存档和配置都在宿主机的挂载卷里，升级就是换个镜像重启。

## 为什么值得容器化

- 服务端依赖 32 位库，跟宿主机的 glibc 版本容易打架
- SteamCMD 下载的版本要跟客户端对齐，容器里换 tag 就能回滚
- 存档目录挂出来，重建容器不丢档

## Dockerfile

```dockerfile
FROM debian:bookworm-slim

RUN dpkg --add-architecture i386 \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
      libc6-i386 lib32gcc-s1 lib32stdc++6 ca-certificates \
      curl unzip \
 && rm -rf /var/lib/apt/lists/*

# steamcmd 非 root 会报错，就用 root，但跑服务时降权
RUN useradd -m -u 1000 starbound

COPY --chown=starbound:starbound entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER starbound
WORKDIR /home/starbound

EXPOSE 21025/udp
ENTRYPOINT ["/entrypoint.sh"]
```

`entrypoint.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

ASSETS=/home/starbound/assets
if [ ! -f "$ASSETS/linux64/starbound_server" ]; then
  echo "首次启动，通过 steamcmd 下载服务端..."
  /home/starbound/steamcmd/steamcmd.sh \
    +force_install_dir "$ASSETS" \
    +login anonymous \
    +app_update 211820 validate \
    +quit
fi

exec "$ASSETS/linux64/starbound_server" "$@"
```

## compose 文件

```yaml
services:
  starbound:
    build: .
    container_name: starbound
    restart: unless-stopped
    ports:
      - "21025:21025/udp"
    volumes:
      - ./data/assets:/home/starbound/assets
      - ./data/storage:/home/starbound/storage
    environment:
      TZ: Asia/Shanghai
```

`./data/storage` 就是存档，**必须备份**。

## 存档格式与备份

Starbound 的存档在 `storage/universe/` 下，是成对出现的：

```
storage/
├── universe/
│   ├── <uuid>.world        # 星球数据
│   └── <uuid>.world.metadata  # 索引，记录了谁是谁
└── player/
    └── <steamid>.player
```

> [!CAUTION]
> `.world` 和 `.world.metadata` 必须**同时**备份。
> 只拷 `.world` 的话，恢复后星球名字会变成 `unknown`，坐标全乱。

停机备份最保险：

```bash
docker compose stop starbound
tar czf /backup/starbound-$(date +%F).tar.gz -C ./data storage
docker compose start starbound
```

在线备份也行（存档有 WAL），但要接受可能损坏最后几秒的数据。

## 玩家白名单

```
storage/sbinit.config
```

关键项：

| 键 | 说明 |
| --- | --- |
| `allowAnonymousConnections` | `false` 时只允许下面名单里的人 |
| `playerServerNickname` | 服务器名 |
| `serverName` | 显示在客户端列表里的名字 |
| `maxPlayers` | 上限 |

## 排查

服务端起不来、日志只有一行的时候：

```bash
docker compose logs --tail=200 starbound
# 确认 32 位库在不在
docker compose run --rm --entrypoint bash starbound -c 'ldd assets/linux64/starbound_server | grep "not found"'
```

端口不通（注意是 **UDP**）：

```bash
sudo ss -lunp | grep 21025
```

> [!NOTE]
> 很多人用 `ss -ltnp`（TCP）去查，什么都查不到，然后怀疑服务没起来。
> Starbound 是 UDP，一定要 `-u`。

## 相关

- [[terraria-tshock]]
- [[docker-compose-tips]]
