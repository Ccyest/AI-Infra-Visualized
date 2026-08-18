import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { REUSE } from "./strings";
import "./styles.css";

/* 地址 × 时间视图,教学示例:一个 shape 3 个 segment。
   左 = 每段中间量各锁一份(常驻叠三层);右 = BCG 段间同址复用 + boundary 例外。
   下方单独画输出 buffer 的跨 size 共享。高度为教学比例,不代表真实字节数。 */

const W = 300;
const H = 172;
const X0 = 14;
const X1 = 288;
const SEG_W = 82;
const GAP = 14;
const BAND_H = 34;
const BAND_GAP = 4;
const AXIS_Y = 150;

/* 三个 segment 的时间窗口 */
const SEGS = [1, 2, 3].map((i) => {
  const x = X0 + (i - 1) * (SEG_W + GAP);
  return { i, x, cx: x + SEG_W / 2 };
});
const BREAKS = [X0 + SEG_W + GAP / 2, X0 + 2 * SEG_W + 1.5 * GAP];

/* 自下而上的三层 band(左图);右图只用最下面一层 */
const bandY = (level: number) => AXIS_Y - 4 - (level + 1) * BAND_H - level * BAND_GAP;
const NAIVE_TOP = bandY(2);

const LIGHT = "color-mix(in srgb, var(--series-1) 14%, var(--surface))";
const LIGHT_EDGE = "color-mix(in srgb, var(--series-1) 35%, var(--grid))";
const DARK = "color-mix(in srgb, var(--series-1) 45%, var(--surface))";
const DARK_EDGE = "color-mix(in srgb, var(--series-1) 65%, var(--grid))";
const BOUNDARY = "color-mix(in srgb, var(--series-7) 30%, var(--surface))";

function Axis({ lang }: { lang: Locale }) {
  return (
    <g>
      <line x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} stroke="var(--axis)" strokeWidth="1" />
      {SEGS.map((s) => (
        <text key={s.i} x={s.cx} y={AXIS_Y + 14} textAnchor="middle" fontSize="9" fill="var(--muted)">
          seg{s.i}
        </text>
      ))}
      {BREAKS.map((bx) => (
        <text key={bx} x={bx} y={AXIS_Y + 14} textAnchor="middle" fontSize="7.5" fill="var(--muted)">
          {REUSE.breakLabel[lang]}
        </text>
      ))}
    </g>
  );
}

export default function MemReuseViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage bcg-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{REUSE.title[lang]}</span>
        <span className="viz-subtitle">{REUSE.subtitle[lang]}</span>
      </div>

      <div className="bcg-bench">
        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{REUSE.rowNaive[lang]}</span>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={REUSE.rowNaive[lang]}>
            {SEGS.map((s, level) => {
              const y = bandY(level);
              return (
                <g key={s.i}>
                  <rect x={X0} y={y} width={X1 - X0} height={BAND_H} rx="3" fill={LIGHT} stroke={LIGHT_EDGE} />
                  <rect x={s.x} y={y} width={SEG_W} height={BAND_H} rx="3" fill={DARK} stroke={DARK_EDGE} />
                  <text x={X0 + 5} y={y + BAND_H / 2 + 3} fontSize="8.5" fill="var(--ink-2)">
                    seg{s.i} {REUSE.segIntermediates[lang]}
                  </text>
                </g>
              );
            })}
            <Axis lang={lang} />
          </svg>
        </div>

        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{REUSE.rowBcg[lang]}</span>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={REUSE.rowBcg[lang]}>
            {/* 共用 pool:三段在同一地址带内先后使用 */}
            <rect x={X0} y={bandY(0)} width={X1 - X0} height={BAND_H} rx="3" fill={LIGHT} stroke={LIGHT_EDGE} />
            {SEGS.map((s) => (
              <g key={s.i}>
                <rect x={s.x} y={bandY(0)} width={SEG_W} height={BAND_H} rx="3" fill={DARK} stroke={DARK_EDGE} />
                <text x={s.cx} y={bandY(0) + BAND_H / 2 + 3} textAnchor="middle" fontSize="8.5" fill="var(--ink-2)">
                  seg{s.i} {REUSE.segIntermediates[lang]}
                </text>
              </g>
            ))}
            <text x={X0} y={bandY(0) - 5} fontSize="8" fill="var(--muted)">
              {REUSE.poolBlock[lang]}
            </text>

            {/* boundary buffer:常驻,断点处原地更新 */}
            <rect x={X0} y={86} width={X1 - X0} height={12} rx="2" fill={BOUNDARY} stroke="var(--series-7)" />
            <text x={X0 + 5} y={95.5} fontSize="8" fill="var(--ink-2)">
              {REUSE.boundaryBand[lang]}
            </text>
            {BREAKS.map((bx) => (
              <polygon key={bx} points={`${bx - 3.5},78 ${bx + 3.5},78 ${bx},85`} fill="var(--series-7)" />
            ))}
            <text x={X1} y={82} textAnchor="end" fontSize="7.5" fill="var(--muted)">
              {REUSE.inPlace[lang]}
            </text>

            {/* 左图总量参照线与省下的部分 */}
            <line
              x1={X0}
              y1={NAIVE_TOP}
              x2={X1}
              y2={NAIVE_TOP}
              stroke="var(--muted)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text x={X0 + 2} y={NAIVE_TOP - 5} fontSize="7.5" fill="var(--muted)">
              {REUSE.naiveTotalLine[lang]}
            </text>
            <line x1={120} y1={NAIVE_TOP + 5} x2={120} y2={80} stroke="var(--ink-2)" strokeWidth="1" />
            <polygon points={`116.5,${NAIVE_TOP + 9} 123.5,${NAIVE_TOP + 9} 120,${NAIVE_TOP + 3}`} fill="var(--ink-2)" />
            <polygon points="116.5,76 123.5,76 120,82" fill="var(--ink-2)" />
            <text x={127} y={(NAIVE_TOP + 86) / 2 + 3} fontSize="8" fill="var(--ink-2)">
              {REUSE.savedLabel[lang]}
            </text>

            <Axis lang={lang} />
          </svg>
        </div>
      </div>

      <div className="bcg-outbuf">
        <div className="bcg-outbuf-head">
          <span className="bcg-bench-head" style={{ color: "var(--ink-2)" }}>
            {REUSE.outbufTitle[lang]}
          </span>
          <span className="bcg-bench-note">{REUSE.outbufNote[lang]}</span>
        </div>
        <div className="bcg-outbuf-box">
          <i style={{ width: "38%" }}>{REUSE.outRowSmall[lang]}</i>
          <i style={{ width: "66%" }}>{REUSE.outRowMid[lang]}</i>
          <i style={{ width: "100%" }}>{REUSE.outRowMax[lang]}</i>
        </div>
        <span className="bcg-bench-note">{REUSE.outNote[lang]}</span>
      </div>

      <div className="viz-footer">
        <span className="bcg-pad-note">{REUSE.weakNote[lang]}</span>
        <Legend
          items={[
            { label: REUSE.pinnedTag[lang], swatch: { background: LIGHT, border: `1px solid ${LIGHT_EDGE}` } },
            { label: REUSE.activeTag[lang], swatch: { background: DARK, border: `1px solid ${DARK_EDGE}` } },
            {
              label: REUSE.boundaryTag[lang],
              swatch: { background: BOUNDARY, border: "1.5px solid var(--series-7)" },
            },
          ]}
        />
      </div>
    </figure>
  );
}
