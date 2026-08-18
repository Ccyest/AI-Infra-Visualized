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
    step3Note: "o 按 head 切开分寄：每卡只发一份输出的量，O(N)",
    step4: "④ 按 LSE 加权合并",
    step4Note: "加权平均后与完整 softmax 完全一致",
    flowNote: "LSE 是每张卡本地 softmax 的分母（取 log 保存）。打个比方：两个班各报一个平均分（o）和人数（LSE），按人数加权平均，就是全年级的平均分——所以合并是精确的，不是近似。",
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
    step3Note: "o is split by head and scattered: each GPU sends one output's worth, O(N)",
    step4: "④ LSE-weighted merge",
    step4Note: "the weighted average equals the full softmax exactly",
    flowNote: "LSE is each GPU's local softmax denominator (kept in log form). Think of two classes each reporting an average score (o) and a headcount (LSE): the headcount-weighted average is exactly the school-wide average — the merge is exact, not approximate.",
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

/* 四步流程的简笔图示：G1/G2 两卡为例 */
function FlowIcon1() {
  return (
    <svg className="dcp-flow-icon" viewBox="0 0 128 56" aria-hidden="true">
      {[0, 1].map((row) => (
        <g key={row} transform={`translate(0 ${row * 26})`}>
          <rect x="6" y="4" width="116" height="22" rx="4" fill="var(--surface)" stroke="var(--border)" />
          <text x="14" y="19" fontSize="9" fill="var(--muted)">G{row + 1}</text>
          <rect x="98" y="7" width="16" height="16" rx="3" fill="var(--accent)" />
          <text x="106" y="19" fontSize="9" fill="var(--accent-ink)" textAnchor="middle">q</text>
        </g>
      ))}
    </svg>
  );
}

function FlowIcon2() {
  return (
    <svg className="dcp-flow-icon" viewBox="0 0 128 56" aria-hidden="true">
      {[0, 1].map((row) => (
        <g key={row} transform={`translate(0 ${row * 28})`}>
          <rect x="6" y="8" width="14" height="14" rx="3" fill="var(--accent)" />
          <text x="13" y="18.5" fontSize="8.5" fill="var(--accent-ink)" textAnchor="middle">q</text>
          {[0, 1, 2, 3, 4, 5].map((c) => {
            const mine = c % 2 === row;
            const x = 34 + c * 15;
            return (
              <g key={c}>
                {mine && <path d={`M20 11 Q ${(20 + x) / 2} 1 ${x + 6} 8`} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />}
                <rect x={x} y="8" width="12" height="14" rx="2" fill={mine ? (row === 0 ? "var(--series-1)" : "var(--series-2)") : "none"} stroke={mine ? "none" : "var(--grid)"} opacity={mine ? 0.85 : 1} />
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
    <svg className="dcp-flow-icon" viewBox="0 0 128 64" aria-hidden="true">
      <defs><marker id="dcp-a2a-arrow" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8Z" fill="var(--accent)" /></marker></defs>
      <text x="3" y="18" fontSize="8" fill="var(--ink-2)">o₁</text>
      <rect x="17" y="7" width="20" height="14" rx="2" fill="var(--series-1)" opacity="0.9" />
      <rect x="38" y="7" width="20" height="14" rx="2" fill="var(--series-1)" opacity="0.35" />
      <text x="3" y="52" fontSize="8" fill="var(--ink-2)">o₂</text>
      <rect x="17" y="41" width="20" height="14" rx="2" fill="var(--series-2)" opacity="0.9" />
      <rect x="38" y="41" width="20" height="14" rx="2" fill="var(--series-2)" opacity="0.35" />
      <rect x="88" y="3" width="36" height="22" rx="4" fill="var(--surface)" stroke="var(--border)" />
      <text x="91" y="17" fontSize="6.5" fill="var(--muted)">G1</text>
      <rect x="102" y="7" width="9" height="14" rx="2" fill="var(--series-1)" opacity="0.9" />
      <rect x="113" y="7" width="9" height="14" rx="2" fill="var(--series-2)" opacity="0.9" />
      <rect x="88" y="39" width="36" height="22" rx="4" fill="var(--surface)" stroke="var(--border)" />
      <text x="91" y="53" fontSize="6.5" fill="var(--muted)">G2</text>
      <rect x="102" y="43" width="9" height="14" rx="2" fill="var(--series-1)" opacity="0.35" />
      <rect x="113" y="43" width="9" height="14" rx="2" fill="var(--series-2)" opacity="0.35" />
      <line x1="49" y1="22" x2="84" y2="46" stroke="var(--accent)" strokeWidth="1.3" markerEnd="url(#dcp-a2a-arrow)" />
      <line x1="30" y1="40" x2="84" y2="17" stroke="var(--accent)" strokeWidth="1.3" markerEnd="url(#dcp-a2a-arrow)" />
    </svg>
  );
}

function FlowIcon4() {
  return (
    <svg className="dcp-flow-icon" viewBox="0 0 128 64" aria-hidden="true">
      <defs><marker id="dcp-merge-arrow" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8Z" fill="var(--good)" /></marker></defs>
      <rect x="6" y="5" width="26" height="16" rx="3" fill="color-mix(in srgb, var(--series-1) 30%, var(--surface))" stroke="var(--border)" />
      <text x="19" y="16.5" fontSize="8" fill="var(--ink-2)" textAnchor="middle">o₁</text>
      <rect x="6" y="43" width="26" height="16" rx="3" fill="color-mix(in srgb, var(--series-2) 30%, var(--surface))" stroke="var(--border)" />
      <text x="19" y="54.5" fontSize="8" fill="var(--ink-2)" textAnchor="middle">o₂</text>
      <line x1="34" y1="13" x2="61" y2="27" stroke="var(--good)" strokeWidth="1.3" markerEnd="url(#dcp-merge-arrow)" />
      <line x1="34" y1="51" x2="61" y2="37" stroke="var(--good)" strokeWidth="1.3" markerEnd="url(#dcp-merge-arrow)" />
      <text x="40" y="11" fontSize="7" fill="var(--ink-2)">×w₁</text>
      <text x="40" y="60" fontSize="7" fill="var(--ink-2)">×w₂</text>
      <circle cx="74" cy="32" r="11" fill="color-mix(in srgb, var(--good) 18%, var(--surface))" stroke="var(--good)" strokeWidth="1.3" />
      <text x="74" y="35.5" fontSize="9" fill="var(--ink)" textAnchor="middle">Σ</text>
      <line x1="86" y1="32" x2="96" y2="32" stroke="var(--good)" strokeWidth="1.3" markerEnd="url(#dcp-merge-arrow)" />
      <rect x="99" y="23" width="18" height="18" rx="3" fill="var(--good)" opacity="0.85" />
      <text x="108" y="35.5" fontSize="9" fill="var(--accent-ink)" fontWeight="700" textAnchor="middle">o</text>
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
        <small className="dcp-flow-note">{copy.flowNote}</small>
      </section>

      <div className="dcp-inline-legend"><span><i className="stored" />{copy.stored}</span><span><i className="empty" />{copy.empty}</span></div>
    </figure>
  );
}
