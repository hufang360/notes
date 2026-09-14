---
title: Docker Compose 实用片段
tags: [docker, compose, 自建服务]
order: 30
---

# Docker Compose 实用片段

用得最多的几段配置，写下来省得每次翻旧项目。

## 最小可用模板

```yaml
services:
  app:
    image: nginx:alpine
    container_name: app
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"      # 只监听本机，公网访问一律走反代
    volumes:
      - ./conf.d:/etc/nginx/conf.d:ro
      - ./html:/usr/share/nginx/html:ro
    environment:
      TZ: Asia/Shanghai
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    logging:
      driver: json-file
      options:
        max-size: "10m"          # 不限制的话 /var/lib/docker 会被日志吃满
        max-file: "3"
    networks: [web]

networks:
  web:
    driver: bridge
```

## 端口映射别写成 `0.0.0.0`

`-p 8080:80` 等价于 `-p 0.0.0.0:8080:80`，**直接暴露到公网**。加上防火墙没配好就是裸奔。

```yaml
# 只给本机 / 反代用
ports:
  - "127.0.0.1:8080:80"

# 或者干脆不映射，让同网络的容器直接访问
expose:
  - "80"
```

## 环境变量分文件

```yaml
services:
  db:
    image: postgres:16-alpine
    env_file:
      - .env            # 不进版本库
    environment:
      POSTGRES_DB: app
```

`.env` 放进 `.gitignore`，另存一份 `.env.example` 提交，写清楚有哪些键：

```bash
# .env.example
POSTGRES_PASSWORD=change-me
```

> [!DANGER]
> 别把真实密码写进 `docker-compose.yml`。
> 这个仓库的 `private/` 目录专门放这类东西，它不会进 git。

## 依赖健康检查再启动

`depends_on` 默认只等容器**启动**，不等它**就绪**。数据库还在初始化时就连接会失败。

```yaml
services:
  api:
    depends_on:
      db:
        condition: service_healthy     # 等健康检查通过
      redis:
        condition: service_started     # 只等启动

  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 10
```

## 常用命令

```bash
docker compose up -d                     # 后台起来
docker compose up -d --build api         # 只重建 api
docker compose logs -f --tail=100 api
docker compose exec api sh               # 进容器
docker compose ps                        # 看状态和健康
docker compose config                    # 渲染最终配置（查变量有没有生效）

docker compose down                      # 停并删容器/网络
docker compose down -v                   # 连数据卷一起删（危险）
```

## 磁盘被吃满时的清理顺序

```bash
docker system df                 # 先看看到底谁占地方
docker image prune -f            # 悬空镜像
docker builder prune -f          # 构建缓存（通常是大头）
docker volume ls -f dangling=true  # 没人用的卷，确认后再删
```

> [!WARNING]
> `docker system prune -a --volumes` 会把**所有**没在跑的镜像、缓存、匿名卷删掉，
> 包括数据库的数据卷。跑之前先 `docker volume ls` 确认一遍。

## 相关

- [[nginx-reverse-proxy]] —— 容器前的反代怎么写
- [[git-cheatsheet]]
