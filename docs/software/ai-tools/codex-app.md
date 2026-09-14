---
title: "让Codex app接入国产大模型"
tags: []
order: 170
source: https://www.bilibili.com/read/cv50042305/
sourceDate: 2026-06-04
draft: false
---

# 让Codex app接入国产大模型

> [!NOTE] 本文原载于 Bilibili 专栏
> [阅读原文](https://www.bilibili.com/read/cv50042305/) · 2026-06-04
> 成文较早，文中的版本号和命令可能已经过时，请结合实际情况判断。

新版的 Codex app 和 Codex CLI 只支持 /v1/responses ，但国产模型还没跟进。 URL大赏 啥意思呢？先看几个url： # 三分天下 # /v1/chat/completions # OpenAI API兼容，大家都支持 # /v1/responses # OpenAI 新标准 # /v1/messages # Anthropic 标准 # 下面为了方便查看，都省略前面的 https:// # openai api.openai.com/v1/chat/completions api.openai.com/v1/responses # deepseek api.deepseek.com/v1/chat/completions api.deepseek.com/v1/responses # 不存在 api.deepseek.com/anthropic/v1/messages # 接claude code 就是这个地址 # mimo api.xiaomimimo.com/v1/chat/completions api.xiaomimimo.com/v1/responses # 不存在 api.xiaomimimo.com/anthropic/v1/messages # minimax api.minimaxi.com/v1/chat/completions api.minimaxi.com/v1/responses # 支持的哦 api.minimaxi.com/anthropic/v1/messages # openrouter openrouter.ai/api/v1/chat/completions openrouter.ai/api/v1/responses # 支持 openrouter.ai/api/v1/messages 手动配置 如果厂商有 /v1/responses 接口，那么我们稍微改一下配置文件，就可以接入了。用记事本或vscode打开 config.toml（操作前先将Codex退出来）。 mac：~/.codex/config.toml windows：%userprofile%/.codex/config.toml 这里抄下minimax作业： model = "MiniMax-M3" model\_provider = "minimax" model\_context\_window = 512000 \[model\_providers.minimax\] name = "MiniMax" base\_url = "https://api.minimaxi.com/v1" experimental\_bearer\_token = "sk-xxxx" wire\_api = "responses" 将上面的内容，粘贴到顶部位置，重启Codex APP 就好了。 CC-Switch cc-switch 新版（v3.16.0）增加了路由功能，Codex这边请求 /v1/responses ，cc-switch的路由接收时，进行转换，然后请求deepseek的 /v1/chat/completions。这这这，不就是中转站么~哈哈是的！ ccs官网地址：https://ccswitch.io/ 下面以添加 DeepSeek 供应商为例： 成果展示\[滑稽\] 常见问题 大多问题，都是因为配置没有生效，没有同步。 呀，ccs(cc-switch) 也做不到，一键切换，指哪打哪~ ccs 你就想它是，修改codex配置的工具。路由功能，相当于中转站。 要诀： 要切供应商，先退Codex！！！ 切过gpt，ccs也要退，然后先启动！！！ 核心配置文件： config.toml 主配置。 auth.json 授权信息。 可以在 .codex 目录找到，用记事本打开，或者用vscode打开（推荐）。 windows: %userprofile%/.codex/ mac: ~/.codex/ CodeX只在启动时读取，中途修改，它可不管。甚至你在codex修改了一部分设置，Codex还会覆写配置。 目前ccs更新 auth.json 经常不及时，两个文件要匹配。有时config.toml改了，auth.json 没改，授权就失败了。一般重开ccs会正确写入。 有时ccs会修改失败，要对不上，就去ccs上新建一个供应商。直到 它俩对上了，再开 Codex。 刚配的供应商，一定要做供应商测试。 如果测试失败，请自己检查api地址和密钥，ccs的api密钥输入框有拼写检查，容易把sk转成Sk，导致密钥失效。 怎么确定是不是deepseek？ ccs主界面右上角设置，找到“使用统计”，下方能看到请求模型是时间，如果有记录且对上了说明成功。 codex里说它是gpt5.5，你就知道他是李鬼，其实是你的deepseek。 怎么确定是不是gpt？ 点codex左下角的设置，如果看到邮箱说明还是gpt。 codex报错信息 如果地址有 127.0.01:15721 说明config.toml对了，走路由了，但是 auth.json不匹配。 如果地址有 api.openai.com 大概率是auth.json是gpt，config.toml配了模型和base\_url。 如看到502错误，请退出代理软件。请退代理！请退代理！ 碎碎念 相信随着codex的普及，说不定 DeepSeek、mimo等也会跟进 responses。就跟支持 anthropic一样。CodeX 也不局限在code写代码上，在办公方面也在逐渐变强！ agent虽好，token要钱！善用工具，你和厂商都有美好的明天，国模加油💪！ 额外的配置示例
