import VizStage from "../../components/core/VizStage";
import Legend from "../../components/core/Legend";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import "./styles.css";

const STEPS = [
  { token: "A=1", key: "A", value: 1, old: 0, delta: 1 },
  { token: "B=2", key: "B", value: 2, old: 0, delta: 2 },
  { token: "A=4", key: "A", value: 4, old: 1, delta: 3 },
  { token: "A?", key: "A", value: 4, old: 4, delta: 0 },
];

const COPY = {
  title: { zh: "DeltaNet：同键改写时，先读、再擦、后写", en: "DeltaNet: read, erase, then write on rebinding" },
  subtitle: { zh: "A 是一个示意的 key 方向；图中写入强度 β=1", en: "A names a toy key direction; the diagram uses write strength β=1" },
  definition1: { zh: "A = 一个示意的 key 方向（不是 token，也不是 query）", en: "A = a toy key direction (not a token and not a query)" },
  definition2: { zh: "A=1 / A=4：写入 token 的 k→A、v=1 / 4；A?：读取 token 的 q→A", en: "A=1 / A=4: write tokens with k→A and v=1 / 4; A?: a read token with q→A" },
  before: { zh: "写入前的 S", en: "S before write" },
  after: { zh: "写回后的 S", en: "S after delta write" },
  read: { zh: "读旧值", en: "read old" },
  erase: { zh: "擦旧关联", en: "erase old association" },
  write: { zh: "写新关联", en: "write new association" },
  delta: { zh: "净更新", en: "net update" },
  query: { zh: "读出", en: "readout" },
  empty: { zh: "空", en: "empty" },
  verdict: {
    zh: "一般 β 下：r′ = r + β(v−r) = (1−β)r + βv。也就是擦掉 β 比例的旧关联，再写入 β 比例的新关联；β=1 才是完整擦掉 1、写入 4。",
    en: "For general β: r′ = r + β(v−r) = (1−β)r + βv. This erases a β fraction of the old association and writes a β fraction of the new one; only β=1 fully erases 1 and writes 4.",
  },
};

function text(lang: Locale, item: { zh: string; en: string }) {
  return item[lang];
}

function drawState(
  values: Record<string, number>,
  x: number,
  y: number,
  width: number,
  height: number,
  lang: Locale,
  highlight?: string,
) {
  const entries = ["A", "B"];
  const stripeW = 31;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={8} fill="none" stroke="var(--ink)" strokeOpacity={0.4} strokeWidth={1.3} />
      {entries.map((key, i) => {
        const value = values[key] ?? 0;
        const xx = x + 3 + i * (stripeW + 3);
        return (
          <g key={key}>
            <rect x={xx} y={y + 3} width={stripeW} height={height - 6} rx={3} fill={value ? seriesColor(value) : "var(--grid)"} opacity={value ? 0.9 : 0.65} />
            <text x={xx + stripeW / 2} y={y + height + 13} textAnchor="middle" fontSize="9" fill={highlight === key ? "var(--accent)" : "var(--muted)"} fontWeight={highlight === key ? 700 : 400}>{value ? `${key}=${value}` : text(lang, COPY.empty)}</text>
          </g>
        );
      })}
    </g>
  );
}

