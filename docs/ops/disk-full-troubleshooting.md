---
title: 磁盘满了的排查流程
tags: [linux, 磁盘, 排障, 运维]
order: 20
---

# 磁盘满了的排查流程

从「收到告警」到「定位到元凶」，按顺序走一遍就行。

## 第一步：确认是哪块盘

```bash
df -hT                    # 带文件系统类型，一眼能看出是不是 overlay/tmpfs
df -i                     # inode 也看一眼！i 满了同样写不进文件
```

![[disk-usage-df.png|820]]

> [!IMPORTANT]
> `df` 显示满了，但 `du` 加起来对不上，八成是这两种情况：
> 1. **inode 耗尽** —— 小文件太多，`df -i` 才会暴露
> 2. **文件被删了但句柄还开着** —— 见下面「幽灵空间」

## 第二步：从根往下逐层逼近

不要一上来就 `du -sh /*`，慢。用 `-x` 限定同一文件系统，按大小排序：

```bash
du -xhd1 / 2>/dev/null | sort -rh | head -20
```

挑最大的那个目录继续往下钻，把 `/` 换成它：

```bash
du -xhd1 /var 2>/dev/null | sort -rh | head -20
```

通常到这一步凶手就露头了。最常见的几个窝点：

| 路径 | 常见原因 |
| --- | --- |
| `/var/log` | 日志没切割，或者某个服务刷错误日志刷疯了 |
| `/var/lib/docker` | 镜像、构建缓存、容器日志 |
| `/var/lib/containerd` | 同上，k8s 环境里更常见 |
| `/home/*/.cache` | 用户级缓存，尤其 CI runner |
| `/tmp` | 临时文件没清理，或者被 `tmpfs` 撑爆内存 |

## 第三步：找大文件

按目录钻不下去了（比如一层里有几万个小文件），就直接找大文件：

```bash
find / -xdev -type f -size +500M -printf '%s\t%p\n' 2>/dev/null \
  | sort -rn | head -20 | numfmt --to=iec --field=1
```

`-xdev` 很重要：不加的话会跑进 `/proc`、挂载的网络盘，又慢又没意义。

## 幽灵空间：删了但不释放

现象：`df` 说盘满，`du` 算出来只有一半。

原因：**进程还开着已经被删除的文件句柄**。文件在目录里没了，但磁盘块要等进程关闭 fd 才回收。

```bash
lsof +L1 2>/dev/null | awk '$7 > 1000000 {print $1, $2, $7/1024/1024 "MB", $9}' | sort -k3 -rn
```

`+L1` 表示「link count 小于 1」，也就是已经被 unlink 的文件。

处理方式：

```bash
# 1) 最干净：重启对应服务
sudo systemctl restart <service>

# 2) 不能重启：清空内容而不是删除文件（日志场景常用）
: > /proc/<pid>/fd/<fd>
```

> [!CAUTION]
> 用 `rm` 删正在写入的日志文件，空间**不会**释放，而且日志会继续写到那个「看不见」的文件里，
> 直到把盘吃满。正确做法是 `truncate -s 0 file` 或者 `: > file`，
> 并且让服务自己 reopen（多数程序收到 `SIGUSR1` 会重新打开日志）。

## 第四步：清 Docker 的空间

容器环境里这步基本都要做：

```bash
docker system df                          # 先看账
docker builder prune -f                   # 构建缓存，通常最大
docker image prune -f                     # 悬空镜像
docker container prune -f                 # 已退出的容器
```

容器日志单独限制（改完要重建容器）：

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

`/etc/docker/daemon.json` 里设全局默认，新容器自动生效：

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
```

## 预防

告警阈值别只设 90%。**磁盘从 90% 涨到 100% 可能只要几分钟**，尤其是日志刷屏的时候。

- 70% 提醒（有时间处理）
- 85% 告警（该动手了）
- 95% 紧急（可能已经开始丢数据）

再加一条增长率告警更实用：`predict_linear(node_filesystem_avail_bytes[6h], 4*3600) < 0`，
意思是「按最近 6 小时的趋势，4 小时后会用完」。见 [[log-rotation]]。

## 相关

- [[log-rotation]] —— 容量估算和自动切割
- [[docker-compose-tips]]
- [[nginx-reverse-proxy]]
