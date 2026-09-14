---
title: Git 常用命令速查
tags: [git, 版本控制, 命令行]
order: 10
---

# Git 常用命令速查

那些不常用、每次都要重新搜一遍的命令。日常 `add` / `commit` / `push` 就不写了。

## 撤销与回退

改错了但**还没 commit**：

```bash
git restore <file>              # 丢弃工作区改动（危险，改动直接没了）
git restore --staged <file>     # 只从暂存区撤出，工作区保留
git restore -p <file>           # 交互式挑着丢弃，比整个文件丢掉安全得多
```

已经 commit 了：

```bash
git commit --amend              # 改最后一次 commit 的信息 / 内容
git reset --soft HEAD~1         # 撤销 commit，改动回到暂存区
git reset --mixed HEAD~1        # 撤销 commit，改动回到工作区（默认）
git reset --hard HEAD~1         # 连改动一起丢（危险）
```

> [!TIP]
> 已经 push 出去的分支不要用 `reset` 改写历史，用 `git revert <sha>` 产生一个反向 commit。
> 否则别人 pull 下来会炸。

## 想找回「被丢掉」的东西

`reset --hard` 之后后悔了，`git reflog` 是救命稻草：

```bash
git reflog                      # 看 HEAD 的移动历史
git reset --hard HEAD@{3}       # 回到 reflog 里的某个位置
git fsck --lost-found           # 更极端的情况，翻 dangling commit
```

reflog 默认保留 90 天（不可达对象 30 天），别拖太久。

## 分支

```bash
git switch -c feat/xxx          # 建分支并切过去（比 checkout -b 更明确）
git branch -vv                  # 看每个分支跟踪的上游，以及领先/落后几个提交
git branch --merged main        # 哪些分支已经合进 main 了，可以删
git push origin --delete feat/xxx
```

清理已合并的本地分支：

```bash
git branch --merged main | grep -v -E '^\*|main|master' | xargs -r git branch -d
```

## 挑拣提交

```bash
git cherry-pick <sha>                    # 把某个提交搬到当前分支
git cherry-pick <sha1>..<sha2>           # 搬一段（不含 sha1）
git cherry-pick -n <sha>                 # 只应用改动，不自动 commit
```

冲突时：

```bash
git cherry-pick --continue
git cherry-pick --abort
```

## 找「这行代码是谁改的」

```bash
git blame -L 40,60 -- src/main.rs        # 只看 40-60 行
git log -S 'someFunctionName' --oneline  # 哪个提交引入/删除了这个字符串
git log -p -- src/main.rs                # 某文件的完整改动历史
git log --follow -- old-name.rs          # 跨重命名追历史
```

`-S`（pickaxe）比 `blame` 好用：它找的是**内容**，不是行号。

## 救急：暂存现场

```bash
git stash push -m '调试到一半' -- src/
git stash list
git stash pop                    # 恢复并删除 stash
git stash apply stash@{2}        # 恢复但保留 stash
git stash show -p stash@{0}      # 先看看里面是什么
```

## 常见坑

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `fatal: refusing to merge unrelated histories` | 两边各自 init 过 | `git pull --allow-unrelated-histories` |
| push 被拒 `non-fast-forward` | 远端有你本地没有的提交 | 先 `git pull --rebase`，别硬 `-f` |
| `Filename too long` (Windows) | 路径超过 260 字符 | `git config --global core.longpaths true` |
| 明明加了 `.gitignore` 还是被跟踪 | 文件已经被 add 过了 | `git rm -r --cached <path>` |
| 中文文件名显示成 `\344\270\255` | 没开 UTF-8 显示 | `git config --global core.quotepath false` |

## 一次性配置

```bash
git config --global core.quotepath false
git config --global rerere.enabled true      # 记住冲突怎么解的，重复冲突自动套用
git config --global pull.rebase true         # pull 默认变基，历史更干净
git config --global diff.algorithm histogram # 改动块划分更合理
```

## 相关

- [[obsidian-setup]] 里提到用 Git 插件自动备份笔记
- [[docker-compose-tips]]
