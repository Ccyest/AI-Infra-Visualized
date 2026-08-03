import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import "./styles.css";

const RANKS = 8;
const TP_ROUNDS = 3;
const PP_CHUNKS = 5;
const PP_COLUMNS = RANKS - 1 + PP_CHUNKS;
const LAYER_RANGES = ["L1–12", "L13–24", "L25–36", "L37–48", "L49–60", "L61–72", "L73–84", "L85–93"];

const COPY = {
  zh: {
    title: "Chunked pipeline prefill：先消掉每层同步，再把长 prompt 灌进流水线",
    subtitle: "同样 8 张 GPU；prefill 从逐层同步的 TP8，切换为按层流水的 PP8",
    problem: "问题",
    solution: "解决",
    tpTitle: "Naive TP8：8 卡锁步计算同一层",
    tpIntro: "每层都把矩阵切成 8 份；算完必须 AllReduce，最慢的卡没到齐，所有卡都不能进入下一层。",
    compute: "计算",
    allReduce: "AllReduce",
    tpFact1: "93 层反复同步",
    tpFact2: "通信处在关键路径",
    tpFact3: "GEMM 被切窄，效率下降",
    ppTitle: "Chunked PP8：模型按层切 8 段，prompt 再切成 chunks",
    ppIntro: "G1–G8 各自执行一段完整层；长 prompt 切成 C1–C5，前一张 GPU 算完一个 chunk 后，把 activation 直接交给下一张。",
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
    whyTitle: "为什么吞吐提高",
    why: "TP8 每层都停下来同步；PP8 只在 stage 边界传一次激活，而且传输可与下一块计算重叠。流水线灌满后，8 张卡不再合算同一个 chunk，而是同时推进 8 个不同 chunks。真机 prefill capacity 是 TEP8 的 1.45–1.72×。",
    tradeoffTitle: "Tradeoff",
    tradeoff: "流水线开始和结束都有气泡，单个请求或 chunks 太少时 PP8 反而可能更慢；必须有足够长的 prompt 或并发 chunks 才能摊薄气泡。浅层 PP4×TP2 还保留 TP AllReduce，也无法充分隐藏 P2P。",
  },
  en: {
    title: "Chunked pipeline prefill: remove per-layer sync, then stream a long prompt",
    subtitle: "The same 8 GPUs; prefill switches from layer-synchronous TP8 to layer-pipelined PP8",
    problem: "Problem",
    solution: "Solution",
    tpTitle: "Naive TP8: all 8 GPUs advance through the same layer in lockstep",
    tpIntro: "Every layer is split eight ways. After compute, every rank must finish an AllReduce before any rank can enter the next layer.",
    compute: "compute",
    allReduce: "AllReduce",
    tpFact1: "A barrier after each of 93 layers",
    tpFact2: "Communication stays on the critical path",
    tpFact3: "Eight-way slicing makes GEMMs narrower",
    ppTitle: "Chunked PP8: split layers into 8 stages and the prompt into chunks",
    ppIntro: "G1–G8 each execute a run of complete layers. The long prompt becomes C1–C5; after one chunk, a GPU sends its activation directly to the next GPU.",
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
    whyTitle: "Why throughput improves",
    why: "TP8 stops for a collective after every layer. PP8 transfers activations only at stage boundaries, and that transfer overlaps the next chunk's compute. Once full, the eight GPUs advance eight different chunks instead of co-computing one. Measured prefill capacity is 1.45–1.72× TEP8.",
    tradeoffTitle: "Tradeoff",
    tradeoff: "The pipeline has fill and drain bubbles. With one request or too few chunks, PP8 can be slower; long prompts or enough concurrent chunks are needed to amortize the bubbles. A shallow PP4×TP2 still pays TP AllReduce and cannot hide P2P well.",
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

function PpSchedule({ lang }: { lang: Locale }) {
  const copy = COPY[lang];
  return (
    <div className="parallel-pp-schedule" aria-label={copy.ppTitle}>
      {Array.from({ length: RANKS }, (_, stage) => (
        <div className="parallel-pp-stage" key={stage}>
          <div className="parallel-schedule-row">
            <b><strong>{copy.gpu}{stage + 1}</strong><small>{LAYER_RANGES[stage]}</small></b>
            <span className="parallel-pp-track">
              {Array.from({ length: PP_COLUMNS }, (_, column) => {
                const chunk = column - stage;
                const active = chunk >= 0 && chunk < PP_CHUNKS;
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
          <div><em>{copy.tp8Comm}</em><i><u className="cost" style={{ width: "100%" }} /></i></div>
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
  return (
    <figure className="viz-stage parallel-explainer" style={{ margin: "1.6rem 0" }}>
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
          <PpSchedule lang={lang} />
          <Facts items={[copy.ppFact1, copy.ppFact2, copy.ppFact3]} />
          <GainChart lang={lang} />
        </section>
      </div>

      <div className="viz-footer parallel-footer">
        <div><b>{copy.whyTitle}：</b>{copy.why}</div>
        <div><b>{copy.tradeoffTitle}：</b>{copy.tradeoff}</div>
      </div>
    </figure>
  );
}
