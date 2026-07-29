# AI Infra Visualized

**Build with SGLang.**

用交互式可视化学习 AI Infra。每篇文章配可暂停、可单步、可拖动时间轴的动画,
配合 [Awesome-ML-SYS-Tutorial](https://github.com/zhaochenyang20/Awesome-ML-SYS-Tutorial)
的文字讲解使用:文字负责讲透,这里负责让机制**动起来**。
灵感来自 [bbycroft.net/llm](https://bbycroft.net/llm)。

Interactive visualizations that help you understand modern AI Infrastructure —
built for the [SGLang](https://github.com/sgl-project/sglang) community.
中英双语(默认中文,`/en/` 为英文版,右上角可切换)。

**在线阅读**:<https://yichizhang.dev/AI-Infra-Visualized/>(推送 main 即自动部署;
`ccyest.github.io/AI-Infra-Visualized` 会跳转到此地址)

## 文章

| 文章 | 内容 | Cookbook |
| --- | --- | --- |
| [DSpark:大 batch 下的投机解码](src/content/lessons/zh/dspark-speculative-decoding.mdx) | 整块起草与验证、按置信度裁剪验证窗口、ragged 打包 | [cookbook](https://sgl-project-sglang-93.mintlify.app/advanced/speculative-decoding) |
| [Kimi K3 Day-0 Support](src/content/lessons/zh/kimi-k3-day0-support.mdx) | 双状态统一显存池、chunked PP prefill、DCP decode | [cookbook](https://sgl-project-sglang-93.mintlify.app/developer/memory-management) |
| [Continuous Batching](src/content/lessons/zh/continuous-batching.mdx) | static vs continuous 逐 iteration 对比,空泡与 GPU 利用率 | [cookbook](https://sgl-project-sglang-93.mintlify.app/concepts/continuous-batching) |

## 本地运行

```bash
npm install
npm run dev      # http://localhost:4321(英文版在 /en/)
npm run build    # 产物在 dist/
npm run check    # 类型与内容 schema 校验
```

## 写一篇

本仓库的核心设计目标是:**加一篇文章 ≈ 写一篇文档**。

1. 新建 `src/content/lessons/zh/<slug>.mdx` 与 `src/content/lessons/en/<slug>.mdx`
   (中英各一份,frontmatter + 正文);
2. (可选)在 `src/viz/<slug>/` 下写这篇专属的可视化组件,MDX 里直接引用;
3. 首页列表、路由、上一篇/下一篇导航、延伸阅读、Try on SGLang 按钮全部自动生成。

约定与铁律见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## Roadmap(欢迎认领)

- KV cache 分页管理(PagedAttention)
- Miles:MXFP4 权重上的 LoRA 强化学习
- Chunked prefill 与 PD(prefill/decode)分离
- Radix cache / prefix caching
- TP / PP / EP 并行策略
- ZeRO 与显存优化

## 技术栈与设计

Astro 5(内容集合 + 静态生成)· MDX(每篇每语言一个文件)· React islands(可视化组件)。
动画为「纯函数模拟引擎 + 时间轴回放」,天然确定、可单步。
视觉风格对齐 [yichizhang.dev](https://yichizhang.dev/),数据配色经过色觉友好性(CVD)校验。

## Credits

- 本站为 [SGLang](https://github.com/sgl-project/sglang) 社区而建。**Build with SGLang.**
- 维护者:[Ccyest (Yichi Zhang)](https://github.com/Ccyest)
- 文字讲解伙伴仓库:[Awesome-ML-SYS-Tutorial](https://github.com/zhaochenyang20/Awesome-ML-SYS-Tutorial)

## License

[MIT](LICENSE)
