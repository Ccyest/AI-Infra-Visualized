import type { Locale, Localized } from "../../lib/i18n";

/** 本课可视化的全部界面文案(zh / en) */

/* ---------------- TimelineViz ---------------- */

export const TIMELINE = {
  title: { zh: "BCG 时间线图示", en: "BCG timeline diagram" },
} satisfies Record<string, Localized>;

export interface TimelineItem {
  date: string;
  pr: string;
  url: string;
  text: Localized;
  /** 原创性锚点,高亮 */
  origin?: boolean;
}

export const TIMELINE_ITEMS: TimelineItem[] = [
  {
    date: "2026-02-21",
    pr: "#19102",
    url: "https://github.com/sgl-project/sglang/pull/19102",
    text: {
      zh: "首个 BCG 实现公开：提出、命名并开源",
      en: "First BCG implementation published: proposed, named, open-sourced",
    },
    origin: true,
  },
  {
    date: "2026-04-11",
    pr: "#19102",
    url: "https://github.com/sgl-project/sglang/pull/19102",
    text: { zh: "BCG 合入 SGLang main", en: "BCG merged into SGLang main" },
  },
  {
    date: "2026-04-24",
    pr: "#22218",
    url: "https://github.com/sgl-project/sglang/pull/22218",
    text: {
      zh: "BCG 扩展到 prefill，随后成为默认",
      en: "BCG extended to prefill; became the default",
    },
  },
  {
    date: "2026-06-10",
    pr: "#23906",
    url: "https://github.com/sgl-project/sglang/pull/23906",
    text: { zh: "Runner/Backend 重构", en: "Runner/backend refactor" },
  },
  {
    date: "2026-07-07",
    pr: "#27988",
    url: "https://github.com/sgl-project/sglang/pull/27988",
    text: {
      zh: "Full CUDA Graph for prefill（FA4 / FlashInfer 首发）",
      en: "Full CUDA Graph for prefill (first on FA4 / FlashInfer)",
    },
  },
  {
    date: "2026-07-08",
    pr: "#27436",
    url: "https://github.com/sgl-project/sglang/pull/27436",
    text: { zh: "diffusion stack 采用 BCG", en: "BCG adopted by the diffusion stack" },
  },
];

/* ---------------- TcPiecewiseViz ---------------- */

export const TC = {
  title: { zh: "TC piecewise 断点图示", en: "TC-piecewise breakpoints diagram" },
  subtitle: { zh: "橙色为不兼容算子", en: "orange marks the incompatible op" },
  stage1: { zh: "一个 forward", en: "One forward" },
  stage1Badge: { zh: "E 依赖运行时信息", en: "E depends on runtime info" },
  stage2: { zh: "torch.compile trace", en: "torch.compile trace" },
  stage2Badge: {
    zh: "Dynamo 把整个 forward trace 成 FX graph；custom kernel 要 torch.library + fake impl",
    en: "Dynamo traces the whole forward into an FX graph; custom kernels need torch.library + fake impls",
  },
  stage3: { zh: "在切分点拆开", en: "Split at the registered points" },
  stage4: { zh: "逐 piece 编译 + capture", en: "Compile + capture each piece" },
  timebarLabel: { zh: "构建时间构成", en: "Build-time breakdown" },
  timebarCompile: { zh: "编译", en: "compile" },
  timebarCapture: { zh: "capture", en: "capture" },
  timebarNumbers: {
    zh: "例：235B MoE 90 s · GLM-5.2 158 s",
    en: "e.g. 90 s on a 235B MoE · 158 s on GLM-5.2",
  },
  replayNote: {
    zh: "replay 每次先付 Dynamo guard check 与 dispatch",
    en: "every replay first pays Dynamo guard checks and dispatch",
  },
} satisfies Record<string, Localized>;

/* ---------------- ResultsViz ---------------- */

