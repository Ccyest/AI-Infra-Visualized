import type { Locale } from "../../lib/i18n";
import "./styles.css";

const DECODE_MAX = 423;

const COPY = {
  zh: {
    title: "K3 serving 数字：先缩短单步，再选择吞吐或交互速度",
    subtitle: "不同口径分开画：左边是 BS=1 decode；右边是 PD disaggregation 的 serving frontier",
    decodeTitle: "BS=1 decode ladder",
    baseline: "Bring-up 基线",
    optimized: "15 轮 kernel / 通信优化后",
    dspark: "+ DSpark 投机解码",
    baselineNote: "63.8 tok/s",
    optimizedNote: "约 113 tok/s · 1.8× baseline",
    dsparkNote: "约 423 tok/s · 3.7× non-speculative",
    decodeFoot: "DSpark 不是把单个 kernel 再加速 3.7×，而是让 target 一次验证并接收多个 draft tokens。",
    frontierTitle: "PD disaggregation serving frontier",
    throughputMode: "吞吐优先",
    throughputTopology: "1× PP8 prefill → 1× TP8 decode",
    throughputValue: "2,808",
    throughputUnit: "tok/s/GPU（FP4）",
    dcpMode: "长上下文折中",
    dcpTopology: "2× PP8 prefill → 2× DCP8 decode",
    dcpValue: "2,633",
    dcpUnit: "tok/s/GPU",
    interactiveMode: "交互优先",
    interactiveTopology: "1× prefill → 3× independent TP8 decode",
    interactiveValue: "116+",
    interactiveUnit: "tok/s/user",
    frontierFoot: "这些数字不是同一根柱子的同一单位：增加 decode instances 会牺牲整机 aggregate throughput，换取每个用户更高的 decode 速度。",
    criticalTitle: "为什么先优化 AllReduce",
    critical: "关键路径 AllReduce",
    criticalValue: "省 1 μs → step 约省 1 μs",
    overlap: "藏在 overlap slack 的 kernel",
    overlapValue: "省 1 μs → step 约省 0.1 μs",
  },
  en: {
    title: "K3 serving numbers: shorten one step, then choose throughput or interactivity",
    subtitle: "Separate denominators: BS=1 decode on the left; the PD-disaggregated serving frontier on the right",
    decodeTitle: "BS=1 decode ladder",
    baseline: "Bring-up baseline",
    optimized: "After 15 kernel and communication rounds",
    dspark: "+ DSpark speculative decoding",
    baselineNote: "63.8 tok/s",
    optimizedNote: "~113 tok/s · 1.8× baseline",
    dsparkNote: "~423 tok/s · 3.7× non-speculative",
    decodeFoot: "DSpark does not make one kernel 3.7× faster; it lets the target verify and accept several draft tokens in one step.",
    frontierTitle: "PD-disaggregated serving frontier",
    throughputMode: "Throughput-first",
    throughputTopology: "1× PP8 prefill → 1× TP8 decode",
    throughputValue: "2,808",
    throughputUnit: "tok/s/GPU (FP4)",
    dcpMode: "Long-context balance",
    dcpTopology: "2× PP8 prefill → 2× DCP8 decode",
    dcpValue: "2,633",
    dcpUnit: "tok/s/GPU",
    interactiveMode: "Interactive-first",
    interactiveTopology: "1× prefill → 3× independent TP8 decode",
    interactiveValue: "116+",
    interactiveUnit: "tok/s/user",
    frontierFoot: "These are not bars with the same denominator. Adding decode instances trades aggregate system throughput for higher per-user decode speed.",
    criticalTitle: "Why AllReduce comes first",
    critical: "Critical-path AllReduce",
    criticalValue: "save 1 μs → step saves ~1 μs",
    overlap: "Kernel hidden in overlap slack",
    overlapValue: "save 1 μs → step saves ~0.1 μs",
  },
} as const;

function DecodeBar({ label, note, value, tone }: { label: string; note: string; value: number; tone: "base" | "optimized" | "dspark" }) {
  return (
    <div className="serving-decode-row">
      <div><b>{label}</b><small>{note}</small></div>
      <span className="serving-decode-track"><i className={tone} style={{ width: `${(value / DECODE_MAX) * 100}%` }} /></span>
      <output>{value}</output>
    </div>
  );
}

function FrontierPoint({ kind, title, topology, value, unit }: { kind: string; title: string; topology: string; value: string; unit: string }) {
  return (
    <div className={`serving-frontier-point ${kind}`}>
      <span>{title}</span>
      <small>{topology}</small>
      <b>{value}</b>
      <em>{unit}</em>
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

      <div className="serving-perf-grid">
        <section className="serving-perf-card">
          <h3>{copy.decodeTitle}</h3>
          <DecodeBar label={copy.baseline} note={copy.baselineNote} value={63.8} tone="base" />
          <DecodeBar label={copy.optimized} note={copy.optimizedNote} value={113} tone="optimized" />
          <DecodeBar label={copy.dspark} note={copy.dsparkNote} value={423} tone="dspark" />
          <p>{copy.decodeFoot}</p>
        </section>

        <section className="serving-perf-card">
          <h3>{copy.frontierTitle}</h3>
          <div className="serving-frontier">
            <FrontierPoint kind="throughput" title={copy.throughputMode} topology={copy.throughputTopology} value={copy.throughputValue} unit={copy.throughputUnit} />
            <i>→</i>
            <FrontierPoint kind="dcp" title={copy.dcpMode} topology={copy.dcpTopology} value={copy.dcpValue} unit={copy.dcpUnit} />
            <i>→</i>
            <FrontierPoint kind="interactive" title={copy.interactiveMode} topology={copy.interactiveTopology} value={copy.interactiveValue} unit={copy.interactiveUnit} />
          </div>
          <p>{copy.frontierFoot}</p>
        </section>
      </div>

      <section className="serving-critical-path">
        <b>{copy.criticalTitle}</b>
        <span><em>{copy.critical}</em><i className="full" /><strong>{copy.criticalValue}</strong></span>
        <span><em>{copy.overlap}</em><i className="tenth" /><strong>{copy.overlapValue}</strong></span>
      </section>
    </figure>
  );
}
