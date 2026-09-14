# hf 的笔记

软件 / 游戏 / 运维的笔记。用 [Obsidian](https://obsidian.md) 写，用 [VitePress](https://vitepress.dev) 生成静态站，通过 GitHub Actions 发布到 GitHub Pages。

线上地址：**https://hufang360.github.io/notes/**

---

## 快速开始

```bash
pnpm install          # 装依赖，顺便自动装好 git 钩子
pnpm dev              # 本地预览 http://localhost:5173/notes/
```

改 Markdown 会热更新，不用刷新。

```bash
pnpm new "Nginx 限流配置" --section ops --slug nginx-rate-limit   # 新建笔记
pnpm bili 14792889=dst/linux-server                             # 从 Bilibili 专栏导入
pnpm build            # 构建到 docs/.vitepress/dist/
pnpm preview          # 预览构建产物
pnpm status           # 看看现在有多少篇笔记
pnpm check            # 提交前自查：密钥扫描 + 隐私目录检查
```

---

## 目录结构

```
.
├── docs/                          ← VitePress 内容根目录
│   ├── .vitepress/
│   │   ├── config.mts             站点配置（标题、分类、导航、搜索）
│   │   ├── vault.mts              扫描笔记 / 解析 frontmatter / 生成侧边栏
│   │   ├── obsidian.mts           Obsidian 语法转换（双链、callout、注释…）
│   │   ├── mermaid.mts            把 ```mermaid 变成按需加载的组件
│   │   └── theme/                 自定义样式和 Mermaid 组件
│   ├── index.md                   首页
│   ├── about.md                   关于页
│   │
│   ├── software/                  分类：软件
│   │   ├── ai-tools/  design/     子分组（每个子目录一个 index.md）
│   │   └── git-cheatsheet.md …    直接放在分类下的单篇
│   │
│   ├── games/                     分类：游戏
│   │   ├── terraria/              └─ tshock/ plugins/ client/ resource-pack/ tmodloader/
│   │   ├── dst/  starbound/  minecraft/
│   │
│   ├── ops/                       分类：运维
│   ├── series/                    分类：文集（B 站专栏串的导读，按阅读顺序重排）
│   ├── essay/                     分类：随笔
│   └── public/
│       ├── favicon.svg
│       └── assets/                ← 所有图片都放这里（按分类分目录）
│
├── private/                       ← 私密内容，永远不会被提交（见下文）
├── _templates/note.md             新笔记模板
├── scripts/                       辅助脚本（新建笔记、导入 B 站专栏、自查）
├── hooks/pre-commit               git 提交钩子
├── .github/workflows/deploy.yml   自动部署
└── .gitleaks.toml                 密钥扫描规则
```

**目录就是导航**：`docs/<分类>/` 一个目录就是一个分组，目录里的 `index.md` 提供分组标题和总览页，
`order` 决定排序。侧边栏、分组、导航全部自动生成，不用手写。

---

## 写一篇笔记

在 `docs/software/`（或 `games/`、`ops/`）下新建一个 `.md` 文件，开头写 frontmatter：

```yaml
---
title: 侧边栏显示的名字
tags: [git, 版本控制]
order: 10         # 同级排序，小的在前；不写就排最后
draft: false      # true = 不参与构建
---

# 正文标题

正文……
```

就这么简单。**侧边栏和导航都是自动生成的**，不用手工维护任何列表。

### 用命令行新建

```bash
pnpm new                          # 交互式，会问标题和分类
pnpm new "Docker 清理磁盘" -s ops --slug docker-disk-cleanup
```

模板默认是 `draft: true`。写完了把那一行改成 `false`（或删掉）再提交。

> 标题是中文时记得加 `--slug`，否则文件名会变成 `untitled-20260914` 这种日期名。

### 图片

图片统一放 `docs/public/assets/` 下面，引用时写 `![[文件名.png]]` 就行。

```
docs/public/assets/
├── obsidian-attachment-setting.png
├── games/terraria-server-console.png
└── ops/disk-usage-df.png
```

在 Obsidian 里粘贴截图会自动落到这个目录（因为 `.obsidian/app.json` 已经设好了）。

**注意**：不同目录下不要有同名图片。构建时如果发现重名会警告，因为 `![[server.png]]` 不知道该指哪一个。

---

## Obsidian 语法支持

`docs/.vitepress/obsidian.mts` 负责转换，目前支持：

| 写法 | 效果 |
| --- | --- |
| `[[笔记名]]` | 链接，显示文字自动取笔记标题 |
| `[[笔记名\|显示文字]]` | 带别名的链接 |
| `[[笔记名#标题]]` | 跳到某篇的某个小节 |
| `![[图片.png]]` | 嵌入图片 |
| `![[图片.png\|400]]` | 嵌入图片并限定宽度 |
| `![[笔记名]]` | 笔记嵌入 → 退化成一条链接（静态站做不了内联转写） |
| `> [!note]` `> [!warning]` … | 提示框，note/tip/warning/danger/question 等都认 |
| `%%注释%%` | 构建时删除，网站上不存在 |
| `==高亮==` | 高亮 |
| ` ```mermaid ` | 流程图 / 时序图，按需加载（没图的页面不下载 mermaid） |
| `$公式$` `$$公式$$` | KaTeX 数学公式 |

**找不到目标不会静默失败**：构建日志里会打出 `⚠️ 找不到笔记 [[xxx]]`。

---

## 隐私：两种「不公开」的区别 ⚠️

这是这个仓库最容易搞错的地方，请认真看：

| 手段 | 网站上看得到 | 仓库里看得到 | 适合放什么 |
| --- | --- | --- | --- |
| `draft: true` | ❌ | ✅ **能看到** | 写了一半不想给人看的草稿 |
| `private/` 目录 | ❌ | ❌ **完全看不到** | 密码、密钥、服务器资料 |
| 直接写进 `docs/` | ✅ | ✅ | 正常公开内容 |

**`draft: true` 不是保密手段。** 文件还在 git 里，别人 clone 一下就能读到。它只让 VitePress 不渲染这一页。

真正敏感的东西放进 `private/`，那个目录在 `.gitignore` 里：

```bash
pnpm new "VPS 资料" --private     # 建到 private/ 下
```

### 有三道防线

1. **`.gitignore`** —— `private/` 以及 `*.key` `*.pem` `.env*` `id_rsa*` 等一律不提交
2. **pre-commit 钩子** —— 提交时如果暂存区里有 `private/` 下的文件，直接拒绝；再用 gitleaks 扫一遍密钥
3. **CI 扫描** —— 每次 push 都会跑 `gitleaks` 扫全历史，有问题就构建失败

自查：

```bash
pnpm check                                  # 综合自查
git check-ignore -v private/xxx.md          # 确认某个文件确实被忽略
git ls-files private/                       # 输出为空才正常
```

> 一旦密钥被 push 上去，就算马上删掉，git 历史里仍然留着。
> 正确做法是**立刻去服务商那里吊销 / 轮换密钥**，然后才考虑清理历史。

---

## 部署

推到 `main` 分支就自动发布。流程在 `.github/workflows/deploy.yml`：

```
push → 密钥扫描 → 构建 → 上传产物 → 部署到 Pages
```

也支持在 Actions 页面手动触发（`workflow_dispatch`）。

### 换成自己的仓库

如果你 fork 了这个仓库，需要改两处：

1. `docs/.vitepress/config.mts` 开头：
   ```ts
   const REPO = 'notes'        // 你的仓库名
   const OWNER = 'hufang360'   // 你的 GitHub 用户名
   ```
   `BASE` 会自动跟着算出来。

2. GitHub 仓库 Settings → Pages → Source 选 **GitHub Actions**。

> 如果仓库名就叫 `<用户名>.github.io`，那它是根域名，`BASE` 要改成 `/`。
> 改法：把 `const BASE = \`/${REPO}/\`` 换成 `const BASE = '/'`。

### 自定义域名

在 `docs/public/` 下放一个 `CNAME` 文件，内容写域名，例如：

```
notes.example.com
```

同时 `config.mts` 里的 `SITE_URL` 也要改成你的域名（sitemap 用）。

---

## 本地开发备忘

```bash
# 清掉构建缓存重来
rm -rf docs/.vitepress/cache docs/.vitepress/dist

# 看某个文件为什么没被 gitignore
git check-ignore -v private/README.md

# 跳过钩子提交（确认是误报时）
git commit --no-verify
```

### 依赖说明

| 包 | 用途 |
| --- | --- |
| `vitepress` | 静态站生成 |
| `markdown-it-mathjax3` | 数学公式 |
| `mermaid` | 图表（**动态加载**，没图的页面不会下载） |
| `turndown` | 只在导入 Bilibili 专栏时用到 |

`gitleaks` 需要单独安装（不在 npm 里）：

```bash
brew install gitleaks     # macOS
# 或见 https://github.com/gitleaks/gitleaks#installing
```

没装也不会报错，只是跳过密钥扫描这一步。

---

## 从 Bilibili 专栏导入

`scripts/import-bilibili.mjs` 把 B 站专栏转成这个仓库的笔记：抓正文、下图片、转 Markdown、写 frontmatter。

```bash
# 单个：cv 号（或链接）= 落地路径（相对 docs/<分类>/）
pnpm bili 14792889=dst/linux-server

# 批量
pnpm bili 14792889=dst/linux-server 14798689=dst/config 14801260=dst/windows-server

# 不写 = 就用标题自动生成文件名
pnpm bili 15317852
```

常用选项：

| 选项 | 说明 |
| --- | --- |
| `--section <dir>` | 放到 docs/ 下哪个分类，默认 `games` |
| `--cookies <path>` | Netscape 格式的 cookie 文件，默认读 `$BILI_COOKIES` 或 `~/yt-dlp/c-bili.txt` |
| `--webp <质量>` | 截图转 WebP，默认 88。**强烈建议开着** |
| `--draft` | 以草稿形式导入 |
| `--delay <秒>` | 每篇之间的间隔，默认 3 |
| `--dry-run` / `--force` | 只看不写 / 覆盖已存在的 |

### 几个已经踩过的坑

- **必须走 curl**：B 站风控看 TLS 指纹，Node 自带的 `fetch` 会被直接判成 `-509 请求过于频繁`。脚本里用的是 `curl` 子进程，别改回去。
- **B 站把代码存在 `pre` 的 `codecontent` 属性里**，元素本身是空的，turndown 的 `isBlank()` 会把它当空白块删掉。所以要先 `inlineCodeBlocks()` 把代码灌回 `<pre><code>` 文本，再交给 turndown。
- **`codecontent` 被转义了两层**，要 `decodeEntities()` 两次。
- **图片一定要转 WebP**：B 站给的是 1920×1080 的 PNG，一张两三兆。转完一般能小 90% 以上（7 篇专栏：39MB → 6.7MB）。需要 `magick` 或 `cwebp`：`brew install imagemagick`。
- **结尾的 B 站娘横幅**（`class="cut-off-N"`）会自动过滤掉。
- **引用其它专栏的卡片图**会自动转成链接。

导入后每篇都会带上「本文原载于 Bilibili 专栏」的提示框和原文链接，方便回溯。

> 导入的是你自己的署名文章没问题；如果是别人的，记得先获得授权再搬。

---

## 许可

笔记内容欢迎参考和链接，但**照抄执行前请先看懂**，我不为任何后果负责。
代码部分（构建配置、脚本）随便用。
