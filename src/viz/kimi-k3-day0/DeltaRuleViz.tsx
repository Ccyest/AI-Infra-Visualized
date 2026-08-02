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
  subtitle: { zh: "A=4 不会和 A=1 叠在一起：delta 只把差值写回同一个键方向", en: "A=4 does not stack with A=1: the delta is written back to the same key direction" },
  before: { zh: "写入前的 S", en: "S before write" },
  after: { zh: "写入后的 S", en: "S after write" },
  read: { zh: "读旧值", en: "read old" },
  delta: { zh: "差值", en: "delta" },
  eraseWrite: { zh: "擦旧 → 写差值", en: "erase old → write delta" },
  query: { zh: "A? 读到", en: "A? reads" },
  empty: { zh: "空", en: "empty" },
  verdict: { zh: "A=4 时，kᵀS 先读出 1，v−kᵀS=4−1=3；写回差值后，S 里只保留最新绑定 A=4。", en: "At A=4, kᵀS first reads 1, so v−kᵀS=4−1=3; after writing the delta back, S keeps only the latest binding A=4." },
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
  const rows = ["A", "B"];
  const rowH = (height - 12) / rows.length;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={8} fill="none" stroke="var(--ink)" strokeOpacity={0.4} strokeWidth={1.3} />
      {rows.map((key, i) => {
        const value = values[key] ?? 0;
        const yy = y + 4 + i * rowH;
        return (
          <g key={key}>
            <text x={x + 13} y={yy + rowH / 2 + 3} fontSize="11" fill={highlight === key ? "var(--accent)" : "var(--ink-2)"} fontWeight={highlight === key ? 750 : 500}>{key}</text>
            <rect x={x + 32} y={yy + 2} width={width - 38} height={rowH - 5} rx={4} fill={value ? seriesColor(value) : "var(--grid)"} opacity={value ? 0.9 : 0.65} />
            <text x={x + width / 2 + 15} y={yy + rowH / 2 + 3} textAnchor="middle" fontSize="10" fill="var(--accent-ink)" fontWeight="700">{value || text(lang, COPY.empty)}</text>
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
  const height = 190;
  const tokenY = 28;
  const boxY = 92;
  const leftBox = 18;
  const rightBox = 450;
  const boxW = 150;
  const boxH = 58;
  const curX = current ? 18 + (t - 1) * 47 + 15 : 0;

  return (
    <VizStage
      title={text(lang, COPY.title)}
      subtitle={text(lang, COPY.subtitle)}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={[{ label: lang === "zh" ? "token / 条纹 = 写入的值" : "token / stripe = written value", swatch: { background: "linear-gradient(90deg, var(--series-1) 0 50%, var(--series-2) 50%)" } }, { label: lang === "zh" ? "实线 = 写入，虚线 = 读出" : "solid = write, dashed = read", swatch: { background: "repeating-linear-gradient(90deg, var(--accent) 0 3px, transparent 3px 6px)" } }]} />
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
            return <g key={item.token + i}><rect x={x} y={tokenY} width={30} height={30} rx={5} fill={seen ? seriesColor(item.value || 0) : "none"} opacity={seen ? 0.86 : 1} stroke={i === t - 1 ? "var(--accent)" : "var(--grid)"} strokeWidth={i === t - 1 ? 2 : 1} /><text x={x + 15} y={tokenY + 43} textAnchor="middle" fontSize="9" fill={i === t - 1 ? "var(--accent)" : "var(--muted)"} fontWeight={i === t - 1 ? 700 : 400}>{seen ? item.token : ""}</text></g>;
          })}
          {current && <>
            <path d={`M ${curX} ${tokenY - 2} Q 220 4 ${leftBox + boxW / 2} ${boxY - 4}`} fill="none" stroke="var(--accent)" strokeWidth={2.3} opacity={0.75} markerEnd="url(#delta-rule-arrow)" />
            {write && <path d={`M ${leftBox + boxW + 7} ${boxY + boxH / 2} L ${rightBox - 10} ${boxY + boxH / 2}`} fill="none" stroke="var(--accent)" strokeWidth={2.2} opacity={0.7} markerEnd="url(#delta-rule-arrow)" />}
          </>}
          <text x={leftBox + boxW / 2} y={boxY - 10} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="650">{text(lang, COPY.before)}</text>
          {drawState(before, leftBox, boxY, boxW, boxH, lang, current?.key)}
          <text x={rightBox + boxW / 2} y={boxY - 10} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="650">{text(lang, COPY.after)}</text>
          {drawState(after, rightBox, boxY, boxW, boxH, lang, current?.key)}
          <g transform="translate(245 104)">
            {write ? <>
              <text x="0" y="0" fontSize="10" fill="var(--ink-2)">{text(lang, COPY.read)}: <tspan fontWeight="750" fill="var(--ink)">{current.old}</tspan></text>
              <text x="0" y="18" fontSize="10" fill="var(--ink-2)">{text(lang, COPY.delta)}: <tspan fontWeight="750" fill="var(--ink)">{current.value} − {current.old} = {current.delta}</tspan></text>
              <text x="0" y="38" fontSize="10" fill="var(--accent)" fontWeight="700">{text(lang, COPY.eraseWrite)}</text>
            </> : current ? <text x="0" y="18" fontSize="11" fill="var(--good)" fontWeight="700">{text(lang, COPY.query)} {current.value}</text> : null}
          </g>
        </svg>
      </div>
    </VizStage>
  );
}