export const RESULTS = {
  title: { zh: "成果图示", en: "Results diagram" },
  codeHead: { zh: "分段执行的实现代码量", en: "Code for segmented execution" },
  speedHead: { zh: "prefill 加速比（对 eager）", en: "Prefill speedup over eager" },
  lineUnit: { zh: " 行", en: " lines" },
  buildNote: {
    zh: "无需编译，构建 prefill graph 快 3.8–5.2×",
    en: "no compilation: prefill graphs build 3.8–5.2× faster",
  },
  benchNote: {
    zh: "gpt-oss-120b · TP4 · 4×GB300",
    en: "gpt-oss-120b · TP4 · 4×GB300",
  },
} satisfies Record<string, Localized>;

/* ---------------- LaunchRaceViz ---------------- */

export const RACE = {
  title: { zh: "Launch 开销图示", en: "Launch-overhead diagram" },
  laneEager: { zh: "Eager", en: "Eager" },
  laneBcg: { zh: "Breakable CUDA Graph", en: "Breakable CUDA Graph" },
  laneFull: { zh: "Full CUDA Graph", en: "Full CUDA Graph" },
  cpuRow: { zh: "CPU", en: "CPU" },
  gpuRow: { zh: "GPU", en: "GPU" },
  legendLaunch: { zh: "CPU 发射 / host 工作", en: "CPU launch / host work" },
  legendGraphKernel: { zh: "kernel（graph 内）", en: "kernel (inside a graph)" },
  legendEagerKernel: { zh: "kernel（eager）", en: "kernel (eager)" },
  legendIdle: { zh: "GPU 空等", en: "GPU waiting" },
} satisfies Record<string, Localized>;

export function raceLaunches(locale: Locale, n: number): string {
  return locale === "zh" ? `${n} 次发射` : `${n} launches`;
}

export function raceFinished(locale: Locale, t: number): string {
  return locale === "zh" ? `✓ 完成于 t=${t}` : `✓ finished at t=${t}`;
}

/* ---------------- BcgStepViz ---------------- */

export const BCG_STEP = {
  title: { zh: "BCG 断开与接上图示", en: "BCG break-and-resume diagram" },
  phaseCapture: { zh: "Capture", en: "Capture" },
  phaseReplay1: { zh: "Replay ①", en: "Replay ①" },
  phaseReplay2: { zh: "Replay ②", en: "Replay ②" },
  seg1: { zh: "segment 1", en: "segment 1" },
  seg2: { zh: "segment 2", en: "segment 2" },
  eagerBadge: { zh: "@eager_on_graph", en: "@eager_on_graph" },
  bufferName: { zh: "boundary buffer", en: "boundary buffer" },
  bufferAddr: { zh: "地址 0x4F00，固定", en: "address 0x4F00, fixed" },
  freshName: { zh: "新 tensor", en: "fresh tensor" },
  copyArrow: { zh: "copy", en: "copy" },
  captureAgainst: { zh: "对着 0x4F00 捕获", en: "captured against 0x4F00" },
  readFrom: { zh: "从 0x4F00 读", en: "reads 0x4F00" },
  stateRecording: { zh: "录制中", en: "recording" },
  stateSealed: { zh: "已捕获", en: "captured" },
  stateReplaying: { zh: "重放", en: "replaying" },
  stateEagerRun: { zh: "eager 执行", en: "running eagerly" },
} satisfies Record<string, Localized>;

