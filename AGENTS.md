# AGENTS.md

给 AI 编码助手的说明。**这个文件每次对话都会被读进上下文，改的时候请保持简短。**

## 这是什么

Obsidian 笔记仓库 + VitePress 静态站，推 `main` 自动发到 GitHub Pages。
仓库根目录就是 Obsidian vault，`docs/` 是笔记内容。架构和完整说明见 `README.md`。

**结构极简：`docs/` 下的一级目录就是一个节点，里面的笔记平铺，只有一层。**
没有「软件 / 游戏 / 运维」这种大分类，顶部导航只有「首页」和「关于」。

## 硬性规则

1. **`private/` 永不提交。** 里面是密码、密钥、服务器资料，已在 `.gitignore` 里。
   不要把它复制进 `docs/`，也不要为了"方便同步"把它加进版本控制。
2. **`draft: true` 不是保密手段。** 它只让 VitePress 不渲染，文件仍然在 git 里，clone 就能看。
   真正不能公开的内容只能放 `private/`。改动时不要把这两者混为一谈。
3. **不要绕过 `pnpm check` 和 pre-commit 钩子**（`git commit --no-verify`）。它们是隐私防线。
4. 不要改 `docs/.vitepress/dist` / `cache`，那是构建产物。

## 目录即导航

侧边栏**全部自动生成**（`docs/.vitepress/vault.mts`），不要手写 sidebar 配置：

- `docs/<节点>/` 一个目录 = 侧边栏一个节点；目录里的 `index.md` 是节点标题兼导读页
- 节点内笔记**平铺**，不要再往下分层
- 节点 order 取自它 `index.md` 的 order；笔记的 order 决定节点内排序，小的在前
- 根目录下的 `.md`（如 `about.md`）直接作为顶层条目
- 节点默认折叠，进到节点内页面时 VitePress 会自动展开并高亮当前项
- **节点目录不进 URL**：`bv1/cv11045619.md` 的地址是 `/notes/cv11045619`。
  靠 `config.mts` 的 `rewrites`（= `vault.mts` 的 `rewritePath`）实现。
  这样文件在 Obsidian 里仍按节点分文件夹（一个目录堆 76 篇没法找），分享的地址却是平的。

## 别碰坏这些

- **`[[双链]]` / `![[图片]]`** 由 `docs/.vitepress/obsidian.mts` 转换，是自研的 markdown-it 插件。
  改完必须跑 `pnpm build`，日志出现 `⚠️ 找不到笔记` 就是解析挂了。
  `[[名字]]` 的显示文字取目标笔记的 title，不是文件名。
- **双链必须生成根绝对路径**（`/cv11045619`），**不能生成相对路径**。
  VitePress 的 link 插件不会跟着 `rewrites` 改写相对链接 —— 源目录和输出目录一旦不一致，
  相对链接就会指到 `/notes/bv1/cv11045619` 这种不存在的地址（已踩过一次）。
  绝对路径能正常渲染，死链检查也会用 `rewrites.inv` 反查回源文件校验。
- **mermaid 是按需加载的**（`theme/Mermaid.vue` 里动态 `import()`）。
  别改成静态 import —— 那会让每个页面都多下 600KB。
- **中文搜索**靠 `config.mts` 里自定义的 miniSearch `tokenize`（汉字逐字切分）。
  用默认分词器搜不到中文，这不是 bug。
- **B 站正文有几种格式，导入器都要认。** 判断顺序：
  1. `{"ops":[...]}` → Quill Delta（动态类内容），走 `deltaToHtml`
  2. 有 HTML 标签 → 走 turndown
  3. **一个标签都没有 → 纯文本**（新版编辑器写的）—— 优先用同一份响应里的
     `opus.content.paragraphs`（标题 / 代码语言 / 列表都在），`plainTextToMarkdown` 只兜底
  第 3 种最容易漏：直接丢给 markdown-it 会把几十个换行当软换行挤成一坨，排版全毁。
- **采集 B 站文章要带 cookie**（Netscape 格式，一行一条，默认 `~/yt-dlp/c-bili.txt`）：
  充电专属的文章不带 cookie 只会返回「请将 App 客户端升级」，带登录 cookie 才拿得到正文。
  `opus` 链接里的 id 是动态 id（超过 Number 安全整数，别转成数字），要用详情接口换成 cv 号。
- **链接卡片的显示文字是「网页链接」时，不要写 `[网页链接](url)`**，
  直接留裸 URL（linkify 会变成可点链接）；只有带真实标题的链接才保留 markdown 链接。
- **纯文本文章必须把代码段识别成围栏代码块**，不只是为了好看 ——
  不进代码块的话，`$targetDir` 会被 MathJax 当行内公式吃掉、`x86*` 变斜体、`# 注释` 变标题。
  判定规则是「以 `#` 开头 或 整行无中文」，别改成看缩进。
- **`.mts` 是故意不编译成 `.js` 的**：Node 26 原样就能 import（type stripping），
  `scripts/status.mjs` 直接复用了 `vault.mts`。别"顺手"改扩展名。
- **pnpm 11 的构建白名单**在 `pnpm-workspace.yaml`（`allowBuilds` + `onlyBuiltDependencies`），
  两个键都留着是为了兼容 pnpm 10。
