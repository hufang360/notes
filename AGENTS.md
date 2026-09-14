# AGENTS.md

给 AI 编码助手的说明。**这个文件每次对话都会被读进上下文，改的时候请保持简短。**

## 这是什么

Obsidian 笔记仓库 + VitePress 静态站，推 `main` 自动发到 GitHub Pages。
仓库根目录就是 Obsidian vault，`docs/` 是笔记内容。架构和完整说明见 `README.md`。

## 硬性规则

1. **`private/` 永不提交。** 里面是密码、密钥、服务器资料，已在 `.gitignore` 里。
   不要把它复制进 `docs/`，也不要为了"方便同步"把它加进版本控制。
2. **`draft: true` 不是保密手段。** 它只让 VitePress 不渲染，文件仍然在 git 里，clone 就能看。
   真正不能公开的内容只能放 `private/`。改动时不要把这两者混为一谈。
3. **不要绕过 `pnpm check` 和 pre-commit 钩子**（`git commit --no-verify`）。它们是隐私防线。
4. 不要改 `docs/.vitepress/dist` / `cache`，那是构建产物。

## 目录即导航

侧边栏、分组、排序**全部自动生成**（`docs/.vitepress/vault.mts`），不要手写 sidebar 配置：

- `docs/<分类>/` 一个目录 = 一个导航分组
- 目录里的 `index.md` 提供分组标题和总览页；**它的 `order` 决定这个分组排在哪**
- 笔记的 frontmatter `order` 决定同级排序，小的在前，不写排最后
- 新增分类要同时改 `config.mts` 里的 `SECTIONS`

## 别碰坏这些

- **`[[双链]]` / `![[图片]]`** 由 `docs/.vitepress/obsidian.mts` 转换，是自研的 markdown-it 插件。
  改完必须跑 `pnpm build`，日志出现 `⚠️ 找不到笔记` 就是解析挂了。
  `[[名字]]` 的显示文字取目标笔记的 title，不是文件名。
- **mermaid 是按需加载的**（`theme/Mermaid.vue` 里动态 `import()`）。
  别改成静态 import —— 那会让每个页面都多下 600KB。
- **中文搜索**靠 `config.mts` 里自定义的 miniSearch `tokenize`（汉字逐字切分）。
  用默认分词器搜不到中文，这不是 bug。
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
pnpm status                     # 笔记、草稿、附件数量
pnpm check                      # 密钥扫描 + private/ 检查
pnpm new "标题" -s ops --slug english-slug
pnpm bili <cv号>=<路径>         # 导入 Bilibili 专栏，选项见 README
```

## 改完怎么验证

1. `pnpm build` —— **必须零警告**。VitePress 会报死链，双链解析失败会打 `⚠️ 找不到笔记`。
2. 涉及样式 / 交互 / Mermaid / 搜索的改动，用无头 Chrome 真跑一遍，别只看构建通过：

   ```bash
   (nohup pnpm preview >/tmp/preview.log 2>&1 &); sleep 8
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/notes/   # 必须先看到 200
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
     --virtual-time-budget=15000 --dump-dom http://localhost:4173/notes/<页面> > /tmp/x.html
   ```

   预览服务要用 `nohup` 起、并 `curl` 确认在跑。直接用 `(pnpm preview &)` 的话，
   工具调用一结束进程就被回收，Chrome 会静默拿到错误页，看起来像渲染失败。

## 写笔记的约定

- 正文和标题都用中文
- **文件名用英文短横线**（中文文件名会让 URL 变成百分号编码），中文标题写在 frontmatter
- 图片放 `docs/public/assets/`，引用写 `![[文件名.webp]]`；**图片压缩后体积差 90%**，别塞原图
- 命令类笔记：代码块标语言，验证过的环境写在正文里
- 直接陈述，不要"本文将介绍……"这种填充

## 协作偏好

- 中文回复，结论先行，不要复述已经说过的内容
- 动大结构之前先说要动什么、为什么；不确定就先问，别猜着做
- **只做被要求的事**。不要顺手重构周边代码、不要加没要求的抽象和配置项
- 汇报时给证据：跑过的命令、实际输出、HTTP 状态码。不要说"应该没问题"
