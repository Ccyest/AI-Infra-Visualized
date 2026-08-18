import { useState } from "react";
import type { ReactNode } from "react";
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
    tpTitle: "Naive TP：每张卡都存一份完整 KV",
    tpIntro: "MLA 虽然有多个 attention heads，但所有 heads 共享同一份压缩 KV latent，cache 没有可供 TP 按 head 切分的轴。TP{n} 因而在 {n} 卡上复制这份 KV latent；GPU 变多了，逻辑上下文容量却没有变大。",
    dcpTitle: "DCP：KV 按 token 位置轮流分到各卡",
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
    step3Note: "每段只有 o 的 1/N",
    step4: "④ 按 LSE 加权合并",
    step4Note: "结果与完整 softmax 一致",
    stored: "实色 = 该 GPU 保存",
    empty: "空框 = 此位置在其他 GPU",
  },
  en: {
    title: "DCP diagram",
    subtitle: "The same 12-token MLA context; naive TP above, DCP below",
    problem: "Problem",
    solution: "Solution",
    tpTitle: "Naive TP: every GPU stores the full KV",
    tpIntro: "MLA has multiple attention heads, but they all share the same compressed KV latent, leaving no cache head axis for TP to shard. TP{n} therefore replicates this KV latent on all {n} GPUs: more GPUs do not increase logical context capacity.",
    dcpTitle: "DCP: KV striped across GPUs by token position",
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
    step3Note: "each segment is 1/N of o",
    step4: "④ LSE-weighted merge",
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

/* 四步流程的简笔图示：与上方网格一致，按 N=4 举例；颜色 = 归哪张卡 */
const ICON_GPUS = [0, 1, 2, 3];
const SUB = ["\u2081", "\u2082", "\u2083", "\u2084"];
const iconRowY = (row: number) => 3 + row * 19;

function FlowIcon1() {
  return (
    <svg className="dcp-flow-icon" viewBox="0 0 128 80" aria-hidden="true">
      {ICON_GPUS.map((row) => (
        <g key={row} transform={`translate(0 ${iconRowY(row)})`}>
          <rect x="6" y="0" width="116" height="15" rx="3" fill="var(--surface)" stroke="var(--border)" />
          <text x="12" y="11" fontSize="7" fill="var(--muted)">G{row + 1}</text>
          <rect x="104" y="2" width="11" height="11" rx="2" fill="var(--accent)" />
          <text x="109.5" y="11" fontSize="7" fill="var(--accent-ink)" textAnchor="middle">q</text>
        </g>
      ))}
    </svg>
  );
}

function FlowIcon2() {
  return (
    <svg className="dcp-flow-icon" viewBox="0 0 128 80" aria-hidden="true">
      {ICON_GPUS.map((row) => (
        <g key={row} transform={`translate(0 ${iconRowY(row)})`}>
          <rect x="6" y="2" width="11" height="11" rx="2" fill="var(--accent)" />
          <text x="11.5" y="11" fontSize="6.5" fill="var(--accent-ink)" textAnchor="middle">q</text>
          {ICON_GPUS.map((c) => {
            const mine = c === row;
            const x = 30 + c * 24;
            return (
              <g key={c}>
                {mine && <path d={`M17 6 Q ${(17 + x) / 2} -4 ${x + 8} 1`} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.55" />}
                <rect x={x} y="1" width="17" height="13" rx="2" fill={mine ? seriesColor(row + 1) : "none"} stroke={mine ? "none" : "var(--grid)"} opacity={mine ? 0.85 : 1} />
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

function FlowIcon3() {
  return (
    <svg className="dcp-flow-icon" viewBox="0 0 128 80" aria-hidden="true">
      {ICON_GPUS.map((row) => (
        <g key={row}>
          <text x="2" y={iconRowY(row) + 10} fontSize="6.5" fill="var(--ink-2)">o{SUB[row]}</text>
          {ICON_GPUS.map((seg) => (
            <rect key={seg} x={13 + seg * 12} y={iconRowY(row) + 1} width="11" height="13" rx="1.5" fill={seriesColor(seg + 1)} opacity="0.85" />
          ))}
          <rect x="84" y={iconRowY(row)} width="40" height="15" rx="3" fill="var(--surface)" stroke="var(--border)" />
          <text x="87" y={iconRowY(row) + 11} fontSize="6" fill="var(--muted)">G{row + 1}</text>
          {ICON_GPUS.map((src) => (
            <rect key={src} x={98 + src * 6.5} y={iconRowY(row) + 2} width="5.5" height="11" rx="1" fill={seriesColor(row + 1)} opacity={0.95 - src * 0.22} />
          ))}
        </g>
      ))}
      {ICON_GPUS.map((dest) => (
        <path
          key={dest}
          d={`M ${18.5 + dest * 12} ${iconRowY(0) + 14} C ${40 + dest * 10} ${iconRowY(0) + 30}, 70 ${iconRowY(dest) + 8}, 83 ${iconRowY(dest) + 8}`}
          fill="none"
          stroke={seriesColor(dest + 1)}
          strokeWidth="1.1"
          opacity="0.75"
        />
      ))}
    </svg>
  );
}

function FlowIcon4() {
  return (
    <svg className="dcp-flow-icon" viewBox="0 0 128 80" aria-hidden="true">
      <defs><marker id="dcp-merge-arrow" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8Z" fill="var(--good)" /></marker></defs>
      {ICON_GPUS.map((row) => (
        <g key={row}>
          <rect x="6" y={iconRowY(row)} width="24" height="14" rx="3" fill={`color-mix(in srgb, ${seriesColor(row + 1)} 30%, var(--surface))`} stroke="var(--border)" />
          <text x="18" y={iconRowY(row) + 10.5} fontSize="7" fill="var(--ink-2)" textAnchor="middle">o{SUB[row]}</text>
          <line x1="32" y1={iconRowY(row) + 7} x2="68" y2={38 + (row - 1.5) * 3} stroke="var(--good)" strokeWidth="1" opacity="0.8" />
          <text x="36" y={iconRowY(row) + 5} fontSize="5.5" fill="var(--ink-2)">{`\u00d7w`}{SUB[row]}</text>
        </g>
      ))}
      <circle cx="79" cy="38" r="10" fill="color-mix(in srgb, var(--good) 18%, var(--surface))" stroke="var(--good)" strokeWidth="1.3" />
      <text x="79" y="41.5" fontSize="9" fill="var(--ink)" textAnchor="middle">Σ</text>
      <line x1="90" y1="38" x2="99" y2="38" stroke="var(--good)" strokeWidth="1.3" markerEnd="url(#dcp-merge-arrow)" />
      <rect x="101" y="30" width="17" height="16" rx="3" fill="var(--good)" opacity="0.85" />
      <text x="109.5" y="41.5" fontSize="9" fill="var(--accent-ink)" fontWeight="700" textAnchor="middle">o</text>
    </svg>
  );
}

function FlowStep({ title, note, icon }: { title: string; note: string; icon?: ReactNode }) {
  return <span className="dcp-flow-step">{icon}<b>{title}</b><small>{note}</small></span>;
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
          <FlowStep title={copy.step1} note={copy.step1Note} icon={<FlowIcon1 />} />
          <i>→</i>
          <FlowStep title={copy.step2} note={copy.step2Note} icon={<FlowIcon2 />} />
          <i>→</i>
          <FlowStep title={copy.step3} note={copy.step3Note} icon={<FlowIcon3 />} />
          <i>→</i>
          <FlowStep title={copy.step4} note={copy.step4Note} icon={<FlowIcon4 />} />
        </div>
      </section>

      <div className="dcp-inline-legend"><span><i className="stored" />{copy.stored}</span><span><i className="empty" />{copy.empty}</span></div>
    </figure>
  );
}
