import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import "./styles.css";

const GPUS = 4;
const POSITIONS = 12;

const COPY = {
  zh: {
    title: "Decode Context Parallelism：不再复制整份 KV，改按 token 位置分片",
    subtitle: "同一段 12-token MLA context；上面是 naive TP，下面是 DCP",
    problem: "问题",
    solution: "解决",
    tpTitle: "Naive TP：每张卡都保存完整 MLA KV latent",
    tpIntro: "MLA 虽然有多个 attention heads，但所有 heads 共享同一份压缩 KV latent，cache 没有可供 TP 按 head 切分的轴。TP8 因而在 8 卡上复制这份 KV latent；GPU 变多了，逻辑上下文容量却没有变大。",
    dcpTitle: "DCP：(token position − 1) mod N 决定 KV 存在哪张 GPU",
    dcpIntro: "Query 很小，复制给所有 GPU；长而占显存的 KV 按 token 位置轮转分片，每个位置只存一份。",
    gpu: "GPU",
    token: "T",
    position: "token 位置",
    sameContext: "同一段 12-token context",
    tpCopies: "物理 KV cells：48（复制 4×）",
    dcpCopies: "物理 KV cells：12（每位置仅 1 份）",
    sameMemory: "同样 48-cell 显存：逻辑容量 12 → 48 tokens",
    flowTitle: "一次 MLA decode 为什么仍然精确",
    step1: "① 复制新 token 的 q",
    step1Note: "q 很小",
    step2: "② 各 GPU 本地 attention",
    step2Note: "只扫自己 1/N 的 KV",
    step3: "③ 一次 packed all-to-all",
    step3Note: "交换 partial output + LSE",
    step4: "④ LSE 精确合并",
    step4Note: "结果与完整 softmax 一致",
    whyTitle: "为什么吞吐提高",
    why: "DCP 的主要收益不是让一条短请求的 attention 算得更快，而是把 MLA 的活跃 KV 工作集分散到多卡。更多长会话能留在 GPU 上，避免 host offload、重新 prefill 和并发坍塌。K3 上 DCP8 把逻辑容量从 1.5M 提到 12.2M tokens（7.9×），48 个 agent sessions 达到 541 tok/s；TP8 在 16 个时已崩塌。",
    tradeoffTitle: "Tradeoff",
    tradeoff: "每个 MLA 层增加一次 all-to-all 和 LSE merge；短上下文、低并发时，这笔通信可能不值得。KDA 状态是每请求一个固定矩阵，没有 token-position 轴，不能用 DCP 分片，仍按 TP/head 处理。",
    stored: "实色 = 该 GPU 保存",
    empty: "空框 = 此位置在其他 GPU",
  },
  en: {
    title: "Decode Context Parallelism: shard KV by token position instead of replicating it",
    subtitle: "The same 12-token MLA context; naive TP above, DCP below",
    problem: "Problem",
    solution: "Solution",
    tpTitle: "Naive TP: every GPU stores the complete MLA KV latent",
    tpIntro: "MLA has multiple attention heads, but they all share the same compressed KV latent, leaving no cache head axis for TP to shard. TP8 therefore replicates this KV latent on all eight GPUs: more GPUs do not increase logical context capacity.",
    dcpTitle: "DCP: (token position − 1) mod N decides which GPU owns each KV",
    dcpIntro: "The small query is replicated to all GPUs; the long, memory-heavy KV is striped round-robin by token position, with each position stored once.",
    gpu: "GPU",
    token: "T",
    position: "token position",
    sameContext: "The same 12-token context",
    tpCopies: "Physical KV cells: 48 (4× replicated)",
    dcpCopies: "Physical KV cells: 12 (one copy per position)",
    sameMemory: "With the same 48-cell memory: 12 → 48 logical tokens",
    flowTitle: "Why one MLA decode step remains exact",
    step1: "① Replicate the new token's q",
    step1Note: "q is small",
    step2: "② Local attention per GPU",
    step2Note: "scan only 1/N of KV",
    step3: "③ One packed all-to-all",
    step3Note: "exchange partial output + LSE",
    step4: "④ Exact LSE merge",
    step4Note: "matches the full softmax result",
    whyTitle: "Why throughput improves",
    why: "DCP's main win is not lower latency for one short request. It spreads MLA's active KV working set across GPUs, keeping more long sessions on device and avoiding host offload, re-prefill, and concurrency collapse. On K3, DCP8 raises logical capacity from 1.5M to 12.2M tokens (7.9×) and reaches 541 tok/s at 48 agent sessions; TP8 has already collapsed at 16.",
    tradeoffTitle: "Tradeoff",
    tradeoff: "Every MLA layer adds one all-to-all and an LSE merge, which may not pay off for short contexts or low concurrency. KDA state is one fixed matrix per request with no token-position axis, so it cannot use DCP and remains TP/head-sharded.",
    stored: "filled = stored on this GPU",
    empty: "outline = owned by another GPU",
  },
} as const;

function KvGrid({ mode, lang }: { mode: "tp" | "dcp"; lang: Locale }) {
  const copy = COPY[lang];
  return (
    <div className={`dcp-kv-grid ${mode}`}>
      <div className="dcp-position-axis">
        <span />
        {Array.from({ length: POSITIONS }, (_, position) => (
          <b key={position} title={`${copy.position} ${position + 1}`}>{copy.token}{position + 1}</b>
        ))}
      </div>
      {Array.from({ length: GPUS }, (_, gpu) => (
        <div className="dcp-kv-row" key={gpu}>
          <b>{copy.gpu} {gpu + 1}</b>
          {Array.from({ length: POSITIONS }, (_, position) => {
            const stored = mode === "tp" || position % GPUS === gpu;
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
  return (
    <figure className="viz-stage dcp-explainer" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{copy.title}</span>
        <span className="viz-subtitle">{copy.subtitle}</span>
      </div>

      <div className="dcp-compare-stack">
        <section className="parallel-card problem">
          <div className="parallel-card-head"><span>{copy.problem}</span><b>{copy.tpTitle}</b></div>
          <p>{copy.tpIntro}</p>
          <KvGrid mode="tp" lang={lang} />
          <div className="dcp-grid-summary"><span>{copy.sameContext}</span><b>{copy.tpCopies}</b></div>
        </section>

        <div className="parallel-down-arrow" aria-hidden="true">↓</div>

        <section className="parallel-card solution">
          <div className="parallel-card-head"><span>{copy.solution}</span><b>{copy.dcpTitle}</b></div>
          <p>{copy.dcpIntro}</p>
          <KvGrid mode="dcp" lang={lang} />
          <div className="dcp-grid-summary"><span>{copy.dcpCopies}</span><b>{copy.sameMemory}</b></div>
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
      <div className="viz-footer parallel-footer">
        <div><b>{copy.whyTitle}：</b>{copy.why}</div>
        <div><b>{copy.tradeoffTitle}：</b>{copy.tradeoff}</div>
      </div>
    </figure>
  );
}
