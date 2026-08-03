import type { Locale } from "../../lib/i18n";
import "./styles.css";

const KERNEL_STEPS = [44.3, 53.2, 61.9, 62.4, 64.2, 65.3, 71.0, 72.0, 74.5, 84.3, 85.2, 90.2, 92.0, 108.0, 111.4, 112.5];

const COPY = {
  zh: {
    title: "K3 serving 实测：先缩短 decode 单步，再沿 frontier 选部署点",
    subtitle: "直接对应 LMSYS 原文的两张图；不同测试口径分开呈现",
    kernelTitle: "BS=1 非投机 decode：15 轮优化",
    kernelContext: "8×GB300 · TP8 · BF16 KV cache",
    kernelGain: "44.3 → 112.5 tok/s（+154%，2.54×）",
    start: "P0",
    end: "P15",
    dsparkTitle: "再叠加 DSpark 投机解码",
    dsparkFrom: "112.5 tok/s",
    dsparkTo: "约 423 tok/s",
    dsparkGain: "约 3.7× non-speculative",
    dsparkNote: "不是让单个 kernel 快 3.7×，而是让 target 一步验证并接收多个 draft tokens。",
    frontierTitle: "PD disaggregation serving frontier",
    frontierContext: "GB300 · 8K input / 1K output · 69 个实测点",
    yAxis: "整机吞吐更高",
    xAxis: "每用户 decode 更快",
    throughput: "吞吐端",
    throughputValue: "2,808 tok/s/GPU",
    throughputDetail: "18.7 tok/s/user · PP8 prefill → TP8 decode · FP4",
    dcp: "长上下文折中",
    dcpValue: "2,633 tok/s/GPU",
    dcpDetail: "2×PP8 prefill → 2×DCP8 decode",
    interactive: "交互端",
    interactiveValue: "116+ tok/s/user",
    interactiveDetail: "增加独立 TP8 decode instances",
    frontierNote: "曲线只表达原文的 Pareto 方向；标注数字是原文实测锚点。增加 decode instances，会牺牲 aggregate throughput，换取更高的单用户速度。",
    criticalTitle: "原文的优化判断",
    critical: "关键路径 AllReduce：省 1 μs，step 约省 1 μs",
    overlap: "藏在 overlap slack 的 kernel：省 1 μs，step 约省 0.1 μs",
  },
  en: {
    title: "Measured K3 serving: shorten decode, then choose a point on the frontier",
    subtitle: "Mapped directly to the two LMSYS figures; unlike denominators stay separate",
    kernelTitle: "BS=1 non-speculative decode: 15 optimization rounds",
    kernelContext: "8×GB300 · TP8 · BF16 KV cache",
    kernelGain: "44.3 → 112.5 tok/s (+154%, 2.54×)",
    start: "P0",
    end: "P15",
    dsparkTitle: "Then add DSpark speculative decoding",
    dsparkFrom: "112.5 tok/s",
    dsparkTo: "~423 tok/s",
    dsparkGain: "~3.7× non-speculative",
    dsparkNote: "This does not make one kernel 3.7× faster; the target verifies and accepts several draft tokens in one step.",
    frontierTitle: "PD-disaggregated serving frontier",
    frontierContext: "GB300 · 8K input / 1K output · 69 measured points",
    yAxis: "higher aggregate throughput",
    xAxis: "faster per-user decode",
    throughput: "Throughput end",
    throughputValue: "2,808 tok/s/GPU",
    throughputDetail: "18.7 tok/s/user · PP8 prefill → TP8 decode · FP4",
    dcp: "Long-context balance",
    dcpValue: "2,633 tok/s/GPU",
    dcpDetail: "2×PP8 prefill → 2×DCP8 decode",
    interactive: "Interactive end",
    interactiveValue: "116+ tok/s/user",
    interactiveDetail: "add independent TP8 decode instances",
    frontierNote: "The curve only conveys the Pareto direction in the source figure; labels are measured anchors. More decode instances trade aggregate throughput for per-user speed.",
    criticalTitle: "The source's optimization rule",
    critical: "Critical-path AllReduce: save 1 μs, and the step saves ~1 μs",
    overlap: "Kernel inside overlap slack: save 1 μs, and the step saves ~0.1 μs",
  },
} as const;

