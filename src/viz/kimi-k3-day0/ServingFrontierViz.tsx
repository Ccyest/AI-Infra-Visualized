import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import "./styles.css";

const COPY = {
  zh: {
    title: "部署取舍图",
    context: "GB300 · 8K input / 1K output · PD disaggregation",
    aggregateTitle: "整机效率（tok/s/GPU）",
    perUserTitle: "单用户速度（tok/s/user）",
    throughput: "总吞吐",
    throughputValue: "2,808",
    throughputDetail: "PP8 prefill → TP8 decode · FP4",
    dcp: "长上下文",
    dcpValue: "2,633",
    dcpDetail: "2×PP8 prefill → 2×DCP8 decode",
    interactive: "单用户",
    interactiveValue: "116+",
    interactiveDetail: "增加独立 TP8 decode instances",
    throughputUserValue: "18.7",
    throughputUserDetail: "总吞吐配置",
    knobLeft: "总吞吐优先",
    knob: "增加 decode 实例 →",
    knobRight: "单用户优先",
    goalControl: "部署目标",
    goalThroughput: "总吞吐",
    goalDcp: "长上下文",
    goalInteractive: "交互速度",
    goalThroughputDetail: "2,808 tok/s/GPU；单用户 18.7 tok/s。",
    goalDcpDetail: "2,633 tok/s/GPU，换取更大的 KV 容量。",
    goalInteractiveDetail: "增加独立 TP8 decode instances，达到 116+ tok/s/user。",
  },
  en: {
    title: "Deployment trade-offs",
    context: "GB300 · 8K input / 1K output · PD disaggregation",
    aggregateTitle: "System efficiency (tok/s/GPU)",
    perUserTitle: "Per-user speed (tok/s/user)",
    throughput: "Total throughput",
    throughputValue: "2,808",
    throughputDetail: "PP8 prefill → TP8 decode · FP4",
    dcp: "Long context",
    dcpValue: "2,633",
    dcpDetail: "2×PP8 prefill → 2×DCP8 decode",
    interactive: "Per user",
    interactiveValue: "116+",
    interactiveDetail: "add independent TP8 decode instances",
    throughputUserValue: "18.7",
    throughputUserDetail: "throughput configuration",
    knobLeft: "throughput first",
    knob: "add decode instances →",
    knobRight: "per-user speed first",
    goalControl: "Deployment goal",
    goalThroughput: "Throughput",
    goalDcp: "Long context",
    goalInteractive: "Interactivity",
    goalThroughputDetail: "2,808 tok/s/GPU; 18.7 tok/s/user.",
    goalDcpDetail: "2,633 tok/s/GPU in exchange for more KV capacity.",
    goalInteractiveDetail: "Add independent TP8 decode instances to reach 116+ tok/s/user.",
  },
} as const;

type DeploymentGoal = "throughput" | "dcp" | "interactive";

function MetricBar({ label, detail, value, width, tone, selected }: { label: string; detail: string; value: string; width: string; tone: "throughput" | "dcp" | "interactive"; selected: boolean }) {
  return (
    <div className={`serving-metric-row${selected ? " selected" : " dimmed"}`}>
      <span><b>{label}</b><small>{detail}</small></span>
      <i><u className={tone} style={{ width }} /></i>
      <output>{value}</output>
    </div>
  );
}

export default function ServingFrontierViz({ lang = "zh" }: { lang?: Locale }) {
  const copy = COPY[lang];
  const [goal, setGoal] = useState<DeploymentGoal>("throughput");
  const goals: { detail: string; id: DeploymentGoal; label: string }[] = [
    { detail: copy.goalThroughputDetail, id: "throughput", label: copy.goalThroughput },
    { detail: copy.goalDcpDetail, id: "dcp", label: copy.goalDcp },
    { detail: copy.goalInteractiveDetail, id: "interactive", label: copy.goalInteractive },
  ];
  const selectedGoal = goals.find((item) => item.id === goal) ?? goals[0];
  return (
    <figure className="viz-stage serving-perf" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{copy.title}</span>
        <span className="viz-subtitle">{copy.context}</span>
      </div>
      <div className="serving-source-grid serving-source-single">
        <section className="serving-source-card serving-frontier-card">
          <div className="serving-goal-control" role="group" aria-label={copy.goalControl}>
            <span>{copy.goalControl}</span>
            {goals.map((item) => (
              <button
                className={`viz-btn${goal === item.id ? " primary" : ""}`}
                type="button"
                key={item.id}
                aria-pressed={goal === item.id}
                onClick={() => setGoal(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="serving-metric-panels" role="img" aria-label={`${copy.aggregateTitle}; ${copy.perUserTitle}`}>
            <section>
              <h4>{copy.aggregateTitle}</h4>
              <MetricBar label={copy.throughput} detail={copy.throughputDetail} value={copy.throughputValue} width="100%" tone="throughput" selected={goal === "throughput"} />
              <MetricBar label={copy.dcp} detail={copy.dcpDetail} value={copy.dcpValue} width="93.8%" tone="dcp" selected={goal === "dcp"} />
            </section>
            <section>
              <h4>{copy.perUserTitle}</h4>
              <MetricBar label={copy.throughput} detail={copy.throughputUserDetail} value={copy.throughputUserValue} width="16.1%" tone="throughput" selected={goal === "throughput"} />
              <MetricBar label={copy.interactive} detail={copy.interactiveDetail} value={copy.interactiveValue} width="100%" tone="interactive" selected={goal === "interactive"} />
            </section>
          </div>
          <div className="serving-deployment-knob"><span>{copy.knobLeft}</span><b>{copy.knob}</b><span>{copy.knobRight}</span></div>
          <output className="serving-goal-detail"><b>{selectedGoal.label}{lang === "zh" ? "：" : ": "}</b>{selectedGoal.detail}</output>
        </section>
      </div>
    </figure>
  );
}
