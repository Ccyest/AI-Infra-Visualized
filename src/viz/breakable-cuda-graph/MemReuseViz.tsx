import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { REUSE } from "./strings";
import "./styles.css";

/* 优化前 / 优化后 对照,教学示例:一个 shape 3 个 segment、3 个 capture size。
   纵轴为显存地址,横轴为一次 replay 的时间;两栏共用同一套坐标,高度可直接比较。
   优化前:每段中间结果、每个 size 的输出各占一块并长期保留;
   优化后:三段共用一个 pool(块在时间上依次移动)、输出 buffer 一块、boundary 例外。 */

const W = 300;
const H = 215;
const GUT_X = 58;
const BX0 = 62;
const BX1 = 292;
const AXIS_Y = 190;
const SEG_W = (BX1 - BX0 - 16) / 3;

const SEGS = [0, 1, 2].map((i) => {
  const x = BX0 + i * (SEG_W + 8);
  return { i: i + 1, x, cx: x + SEG_W / 2 };
});
const BREAKS = [BX0 + SEG_W + 4, BX0 + 2 * SEG_W + 12];

const TOP_BEFORE = 30;
const TOP_AFTER = 128;

const INT_FILL = "color-mix(in srgb, var(--series-1) 14%, var(--surface))";
const INT_EDGE = "color-mix(in srgb, var(--series-1) 35%, var(--grid))";
const ACT_FILL = "color-mix(in srgb, var(--series-1) 45%, var(--surface))";
const ACT_EDGE = "color-mix(in srgb, var(--series-1) 65%, var(--grid))";
const OUT_FILL = "color-mix(in srgb, var(--series-4) 30%, var(--surface))";
const OUT_EDGE = "color-mix(in srgb, var(--series-4) 55%, var(--grid))";
const BND_FILL = "color-mix(in srgb, var(--series-7) 30%, var(--surface))";

interface Row {
  y: number;
  h: number;
  label: string;
  fill: string;
  edge: string;
  /** 该行在哪些 segment 时间窗内被使用中 */
  active?: number[];
  /** 在 active 块内标注 seg 编号 */
  numbered?: boolean;
  /** 断点处画原地更新的标记 */
  marks?: boolean;
}

function Band({ row }: { row: Row }) {
  return (
    <g>
      <rect
        x={BX0}
        y={row.y}
        width={BX1 - BX0}
        height={row.h}
        rx="3"
        fill={row.fill}
        stroke={row.edge}
      />
      {row.active?.map((n) => {
        const s = SEGS[n - 1];
        return (
          <g key={n}>
            <rect
              x={s.x}
              y={row.y}
              width={SEG_W}
              height={row.h}
              rx="3"
              fill={ACT_FILL}
              stroke={ACT_EDGE}
            />
            {row.numbered && (
              <text
                x={s.cx}
                y={row.y + row.h / 2 + 3}
                textAnchor="middle"
                fontSize="8.5"
                fill="var(--ink-2)"
              >
                seg{s.i}
              </text>
            )}
          </g>
        );
      })}
      {row.marks &&
        BREAKS.map((bx) => (
          <circle key={bx} cx={bx} cy={row.y + row.h / 2} r="2.6" fill="var(--series-7)" />
        ))}
      <text
        x={GUT_X}
        y={row.y + row.h / 2 + 3}
        textAnchor="end"
        fontSize={row.h > 14 ? "8" : "7"}
        fill="var(--muted)"
      >
        {row.label}
      </text>
    </g>
  );
}

function TimeAxis({ lang }: { lang: Locale }) {
  return (
    <g>
      <line x1={BX0} y1={AXIS_Y} x2={BX1} y2={AXIS_Y} stroke="var(--axis)" strokeWidth="1" />
      {SEGS.map((s) => (
        <text key={s.i} x={s.cx} y={AXIS_Y + 12} textAnchor="middle" fontSize="8" fill="var(--muted)">
          seg{s.i}
        </text>
      ))}
      {BREAKS.map((bx) => (
        <text key={bx} x={bx} y={AXIS_Y + 12} textAnchor="middle" fontSize="7" fill="var(--muted)">
          {REUSE.breakLabel[lang]}
        </text>
      ))}
    </g>
  );
}