export const BCG_STEPS: Localized[] = [
  {
    zh: "一段 forward：A1–A3 与 B1–B3 图兼容，E 被 @eager_on_graph 标注。播放开始 capture",
    en: "One forward: A1–A3 and B1–B3 are graph-safe; E is marked @eager_on_graph. Play to start capture",
  },
  {
    zh: "capture 开始：segment 1 录制 A1–A3",
    en: "Capture begins: segment 1 records A1–A3",
  },
  {
    zh: "执行到 E：segment 1 收口",
    en: "Execution reaches E: segment 1 is closed",
  },
  {
    zh: "E eager 执行；返回的 tensor 保留为 boundary buffer，地址 0x4F00 从此固定",
    en: "E runs eagerly; its output is retained as the boundary buffer — address 0x4F00 is now fixed",
  },
  {
    zh: "capture 在 segment 2 继续：B1–B3 对着地址 0x4F00 录制",
    en: "Capture resumes in segment 2: B1–B3 are captured against address 0x4F00",
  },
  {
    zh: "capture 完成：两段图 + 一个 eager 区",
    en: "Capture done: two graph segments plus one eager region",
  },
  {
    zh: "replay：segment 1 一次发射，整段重放",
    en: "Replay: segment 1 replays as one unit with a single launch",
  },
  {
    zh: "E 正常执行，返回新 tensor（地址 0x7A10，值 v₁）",
    en: "E runs normally and returns a fresh tensor (address 0x7A10, value v₁)",
  },
  {
    zh: "BCG 把 v₁ 拷进 0x4F00：地址不变，值更新",
    en: "BCG copies v₁ into 0x4F00: same address, new value",
  },
  {
    zh: "segment 2 重放，从捕获时的地址 0x4F00 读到 v₁",
    en: "Segment 2 replays and reads v₁ from the address it was captured against",
  },
  {
    zh: "再一次 replay：segment 1 重放",
    en: "Another replay: segment 1 replays",
  },
  {
    zh: "E 返回又一个新 tensor（0x9C20，v₂），拷进 0x4F00",
    en: "E returns another fresh tensor (0x9C20, v₂), copied into 0x4F00",
  },
  {
    zh: "segment 2 重放，读到 v₂。eager 区内部，BCG 始终不需要理解",
    en: "Segment 2 replays and reads v₂. BCG never needs to understand what happens inside the eager region",
  },
];

/* ---------------- PrefillPadViz ---------------- */

export const PAD = {
  title: { zh: "Prefill padding 图示", en: "Prefill-padding diagram" },
  subtitle: {
    zh: "bucket：16 / 32 / 64 · request 槽位 ×4",
    en: "buckets: 16 / 32 / 64 · request slots ×4",
  },
  scenariosAria: { zh: "切换场景", en: "Switch scenario" },
  tokenAxis: { zh: "token 维", en: "tokens" },
  slotAxis: { zh: "request 槽位", en: "request slots" },
  sentinel: { zh: "len 0", en: "len 0" },
  legendToken: { zh: "真实 token（颜色 = 请求）", en: "real token (color = request)" },
  legendPad: { zh: "padding token", en: "padding token" },
  legendUnused: { zh: "更大 bucket，未用", en: "larger bucket, unused" },
} satisfies Record<string, Localized>;

export interface PadScenario {
  id: string;
  label: Localized;
  /** 每个请求的 token 数 */
  reqs: number[];
}

export const PAD_SCENARIOS: PadScenario[] = [
  { id: "short", label: { zh: "三个短请求", en: "Three short requests" }, reqs: [6, 5, 4] },
  { id: "mixed", label: { zh: "长短混合", en: "Mixed lengths" }, reqs: [18, 7, 3] },
  { id: "single", label: { zh: "一个长请求", en: "One long request" }, reqs: [30] },
  { id: "overflow", label: { zh: "5 个请求", en: "Five requests" }, reqs: [3, 3, 3, 2, 2] },
];

export const PAD_BUCKETS = [16, 32, 64];
export const PAD_SLOTS = 4;

export function padBucketStat(locale: Locale, bucket: number, pad: number): string {
  return locale === "zh"
    ? `bucket = ${bucket} · pad token ×${pad}`
    : `bucket = ${bucket} · ${pad} pad tokens`;
}

export function padSentinelStat(locale: Locale, n: number): string {
  return locale === "zh" ? `sentinel 槽 ×${n}` : `${n} sentinel slots`;
}