export default function DeltaRuleViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(STEPS.length, 1.2);
  const t = Math.min(player.t, STEPS.length);
  const current = t ? STEPS[t - 1] : null;
  const before: Record<string, number> = {};
  for (let i = 0; i < Math.max(0, t - 1); i += 1) {
    if (!STEPS[i].token.endsWith("?")) before[STEPS[i].key] = STEPS[i].value;
  }
  const after = { ...before };
  if (current && !current.token.endsWith("?")) after[current.key] = current.value;
  const write = current && !current.token.endsWith("?");
  const width = 620;
  const height = 230;
  const tokenY = 28;
  const boxY = 145;
  const leftBox = 18;
  const rightBox = 450;
  const boxW = 150;
  const boxH = 48;

  return (
    <VizStage
      title={text(lang, COPY.title)}
      subtitle={text(lang, COPY.subtitle)}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={[{ label: lang === "zh" ? "彩色 token = 写入(k, v)" : "colored token = write (k, v)", swatch: { background: "linear-gradient(90deg, var(--series-1) 0 50%, var(--series-2) 50%)" } }, { label: lang === "zh" ? "灰色 token = 读取(q)" : "gray token = read (q)", swatch: { background: "var(--axis)" } }]} />
          <div className="viz-verdict">{text(lang, COPY.verdict)}</div>
        </>
      }
    >
      <div className="viz-grid-wrap">
        <svg className="viz-grid" style={{ minWidth: 500, maxWidth: 680 }} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={text(lang, COPY.title)}>
          <defs>
            <marker id="delta-rule-arrow" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" fill="var(--accent)" /></marker>
          </defs>
          {STEPS.map((item, i) => {
            const x = 18 + i * 47;
            const seen = i < t;
            const isQuery = item.token.endsWith("?");
            return <g key={item.token + i}><rect x={x} y={tokenY} width={30} height={30} rx={5} fill={seen ? (isQuery ? "var(--axis)" : seriesColor(item.value)) : "none"} opacity={seen ? (isQuery ? 0.5 : 0.86) : 1} stroke={i === t - 1 ? "var(--accent)" : "var(--grid)"} strokeWidth={i === t - 1 ? 2 : 1} /><text x={x + 15} y={tokenY + 43} textAnchor="middle" fontSize="9" fill={i === t - 1 ? "var(--accent)" : "var(--muted)"} fontWeight={i === t - 1 ? 700 : 400}>{seen ? item.token : ""}</text></g>;
          })}
          <text x="18" y="88" fontSize="9.5" fill="var(--ink-2)" fontWeight="650">{text(lang, COPY.definition1)}</text>
          <text x="18" y="103" fontSize="9" fill="var(--muted)">{text(lang, COPY.definition2)}</text>
          {write && <>
            <path d={`M ${leftBox + boxW + 7} ${boxY + boxH / 2} L 218 ${boxY + boxH / 2}`} fill="none" stroke="var(--accent)" strokeWidth={2.2} opacity={0.7} />
            <path d={`M 422 ${boxY + boxH / 2} L ${rightBox - 10} ${boxY + boxH / 2}`} fill="none" stroke="var(--accent)" strokeWidth={2.2} opacity={0.7} markerEnd="url(#delta-rule-arrow)" />
          </>}
          <text x={leftBox + boxW / 2} y={boxY - 12} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="650">{text(lang, COPY.before)}</text>
          {drawState(before, leftBox, boxY, boxW, boxH, lang, current?.key)}
          <text x={rightBox + boxW / 2} y={boxY - 12} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="650">{text(lang, COPY.after)}</text>
          {drawState(after, rightBox, boxY, boxW, boxH, lang, current?.key)}
          <g transform="translate(225 137)">
            {write ? <>
              <text x="0" y="0" fontSize="10" fill="var(--ink-2)">{text(lang, COPY.read)}: <tspan fontWeight="750" fill="var(--ink)">{current.old}</tspan></text>
              <text x="0" y="16" fontSize="10" fill="var(--ink-2)">{text(lang, COPY.erase)}: <tspan fontWeight="750" fill="var(--ink)">−1×{current.old}</tspan></text>
              <text x="0" y="32" fontSize="10" fill="var(--ink-2)">{text(lang, COPY.write)}: <tspan fontWeight="750" fill="var(--ink)">+1×{current.value}</tspan></text>
              <text x="0" y="48" fontSize="10" fill="var(--accent)" fontWeight="700">{text(lang, COPY.delta)}: 1×({current.value}−{current.old}) = +{current.delta}</text>
              <text x="0" y="64" fontSize="10" fill="var(--good)" fontWeight="700">{current.old} + {current.delta} = {current.value}</text>
            </> : current ? <text x="0" y="18" fontSize="11" fill="var(--good)" fontWeight="700">{text(lang, COPY.query)}: {current.value}</text> : null}
          </g>
        </svg>
      </div>
    </VizStage>
  );
}
