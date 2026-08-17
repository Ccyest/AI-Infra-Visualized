import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import "./styles.css";

const POSITIONS = 12;
const GPU_OPTIONS = [2, 4, 8] as const;

const COPY = {
  zh: {
    title: "DCP 图示",
    subtitle: "同一段 12-token MLA context；上面是 naive TP，下面是 DCP",
    problem: "问题",
    solution: "解决",
    tpTitle: "Naive TP：每张卡都保存完整 MLA KV latent",
    tpIntro: "MLA 虽然有多个 attention heads，但所有 heads 共享同一份压缩 KV latent，cache 没有可供 TP 按 head 切分的轴。TP{n} 因而在 {n} 卡上复制这份 KV latent；GPU 变多了，逻辑上下文容量却没有变大。",
    dcpTitle: "DCP：(token position − 1) mod N 决定 KV 存在哪张 GPU",
    dcpIntro: "Query 很小，复制给所有 GPU；长而占显存的 KV 按 token 位置轮转分片，每个位置只存一份。",
    gpu: "GPU",
    token: "T",
    position: "token 位置",
    sameContext: "同一段 12-token context",
    gpuControl: "并行 GPU 数 N",
    tpCopies: "物理 KV cells：{cells}（复制 {n}×）",
    dcpCopies: "物理 KV cells：12（每位置仅 1 份）",
    sameMemory: "同样 {cells}-cell 显存：逻辑容量 12 → {capacity} tokens",
    localShare: "每卡只扫约 1/{n} KV",
    flowTitle: "一次 MLA decode 为什么仍然精确",
    step1: "① 各 GPU 本地生成完整 q",
    step1Note: "q 很小，无需广播",
    step2: "② 各 GPU 本地 attention",
    step2Note: "只扫自己 1/N 的 KV",
    step3: "③ 一次 packed all-to-all",
    step3Note: "交换 partial output + LSE",
    step4: "④ LSE 精确合并",
    step4Note: "结果与完整 softmax 一致",
    stored: "实色 = 该 GPU 保存",
    empty: "空框 = 此位置在其他 GPU",
  },
  en: {
    title: "DCP diagram",
    subtitle: "The same 12-token MLA context; naive TP above, DCP below",
    problem: "Problem",
    solution: "Solution",
    tpTitle: "Naive TP: every GPU stores the complete MLA KV latent",
    tpIntro: "MLA has multiple attention heads, but they all share the same compressed KV latent, leaving no cache head axis for TP to shard. TP{n} therefore replicates this KV latent on all {n} GPUs: more GPUs do not increase logical context capacity.",
    dcpTitle: "DCP: (token position − 1) mod N decides which GPU owns each KV",
    dcpIntro: "The small query is replicated to all GPUs; the long, memory-heavy KV is striped round-robin by token position, with each position stored once.",
    gpu: "GPU",
    token: "T",
    position: "token position",
    sameContext: "The same 12-token context",
    gpuControl: "Parallel GPUs N",
    tpCopies: "Physical KV cells: {cells} ({n}× replicated)",
    dcpCopies: "Physical KV cells: 12 (one copy per position)",
    sameMemory: "With the same {cells}-cell memory: 12 → {capacity} logical tokens",
    localShare: "Each GPU scans about 1/{n} of KV",
    flowTitle: "Why one MLA decode step remains exact",
    step1: "① Project the full q locally",
    step1Note: "q is small; no broadcast",
    step2: "② Local attention per GPU",
    step2Note: "scan only 1/N of KV",
    step3: "③ One packed all-to-all",
    step3Note: "exchange partial output + LSE",
    step4: "④ Exact LSE merge",
    step4Note: "matches the full softmax result",
    stored: "filled = stored on this GPU",
    empty: "outline = owned by another GPU",
  },
} as const;

function interpolate(template: string, values: Record<string, number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function KvGrid({ gpuCount, mode, lang }: { gpuCount: number; mode: "tp" | "dcp"; lang: Locale }) {
  const copy = COPY[lang];
  return (
    <div className={`dcp-kv-grid ${mode}`}>
      <div className="dcp-position-axis">
        <span />
        {Array.from({ length: POSITIONS }, (_, position) => (
          <b key={position} title={`${copy.position} ${position + 1}`}>{copy.token}{position + 1}</b>
        ))}
      </div>
      {Array.from({ length: gpuCount }, (_, gpu) => (
        <div className="dcp-kv-row" key={gpu}>
          <b>{copy.gpu} {gpu + 1}</b>
          {Array.from({ length: POSITIONS }, (_, position) => {
            const stored = mode === "tp" || position % gpuCount === gpu;
            return (
              <i
                className={stored ? "stored" : "empty"}
                key={position}
                style={stored ? { background: seriesColor((position % 7) + 1) } : undefined}
                title={stored ? `${copy.position} ${position + 1}` : copy.empty}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function FlowStep({ title, note }: { title: string; note: string }) {
  return <span className="dcp-flow-step"><b>{title}</b><small>{note}</small></span>;
}

export default function DcpViz({ lang = "zh" }: { lang?: Locale }) {
  const copy = COPY[lang];
  const [gpuCount, setGpuCount] = useState<number>(4);
  const physicalCells = POSITIONS * gpuCount;
  const values = { capacity: physicalCells, cells: physicalCells, n: gpuCount };
  return (
    <figure className="viz-stage dcp-explainer" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{copy.title}</span>
        <span className="viz-subtitle">{copy.subtitle}</span>
      </div>

      <div className="dcp-gpu-control" role="group" aria-label={copy.gpuControl}>
        <span>{copy.gpuControl}</span>
        {GPU_OPTIONS.map((option) => (
          <button
            className={`viz-btn${gpuCount === option ? " primary" : ""}`}
            type="button"
            key={option}
            aria-pressed={gpuCount === option}
            onClick={() => setGpuCount(option)}
          >
            {option}
          </button>
        ))}
        <output>{interpolate(copy.localShare, values)}</output>
      </div>

      <div className="dcp-compare-stack">
        <section className="parallel-card problem">
          <div className="parallel-card-head"><span>{copy.problem}</span><b>{copy.tpTitle}</b></div>
          <p>{interpolate(copy.tpIntro, values)}</p>
          <KvGrid gpuCount={gpuCount} mode="tp" lang={lang} />
          <div className="dcp-grid-summary"><span>{copy.sameContext}</span><b>{interpolate(copy.tpCopies, values)}</b></div>
        </section>

        <div className="parallel-down-arrow" aria-hidden="true">↓</div>

        <section className="parallel-card solution">
          <div className="parallel-card-head"><span>{copy.solution}</span><b>{copy.dcpTitle}</b></div>
          <p>{copy.dcpIntro}</p>
          <KvGrid gpuCount={gpuCount} mode="dcp" lang={lang} />
          <div className="dcp-grid-summary"><span>{copy.dcpCopies}</span><b>{interpolate(copy.sameMemory, values)}</b></div>
        </section>
      </div>

      <section className="dcp-exact-flow">
        <b className="dcp-exact-title">{copy.flowTitle}</b>
        <div className="dcp-flow-steps">
          <FlowStep title={copy.step1} note={copy.step1Note} />
          <i>→</i>
          <FlowStep title={copy.step2} note={copy.step2Note} />
          <i>→</i>
          <FlowStep title={copy.step3} note={copy.step3Note} />
          <i>→</i>
          <FlowStep title={copy.step4} note={copy.step4Note} />
        </div>
      </section>

      <div className="dcp-inline-legend"><span><i className="stored" />{copy.stored}</span><span><i className="empty" />{copy.empty}</span></div>
    </figure>
  );
}
