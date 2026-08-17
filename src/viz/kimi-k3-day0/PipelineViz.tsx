import { useState, type CSSProperties } from "react";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import "./styles.css";

const RANKS = 8;
const TP_ROUNDS = 3;
const DEFAULT_PP_CHUNKS = 5;
const MAX_PP_CHUNKS = 12;
const LAYER_RANGES = ["L1–12", "L13–24", "L25–36", "L37–48", "L49–60", "L61–72", "L73–84", "L85–93"];

const COPY = {
  zh: {
    title: "Chunked pipeline prefill 图示",
    subtitle: "同样 8 张 GPU；上面 TP8，下面 chunked PP8",
    problem: "问题",
    solution: "解决",
    tpTitle: "TP8：每层之后 8 卡同步一次",
    tpIntro: "每层都把矩阵切成 8 份；算完必须 AllReduce，最慢的卡没到齐，所有卡都不能进入下一层。",
    compute: "计算",
    allReduce: "AllReduce",
    tpFact1: "93 层反复同步",
    tpFact2: "通信处在关键路径",
    tpFact3: "GEMM 被切窄，效率下降",
    ppTitle: "Chunked PP8：层切 8 段，prompt 切成 chunks",
    ppIntro: "G1–G8 各自执行一段完整层；长 prompt 切成多个 chunks，前一张 GPU 算完一个 chunk 后，把 activation 直接交给下一张。",
    chunkControl: "Prompt chunks",
    chunkUnit: "块",
    utilization: "流水线 slot 利用率",
    bubble: "气泡占比",
    utilizationNote: "等长 stage 的教学模型：chunks 越多，灌入/排空气泡越容易被摊薄。",
    gpu: "G",
    chunk: "C",
    p2p: "P2P activation",
    ppCaption: "斜线 = 同一 chunk 依次流过 G1→G8；P2P（point-to-point）= 相邻两张 GPU 直接传 activation，不需要 8 卡共同汇总。层号按 93 层近似均分示意。",
    ppFact1: "整层 GEMM，更宽更高效",
    ppFact2: "P2P 的 91% 被下一 chunk 的计算隐藏",
    ppFact3: "每张 GPU 只保留约 12 层的 KV/activation",
    measuredTitle: "8K prefill 实测（2×4 GB300，仅改变并行拓扑）",
    capacity: "每节点 prefill capacity",
    tep8: "TEP8",
    pp8: "PP8×TP1",
    capacityBase: "1.00×",
    capacityGain: "1.45–1.72×（代表点 1.64×）",
    communication: "暴露在关键路径上的通信 / 1K tokens",
    tp8Comm: "TP8 · 9.38 ms",
    pp8Comm: "PP8 · 0.88 ms",
    hidden: "约减少 91%",
    why: "PP8 只在 stage 边界传一次激活，还能和下一个 chunk 的计算重叠；灌满后 8 张卡各推进各的 chunk。实测 prefill capacity 是 TEP8 的 1.45–1.72×。",
    tradeoff: "灌入和排空的气泡要靠足够多的 chunks 摊薄；请求少或 prompt 短时 PP8 反而更慢。",
  },
  en: {
    title: "Chunked pipeline prefill diagram",
    subtitle: "The same 8 GPUs; TP8 above, chunked PP8 below",
    problem: "Problem",
    solution: "Solution",
    tpTitle: "TP8: all 8 GPUs sync after every layer",
    tpIntro: "Every layer is split eight ways. After compute, every rank must finish an AllReduce before any rank can enter the next layer.",
    compute: "compute",
    allReduce: "AllReduce",
    tpFact1: "A barrier after each of 93 layers",
    tpFact2: "Communication stays on the critical path",
    tpFact3: "Eight-way slicing makes GEMMs narrower",
    ppTitle: "Chunked PP8: 8 layer stages, prompt in chunks",
    ppIntro: "G1–G8 each execute a run of complete layers. The long prompt becomes multiple chunks; after one chunk, a GPU sends its activation directly to the next GPU.",
    chunkControl: "Prompt chunks",
    chunkUnit: "chunks",
    utilization: "pipeline-slot utilization",
    bubble: "bubble share",
    utilizationNote: "Equal-stage teaching model: more chunks amortize the fill and drain bubbles.",
    gpu: "G",
    chunk: "C",
    p2p: "P2P activation",
    ppCaption: "Diagonal = one chunk streaming through G1→G8. P2P (point-to-point) means adjacent GPUs directly hand off activations; all eight do not collectively reduce them. Layer ranges illustrate an approximately even split of 93 layers.",
    ppFact1: "Whole-layer GEMMs are wider and more efficient",
    ppFact2: "91% of P2P transfer hides behind next-chunk compute",
    ppFact3: "Each stage holds KV/activations for only ~12 layers",
    measuredTitle: "Measured 8K prefill (2×4 GB300; topology is the only variable)",
    capacity: "Prefill capacity per node",
    tep8: "TEP8",
    pp8: "PP8×TP1",
    capacityBase: "1.00×",
    capacityGain: "1.45–1.72× (representative point: 1.64×)",
    communication: "Exposed critical-path communication / 1K tokens",
    tp8Comm: "TP8 · 9.38 ms",
    pp8Comm: "PP8 · 0.88 ms",
    hidden: "about 91% lower",
    why: "PP8 hands activations over only at stage boundaries, and the transfer overlaps the next chunk's compute; once full, the 8 GPUs each advance a different chunk. Measured prefill capacity is 1.45–1.72× TEP8.",
    tradeoff: "Fill and drain bubbles need enough chunks to amortize; with few requests or short prompts PP8 can be slower.",
  },
} as const;

