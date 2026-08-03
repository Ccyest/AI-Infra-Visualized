import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import "./styles.css";

const RANKS = 8;
const TP_ROUNDS = 3;
const PP_COLUMNS = 15;

const COPY = {
  zh: {
    title: "Chunked pipeline prefill：先消掉每层同步，再把长 prompt 灌进流水线",
    subtitle: "同样 8 张 GPU；上面是 naive TP8，下面是 SGLang 的 chunked PP8",
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
    ppIntro: "每张卡执行完整的约 12 层；不同 stage 同时处理不同 chunk，stage 间只做 P2P 交接。",
    stage: "S",
    chunk: "C",
    ppCaption: "斜线 = 一个 chunk 逐段前进；同一列 = 8 个 stage 同时计算不同 chunks",
    ppFact1: "整层 GEMM，更宽更高效",
    ppFact2: "P2P 的 91% 藏在下一 chunk 计算后面",
    ppFact3: "每个 stage 只保留约 12 层的 KV/activation",
    whyTitle: "为什么吞吐提高",
    why: "TP8 每层都停下来同步；PP8 只在 stage 边界传一次激活，而且传输可与下一块计算重叠。流水线灌满后，8 张卡不再合算同一个 chunk，而是同时推进 8 个不同 chunks。真机 prefill capacity 是 TEP8 的 1.45–1.72×。",
    tradeoffTitle: "Tradeoff",
    tradeoff: "流水线开始和结束都有气泡，单个请求或 chunks 太少时 PP8 反而可能更慢；必须有足够长的 prompt 或并发 chunks 才能摊薄气泡。浅层 PP4×TP2 还保留 TP AllReduce，也无法充分隐藏 P2P。",
  },
  en: {
    title: "Chunked pipeline prefill: remove per-layer sync, then stream a long prompt",
    subtitle: "The same 8 GPUs; naive TP8 above, SGLang chunked PP8 below",
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
    ppIntro: "Each GPU executes about 12 complete layers. Different stages process different chunks concurrently, with only P2P hand-offs between stages.",
    stage: "S",
    chunk: "C",
    ppCaption: "Diagonal = one chunk moving through stages; one column = 8 stages computing different chunks together",
    ppFact1: "Whole-layer GEMMs are wider and more efficient",
    ppFact2: "91% of P2P transfer hides behind next-chunk compute",
    ppFact3: "Each stage holds KV/activations for only ~12 layers",
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
        <div className="parallel-schedule-row" key={stage}>
          <b>{copy.stage}{stage + 1}</b>
          <span className="parallel-pp-track">
            {Array.from({ length: PP_COLUMNS }, (_, column) => {
              const chunk = column - stage;
              const active = chunk >= 0;
              return (
                <i
                  className={active ? "active" : "bubble"}
                  key={column}
                  style={active ? { background: seriesColor((chunk % 7) + 1) } : undefined}
                  title={active ? `${copy.chunk}${chunk + 1}` : "bubble"}
                >
                  {active && `${copy.chunk}${chunk + 1}`}
                </i>
              );
            })}
          </span>
        </div>
      ))}
      <small>{copy.ppCaption}</small>
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
        </section>
      </div>

      <div className="viz-footer parallel-footer">
        <div><b>{copy.whyTitle}：</b>{copy.why}</div>
        <div><b>{copy.tradeoffTitle}：</b>{copy.tradeoff}</div>
      </div>
    </figure>
  );
}
