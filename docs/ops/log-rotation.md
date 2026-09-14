---
title: 日志切割与容量估算
tags: [linux, 日志, logrotate, 运维]
order: 30
---

# 日志切割与容量估算

## 先算一下，别凭感觉

按平均请求体积估算一天写多少日志。设 QPS 为 $q$，单条访问日志平均 $s$ 字节，一天就是：

$$
B_{\text{day}} = q \times s \times 86400
$$

比如 $q = 50$、$s = 400\,\text{B}$：

$$
B_{\text{day}} = 50 \times 400 \times 86400 \approx 1.73 \times 10^{9}\,\text{B} \approx 1.6\,\text{GiB}
$$

保留 14 天就是 **22 GiB** 左右。这时候再去定 `rotate` 次数和分区大小，心里就有底了。

反过来，如果想知道给定分区能撑多久：

$$
T_{\text{days}} = \frac{C \times 0.8}{B_{\text{day}} / 86400 \times 86400}
$$

其中 $C$ 是分区容量，乘 $0.8$ 是留 20% 余量给系统和突发流量。

> [!TIP]
> 估算值通常偏大（真实流量有波峰波谷，日志也有压缩）。
> 但**宁可备多**：磁盘满了是事故，磁盘闲一点只是浪费钱。

## logrotate 模板

`/etc/logrotate.d/myapp`：

```
/var/log/myapp/*.log {
    daily
    rotate 14
    missingok
    notifempty
    compress
    delaycompress
    dateext
    dateformat -%Y%m%d
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /run/myapp.pid ] && kill -USR1 "$(cat /run/myapp.pid)" || true
    endscript
}
```

逐行解释：

| 指令 | 作用 |
| --- | --- |
| `daily` / `rotate 14` | 每天切一次，留 14 份 |
| `compress` + `delaycompress` | 压缩，但**不压最新的那份** —— 因为进程可能还开着它的句柄 |
| `dateext` | 用日期做后缀，比数字后缀好排查 |
| `create 0640 www-data adm` | 切割后新建文件，指定权限和属主，否则服务可能写不进去 |
| `postrotate ... kill -USR1` | 通知服务重新打开日志文件，**这才是释放空间的关键** |

测试（不实际切，只看会做什么）：

```bash
sudo logrotate -d /etc/logrotate.d/myapp
```

强制切一次：

```bash
sudo logrotate -vf /etc/logrotate.d/myapp
```

> [!CAUTION]
> 用了 `copytruncate` 就要小心：它在「拷贝」和「清空」之间有个时间窗，
> 这期间的日志会丢。日志审计要求高的场景应该用 `create` + `postrotate` 那套。

## systemd 服务的日志

用 `journald` 的话不用 logrotate，改 `/etc/systemd/journald.conf`：

```ini
[Journal]
Storage=persistent
SystemMaxUse=2G
SystemMaxFileSize=200M
MaxRetentionSec=30day
```

```bash
sudo systemctl restart systemd-journald
journalctl --disk-usage
sudo journalctl --vacuum-size=1G
```

## 检查有没有按时切

```bash
ls -lh /var/log/myapp/ | head
systemctl status logrotate.timer
grep -i logrotate /var/log/syslog | tail -5
```

如果最新日志文件一直是同一个、没有日期后缀，说明 logrotate 根本没跑或者被 `notifempty` 跳过了。

## 相关

- [[disk-full-troubleshooting]]
- [[nginx-reverse-proxy]]
