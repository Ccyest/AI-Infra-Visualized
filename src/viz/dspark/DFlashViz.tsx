import { useId, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { DFLASH, dflashCellTooltip, dflashInjectTooltip } from "./strings";
import "./styles.css";

const BLOCK = 8;
const LAYERS = 5;

const CELL = 20;
const GAP = 4;
const PITCH = CELL + GAP;
/* 左侧 draft 层堆叠 */
const LAYER_W = 64;
const LAYER_H = 12;
const LAYER_GAP = 6;
const STACK_X = 96;
const TOKENS_X = STACK_X + LAYER_W + 56;

interface PanelProps {
  mode: "ar" | "df";
  lang: Locale;
  showTooltip: (e: ReactMouseEvent, text: string) => void;
  hide: () => void;
  uid: string;
}

function Panel({ mode, lang, showTooltip, hide, uid }: PanelProps) {
  const stackH = LAYERS * (LAYER_H + LAYER_GAP) - LAYER_GAP;
  const height = Math.max(stackH, CELL) + 34;
  const width = TOKENS_X + BLOCK * PITCH + 8;
  const stackTop = 6;
  const tokenY = stackTop + (stackH - CELL) / 2;

  return (
    <svg
      className="viz-grid"
      style={{ minWidth: 560 }}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={DFLASH[mode === "ar" ? "arHead" : "dfHead"][lang]}
      onMouseLeave={hide}
    >
      <defs>
        <marker
          id={`dfarrow-${uid}-${mode}`}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 0 8 4 0 8Z" fill="var(--series-3)" />
        </marker>
        <marker
          id={`dfchain-${uid}-${mode}`}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto"
        >
          <path d="M0 0 8 4 0 8Z" fill="var(--muted)" />
        </marker>
      </defs>

      {/* draft 层堆叠 */}
      {Array.from({ length: LAYERS }, (_, l) => {
        const y = stackTop + l * (LAYER_H + LAYER_GAP);
        return (
          <g key={l}>
            <rect
              x={STACK_X}
              y={y}
              width={LAYER_W}
              height={LAYER_H}
              rx={3}
              fill="color-mix(in srgb, var(--ink) 14%, transparent)"
            />
            {/* 注入箭头:AR 只有输入端一条,DFlash 每层一条 */}
            {(mode === "df" || l === LAYERS - 1) && (
              <line
                x1={STACK_X - 40}
                y1={mode === "df" ? y + LAYER_H / 2 : stackTop + stackH + 6}
                x2={STACK_X - 4}
                y2={mode === "df" ? y + LAYER_H / 2 : stackTop + stackH - LAYER_H / 2}
                stroke="var(--series-3)"
                strokeWidth="1.6"
                markerEnd={`url(#dfarrow-${uid}-${mode})`}
                onMouseEnter={(e) => showTooltip(e, dflashInjectTooltip(lang, mode, l))}
              />
            )}
          </g>
        );
      })}
      <text
        x={STACK_X + LAYER_W / 2}
        y={stackTop + stackH + 16}
        textAnchor="middle"
        fontSize="9"
        fill="var(--muted)"
      >
        {DFLASH.layerLabel[lang]} ×{LAYERS}
      </text>
      <text
        x={STACK_X - 44}
        y={mode === "df" ? stackTop - 0.5 : stackTop + stackH + 17}
        textAnchor="end"
        fontSize="9"
        fill="var(--series-3)"
      >
        {DFLASH[mode === "ar" ? "arInjectLabel" : "dfInjectLabel"][lang]}
      </text>

      {/* 层堆叠 → token 行 */}
      <line
        x1={STACK_X + LAYER_W + 4}
        y1={tokenY + CELL / 2}
        x2={TOKENS_X - 6}
        y2={tokenY + CELL / 2}
        stroke="var(--muted)"
        strokeWidth="1.3"
        markerEnd={`url(#dfchain-${uid}-${mode})`}
      />

      {/* 草稿 token 行 */}
      {Array.from({ length: BLOCK }, (_, p) => (
        <g key={p}>
          <rect
            className="viz-cell"
            x={TOKENS_X + p * PITCH}
            y={tokenY}
            width={CELL}
            height={CELL}
            rx={3}
            fill="var(--series-2)"
            onMouseEnter={(e) => showTooltip(e, dflashCellTooltip(lang, mode, p))}
          />
          {mode === "ar" && p < BLOCK - 1 && (
            <line
              x1={TOKENS_X + p * PITCH + CELL + 1}
              y1={tokenY + CELL / 2}
              x2={TOKENS_X + (p + 1) * PITCH - 2}
              y2={tokenY + CELL / 2}
              stroke="var(--muted)"
              strokeWidth="1.3"
              markerEnd={`url(#dfchain-${uid}-${mode})`}
            />
          )}
        </g>
      ))}
      {/* DFlash:整块括号 = 一次 forward */}
      {mode === "df" && (
        <>
          <path
            d={`M ${TOKENS_X} ${tokenY + CELL + 7} v 4 h ${BLOCK * PITCH - GAP} v -4`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
          />
          <text
            x={TOKENS_X + (BLOCK * PITCH - GAP) / 2}
            y={tokenY + CELL + 22}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="600"
            fill="var(--accent)"
          >
            {DFLASH.oneForward[lang]}
          </text>
        </>
      )}
    </svg>
  );
}

export default function DFlashViz({ lang = "zh" }: { lang?: Locale }) {
  const uid = useId();
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
        <span className="viz-title">{DFLASH.title[lang]}</span>
        <span className="viz-subtitle">{DFLASH.subtitle[lang]}</span>
      </div>

      <div className="viz-grid-wrap" ref={wrapRef}>
        <div className="viz-section">
          <div className="viz-section-head">
            <b>{DFLASH.arHead[lang]}</b>
            <span className="viz-section-stats">{DFLASH.arStat[lang]}</span>
          </div>
          <Panel mode="ar" lang={lang} showTooltip={showTooltip} hide={() => setHover(null)} uid={uid} />
        </div>
        <div className="viz-section">
          <div className="viz-section-head">
            <b>{DFLASH.dfHead[lang]}</b>
            <span className="viz-section-stats">{DFLASH.dfStat[lang]}</span>
          </div>
          <Panel mode="df" lang={lang} showTooltip={showTooltip} hide={() => setHover(null)} uid={uid} />
        </div>
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
          items={[
            { label: DFLASH.legendToken[lang], swatch: { background: "var(--series-2)" } },
            { label: DFLASH.legendInject[lang], swatch: { background: "var(--series-3)" } },
          ]}
        />
      </div>
    </figure>
  );
}