- **`.gitleaks.toml` 里禁止加 `docs/**.md` 这类路径白名单。**
  这个仓库的正文就是笔记，排除 docs/ 等于让扫描形同虚设 —— 密码写进笔记也会绿灯。
  白名单只能放人工确认过的具体假值。
- **CI 不用 `gitleaks-action`。** 它不认 `--config`，用的是默认规则，
  本地和 CI 的结果会对不上（这个坑已经踩过一次）。workflow 里直接下官方二进制。
- **密钥扫描要扫两层**：`gitleaks git` 只看已提交的历史，刚写进笔记、还没 commit 的
  得靠 `gitleaks dir`。两个都在 `pnpm check` 里。

## 命令

```bash
pnpm dev / build / preview      # 本地预览 / 构建 / 预览产物
./docker.sh                     # 同上，但不用装 Node（端口 5173）
./docker.sh preview             # 构建+静态预览（端口 4173）
pnpm status                     # 笔记、草稿、附件数量
pnpm check                      # 密钥扫描 + private/ 检查
pnpm new "标题" -s ops --slug english-slug
pnpm bili <cv号>=<路径>         # 导入 Bilibili 专栏，选项见 README
```

## 改完怎么验证

1. `pnpm build` —— **必须零警告**。VitePress 会报死链，双链解析失败会打 `⚠️ 找不到笔记`。
2. 涉及样式 / 交互 / Mermaid / 搜索的改动，用无头 Chrome 真跑一遍，别只看构建通过：

   ```bash
   pkill -9 -f vitepress; sleep 1        # 先杀干净旧进程，否则会掉进下面的坑
   nohup pnpm preview >/tmp/preview.log 2>&1 &
   sleep 9
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/notes/   # 必须先看到 200
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
     --virtual-time-budget=15000 --dump-dom http://localhost:4173/notes/<页面> > /tmp/x.html
   ```

   > [!WARNING] 两个让验证结果说假的坑，都实际踩过
   >
   > **1. 残留的 preview 进程或 Docker 容器占着端口。** 新起的服务绑定失败，
   > 请求打到了旧进程上 —— 而旧进程服务的是**上一次构建的 dist**。症状是主包 JS 报 404，
   > Vue 从未 hydrate，页面停留在 SSR 快照：侧边栏不展开、不高亮、看起来像代码写错了。
   > 排查：`lsof -nP -iTCP:4173 -sTCP:LISTEN`、`docker ps`，然后 `pkill -9 -f vitepress`。
   > **先确认 `/notes/assets/app.<hash>.js` 返回 200** 再往下看。
   >
   > **2. `(pnpm preview &)` 起服务。** 工具调用一结束进程就被回收，Chrome 会静默拿到错误页。
   > 用 `nohup`，并 `curl` 确认在跑。

## 图片

- 站点上的图是**压缩过的 WebP**，不是原图。来源记录在 `scripts/assets-sources.json`，
  用 `pnpm images:fetch` 取原图。改图片相关逻辑前先读 README 的「图片」一节。
- **自己粘的图不要自动转 WebP** —— 剪贴板里存下来的那份就是唯一的原图。
  `pnpm images webp` 默认只转「有来源 URL」的，这个判断不能去掉。
- **`docs/public/` 下的所有文件都会发布**，不管有没有被笔记引用。
  `pnpm images:check` 的「孤儿图」和「只被 private/ 引用」两类就是在兜这个底。
  删文章后要跑 `pnpm images:prune`，不然图会一直留在仓库和线上。
- **保持 WebP**。体积优先，专栏文章还可能被删，没必要为了画质换回 PNG。
  `pnpm images webp` 只转「有来源 URL」的图这条规则别去掉。
- **下载类附件放 `docs/public/files/`**（脚本、压缩包…），平铺，笔记里用
  `[[x.sh|下载]]` 引用（`![[x.sh]]` 也行），插件会生成带 base 的链接。
  不要放 `assets/` 下 —— `images:prune` 的孤儿判定只看图片的 `![[...]]`，会把它删掉。

## 写笔记的约定

- **从 B 站专栏采集的笔记必须命名为 `cv<号>.md`**（图片同理，`cv<号>-<序号>.webp`），
  这样打开任意一页就能对应回原专栏。自己写的笔记不受此限。
- 正文和标题都用中文
- **文件名用英文短横线**（中文文件名会让 URL 变成百分号编码），中文标题写在 frontmatter
- 图片放 `docs/public/assets/`（**平铺，不分子目录**），引用写 `![[文件名.webp]]`；**图片压缩后体积差 90%**，别塞原图
- 命令类笔记：代码块标语言，验证过的环境写在正文里
- 直接陈述，不要"本文将介绍……"这种填充

## 协作偏好

- 中文回复，结论先行，不要复述已经说过的内容
- 动大结构之前先说要动什么、为什么；不确定就先问，别猜着做
- **只做被要求的事**。不要顺手重构周边代码、不要加没要求的抽象和配置项
- 汇报时给证据：跑过的命令、实际输出、HTTP 状态码。不要说"应该没问题"
