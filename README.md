# hf 的笔记

一些笔记，目前主要采集自己之前在哔哩哔哩上写的专栏文章，主要是泰拉瑞亚、starbound、饥荒开服相关。

用 [Obsidian](https://obsidian.md) 写，用 [VitePress](https://vitepress.dev) 生成静态站，通过 GitHub Actions 发布到 GitHub Pages。

线上地址：**https://hufang360.github.io/notes/**

---

## 快速开始

```bash
pnpm install          # 装依赖，顺便自动装好 git 钩子
pnpm dev              # 本地预览 http://localhost:5173/notes/
```

不想装 Node 就用 Docker（`docker.sh`）：

```bash
./docker.sh             # 开发服务器，改笔记即时生效
./docker.sh preview     # 构建 + 静态预览，顺带跑死链检查
```

端口分别是 `5173` 和 `4173`，地址里的 `/notes/` 不能省（站点 base 配的就是它）。

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
├── docs/                          ← VitePress 内容根目录（也是 Obsidian vault 的内容目录）
│   ├── .vitepress/
│   │   ├── config.mts             站点配置（标题、导航、搜索）
│   │   ├── vault.mts              扫描笔记 / 解析 frontmatter / 生成侧边栏
│   │   ├── obsidian.mts           Obsidian 语法转换（双链、callout、注释…）
│   │   ├── mermaid.mts            把 ```mermaid 变成按需加载的组件
│   │   └── theme/                 自定义样式和 Mermaid 组件
│   ├── index.md                   首页
│   ├── about.md                   关于（技术实现、隐私说明都在这）
│   ├── bv1/                       腐竹计划（B 站文集，42 篇平铺）
│   ├── bv2/                       游戏笔记（B 站文集，13 篇平铺）
│   ├── starbound/                 Starbound（1 篇平铺）
│   ├── terraria/                  泰拉瑞亚（2 篇平铺）
│   └── public/assets/             图片，全部平铺，不分子目录
├── private/                       ← 私密内容，永远不会被提交（见下文）
├── _templates/note.md             新笔记模板
├── scripts/                       辅助脚本（新建笔记、导入 B 站专栏、自查）
├── hooks/pre-commit               git 提交钩子
├── docker.sh                      本地预览（不用装 Node）
├── .github/workflows/deploy.yml   自动部署
└── .gitleaks.toml                 密钥扫描规则
```

**目录就是导航，只有一层。** `docs/` 下的一级目录就是一个节点，里面的笔记平铺，不再往下分层。
没有「软件 / 游戏 / 运维」那种大分类 —— 顶部导航只有「首页」和「关于」，内容全靠左侧边栏。

**但节点目录不进 URL**：`docs/bv1/cv11045619.md` 的地址是 `https://…/notes/cv11045619`。
用 VitePress 的 `rewrites` 实现，好处是文件在 Obsidian 里仍按节点分文件夹（一个目录堆 76 篇笔记没法找），
分享出去的地址却是平的。

一个节点 = 一个目录 + 一个 `index.md`（当导读页和节点标题）：

```
docs/bv1/
├── index.md           ← 节点标题取自它的 frontmatter.title，也是点击节点后的落地页
├── vol26001-*.md
└── …42 篇平铺
```

节点默认折叠，进到某个节点下的页面时会自动展开，并在侧边栏高亮当前页。

**目录就是导航**：`docs/<分类>/` 一个目录就是一个分组，目录里的 `index.md` 提供分组标题和总览页，
`order` 决定排序。侧边栏、分组、导航全部自动生成，不用手写。

---

## 写一篇笔记

在 `docs/` 下任意一个节点目录里（比如 `docs/bv1/`）新建一个 `.md`，开头写 frontmatter：

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

图片统一放 `docs/public/assets/` 下，**全部平铺，不分子目录**，引用时写 `![[文件名.png]]` 就行。

在 Obsidian 里粘贴截图会自动落到这个目录（因为 `.obsidian/app.json` 已经设好了）。

**注意**：不要有同名图片。构建时如果发现重名会警告，因为 `![[server.png]]` 不知道该指哪一个。

### 附件

脚本、压缩包、示例配置这类**下载用**的文件放 `docs/public/files/`，一样平铺。

```markdown
[[deploy.sh|部署脚本]]      ← 推荐：Obsidian 里是链接，站上也是链接
![[deploy.sh|部署脚本]]     ← 站上一样，但 Obsidian 会把文件内容内联展开
```

**别放进 `assets/`**：`pnpm images:prune` 的孤儿判定只看图片的 `![[...]]` 引用，
附件放进去会被当孤儿删掉。

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
| `[[x.sh\|下载]]` `![[x.sh\|下载]]` | 附件链接（脚本、压缩包…），地址自动带 base |
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

### 命名约定：采集来的笔记用 cv 号

从专栏采集的笔记一律命名为 `cv<号>.md`，图片命名成 `cv<号>-<序号>.webp`。
好处是**打开任何一页都能直接对应回原始专栏**：

```
docs/bv2/cv15317852.md            ← 对应 https://www.bilibili.com/read/cv15317852/
docs/public/assets/cv15317852-01.webp
```

所以导入时路径要写成 `cv<号>`：

```bash
pnpm bili 15317852=bv2/cv15317852
```

自己写的笔记（`about.md`、各节点的 `index.md` 等）不用这个规则。

> 导入的是你自己的署名文章没问题；如果是别人的，记得先获得授权再搬。

---

## 图片：格式、原图、体检

站点上的图都是**压缩过的 WebP**（原 PNG 的 12% 左右），不是原图。但任何时候都能把原图拿回来。

### 来源清单

`scripts/assets-sources.json` 记录每张图的**原图 URL、原图文件名**（443 条，约 60KB）：
B 站导入的图顺着 URL 重下即可；你自己粘的图会归档在 `private/originals/`（不进 git）。

```bash
pnpm images manifest         # 重建清单（需要 B 站 cookie，抓 56 篇文章）
pnpm images:check            # 体检
pnpm images:fetch <关键词>    # 取原图
pnpm images:prune            # 删掉没被引用的图（删文章后用）
pnpm images:secure           # 把只被 private/ 引用的图挪出公共目录
pnpm images webp             # 把 PNG 转 WebP
```

### 取原图

```bash
pnpm images:fetch cv14798689              # 这一篇的全部原图
pnpm images:fetch cv14798689-01           # 单张
pnpm images:fetch --all --out=~/orig      # 全部 443 张
```

出来的文件名是**B 站的原文件名**（`<hash>.png`），尺寸是原始尺寸。

### 自己粘的图会怎样

Obsidian 设置 `attachmentFolderPath: "docs/public/assets"`，所以粘贴的图会：

| | |
| --- | --- |
| 落到 | `docs/public/assets/` 根目录（不分子目录） |
| 格式 | **保持 PNG，不自动转** |
| 引用 | 自动写 `![[Pasted image xxx.png]]`，构建能正常渲染 |

**为什么不自动转**：剪贴板里的图存下来就是唯一的原图，转了就没有了。

`pnpm images webp` 会区别对待：

- **有来源 URL 的**（B 站导入）→ 直接转，原图随时能重下
- **没有来源的**（自己粘的）→ **默认跳过**；加 `--all` 才转，转之前先把原图归档到 `private/originals/`

### 体检与清理

```bash
pnpm images:check            # 只看，不改
pnpm images:prune            # 预览：列出可以删的孤儿图
pnpm images:prune --yes      # 真删
pnpm images:secure           # 把私密图挪到 private/assets/
```

`check` 查四件事：

1. **没被任何笔记引用的图** —— 删了引用不等于删了文件，它们**仍然会发布到网站**
   （`docs/public/` 是原样拷贝）。删文章之后跑 `images:prune` 收拾。
2. **只被 `private/` 笔记引用的图** —— 笔记是私密的，图却在公共资源目录里、
   会被提交并发布。`images:secure` 会把它们挪到 `private/assets/`。
3. **原图已不可再获取的图** —— 没来源 URL 也没本地归档，转了就永久丢失。
4. **体积异常的图**。

#### 删掉一篇专栏文章的流程

```bash
# 1. 删笔记（Obsidian 里删，或者 rm）
# 2. 看看它的图变成孤儿了没
pnpm images:prune
# 3. 确认没问题就删掉
pnpm images:prune --yes
# 4. 构建
pnpm build
```

顺带一提：这些图的来源记录可以留着（几十字节），以后想找原图还能查到来自哪篇专栏。

> [!WARNING]
> 附件目录是全局固定的，跟你在哪篇笔记里粘贴无关。
> **在 `private/` 笔记里粘图，图片照样会进 `docs/public/assets/` 并被提交、被发布。**
> 私密笔记的配图请粘完手动移到 `private/` 下。

---

## 许可

笔记内容欢迎参考和链接，但**照抄执行前请先看懂**，我不为任何后果负责。
代码部分（构建配置、脚本）随便用。
