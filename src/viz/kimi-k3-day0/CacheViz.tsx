import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { CACHE, cacheCellTooltip } from "./strings";
import "./styles.css";

/**
 * cache 账单模型(纯算术，数字口径见文末对照)：
 * - MLA:27 KB/token(24 层合计，Day-0 博客口径)→ 每层 1.125 KB/token;
 * - 假想全 MLA:93 层 × 1.125 ≈ 104.6 KB/token;
 * - KDA:69 层递归状态固定 ≈ 54 MB/请求/GPU(TP=8)，不随上下文变化。
 */
const STEPS = 16;
const STEP_TOKENS = 65536;
const KB_PER_LAYER_TOKEN = 27 / 24;
const K3_MLA_LAYERS = 24;
const HYPO_LAYERS = 93;
const KDA_FIXED_GB = 0.054;
const GB_PER_CELL = 2;

const CELL = 9;
const GAP = 2;
const PITCH = CELL + GAP;
const AXIS_H = 16;

function mlaGb(t: number, layers: number): number {
  return (t * STEP_TOKENS * KB_PER_LAYER_TOKEN * layers) / 1e6;
}

function fmtTokens(t: number): string {
  return t >= STEPS ? "1M" : `${t * 64}K`;
}

/** 3:1 交错示意：前 8 层的排布 */
const STRIP_PATTERN = ["K", "K", "K", "M", "K", "K", "K", "M"] as const;

function CacheBar({
  label,
  layers,
  withKda,
  t,
  lang,
  maxCells,
}: {
  label: string;
  layers: number;
  withKda: boolean;
  t: number;
  lang: Locale;
  maxCells: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const gb = mlaGb(t, layers);
  const cells = Math.round(gb / GB_PER_CELL);
  const kdaOffset = withKda ? PITCH : 0;
  const width = kdaOffset + maxCells * PITCH + 2;
  const height = CELL + AXIS_H + 2;
  const totalGb = gb + (withKda ? KDA_FIXED_GB : 0);

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
    <div className="viz-section">
      <div className="viz-section-head">
        <b>{label}</b>
        <span className="viz-section-stats">
          {CACHE.statContext[lang]} {fmtTokens(t)} token · {CACHE.statCache[lang]}{" "}
          {totalGb < 10 ? totalGb.toFixed(1) : Math.round(totalGb)} GB ·{" "}
          {CACHE.statPerToken[lang]} {Math.round(KB_PER_LAYER_TOKEN * layers)} KB
        </span>
      </div>
      <div className="viz-grid-wrap" ref={wrapRef}>
        <svg
          className="viz-grid"
          style={{ minWidth: 620 }}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={label}
          onMouseLeave={() => setHover(null)}
        >
          {withKda && (
            <rect
              x={0}
              y={1}
              width={CELL}
              height={CELL}
              rx={2.5}
              fill="var(--series-1)"
              stroke="var(--ink)"
              strokeOpacity={0.35}
              strokeWidth="1"
              onMouseEnter={(e) => showTooltip(e, cacheCellTooltip(lang, "kda", layers))}
            />
          )}
          {Array.from({ length: maxCells }, (_, i) => {
            const x = kdaOffset + i * PITCH;
            const filled = i < cells;
            if (!filled) {
              return (
                <rect
                  key={i}
                  x={x}
                  y={1}
                  width={CELL}
                  height={CELL}
                  rx={2.5}
                  fill="none"
                  stroke="var(--grid)"
                  strokeWidth="1"
                />
              );
            }
            return (
              <rect
                key={i}
                className="viz-cell"
                x={x}
                y={1}
                width={CELL}
                height={CELL}
                rx={2.5}
                fill="var(--series-1)"
                opacity={0.45}
                onMouseEnter={(e) => showTooltip(e, cacheCellTooltip(lang, "mla", layers))}
              />
            );
          })}
          {/* GB 刻度：每 10 格 = 20 GB */}
          {Array.from({ length: Math.floor(maxCells / 10) + 1 }, (_, i) => (
            <text
              key={i}
              x={Math.max(kdaOffset + i * 10 * PITCH - GAP / 2, 3)}
              y={CELL + AXIS_H - 3}
              textAnchor="middle"
              fontSize="8"
              fill="var(--muted)"
            >
              {i * 10 * GB_PER_CELL}
            </text>
          ))}
          <text
            x={width - 2}
            y={CELL + AXIS_H - 3}
            textAnchor="end"
            fontSize="8"
            fill="var(--muted)"
          >
            GB
          </text>
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
    </div>
  );
}

/** 上下文 0 → 1M，全 MLA 假想 vs K3 混排的 cache 增长对比 */
export default function CacheViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(STEPS, 2);
  const maxCells = Math.round(mlaGb(STEPS, HYPO_LAYERS) / GB_PER_CELL);

  const legend = [
    { label: CACHE.legendMla[lang], swatch: { background: "var(--series-1)", opacity: 0.45 } },
    {
      label: CACHE.legendKda[lang],
      swatch: {
        background: "var(--series-1)",
        border: "1px solid color-mix(in srgb, var(--ink) 35%, transparent)",
      },
    },
  ];

  return (
    <VizStage
      title={CACHE.title[lang]}
      player={player}
      lang={lang}
      footer={<Legend items={legend} />}
    >
      {/* 3:1 交错排布示意 */}
      <div className="k3a-strip">
        {STRIP_PATTERN.map((kind, i) => (
          <span
            key={i}
            className={`k3a-layer ${kind === "K" ? "k3a-layer-k" : "k3a-layer-m"}`}
            title={CACHE[kind === "K" ? "kLayerTip" : "mLayerTip"][lang]}
          >
            {kind}
          </span>
        ))}
        <span className="k3a-strip-caption">{CACHE.stripCaption[lang]}</span>
      </div>

      <CacheBar
        label={CACHE.hypoLabel[lang]}
        layers={HYPO_LAYERS}
        withKda={false}
        t={player.t}
        lang={lang}
        maxCells={maxCells}
      />
      <CacheBar
        label={CACHE.k3Label[lang]}
        layers={K3_MLA_LAYERS}
        withKda
        t={player.t}
        lang={lang}
        maxCells={maxCells}
      />
    </VizStage>
  );
}
