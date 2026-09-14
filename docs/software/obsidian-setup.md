---
title: Obsidian 配置与写作约定
tags: [obsidian, 写作, 工作流]
order: 20
---

# Obsidian 配置与写作约定

这个仓库同时是一个 Obsidian vault。把仓库根目录作为 vault 打开，就能直接在 Obsidian 里写、在本地预览、push 之后自动发布。

## 打开仓库作为 vault

Obsidian → 「打开文件夹作为仓库」→ 选中 `blog/`（即仓库根目录）。

> [!NOTE]
> 不要把 `docs/` 当成 vault 根。仓库根才是 vault 根，这样 `private/`、`_templates/`、README 都能正常看到和编辑。

## 必改的几个设置

**设置 → 文件与链接**：

| 选项 | 设成 | 为什么 |
| --- | --- | --- |
| 新附件的默认位置 | 指定的附件文件夹 | 图片统一收口，构建时才能找到 |
| 附件文件夹路径 | `docs/public/assets` | 发布后对应 `/assets/...`，链接不会断 |
| 新链接格式 | 尽可能短 | 与 VitePress 的相对链接习惯一致 |
| 使用 Wikilinks | **开**（也可以） | 构建时有插件帮你转成标准链接 |
| 自动更新内部链接 | 开 | 重命名笔记时自动改引用 |

![[obsidian-attachment-setting.png|520]]

改完之后，粘贴进来的截图会自动落到 `docs/public/assets/`，笔记里写的是 `![[图片名.png]]`，构建时会被翻译成 `/assets/图片名.png`。

## 支持的 Obsidian 语法

构建前会有一道转换（见 `docs/.vitepress/obsidian.mts`），目前支持：

| 写法 | 效果 |
| --- | --- |
| `[[笔记名]]` | 转成相对链接，例如你现在看到的 [[git-cheatsheet]] |
| `[[笔记名\|显示文字]]` | 带别名，例如 [[git-cheatsheet\|Git 速查]] |
| `[[笔记名#标题]]` | 跳转到指定小节 |
| `![[图片.png]]` | 嵌入图片 |
| `![[图片.png\|400]]` | 嵌入图片并限定宽度 |
| `> [!note]` 等 | 转成提示框（note / tip / warning / danger / question 都认） |
| `%%注释%%` | 构建时删除，不输出到页面 |
| `==高亮==` | 高亮 |

> [!WARNING]
> `![[整篇笔记]]` 这种「笔记嵌入笔记」做不了静态转写，会退化成一条链接。
> 需要合并内容时，手动复制过去。

上面这张表里的写法在本页就能直接看到效果：双链（[[git-cheatsheet]]）、
高亮（==这一句是高亮的==）、注释（%%你写什么都行，构建时会被删掉%%）。
被删掉的注释在 Obsidian 里能看到，在网站上不存在。

## frontmatter 字段

```yaml
---
title: 侧边栏显示的名字
tags: [obsidian, 写作]
order: 20        # 同级排序，小的在前，不写就排最后
draft: false     # true = 不参与构建
private: false   # true = 不参与构建（语义上的区别，行为一样）
---
```

## 本地预览

```bash
pnpm install
pnpm dev          # http://localhost:5173/notes/
```

改完 Markdown 会热更新，不用刷新。

## 图片放哪

```
docs/public/assets/            <- 所有图片、附件的家
├── obsidian-attachment-setting.png
├── games/
│   └── terraria-server-console.png
└── ops/
    └── disk-usage.png
```

> [!CAUTION]
> 附件重名会被警告。`a/server.png` 和 `b/server.png` 同时存在时，
> `![[server.png]]` 不知道指哪个。给图片起名时带上上下文，比如 `terraria-server.png`。

## 相关

- [[docker-compose-tips]]
