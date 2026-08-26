import { useMemo, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { MHC_VIZ } from "./strings";
import "./styles.css";

/**
 * mHC:hc_mult = 4 的残差流经过 4×4 混合矩阵 H。
 * k = 0 就是无约束的 HC;每按一次 Sinkhorn 就做一轮「行归一 + 列归一」,
 * 行和列和收敛到 1(双随机),右侧 45 层深度上的信号强度曲线随之变平。
 * 初始矩阵是手写示意值;信号强度用最大行和的 L 次幂近似。
 */

const H0 = [
  [0.9, 0.3, 0.1, 0.2],
  [0.2, 1.1, 0.3, 0.1],
  [0.4, 0.2, 0.8, 0.3],
  [0.1, 0.3, 0.2, 1.0],
];
const N = 4;
const LAYERS = 45;
const MAX_ITERS = 20; // config: hc_sinkhorn_iters

function sinkhorn(k: number): number[][] {
  let m = H0.map((r) => [...r]);
  for (let it = 0; it < k; it++) {
    m = m.map((row) => {
      const s = row.reduce((a, b) => a + b, 0);
      return row.map((v) => v / s);
    });
    for (let j = 0; j < N; j++) {
      let s = 0;
      for (let i = 0; i < N; i++) s += m[i][j];
      for (let i = 0; i < N; i++) m[i][j] /= s;
    }
  }
  return m;
}

export default function MhcViz({ lang = "zh" }: { lang?: Locale }) {
  const [k, setK] = useState(0);
  const m = useMemo(() => sinkhorn(k), [k]);

  const rowSums = m.map((r) => r.reduce((a, b) => a + b, 0));
  const colSums = Array.from({ length: N }, (_, j) => m.reduce((a, r) => a + r[j], 0));
  const gain = Math.max(...rowSums);

  // 深度曲线:log10(gain^L),纵轴 10^0 .. 10^6,超出封顶
  const CH_X = 560;
  const CH_W = 360;
  const CH_Y = 52;
  const CH_H = 230;
  const logMax = 6;
  const px = (L: number) => CH_X + (L / LAYERS) * CH_W;
  const py = (logV: number) => CH_Y + CH_H - (Math.min(Math.max(logV, -0.4), logMax) + 0.4) / (logMax + 0.4) * CH_H;
  const path = Array.from({ length: LAYERS + 1 }, (_, L) => {
    const logV = L * Math.log10(gain);
    return `${L === 0 ? "M" : "L"} ${px(L).toFixed(1)} ${py(logV).toFixed(1)}`;
  }).join(" ");

  const MAT_X = 190;
  const MAT_Y = 60;
  const CELL = 52;
  const near1 = (s: number) => Math.abs(s - 1) < 0.005;

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{MHC_VIZ.title[lang]}</span>
        <span className="viz-subtitle">{MHC_VIZ.subtitle[lang]}</span>
      </div>

      <div className="viz-controls">
        <span className="viz-presets" role="group">
          <button type="button" className={`viz-btn${k === 0 ? " primary" : ""}`} onClick={() => setK(0)}>
            {MHC_VIZ.modeHc[lang]}
          </button>
          <button type="button" className="viz-btn" onClick={() => setK((v) => Math.min(v + 1, MAX_ITERS))}>
            {MHC_VIZ.sinkhornStep[lang]}
          </button>
          <button type="button" className={`viz-btn${k >= MAX_ITERS ? " primary" : ""}`} onClick={() => setK(MAX_ITERS)}>
            {MHC_VIZ.modeMhc[lang]}
          </button>
        </span>
        <span className="viz-hint">
          {MHC_VIZ.iterLabel[lang]} {k} / {MAX_ITERS}
        </span>
      </div>

      <div className="viz-grid-wrap">
        <svg className="viz-grid" style={{ minWidth: 760 }} viewBox="0 0 960 340" role="img" aria-label={MHC_VIZ.title[lang]}>
          {/* 输入 / 输出残差流 */}
          {Array.from({ length: N }, (_, i) => {
            const y = MAT_Y + i * CELL + CELL / 2;
            return (
              <g key={`lane-${i}`}>
                <line x1={60} y1={y} x2={MAT_X - 6} y2={y} stroke={seriesColor(i + 1)} strokeWidth={3} strokeLinecap="round" />
                <line x1={MAT_X + N * CELL + 6} y1={y} x2={470} y2={y} stroke={seriesColor(i + 1)} strokeWidth={3} strokeLinecap="round" opacity={0.55} />
              </g>
            );
          })}
          <text x={60} y={MAT_Y - 18} fontSize={9.5} fill="var(--muted)">
            {MHC_VIZ.streams[lang]}
          </text>

          {/* 混合矩阵 */}
          <text x={MAT_X + (N * CELL) / 2} y={MAT_Y - 18} textAnchor="middle" fontSize={10.5} fontWeight={650} fill="var(--ink)">
            {MHC_VIZ.mixMatrix[lang]}
          </text>
          {m.map((row, i) =>
            row.map((v, j) => (
              <g key={`c-${i}-${j}`} className="g53-mat-cell">
                <rect
                  x={MAT_X + j * CELL}
                  y={MAT_Y + i * CELL}
                  width={CELL - 3}
                  height={CELL - 3}
                  rx={6}
                  fill={`color-mix(in srgb, var(--series-2) ${Math.round(Math.min(v, 1.2) * 55)}%, var(--surface))`}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text x={MAT_X + j * CELL + (CELL - 3) / 2} y={MAT_Y + i * CELL + CELL / 2 + 2} textAnchor="middle" fontSize={10} fill="var(--ink)">
                  {v.toFixed(2)}
                </text>
              </g>
            )),
          )}

          {/* 行和 / 列和 */}
          <text x={MAT_X + N * CELL + 58} y={MAT_Y - 6} textAnchor="middle" fontSize={9} fill="var(--muted)">
            {MHC_VIZ.rowSums[lang]}
          </text>
          {rowSums.map((s, i) => (
            <text key={`rs-${i}`} x={MAT_X + N * CELL + 58} y={MAT_Y + i * CELL + CELL / 2 + 3} textAnchor="middle" fontSize={10.5} fontWeight={650} fill={near1(s) ? "var(--good)" : "var(--bad, var(--series-5))"}>
              {s.toFixed(2)}
            </text>
          ))}
          <text x={MAT_X - 34} y={MAT_Y + N * CELL + 24} fontSize={9} fill="var(--muted)">
            {MHC_VIZ.colSums[lang]}
          </text>
          {colSums.map((s, j) => (
            <text key={`cs-${j}`} x={MAT_X + j * CELL + (CELL - 3) / 2} y={MAT_Y + N * CELL + 24} textAnchor="middle" fontSize={10.5} fontWeight={650} fill={near1(s) ? "var(--good)" : "var(--bad, var(--series-5))"}>
              {s.toFixed(2)}
            </text>
          ))}

          {/* 右:45 层深度上的信号强度(对数轴) */}
          <text x={CH_X + CH_W / 2} y={CH_Y - 22} textAnchor="middle" fontSize={10.5} fontWeight={650} fill="var(--ink)">
            {MHC_VIZ.depthChart[lang]}
          </text>
          <line x1={CH_X} y1={CH_Y} x2={CH_X} y2={CH_Y + CH_H} stroke="var(--axis)" strokeWidth={1} />
          <line x1={CH_X} y1={CH_Y + CH_H} x2={CH_X + CH_W} y2={CH_Y + CH_H} stroke="var(--axis)" strokeWidth={1} />
          {[0, 2, 4, 6].map((e) => (
            <g key={`tick-${e}`}>
              <line x1={CH_X - 4} y1={py(e)} x2={CH_X + CH_W} y2={py(e)} stroke="var(--grid)" strokeWidth={0.7} />
              <text x={CH_X - 8} y={py(e) + 3} textAnchor="end" fontSize={9} fill="var(--muted)">
                {e === 0 ? "1" : `10${["", "", "²", "", "⁴", "", "⁶"][e]}`}
              </text>
            </g>
          ))}
          {[0, 15, 30, 45].map((L) => (
            <text key={`xl-${L}`} x={px(L)} y={CH_Y + CH_H + 16} textAnchor="middle" fontSize={9} fill="var(--muted)">
              {L}
            </text>
          ))}
          <text x={CH_X + CH_W / 2} y={CH_Y + CH_H + 32} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
            {MHC_VIZ.layerAxis[lang]}
          </text>
          <line x1={CH_X} y1={py(0)} x2={CH_X + CH_W} y2={py(0)} stroke="var(--good)" strokeWidth={1} strokeDasharray="5 4" />
          <path d={path} fill="none" stroke="var(--series-1)" strokeWidth={2.2} />
          <text x={CH_X + CH_W - 4} y={py(LAYERS * Math.log10(gain)) - 8} textAnchor="end" fontSize={10} fontWeight={650} fill="var(--series-1)">
            {gain > 1.005 ? `${gain.toFixed(2)}^45` : "≈1"}
          </text>
        </svg>
      </div>
    </figure>
  );
}
