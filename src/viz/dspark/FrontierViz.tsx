import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { FRONTIER, frontierPointTooltip } from "./strings";
import "./styles.css";

/* 数据点读自原文 Figure 1(近似):[单请求 tok/s, 总吞吐 K tok/s, batch size] */
type Pt = [number, number, number];

const ARMS: { key: "armNonSpec" | "armMtp" | "armDspark"; color: string; pts: Pt[] }[] = [
  {
    key: "armNonSpec",
    color: "var(--axis)",
    pts: [
      [100, 0.1, 1],
      [87, 0.7, 8],
      [75, 1.25, 16],
      [66, 2.1, 32],
      [58, 3.6, 64],
      [48, 5.8, 128],
      [42, 7.6, 192],
      [35, 8.9, 256],
    ],
  },
  {
    key: "armMtp",
    color: "var(--series-1)",
    pts: [
      [200, 0.2, 1],
      [155, 1.25, 8],
      [132, 2.1, 16],
      [110, 3.5, 32],
      [87, 5.6, 64],
      [62, 8.1, 128],
      [55, 9.65, 192],
      [45, 11.15, 256],
    ],
  },
  {
    key: "armDspark",
    color: "var(--series-4)",
    pts: [
      [290, 0.3, 1],
      [228, 1.85, 8],
      [187, 2.95, 16],
      [155, 4.9, 32],
      [111, 7.25, 64],
      [75, 9.75, 128],
      [60, 11.0, 192],
      [48, 12.2, 256],
    ],
  },
];

/** 图上直接标注 batch size 的点 */
const LABELED = new Set([1, 16, 64, 256]);

const W = 560;
const H = 300;
const PADL = 44;
const PADB = 38;
const PADT = 12;
const PADR = 16;
const MAXX = 310;
const MAXY = 13;

function x(v: number): number {
  return PADL + (v / MAXX) * (W - PADL - PADR);
}
function y(v: number): number {
  return PADT + (1 - v / MAXY) * (H - PADT - PADB);
}

export default function FrontierViz({ lang = "zh" }: { lang?: Locale }) {
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

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{FRONTIER.title[lang]}</span>
        <span className="viz-subtitle">{FRONTIER.subtitle[lang]}</span>
      </div>

      <div className="viz-grid-wrap" ref={wrapRef}>
        <svg
          className="viz-grid"
          style={{ minWidth: 520 }}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={FRONTIER.title[lang]}
          onMouseLeave={() => setHover(null)}
        >
          <line x1={PADL} y1={H - PADB} x2={W - PADR + 8} y2={H - PADB} stroke="var(--axis)" strokeWidth="1" />
          <line x1={PADL} y1={PADT - 4} x2={PADL} y2={H - PADB} stroke="var(--axis)" strokeWidth="1" />
          {[0, 50, 100, 150, 200, 250, 300].map((tick) => (
            <g key={tick}>
              <line x1={x(tick)} y1={H - PADB} x2={x(tick)} y2={H - PADB + 4} stroke="var(--axis)" strokeWidth="1" />
              <text x={x(tick)} y={H - PADB + 15} textAnchor="middle" fontSize="9" fill="var(--muted)">
                {tick}
              </text>
            </g>
          ))}
          {[2, 4, 6, 8, 10, 12].map((tick) => (
            <g key={tick}>
              <line x1={PADL} y1={y(tick)} x2={W - PADR} y2={y(tick)} stroke="var(--grid)" strokeWidth="0.6" />
              <text x={PADL - 6} y={y(tick) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">
                {tick}K
              </text>
            </g>
          ))}
          <text x={(PADL + W) / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--muted)">
            {FRONTIER.xAxis[lang]}
          </text>
          <text
            x={12}
            y={(PADT + H - PADB) / 2}
            textAnchor="middle"
            fontSize="9"
            fill="var(--muted)"
            transform={`rotate(-90 12 ${(PADT + H - PADB) / 2})`}
          >
            {FRONTIER.yAxis[lang]}
          </text>

          {ARMS.map((arm) => (
            <g key={arm.key}>
              <polyline
                points={arm.pts.map(([px, py]) => `${x(px)},${y(py)}`).join(" ")}
                fill="none"
                stroke={arm.color}
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {arm.pts.map(([px, py, bs]) => (
                <g key={bs}>
                  <circle
                    cx={x(px)}
                    cy={y(py)}
                    r={4}
                    fill={arm.color}
                    stroke="var(--surface)"
                    strokeWidth="1.2"
                    onMouseEnter={(e) =>
                      showTooltip(e, frontierPointTooltip(lang, FRONTIER[arm.key][lang], bs, px, py))
                    }
                  />
                  {LABELED.has(bs) && (
                    <text
                      x={x(px) + 7}
                      y={y(py) - 6}
                      fontSize="8.5"
                      fill={arm.color}
                    >
                      bs{bs}
                    </text>
                  )}
                </g>
              ))}
            </g>
          ))}
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
        <Legend
          items={ARMS.map((arm) => ({
            label: FRONTIER[arm.key][lang],
            swatch: { background: arm.color },
          }))}
        />
      </div>
    </figure>
  );
}
