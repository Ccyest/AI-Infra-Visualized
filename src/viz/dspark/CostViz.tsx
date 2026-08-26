import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { COST, costPointTooltip } from "./strings";
import "./styles.css";

/* 步时模型:T(M) = BIAS + SLOPE·M,形状读自原文 Figure 6(a)(近线性),示意口径 */
const BIAS = 20;
const SLOPE = 0.19;
function stepTime(m: number): number {
  return BIAS + SLOPE * m;
}

const BATCHES = [1, 16, 64, 256];

/** 三种臂:每请求 verify 的 token 数与每步提交数(接受数为脚本值) */
const ARMS = [
  { key: "armNonSpec", perReq: 1, commit: 1, color: "var(--axis)" },
  { key: "armFull", perReq: 6, commit: 4, color: "var(--series-4)" },
  { key: "armTrim", perReq: 3, commit: 3.5, color: "var(--series-1)" },
] as const;

const W = 560;
const H = 220;
const PADL = 46;
const PADB = 34;
const PADT = 10;
const PADR = 14;
const MAXM = 1600;
const MAXT = 340;

function x(m: number): number {
  return PADL + (m / MAXM) * (W - PADL - PADR);
}
function y(t: number): number {
  return PADT + (1 - t / MAXT) * (H - PADT - PADB);
}

export default function CostViz({ lang = "zh" }: { lang?: Locale }) {
  const [bs, setBs] = useState(64);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const showTooltip = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({
      x: e.clientX - rect.left + wrap.scrollLeft,
      y: e.clientY - rect.top,
      text,
    });
  };

  const baseline = ARMS[0];
  const tBase = stepTime(bs * baseline.perReq);

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{COST.title[lang]}</span>
        <span className="viz-subtitle">{COST.subtitle[lang]}</span>
        <span className="viz-head-extra">
          <span className="viz-presets" role="group" aria-label={COST.batchLabel[lang]}>
            {BATCHES.map((b) => (
              <button
                key={b}
                type="button"
                className={`viz-btn${b === bs ? " primary" : ""}`}
                onClick={() => setBs(b)}
              >
                {COST.batchLabel[lang]} {b}
              </button>
            ))}
          </span>
        </span>
      </div>

      <div className="viz-grid-wrap" ref={wrapRef}>
        <svg
          className="viz-grid"
          style={{ minWidth: 480 }}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={COST.title[lang]}
          onMouseLeave={() => setHover(null)}
        >
          {/* 轴 */}
          <line x1={PADL} y1={H - PADB} x2={W - PADR + 8} y2={H - PADB} stroke="var(--axis)" strokeWidth="1" />
          <line x1={PADL} y1={PADT - 4} x2={PADL} y2={H - PADB} stroke="var(--axis)" strokeWidth="1" />
          {[0, 400, 800, 1200, 1600].map((tick) => (
            <g key={tick}>
              <line x1={x(tick)} y1={H - PADB} x2={x(tick)} y2={H - PADB + 4} stroke="var(--axis)" strokeWidth="1" />
              <text x={x(tick)} y={H - PADB + 15} textAnchor="middle" fontSize="9" fill="var(--muted)">
                {tick}
              </text>
            </g>
          ))}
          {[100, 200, 300].map((tick) => (
            <g key={tick}>
              <line x1={PADL} y1={y(tick)} x2={W - PADR} y2={y(tick)} stroke="var(--grid)" strokeWidth="0.6" />
              <text x={PADL - 6} y={y(tick) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">
                {tick}
              </text>
            </g>
          ))}
          <text x={(PADL + W) / 2} y={H - 3} textAnchor="middle" fontSize="9" fill="var(--muted)">
            {COST.xAxis[lang]}
          </text>
          <text
            x={12}
            y={(PADT + H - PADB) / 2}
            textAnchor="middle"
            fontSize="9"
            fill="var(--muted)"
            transform={`rotate(-90 12 ${(PADT + H - PADB) / 2})`}
          >
            {COST.yAxis[lang]}
          </text>

          {/* 成本直线 T(M) */}
          <line
            x1={x(0)}
            y1={y(stepTime(0))}
            x2={x(MAXM)}
            y2={y(stepTime(MAXM))}
            stroke="var(--ink)"
            strokeWidth="1.6"
            opacity={0.55}
            strokeLinecap="round"
          />

          {/* 三个臂在当前 batch 下的落点 */}
          {ARMS.map((arm) => {
            const m = bs * arm.perReq;
            const t = stepTime(m);
            return (
              <g key={arm.key}>
                <line
                  x1={x(m)}
                  y1={y(t)}
                  x2={x(m)}
                  y2={H - PADB}
                  stroke={arm.color}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity={0.8}
                />
                <circle
                  cx={x(m)}
                  cy={y(t)}
                  r={5}
                  fill={arm.color}
                  stroke="var(--surface)"
                  strokeWidth="1.5"
                  onMouseEnter={(e) => showTooltip(e, costPointTooltip(lang, COST[arm.key][lang], m, t))}
                />
                <text
                  x={x(m)}
                  y={y(t) - 9}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={arm.color}
                >
                  {COST[arm.key][lang]}
                </text>
              </g>
            );
          })}
        </svg>
        {hover && (
          <div
            className="viz-tooltip"
            style={{ left: hover.x, top: hover.y, transform: "translate(-50%, -130%)" }}
          >
            {hover.text}
          </div>
        )}
      </div>

      <div className="viz-footer">
        <div className="viz-stats">
          {ARMS.map((arm) => {
            const m = bs * arm.perReq;
            const t = stepTime(m);
            const speedup = (arm.commit * tBase) / t;
            return (
              <span className="viz-stat" key={arm.key}>
                <span style={{ color: arm.color, fontWeight: 600 }}>{COST[arm.key][lang]}</span>{" "}
                {COST.statM[lang]}=<b>{m}</b> · {COST.statT[lang]} <b>{t.toFixed(0)} ms</b> ·{" "}
                {COST.statCommit[lang]} <b>{arm.commit}</b> · {COST.statSpeedup[lang]}{" "}
                <b>{speedup.toFixed(2)}×</b>
              </span>
            );
          })}
        </div>
        <Legend
          items={ARMS.map((arm) => ({
            label: COST[arm.key][lang],
            swatch: { background: arm.color },
          }))}
        />
      </div>
    </figure>
  );
}
