import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { GAIN } from "./strings";
import "./styles.css";

/* 数据点读自原文 Figure 3(近似):[单请求 tok/s, 总吞吐 K tok/s, batch size] */
type Pt = [number, number, number];

const PANELS: {
  key: "panelHigh" | "panelLow";
  noTrim: Pt[];
  compact: Pt[];
}[] = [
  {
    key: "panelHigh",
    noTrim: [
      [232, 0.23, 1],
      [124, 1.95, 16],
      [74, 4.65, 64],
      [50, 6.4, 128],
      [33, 8.15, 256],
    ],
    compact: [
      [231, 0.24, 1],
      [125, 1.98, 16],
      [75, 4.75, 64],
      [53, 6.85, 128],
      [36, 9.2, 256],
    ],
  },
  {
    key: "panelLow",
    noTrim: [
      [205, 0.2, 1],
      [108, 1.7, 16],
      [65, 4.05, 64],
      [45, 5.5, 128],
      [27, 7.05, 256],
    ],
    compact: [
      [196, 0.2, 1],
      [113, 1.85, 16],
      [66, 4.4, 64],
      [48, 6.35, 128],
      [33, 8.5, 256],
    ],
  },
];

const LABELED = new Set([1, 256]);

const W = 300;
const H = 200;
const PADL = 34;
const PADB = 34;
const PADT = 10;
const PADR = 12;
const MAXX = 245;
const MAXY = 10;

function x(v: number): number {
  return PADL + (v / MAXX) * (W - PADL - PADR);
}
function y(v: number): number {
  return PADT + (1 - v / MAXY) * (H - PADT - PADB);
}

const ARMS = [
  { key: "armNoTrim", color: "var(--axis)", field: "noTrim" },
  { key: "armTrim", color: "var(--series-4)", field: "compact" },
] as const;

export default function TrimGainViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{GAIN.title[lang]}</span>
        <span className="viz-subtitle">{GAIN.subtitle[lang]}</span>
      </div>

      <div className="viz-grid-wrap">
        <div className="dspark-panels" style={{ minWidth: 560 }}>
          {PANELS.map((panel) => (
            <div key={panel.key}>
              <span className="dspark-panel-head">{GAIN[panel.key][lang]}</span>
              <svg
                className="viz-grid"
                viewBox={`0 0 ${W} ${H}`}
                role="img"
                aria-label={GAIN[panel.key][lang]}
              >
                <line x1={PADL} y1={H - PADB} x2={W - PADR + 6} y2={H - PADB} stroke="var(--axis)" strokeWidth="1" />
                <line x1={PADL} y1={PADT - 4} x2={PADL} y2={H - PADB} stroke="var(--axis)" strokeWidth="1" />
                {[0, 50, 100, 150, 200].map((tick) => (
                  <g key={tick}>
                    <line x1={x(tick)} y1={H - PADB} x2={x(tick)} y2={H - PADB + 4} stroke="var(--axis)" strokeWidth="1" />
                    <text x={x(tick)} y={H - PADB + 14} textAnchor="middle" fontSize="8.5" fill="var(--muted)">
                      {tick}
                    </text>
                  </g>
                ))}
                {[2, 4, 6, 8].map((tick) => (
                  <g key={tick}>
                    <line x1={PADL} y1={y(tick)} x2={W - PADR} y2={y(tick)} stroke="var(--grid)" strokeWidth="0.6" />
                    <text x={PADL - 5} y={y(tick) + 3} textAnchor="end" fontSize="8.5" fill="var(--muted)">
                      {tick}K
                    </text>
                  </g>
                ))}
                <text x={(PADL + W) / 2} y={H - 3} textAnchor="middle" fontSize="8.5" fill="var(--muted)">
                  {GAIN.xAxis[lang]}
                </text>

                {ARMS.map((arm) => {
                  const pts = panel[arm.field];
                  return (
                    <g key={arm.key}>
                      <polyline
                        points={pts.map(([px, py]) => `${x(px)},${y(py)}`).join(" ")}
                        fill="none"
                        stroke={arm.color}
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      {pts.map(([px, py, bs]) => (
                        <g key={bs}>
                          <circle cx={x(px)} cy={y(py)} r={3.4} fill={arm.color} stroke="var(--surface)" strokeWidth="1" />
                          {LABELED.has(bs) && arm.key === "armTrim" && (
                            <text x={x(px) + 5} y={y(py) - 5} fontSize="8" fill={arm.color}>
                              bs{bs}
                            </text>
                          )}
                        </g>
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>
          ))}
        </div>
      </div>

      <div className="viz-footer">
        <Legend
          items={ARMS.map((arm) => ({
            label: GAIN[arm.key][lang],
            swatch: { background: arm.color },
          }))}
        />
      </div>
    </figure>
  );
}
