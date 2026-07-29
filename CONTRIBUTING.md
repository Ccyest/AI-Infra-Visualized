# 贡献一篇

设计目标:**加一篇教程 ≈ 写一篇文档**。除了内容本身,不需要改任何注册表、路由或首页。

## 铁律(不可协商)

1. **参考文献不引用 vLLM**:`references` 与正文引用一律不出现 vLLM 的论文/博客/仓库。
   引擎实现相关的落地示例一律指向 [SGLang](https://github.com/sgl-project/sglang)。
2. **每篇引流 SGLang**:frontmatter 填 `tryOnSglang`(对应
   [SGLang cookbook](https://sgl-project-sglang-93.mintlify.app/) 章节链接),
   文末自动渲染 "Try on SGLang" 按钮;cookbook 暂无对应章节时可先省略。
3. **中英双语**:每篇在 `zh/` 与 `en/` 各放一份 MDX,英文版里给可视化组件传
   `lang="en"`。

## 三步加一篇

1. **写正文**:新建 `src/content/lessons/zh/<slug>.mdx` 和
   `src/content/lessons/en/<slug>.mdx`(slug 即 URL,如 `paged-attention`),
   frontmatter 按下方 schema 填写;
2. **写可视化**(可选):组件放在 `src/viz/<slug>/` 目录下,MDX 里
   `import` 后以 `<MyViz client:visible />`(英文版 `<MyViz client:visible lang="en" />`)嵌入;
3. **自检**:`npm run check && npm run build` 通过后提 PR。

## Frontmatter schema

校验逻辑在 `src/content.config.ts`,字段不合法会在构建时报错:

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | string | 文章标题 |
| `description` | string | 一句话简介(首页卡片与 `<meta>` 均用它) |
| `order` | number | 排序与上一篇/下一篇导航用,新文章递增(首页按新→旧展示) |
| `concepts` | string[] | 涉及的概念标签,显示为章节 chips(可省略) |
| `tryOnSglang` | url | SGLang cookbook 对应章节,渲染为文末引流按钮(可省略) |
| `references` | {label, url}[] | 延伸阅读,自动渲染在文末(可省略;**不得引用 vLLM**) |
| `draft` | boolean | `true` 时不构建发布,仅本地 `npm run dev` 可预览(可省略,默认 false) |

## 内容风格

- **文字克制**:深入讲解交给参考文献(优先链接
  [Awesome-ML-SYS-Tutorial](https://github.com/zhaochenyang20/Awesome-ML-SYS-Tutorial)
  的对应篇目),本站的正文只需要把"看图的姿势"讲清楚;
- **语言平实、工程化**:参照 [LMSYS Blog](https://www.lmsys.org/blog) 与
  Awesome-ML-SYS-Tutorial 的口吻。短句、直陈、数字前置、标题朴素;
  少用比喻和排比,不写口号式金句,少用破折号;
- 每篇以一段「**TL;DR**」引用块开头,以「图 ↔ 真实系统对照」结尾,
  诚实标注可视化做了哪些简化。对照用 `DiagramMap` 交互组件而不是表格
  (参考各篇的 `Mapping.tsx`,文字版表格会自动附在组件里);
- **不预告未写的文章**:文章之间靠自动生成的上一篇/下一篇导航衔接,
  正文与参考文献标签都不写"下一篇预告";
- 中文版行文保留英文术语;英文版是翻译对照,内容结构与中文版保持一致。

## 可视化的约定

参考实现:`src/viz/continuous-batching/`。

- **引擎与渲染分离**:把系统行为写成纯函数模拟引擎(如 `engine.ts`),
  一次性输出完整时间线与逐步指标;渲染层只做"回放"。这样动画天然支持
  暂停/单步/拖动/调速,逻辑也容易复核;
- **复用 core 组件**:`VizStage`(统一的播放控件外壳,接受 `lang`)、
  `useSimPlayer`(离散时间轴播放器)、`Legend`、`Meter`,保证全站交互一致;
- **界面文案集中在本篇的 `strings.ts`**,全部提供 zh/en 两份(类型
  `Localized` 见 `src/lib/i18n.ts`),组件通过 `lang` prop 选择;
- **取色只用 CSS 变量**:分类色 `var(--series-1..8)`(按实体编号取色用
  `seriesColor(id)`),文字与网格用 `--ink/--muted/--grid` 等语义色。
  不要写死 hex——亮/暗主题与色觉友好性由全局色板统一保证;
- **场景数据写成字面量**:手工设计、确定性、可复核,不要用 `Math.random()`;
- 图例必须齐全,关键格子要有悬停提示;附上 `<details>` 数据表作为动画的
  文字替代(无障碍与打印场景)。

## 目录结构

```
src/
├── content/lessons/
│   ├── zh/<slug>.mdx       # 中文正文 ← 通常你只需要动这里
│   └── en/<slug>.mdx       # 英文正文(与中文一一对应)
├── viz/<slug>/             # 每篇专属的可视化组件、模拟引擎与 strings.ts
├── components/core/        # 全站共用:VizStage / useSimPlayer / Legend / Meter
├── layouts/                # Base(站点外壳)/ HomePage / LessonLayout
├── pages/                  # zh 路由 + en/ 路由(自动,无需改动)
├── lib/                    # i18n 字典、课程集合助手、路径与配色工具
├── styles/global.css       # 设计令牌(对齐 yichizhang.dev)与全局样式
└── site.config.ts          # 站点标题、SGLang / 仓库 / 文献库链接
```