function KernelLadder({ lang }: { lang: Locale }) {
  const copy = COPY[lang];
  const x = (index: number) => 34 + (index / (KERNEL_STEPS.length - 1)) * 360;
  const y = (value: number) => 148 - ((value - 40) / 80) * 116;
  const points = KERNEL_STEPS.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const milestones = new Set([0, 4, 9, 15]);
  return (
    <section className="serving-source-card serving-kernel-card">
      <h3>{copy.kernelTitle}</h3>
      <small>{copy.kernelContext}</small>
      <svg className="serving-kernel-chart" viewBox="0 0 430 184" role="img" aria-label={copy.kernelGain}>
        <title>{copy.kernelGain}</title>
        {[40, 80, 120].map((tick) => (
          <g key={tick}>
            <line x1="34" x2="402" y1={y(tick)} y2={y(tick)} className="serving-chart-grid" />
            <text x="5" y={y(tick) + 4} className="serving-chart-muted">{tick}</text>
          </g>
        ))}
        <polyline points={points} className="serving-kernel-line" />
        {KERNEL_STEPS.map((value, index) => (
          <circle key={index} cx={x(index)} cy={y(value)} r={milestones.has(index) ? 4.2 : 2.3} className={index === 0 || index === 15 ? "serving-kernel-endpoint" : "serving-kernel-point"} />
        ))}
        <text x={x(0)} y={y(KERNEL_STEPS[0]) - 10} textAnchor="middle" className="serving-chart-value">44.3</text>
        <text x={x(15)} y={y(KERNEL_STEPS[15]) - 10} textAnchor="end" className="serving-chart-value">112.5</text>
        <text x={x(0)} y="174" textAnchor="middle" className="serving-chart-muted">{copy.start}</text>
        <text x={x(15)} y="174" textAnchor="middle" className="serving-chart-muted">{copy.end}</text>
        <text x="215" y="181" textAnchor="middle" className="serving-chart-muted">{copy.kernelGain}</text>
      </svg>
      <div className="serving-dspark-jump">
        <span><b>{copy.dsparkTitle}</b><small>{copy.dsparkNote}</small></span>
        <strong>{copy.dsparkFrom}</strong><i>→</i><strong>{copy.dsparkTo}</strong><em>{copy.dsparkGain}</em>
      </div>
    </section>
  );
}

function FrontierChart({ lang }: { lang: Locale }) {
  const copy = COPY[lang];
  return (
    <section className="serving-source-card serving-frontier-card">
      <h3>{copy.frontierTitle}</h3>
      <small>{copy.frontierContext}</small>
      <div className="serving-frontier-plot" role="img" aria-label={`${copy.throughputValue}; ${copy.interactiveValue}`}>
        <span className="serving-frontier-y">↑ {copy.yAxis}</span>
        <svg viewBox="0 0 470 225" aria-hidden="true">
          <line x1="50" y1="18" x2="50" y2="190" className="serving-frontier-axis" />
          <line x1="50" y1="190" x2="448" y2="190" className="serving-frontier-axis" />
          <path d="M 82 42 C 135 58, 172 89, 220 112 S 338 154, 420 174" className="serving-frontier-curve" />
          <circle cx="82" cy="42" r="6" className="serving-frontier-throughput" />
          <circle cx="118" cy="55" r="6" className="serving-frontier-dcp" />
          <circle cx="420" cy="174" r="6" className="serving-frontier-interactive" />
          <g transform="translate(118 8)">
            <text className="serving-chart-label">{copy.throughput}</text>
            <text y="17" className="serving-chart-value">{copy.throughputValue}</text>
            <text y="33" className="serving-chart-muted">{copy.throughputDetail}</text>
          </g>
          <g transform="translate(148 82)">
            <text className="serving-chart-label">{copy.dcp}</text>
            <text y="17" className="serving-chart-value">{copy.dcpValue}</text>
            <text y="33" className="serving-chart-muted">{copy.dcpDetail}</text>
          </g>
          <g transform="translate(245 153)">
            <text className="serving-chart-label">{copy.interactive}</text>
            <text y="17" className="serving-chart-value">{copy.interactiveValue}</text>
            <text y="33" className="serving-chart-muted">{copy.interactiveDetail}</text>
          </g>
        </svg>
        <span className="serving-frontier-x">{copy.xAxis} →</span>
      </div>
      <p>{copy.frontierNote}</p>
    </section>
  );
}

export default function ServingPerfViz({ lang = "zh" }: { lang?: Locale }) {
  const copy = COPY[lang];
  return (
    <figure className="viz-stage serving-perf" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{copy.title}</span>
        <span className="viz-subtitle">{copy.subtitle}</span>
      </div>
      <div className="serving-source-grid">
        <KernelLadder lang={lang} />
        <FrontierChart lang={lang} />
      </div>
      <section className="serving-critical-path">
        <b>{copy.criticalTitle}</b>
        <span><i className="full" /><em>{copy.critical}</em></span>
        <span><i className="tenth" /><em>{copy.overlap}</em></span>
      </section>
    </figure>
  );
}
