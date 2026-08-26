import { useId, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { BLOCK, blockCellTooltip } from "./strings";
import "./styles.css";

/* 脚本化的一个草稿块:原始分系统性偏自信,STS 校准后下移 */
const GAMMA = 6;
const RAW = [0.97, 0.93, 0.85, 0.72, 0.55, 0.38];
const STS = [0.92, 0.85, 0.71, 0.55, 0.34, 0.18];
const CUM = STS.reduce<number[]>((acc, p, i) => {
  acc.push((i === 0 ? 1 : acc[i - 1]) * p);
  return acc;
}, []);
/** scheduler 的切点:块存活率 ≥ 0.25 的最长前缀 */
const THRESHOLD = 0.25;
const WINDOW = CUM.filter((c) => c >= THRESHOLD).length;

const CTX = 4;
const CELL = 34;
const GAP = 14;
const PITCH = CELL + GAP;
const LABEL_W = 132;
const ROW_H = 26;

const HATCH_CSS =
  "repeating-linear-gradient(45deg, transparent 0 3px, var(--axis) 3px 4.5px)";

/* 播放步:1=起草 2=原始分 3=校准 4=连乘 5=切窗口 */
const STAGES = ["stageDraft", "stageRaw", "stageSts", "stageCum", "stageCut"] as const;

export default function BlockDraftViz({ lang = "zh" }: { lang?: Locale }) {
  const uid = useId();
  const hatchId = `bdhatch-${uid}`;
  const player = useSimPlayer(STAGES.length, 0.8);
  const t = player.t;
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

  const blockX = (i: number) => LABEL_W + (CTX + 0.6 + i) * PITCH;
  const yBlock = 34;
  const yRaw = yBlock + CELL + 16;
  const ySts = yRaw + ROW_H;
  const yCum = ySts + ROW_H;
  const width = blockX(GAMMA) + 8;
  const height = yCum + ROW_H + 6;

  return (
    <VizStage
      title={BLOCK.title[lang]}
      subtitle={BLOCK.subtitle[lang]}
      player={player}
      lang={lang}
      footer={
        <Legend
          items={[
            { label: BLOCK.legendKept[lang], swatch: { background: "var(--series-2)" } },
            {
              label: BLOCK.legendTrimmed[lang],
              swatch: { background: HATCH_CSS, border: "1px solid var(--grid)" },
            },
          ]}
        />
      }
    >
      <div className="viz-grid-wrap" ref={wrapRef}>
        <svg
          className="viz-grid"
          style={{ minWidth: 620 }}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={BLOCK.title[lang]}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <pattern
              id={hatchId}
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="5" height="5" fill="color-mix(in srgb, var(--ink) 4%, transparent)" />
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--axis)" strokeWidth="1.4" />
            </pattern>
            <marker id={`bdarrow-${uid}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 8 4 0 8Z" fill="var(--muted)" />
            </marker>
          </defs>

          {/* 已提交前缀 + drafter */}
          <text x={LABEL_W - 8} y={yBlock + CELL / 2 + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
            {BLOCK.ctxLabel[lang]}
          </text>
          {Array.from({ length: CTX }, (_, i) => (
            <rect
              key={i}
              x={LABEL_W + i * PITCH}
              y={yBlock}
              width={CELL}
              height={CELL}
              rx={4}
              fill="color-mix(in srgb, var(--ink) 14%, transparent)"
            />
          ))}

          {/* 草稿块(t>=1) */}
          {t >= 1 &&
            Array.from({ length: GAMMA }, (_, i) => {
              const trimmed = t >= 5 && i >= WINDOW;
              return (
                <g key={i}>
                  <rect
                    className="viz-cell"
                    x={blockX(i)}
                    y={yBlock}
                    width={CELL}
                    height={CELL}
                    rx={4}
                    fill={trimmed ? `url(#${hatchId})` : "var(--series-2)"}
                    opacity={trimmed ? 1 : t >= 4 ? Math.max(0.25, CUM[i]) : 0.85}
                    onMouseEnter={(e) =>
                      showTooltip(e, blockCellTooltip(lang, i, RAW[i], STS[i], CUM[i]))
                    }
                  />
                  {/* sequential head:逐位条件化 */}
                  {i < GAMMA - 1 && (
                    <line
                      x1={blockX(i) + CELL + 1}
                      y1={yBlock + CELL / 2}
                      x2={blockX(i + 1) - 2}
                      y2={yBlock + CELL / 2}
                      stroke="var(--muted)"
                      strokeWidth="1.3"
                      markerEnd={`url(#bdarrow-${uid})`}
                    />
                  )}
                </g>
              );
            })}
          {t >= 1 && (
            <>
              <line
                x1={LABEL_W + CTX * PITCH - GAP + 4}
                y1={yBlock + CELL / 2}
                x2={blockX(0) - 2}
                y2={yBlock + CELL / 2}
                stroke="var(--muted)"
                strokeWidth="1.3"
                markerEnd={`url(#bdarrow-${uid})`}
              />
              <text
                x={blockX(0)}
                y={yBlock - 8}
                fontSize="9.5"
                fill="var(--muted)"
              >
                {BLOCK.drafterLabel[lang]} · {BLOCK.headLabel[lang]}
              </text>
            </>
          )}

          {/* 三行数值:原始分 / 校准 / 连乘 */}
          {t >= 2 && (
            <g opacity={t >= 3 ? 0.45 : 1}>
              <text x={blockX(0) - 10} y={yRaw + 4} textAnchor="end" fontSize="9.5" fill="var(--muted)">
                {BLOCK.rawRow[lang]}
              </text>
              {RAW.map((v, i) => (
                <text
                  key={i}
                  x={blockX(i) + CELL / 2}
                  y={yRaw + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--muted)"
                  textDecoration={t >= 3 ? "line-through" : undefined}
                >
                  {v.toFixed(2)}
                </text>
              ))}
            </g>
          )}
          {t >= 3 && (
            <g>
              <text x={blockX(0) - 10} y={ySts + 4} textAnchor="end" fontSize="9.5" fill="var(--muted)">
                {BLOCK.stsRow[lang]}
              </text>
              {STS.map((v, i) => (
                <text
                  key={i}
                  x={blockX(i) + CELL / 2}
                  y={ySts + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--ink)"
                >
                  {v.toFixed(2)}
                </text>
              ))}
            </g>
          )}
          {t >= 4 && (
            <g>
              <text x={blockX(0) - 10} y={yCum + 4} textAnchor="end" fontSize="9.5" fill="var(--muted)">
                {BLOCK.cumRow[lang]}
              </text>
              {CUM.map((v, i) => (
                <text
                  key={i}
                  x={blockX(i) + CELL / 2}
                  y={yCum + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill={t >= 5 && i >= WINDOW ? "var(--muted)" : "var(--accent)"}
                >
                  {v.toFixed(2)}
                </text>
              ))}
            </g>
          )}

          {/* 切窗口 */}
          {t >= 5 && (
            <g>
              <line
                x1={blockX(WINDOW) - GAP / 2 - 1}
                y1={yBlock - 14}
                x2={blockX(WINDOW) - GAP / 2 - 1}
                y2={yCum + 8}
                stroke="var(--ink)"
                strokeWidth="1.6"
                strokeDasharray="4 3"
              />
              <text
                x={blockX(WINDOW) - GAP / 2 - 6}
                y={yBlock - 18}
                textAnchor="end"
                fontSize="10"
                fontWeight="600"
                fill="var(--ink)"
              >
                {BLOCK.cutLabel[lang]} · P ≥ {THRESHOLD}
              </text>
            </g>
          )}
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
      <div className="dspark-step-desc">{t >= 1 ? BLOCK[STAGES[t - 1]][lang] : ""}</div>
    </VizStage>
  );
}