function TpSchedule({ lang }: { lang: Locale }) {
  const copy = COPY[lang];
  return (
    <div className="parallel-tp-schedule" aria-label={copy.tpTitle}>
      {Array.from({ length: RANKS }, (_, rank) => (
        <div className="parallel-schedule-row" key={rank}>
          <b>G{rank + 1}</b>
          {Array.from({ length: TP_ROUNDS }, (_, round) => (
            <span className="parallel-tp-round" key={round}>
              <i style={{ background: seriesColor(round + 1) }}>{copy.compute}</i>
              <em>{copy.allReduce}</em>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function PpSchedule({ chunks, lang }: { chunks: number; lang: Locale }) {
  const copy = COPY[lang];
  const columns = RANKS - 1 + chunks;
  const scheduleStyle = { "--pp-columns": columns } as CSSProperties;
  return (
    <div className="parallel-pp-schedule" aria-label={copy.ppTitle} style={scheduleStyle}>
      {Array.from({ length: RANKS }, (_, stage) => (
        <div className="parallel-pp-stage" key={stage}>
          <div className="parallel-schedule-row">
            <b><strong>{copy.gpu}{stage + 1}</strong><small>{LAYER_RANGES[stage]}</small></b>
            <span className="parallel-pp-track">
              {Array.from({ length: columns }, (_, column) => {
                const chunk = column - stage;
                const active = chunk >= 0 && chunk < chunks;
                const before = column < stage;
                return (
                  <i
                    className={active ? "active" : before ? "bubble" : "idle"}
                    key={column}
                    style={active ? { background: seriesColor((chunk % 5) + 1) } : undefined}
                    title={active ? `${copy.chunk}${chunk + 1}` : before ? "pipeline bubble" : undefined}
                  >
                    {active && `${copy.chunk}${chunk + 1}`}
                  </i>
                );
              })}
            </span>
          </div>
          {stage < RANKS - 1 && (
            <div className="parallel-p2p-row" aria-hidden="true">
              <span />
              <span className="parallel-p2p-track">
                <i style={{ gridColumn: `${stage + 1} / span 2` }}>↘ {stage === 0 ? copy.p2p : "P2P"}</i>
              </span>
            </div>
          )}
        </div>
      ))}
      <small>{copy.ppCaption}</small>
    </div>
  );
}

function GainChart({ lang }: { lang: Locale }) {
  const copy = COPY[lang];
  return (
    <div className="parallel-gain-chart">
      <b>{copy.measuredTitle}</b>
      <div className="parallel-gain-columns">
        <section>
          <span>{copy.capacity}</span>
          <div><em>{copy.tep8}</em><i><u style={{ width: "58%" }} /></i><output>{copy.capacityBase}</output></div>
          <div><em>{copy.pp8}</em><i><u className="gain" style={{ width: "95%" }} /></i><output>{copy.capacityGain}</output></div>
        </section>
        <section>
          <span>{copy.communication}</span>
          <div><em>{copy.tp8Comm}</em><i><u className="cost" style={{ width: "100%" }} /></i><output /></div>
          <div><em>{copy.pp8Comm}</em><i><u className="cost low" style={{ width: "9.4%" }} /></i><output>{copy.hidden}</output></div>
        </section>
      </div>
    </div>
  );
}

function Facts({ items }: { items: readonly string[] }) {
  return <div className="parallel-facts">{items.map((item) => <span key={item}>✓ {item}</span>)}</div>;
}

export default function PipelineViz({ lang = "zh" }: { lang?: Locale }) {
  const copy = COPY[lang];
  const [chunks, setChunks] = useState(DEFAULT_PP_CHUNKS);
  const utilization = Math.round((chunks / (chunks + RANKS - 1)) * 100);
  const bubbleShare = 100 - utilization;
  return (
    <figure className="viz-stage k3-viz parallel-explainer" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{copy.title}</span>
        <span className="viz-subtitle">{copy.subtitle}</span>
      </div>

      <div className="parallel-compare-stack">
        <section className="parallel-card problem">
          <div className="parallel-card-head"><span>{copy.problem}</span><b>{copy.tpTitle}</b></div>
          <p>{copy.tpIntro}</p>
          <TpSchedule lang={lang} />
          <Facts items={[copy.tpFact1, copy.tpFact2, copy.tpFact3]} />
        </section>

        <div className="parallel-down-arrow" aria-hidden="true">↓</div>

        <section className="parallel-card solution">
          <div className="parallel-card-head"><span>{copy.solution}</span><b>{copy.ppTitle}</b></div>
          <p>{copy.ppIntro}</p>
          <label className="parallel-chunk-control">
            <span><b>{copy.chunkControl}</b><output>{chunks} {copy.chunkUnit}</output></span>
            <input
              className="viz-scrub"
              type="range"
              min="1"
              max={MAX_PP_CHUNKS}
              step="1"
              value={chunks}
              onChange={(event) => setChunks(Number(event.target.value))}
            />
            <span className="parallel-live-metrics">
              <output>{copy.utilization} <b>{utilization}%</b></output>
              <output>{copy.bubble} <b>{bubbleShare}%</b></output>
            </span>
            <small>{copy.utilizationNote}</small>
          </label>
          <PpSchedule chunks={chunks} lang={lang} />
          <Facts items={[copy.ppFact1, copy.ppFact2, copy.ppFact3]} />
          <GainChart lang={lang} />
        </section>
      </div>

      <div className="viz-footer parallel-footer">
        <div>{copy.why}</div>
        <div>{copy.tradeoff}</div>
      </div>
    </figure>
  );
}
