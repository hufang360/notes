#!/usr/bin/env bash
#
# 本地预览，宿主机不用装 Node。
#
#   ./docker.sh            # 开发服务器，改笔记即时生效        http://localhost:5173/notes/
#   ./docker.sh preview    # 先构建再静态预览（顺带跑死链检查） http://localhost:4173/notes/
#
# 地址里的 /notes/ 不能省 —— 站点 base 配的就是它。
#
# 几个别改的点（对应原来的 docker-compose.yml）：
#   - 容器里自己装一份 node_modules，不能复用宿主机的
#     —— macOS 下的 esbuild 二进制在 Linux 容器里跑不起来
#   - pnpm 的 store 也挂出来，否则它会建在项目里的 .pnpm-store/，污染仓库
#   - 卷名沿用 compose 的 notes_* 前缀，之前起过就直接复用，不用重装依赖
#   - CI=1：lockfile 有出入直接报错，别偷偷改
#   - 首次启动会 apk 装 git（VitePress 的 lastUpdated 要读 git 提交时间）并 pnpm install
set -euo pipefail
cd "$(dirname "$0")"

command -v docker >/dev/null || {
  echo "需要 docker（https://docs.docker.com/get-docker/）" >&2
  exit 1
}

# 有终端就 -it（Ctrl-C、按 q 退出都正常）；管道 / CI 里退化成 -t
TTY="-t"
[ -t 0 ] && TTY="-it"

case "${1:-dev}" in

dev)
  # 上次没退干净的容器会占着名字和端口，先清掉
  docker rm -f notes-dev >/dev/null 2>&1 || true

  exec docker run --rm --name notes-dev $TTY \
    --init \
    -e CI=1 \
    -v "$PWD:/app" \
    -v notes_node_modules:/app/node_modules \
    -v notes_vitepress-cache:/app/docs/.vitepress/cache \
    -v notes_pnpm-store:/pnpm-store \
    -w /app \
    -p 5173:5173 \
    node:24-alpine \
    sh -c '
      set -e
      apk add --no-cache git >/dev/null
      git config --global --add safe.directory /app
      corepack enable
      pnpm install --frozen-lockfile --store-dir /pnpm-store

      exec pnpm dev --host 0.0.0.0 --port 5173
    '
  ;;

preview)
  docker rm -f notes-preview >/dev/null 2>&1 || true

  exec docker run --rm --name notes-preview \
    --init \
    -e CI=1 \
    -v "$PWD:/app" \
    -v notes_node_modules:/app/node_modules \
    -v notes_vitepress-cache:/app/docs/.vitepress/cache \
    -v notes_pnpm-store:/pnpm-store \
    -w /app \
    -p 4173:4173 \
    node:24-alpine \
    sh -c '
      set -e
      apk add --no-cache git >/dev/null
      git config --global --add safe.directory /app
      corepack enable
      pnpm install --frozen-lockfile --store-dir /pnpm-store

      pnpm build && exec pnpm preview --host 0.0.0.0 --port 4173
    '
  ;;

*)
  echo "用法: $0 [dev|preview]" >&2
  exit 1
  ;;
esac
