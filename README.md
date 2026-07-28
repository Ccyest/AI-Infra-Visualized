# AI Infra Visualized

**Build with SGLang.**

用交互式可视化学习 AI Infra。每一课都是可暂停、可单步、可拖动时间轴的动画,
配合 [Awesome-ML-SYS-Tutorial](https://github.com/zhaochenyang20/Awesome-ML-SYS-Tutorial)
的文字讲解使用——文字负责讲透,这里负责让机制**动起来**。
灵感来自 [bbycroft.net/llm](https://bbycroft.net/llm)。

Interactive visualizations that help you understand modern AI Infrastructure —
built for the [SGLang](https://github.com/sgl-project/sglang) community.
中英双语(默认中文,`/en/` 为英文版,右上角可切换)。

**在线阅读**:<https://yichizhang.dev/AI-Infra-Visualized/>(推送 main 即自动部署;
`ccyest.github.io/AI-Infra-Visualized` 会跳转到此地址)

## 课程

| # | 课程 | 你会看到 | Try on SGLang |
| - | --- | --- | --- |
| 1 | [Continuous Batching](src/content/lessons/zh/continuous-batching.mdx) | static vs continuous 同场赛跑,空泡如何吃掉 GPU 利用率 | [cookbook](https://sgl-project-sglang-93.mintlify.app/concepts/continuous-batching) |

## 本地运行

```bash
npm install
npm run dev      # http://localhost:4321(英文版在 /en/)
npm run build    # 产物在 dist/
npm run check    # 类型与内容 schema 校验
```

## 加一课

本仓库的核心设计目标是:**加一篇教程 ≈ 写一篇文档**。

1. 新建 `src/content/lessons/zh/<slug>.mdx` 与 `src/content/lessons/en/<slug>.mdx`
   (中英各一份,frontmatter + 正文);
2. (可选)在 `src/viz/<slug>/` 下写这课专属的可视化组件,MDX 里直接引用;
3. 首页列表、路由、上一课/下一课导航、延伸阅读、Try on SGLang 按钮全部自动生成。

约定与铁律见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## Roadmap(欢迎认领)

- KV cache 分页管理(PagedAttention)
- Chunked prefill 与 PD(prefill/decode)分离
- Speculative decoding
- Radix cache / prefix caching
- TP / PP / EP 并行策略
- ZeRO 与显存优化

## 技术栈与设计

Astro 5(内容集合 + 静态生成)· MDX(每课每语言一个文件)· React islands(可视化组件)。
动画为「纯函数模拟引擎 + 时间轴回放」,天然确定、可单步。
视觉风格对齐 [yichizhang.dev](https://yichizhang.dev/),数据配色经过色觉友好性(CVD)校验。

## Credits

- 本站为 [SGLang](https://github.com/sgl-project/sglang) 社区而建。**Build with SGLang.**
- 维护者:[Ccyest (Yichi Zhang)](https://github.com/Ccyest)
- 文字讲解伙伴仓库:[Awesome-ML-SYS-Tutorial](https://github.com/zhaochenyang20/Awesome-ML-SYS-Tutorial)

## License

[MIT](LICENSE)
