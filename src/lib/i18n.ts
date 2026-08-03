/**
 * 双语支持:zh 为默认语言(路由无前缀),en 挂在 /en/ 下。
 * - 站点骨架文案:CHROME
 * - 播放器控件文案:PLAYER_UI
 * - 课程可视化内部文案:各课自己的 strings.ts(参考 src/viz/continuous-batching/strings.ts)
 * - 课程正文:src/content/lessons/<locale>/<slug>.mdx,两种语言各一份
 */

export type Locale = "zh" | "en";

/** 一段双语文案 */
export type Localized = { zh: string; en: string };

export const HTML_LANG: Record<Locale, string> = { zh: "zh-CN", en: "en" };

export const CHROME = {
  tagline: {
    zh: "用交互式可视化，把 AI Infra 的核心机制讲明白",
    en: "Interactive visualizations that make AI infra mechanisms click",
  },
  buildWithSglang: { zh: "Build with SGLang.", en: "Build with SGLang." },
  themeToggle: { zh: "切换亮暗主题", en: "Toggle color theme" },
  /** 可见文案显示「切换到」的语言(用目标语言书写,配合 span[lang] 标注);
      aria-label 则用页面自身的语言,读屏器才能正确发音 */
  langSwitch: { zh: "EN", en: "中文" },
  langSwitchAria: { zh: "切换到英文版", en: "Switch to Chinese" },
  heroTitle: { zh: "用可视化，学 AI Infra", en: "Learn AI Infra, visually" },
  heroTagline: {
    zh: "AI Infra 优化方案可视化详解，Built based on SGLang。",
    en: "AI infra optimizations, visualized in detail. Built based on SGLang.",
  },
  heroCredit: {
    zh: "本站为 SGLang 社区而建，由",
    en: "Built for the SGLang community, maintained by",
  },
  heroCreditTail: { zh: "维护。", en: "." },
  furtherReading: { zh: "延伸阅读", en: "Further reading" },
  tryOnSglang: { zh: "上手试试 · Try on SGLang", en: "Try on SGLang" },
  tryOnSglangSub: {
    zh: "打开 SGLang 仓库，在真实推理引擎里跑一跑这套机制",
    en: "Open the SGLang repo and run this in a real inference engine",
  },
  contribute: { zh: "贡献一篇", en: "Contribute a post" },
} satisfies Record<string, Localized>;

/** 播放器控件(VizStage)文案 */
export const PLAYER_UI = {
  play: { zh: "▶ 播放", en: "▶ Play" },
  pause: { zh: "⏸ 暂停", en: "⏸ Pause" },
  replay: { zh: "↻ 重播", en: "↻ Replay" },
  stepBack: { zh: "上一步", en: "Step back" },
  stepForward: { zh: "下一步", en: "Step forward" },
  toStart: { zh: "回到开头", en: "Back to start" },
  timeline: { zh: "时间轴", en: "Timeline" },
  speed: { zh: "播放速度", en: "Playback speed" },
} satisfies Record<string, Localized>;
