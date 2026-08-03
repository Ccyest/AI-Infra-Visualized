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
    frontierTitle: "两种单位，分开比较",
    frontierContext: "GB300 · 8K input / 1K output",
    aggregateTitle: "整机效率（tok/s/GPU）",
    perUserTitle: "单用户速度（tok/s/user）",
    throughput: "吞吐端",
    throughputValue: "2,808",
    throughputDetail: "PP8 prefill → TP8 decode · FP4",
    dcp: "长上下文折中",
    dcpValue: "2,633",
    dcpDetail: "2×PP8 prefill → 2×DCP8 decode",
    interactive: "交互端",
    interactiveValue: "116+",
    interactiveDetail: "增加独立 TP8 decode instances",
    throughputUserValue: "18.7",
    throughputUserDetail: "吞吐端配置中的单用户速度",
    knobLeft: "更强 batching · 总吞吐优先",
    knob: "增加独立 decode instances →",
    knobRight: "更少 batching · 单用户优先",
    noCross: "不要跨面板比数字：",
    frontierNote: "上面只比较每 GPU 总吞吐，下面只比较每用户速度；116+ 不是从 2,808 降下来，而是另一个单位下从 18.7 提高到 116+。",
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
    frontierTitle: "Two units, compared separately",
    frontierContext: "GB300 · 8K input / 1K output",
    aggregateTitle: "System efficiency (tok/s/GPU)",
    perUserTitle: "Per-user speed (tok/s/user)",
    throughput: "Throughput end",
    throughputValue: "2,808",
    throughputDetail: "PP8 prefill → TP8 decode · FP4",
    dcp: "Long-context balance",
    dcpValue: "2,633",
    dcpDetail: "2×PP8 prefill → 2×DCP8 decode",
    interactive: "Interactive end",
    interactiveValue: "116+",
    interactiveDetail: "add independent TP8 decode instances",
    throughputUserValue: "18.7",
    throughputUserDetail: "per-user speed at the throughput endpoint",
    knobLeft: "stronger batching · throughput-first",
    knob: "add independent decode instances →",
    knobRight: "less batching · user-first",
    noCross: "Do not compare across panels: ",
    frontierNote: "the upper panel compares total throughput per GPU; the lower panel compares speed per user. 116+ is not a drop from 2,808—it is a rise from 18.7 under a different unit.",
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
      <div className="serving-metric-panels" role="img" aria-label={`${copy.aggregateTitle}; ${copy.perUserTitle}`}>
        <section>
          <h4>{copy.aggregateTitle}</h4>
          <MetricBar label={copy.throughput} detail={copy.throughputDetail} value={copy.throughputValue} width="100%" tone="throughput" />
          <MetricBar label={copy.dcp} detail={copy.dcpDetail} value={copy.dcpValue} width="93.8%" tone="dcp" />
        </section>
        <section>
          <h4>{copy.perUserTitle}</h4>
          <MetricBar label={copy.throughput} detail={copy.throughputUserDetail} value={copy.throughputUserValue} width="16.1%" tone="throughput" />
          <MetricBar label={copy.interactive} detail={copy.interactiveDetail} value={copy.interactiveValue} width="100%" tone="interactive" />
        </section>
      </div>
      <div className="serving-deployment-knob"><span>{copy.knobLeft}</span><b>{copy.knob}</b><span>{copy.knobRight}</span></div>
      <p><b>{copy.noCross}</b>{copy.frontierNote}</p>
    </section>
  );
}

function MetricBar({ label, detail, value, width, tone }: { label: string; detail: string; value: string; width: string; tone: "throughput" | "dcp" | "interactive" }) {
  return (
    <div className="serving-metric-row">
      <span><b>{label}</b><small>{detail}</small></span>
      <i><u className={tone} style={{ width }} /></i>
      <output>{value}</output>
    </div>
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