export function padFallback(locale: Locale, reqs: number, slots: number): string {
  return locale === "zh"
    ? `请求 ${reqs} 个 > 槽位 ${slots} 个 → 回退 eager`
    : `${reqs} requests > ${slots} slots → falls back to eager`;
}

export function padSlotLabel(locale: Locale, id: number, len: number): string {
  return locale === "zh" ? `R${id} · ${len} tok` : `R${id} · ${len} tok`;
}

/* ---------------- ReplayBenchViz ---------------- */

export const BENCH = {
  title: { zh: "Prefill replay 加速图示", en: "Prefill-replay speedup diagram" },
  barsHead: {
    zh: "gpt-oss-120b · TP4 · 4×GB300",
    en: "gpt-oss-120b · TP4 · 4×GB300",
  },
  linesHead: { zh: "prefill-only 延迟（相对）", en: "Prefill-only latency (relative)" },
  eager: { zh: "eager", en: "eager" },
  tc: { zh: "tc_piecewise", en: "tc_piecewise" },
  bcg: { zh: "BCG", en: "BCG" },
  full: { zh: "full", en: "full" },
  xAxis: { zh: "prompt 长度（相对，log）", en: "prompt length (relative, log)" },
  flatNote: { zh: "32× 范围内平坦 = launch-bound", en: "flat across 32× = launch-bound" },
  glmNote: {
    zh: "GLM-5.2：仅 BCG 可捕获，1.60×",
    en: "GLM-5.2: only BCG can capture, 1.60×",
  },
} satisfies Record<string, Localized>;

/* ---------------- MemReuseViz ---------------- */

export const REUSE = {
  title: { zh: "显存复用图示", en: "Memory-reuse diagram" },
  headBefore: { zh: "优化前", en: "Before optimization" },
  headAfter: { zh: "优化后", en: "After optimization" },
  segInt: { zh: "中间结果", en: "intermediates" },
  poolRow: { zh: "共用 pool", en: "shared pool" },
  outRow: { zh: "输出", en: "out" },
  outMaxRow: { zh: "输出 buffer", en: "output buffer" },
  running: { zh: "执行中", en: "running" },
  idle: { zh: "闲置", en: "idle" },
  empty: { zh: "空", en: "empty" },
  stale: { zh: "上次留下的旧数据", en: "stale rows from the last replay" },
  totalBefore: { zh: "常驻总量", en: "resident total" },
  refBefore: { zh: "优化前的总量", en: "total before" },
  saved: { zh: "省下的显存", en: "memory saved" },
  actTag: { zh: "正在写入 / 使用", en: "being written / in use" },
  heldTag: { zh: "占着但没在用", en: "held but idle" },
  outTag: { zh: "输出 buffer 已写入的行", en: "rows written in the output buffer" },
  premiseHead: {
    zh: "前提：capture 了三个 shape，每个都被切成 graph 段 + eager 断点",
    en: "Setup: three shapes are captured, each split into graph segments and eager breaks",
  },
  premiseNote: {
    zh: "e = eager 断点；一次 replay 依次跑完这一行的三个 graph 段",
    en: "e = eager break; one replay runs the row's three graph segments in order",
  },
  graphSeg: { zh: "graph", en: "graph" },
  maxTag: { zh: "max", en: "max" },
  replayHead: {
    zh: "CUDA Graph replay：三个 shape 轮流 replay，方块的位置就是显存地址",
    en: "CUDA Graph replay: the three shapes replay in turn; a block's position is its address",
  },
} satisfies Record<string, Localized>;