export default function MemReuseViz({ lang = "zh" }: { lang?: Locale }) {
  const before: Row[] = [
    ...SEGS.map((s, idx) => ({
      y: 156 - idx * 28,
      h: 24,
      label: `seg${s.i} ${REUSE.segInt[lang]}`,
      fill: INT_FILL,
      edge: INT_EDGE,
      active: [s.i],
    })),
    { y: 86, h: 10, label: REUSE.breakTensor[lang], fill: INT_FILL, edge: INT_EDGE },
    ...[1, 2, 3].map((n) => ({
      y: 72 - (n - 1) * 14,
      h: 10,
      label: `size${n} ${REUSE.outRow[lang]}`,
      fill: OUT_FILL,
      edge: OUT_EDGE,
    })),
    {
      y: TOP_BEFORE,
      h: 10,
      label: REUSE.boundaryRow[lang],
      fill: BND_FILL,
      edge: "var(--series-7)",
      marks: true,
    },
  ];

  const after: Row[] = [
    {
      y: 156,
      h: 24,
      label: REUSE.poolRow[lang],
      fill: INT_FILL,
      edge: INT_EDGE,
      active: [1, 2, 3],
      numbered: true,
    },
    { y: 142, h: 10, label: REUSE.outMax[lang], fill: OUT_FILL, edge: OUT_EDGE },
    {
      y: TOP_AFTER,
      h: 10,
      label: REUSE.boundaryRow[lang],
      fill: BND_FILL,
      edge: "var(--series-7)",
      marks: true,
    },
  ];

  const bracketX = BX0 + 112;

  return (
    <figure className="viz-stage bcg-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{REUSE.title[lang]}</span>
        <span className="viz-subtitle">{REUSE.subtitle[lang]}</span>
      </div>

      <div className="bcg-bench">
        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{REUSE.headBefore[lang]}</span>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={REUSE.headBefore[lang]}>
            {before.map((row) => (
              <Band key={row.label} row={row} />
            ))}
            <text x={BX1} y={TOP_BEFORE - 6} textAnchor="end" fontSize="8" fill="var(--ink-2)">
              {REUSE.totalBefore[lang]}
            </text>
            <TimeAxis lang={lang} />
          </svg>
        </div>

        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{REUSE.headAfter[lang]}</span>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={REUSE.headAfter[lang]}>
            {after.map((row) => (
              <Band key={row.label} row={row} />
            ))}

            {/* 优化前的总量参照线 + 省下的部分 */}
            <line
              x1={BX0}
              y1={TOP_BEFORE}
              x2={BX1}
              y2={TOP_BEFORE}
              stroke="var(--muted)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text x={BX1} y={TOP_BEFORE - 6} textAnchor="end" fontSize="8" fill="var(--muted)">
              {REUSE.refBefore[lang]}
            </text>
            <line
              x1={bracketX}
              y1={TOP_BEFORE + 3}
              x2={bracketX}
              y2={TOP_AFTER - 3}
              stroke="var(--ink-2)"
              strokeWidth="1"
            />
            <polygon
              points={`${bracketX - 3.2},${TOP_BEFORE + 7} ${bracketX + 3.2},${TOP_BEFORE + 7} ${bracketX},${TOP_BEFORE + 1}`}
              fill="var(--ink-2)"
            />
            <polygon
              points={`${bracketX - 3.2},${TOP_AFTER - 7} ${bracketX + 3.2},${TOP_AFTER - 7} ${bracketX},${TOP_AFTER - 1}`}
              fill="var(--ink-2)"
            />
            <text
              x={bracketX + 6}
              y={(TOP_BEFORE + TOP_AFTER) / 2 + 3}
              fontSize="8"
              fill="var(--ink-2)"
            >
              {REUSE.saved[lang]}
            </text>

            <text x={BX0} y={TOP_AFTER - 8} fontSize="7.5" fill="var(--muted)">
              {REUSE.weakRefAnnot[lang]}
            </text>

            <TimeAxis lang={lang} />
          </svg>
        </div>
      </div>

      <div className="viz-footer">
        <span className="bcg-pad-note">{REUSE.axesNote[lang]}</span>
        <Legend
          items={[
            { label: REUSE.pinnedTag[lang], swatch: { background: INT_FILL, border: `1px solid ${INT_EDGE}` } },
            { label: REUSE.activeTag[lang], swatch: { background: ACT_FILL, border: `1px solid ${ACT_EDGE}` } },
            { label: REUSE.outTag[lang], swatch: { background: OUT_FILL, border: `1px solid ${OUT_EDGE}` } },
            { label: REUSE.boundaryTag[lang], swatch: { background: BND_FILL, border: "1.5px solid var(--series-7)" } },
          ]}
        />
      </div>
    </figure>
  );
}