/** 时间轴:三次 replay(size3 / size1 / size2),每次三个 segment */
export const REUSE_STEPS: Localized[] = [
  {
    zh: "replay size3 的 seg1。优化前 seg1、seg2、seg3 各有一块地址，优化后只有一块共用 pool。",
    en: "seg1 of the size3 replay. Before, seg1/seg2/seg3 each own an address; after, there is only one shared pool.",
  },
  {
    zh: "seg2：优化后把共用 pool 里的 seg1 擦掉，在同一块地址上写 seg2。优化前 seg1 那块仍占着。",
    en: "seg2: after optimization, seg1 is erased from the shared pool and seg2 is written at the same address. Before, seg1's block is still held.",
  },
  {
    zh: "seg3：共用 pool 再擦一次。这次 replay 的输出写进输出 buffer，size3 写满全部行。",
    en: "seg3: the shared pool is erased once more. This replay's output goes into the output buffer — size3 fills every row.",
  },
  {
    zh: "换 size1 再 replay 的 seg1：共用 pool 又被擦掉重写。",
    en: "seg1 of the size1 replay: the shared pool is erased and rewritten again.",
  },
  { zh: "seg2：同一块地址，再擦一次。", en: "seg2: same address, erased once more." },
  {
    zh: "seg3：输出仍从第 0 行写起，size1 只写前面一小截，后面是上次留下的旧数据。",
    en: "seg3: the output still starts at row 0 — size1 writes only a short prefix, and the rest is stale data from last time.",
  },
  {
    zh: "换 size2 再 replay 的 seg1。优化前此时三块中间结果、三块输出都占着。",
    en: "seg1 of the size2 replay. Before optimization, three intermediate blocks and three output buffers are all held by now.",
  },
  { zh: "seg2：共用 pool 再擦一次。", en: "seg2: the shared pool is erased once more." },
  {
    zh: "seg3：输出第三次从第 0 行写起。全程只有一块 pool、一块输出 buffer。",
    en: "seg3: the output is written from row 0 a third time. One pool and one output buffer throughout.",
  },
];

/* ---------------- MemoryCeilingViz ---------------- */

export const MEM = {
  title: { zh: "Capture 天花板图示", en: "Capture-ceiling diagram" },
  subtitle: {
    zh: "prefill 显存对 no-graph baseline 的增量",
    en: "prefill memory vs the no-graph baseline",
  },
  modelsAria: { zh: "切换模型", en: "Switch model" },
  colBaseline: { zh: "无 graph", en: "no graphs" },
  colBelow: { zh: "天花板 < chunk", en: "ceiling < chunk" },
  colAt: { zh: "捕到 chunk size", en: "through chunk size" },
  legendPeak: { zh: "eager activation 峰值（瞬态）", en: "eager activation peak (transient)" },
  legendResident: { zh: "graph 常驻显存", en: "resident graph memory" },
  baselineMark: { zh: "no-graph baseline", en: "no-graph baseline" },
  schematicNote: {
    zh: "峰值与差值为实测，常驻切分为示意",
    en: "peaks and deltas measured; resident split schematic",
  },
} satisfies Record<string, Localized>;

export interface MemModel {
  id: string;
  label: string;
  /** GB */
  basePeak: number;
  belowResident: number;
  atPeak: number;
  atResident: number;
  /** 捕到 chunk size 后,总量低于 baseline 的差值(GB) */
  saving: number;
}

export const MEM_MODELS: MemModel[] = [
  {
    id: "gpt-oss-120b",
    label: "gpt-oss-120b",
    basePeak: 0.56,
    belowResident: 0.04,
    atPeak: 0.001,
    atResident: 0.05,
    saving: 0.51,
  },
  {
    id: "glm-5.2",
    label: "GLM-5.2",
    basePeak: 1.55,
    belowResident: 0.08,
    atPeak: 0.35,
    atResident: 0.1,
    saving: 1.1,
  },
];

export function memPeak(locale: Locale, gb: number): string {
  const v = gb < 0.01 ? gb.toFixed(3) : gb.toFixed(2);
  return locale === "zh" ? `峰值 ${v} GB` : `peak ${v} GB`;
}

export function memDelta(locale: Locale, delta: number): string {
  const sign = delta >= 0 ? "+" : "−";
  const v = Math.abs(delta).toFixed(2);
  return locale === "zh"
    ? `对 baseline ${sign}${v} GB`
    : `${sign}${v} GB vs baseline`;
}
