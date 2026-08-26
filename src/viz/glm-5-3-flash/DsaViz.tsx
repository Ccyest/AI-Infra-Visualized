import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { DSA_VIZ } from "./strings";
import "./styles.css";

/**
 * 一步 decode 里 DSA 的完整路径:写 KV + indexer key → 4 合 1 池化 →
 * indexer 打分 → top-k 选 block(尾部恒选)→ 主注意力只读被选中的 KV。
 * 场景为教学缩尺:24 token、6 个 block、top-2;分数是手写字面量。
 */

const N = 24;
const POOL = 4;
const BLOCKS = N / POOL; // 6
/** 手写的 indexer 分数(确定性):top-2 是 block 1 和 block 3,block 5 是尾部恒选 */
const SCORES = [0.22, 0.86, 0.31, 0.74, 0.18, 0.4] as const;
const TOP_BLOCKS = [1, 3];
const TAIL_BLOCK = BLOCKS - 1;
const SELECTED = new Set([...TOP_BLOCKS, TAIL_BLOCK]);

const CELL_W = 26;
const GAP = 4;
const X0 = 46;
const QX = X0 + N * (CELL_W + GAP) + 26; // query token x

const tokenX = (i: number) => X0 + i * (CELL_W + GAP);
const blockX = (b: number) => tokenX(b * POOL);
const BLOCK_W = POOL * (CELL_W + GAP) - GAP;

export default function DsaViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(5, 0.9);
  const { t } = player;

  const legend = [
    { label: DSA_VIZ.kvCache[lang], swatch: { background: "color-mix(in srgb, var(--good) 30%, var(--surface))" } },
    { label: DSA_VIZ.indexKeys[lang], swatch: { background: "color-mix(in srgb, var(--series-3) 30%, var(--surface))" } },
    { label: DSA_VIZ.indexCache[lang], swatch: { background: "color-mix(in srgb, var(--series-3) 55%, var(--surface))" } },
    { label: DSA_VIZ.queryToken[lang], swatch: { background: "var(--series-1)" } },
  ];

  const isSelected = (b: number) => SELECTED.has(b);
  const kvSelected = (i: number) => isSelected(Math.floor(i / POOL));

  return (
    <VizStage
      title={DSA_VIZ.title[lang]}
      subtitle={DSA_VIZ.subtitle[lang]}
      player={player}
      lang={lang}
      footer={<Legend items={legend} />}
    >
      <div className="viz-grid-wrap">
        <svg className="viz-grid" style={{ minWidth: 820 }} viewBox="0 0 960 420" role="img" aria-label={DSA_VIZ.title[lang]}>
          {/* 行 1:context tokens + 当前 token */}
          {Array.from({ length: N }, (_, i) => (
            <rect key={`tok-${i}`} x={tokenX(i)} y={36} width={CELL_W} height={20} rx={4} fill="var(--surface)" stroke="var(--border)" strokeWidth={1} />
          ))}
          <rect x={QX} y={36} width={CELL_W} height={20} rx={4} fill="var(--series-1)" stroke="var(--border)" strokeWidth={1} />
          <text x={QX + CELL_W / 2} y={30} textAnchor="middle" fontSize={9} fill="var(--ink-2)">
            t=25
          </text>

          {/* 行 2:KV cache(t≥1)*/}
          {t >= 1 &&
            Array.from({ length: N }, (_, i) => (
              <rect
                key={`kv-${i}`}
                className={`g53-cell${t >= 5 && !kvSelected(i) ? " g53-dim" : ""}`}
                x={tokenX(i)}
                y={96}
                width={CELL_W}
                height={20}
                rx={4}
                fill="color-mix(in srgb, var(--good) 30%, var(--surface))"
                stroke={t >= 5 && kvSelected(i) ? "var(--ink)" : "var(--border)"}
                strokeWidth={t >= 5 && kvSelected(i) ? 1.6 : 1}
              />
            ))}
          {t >= 1 && (
            <text x={X0 - 8} y={110} textAnchor="end" fontSize={9.5} fill="var(--ink-2)">
              KV
            </text>
          )}

          {/* 行 3:indexer keys(t≥1)*/}
          {t >= 1 &&
            Array.from({ length: N }, (_, i) => (
              <rect
                key={`ik-${i}`}
                className="g53-cell"
                x={tokenX(i)}
                y={150}
                width={CELL_W}
                height={12}
                rx={3}
                fill="color-mix(in srgb, var(--series-3) 30%, var(--surface))"
                stroke="var(--border)"
                strokeWidth={0.8}
              />
            ))}

          {/* 池化括号 + 行 4:indexer cache(t≥2)*/}
          {t >= 2 &&
            Array.from({ length: BLOCKS }, (_, b) => (
              <g key={`pool-${b}`}>
                <path
                  d={`M ${blockX(b) + 2} 168 L ${blockX(b) + 2} 176 L ${blockX(b) + BLOCK_W - 2} 176 L ${blockX(b) + BLOCK_W - 2} 168`}
                  fill="none"
                  stroke="var(--axis)"
                  strokeWidth={1}
                />
                <line x1={blockX(b) + BLOCK_W / 2} y1={176} x2={blockX(b) + BLOCK_W / 2} y2={188} stroke="var(--axis)" strokeWidth={1} />
                <rect
                  className={`g53-cell${t >= 4 && !isSelected(b) ? " g53-dim" : ""}`}
                  x={blockX(b) + BLOCK_W / 2 - 22}
                  y={190}
                  width={44}
                  height={16}
                  rx={4}
                  fill="color-mix(in srgb, var(--series-3) 55%, var(--surface))"
                  stroke={t >= 4 && isSelected(b) ? "var(--ink)" : "var(--border)"}
                  strokeWidth={t >= 4 && isSelected(b) ? 1.6 : 1}
                />
              </g>
            ))}

          {/* t≥3:indexer query 打分 */}
          {t >= 3 && (
            <g>
              <path d={`M ${QX + CELL_W / 2} 56 L ${QX + CELL_W / 2} 236 L ${blockX(0) + BLOCK_W / 2} 236`} fill="none" stroke="var(--series-1)" strokeWidth={1.2} strokeDasharray="4 3" />
              {Array.from({ length: BLOCKS }, (_, b) => (
                <g key={`score-${b}`} className={t >= 4 && !isSelected(b) ? "g53-dim" : undefined}>
                  <rect
                    x={blockX(b) + BLOCK_W / 2 - 7}
                    y={262 + (1 - SCORES[b]) * 42}
                    width={14}
                    height={SCORES[b] * 42}
                    rx={2}
                    fill="var(--series-2)"
                  />
                  <text x={blockX(b) + BLOCK_W / 2} y={318} textAnchor="middle" fontSize={9} fill="var(--ink-2)">
                    {SCORES[b].toFixed(2)}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* t≥4:选中标注 */}
          {t >= 4 &&
            Array.from({ length: BLOCKS }, (_, b) => (
              <text key={`tag-${b}`} x={blockX(b) + BLOCK_W / 2} y={336} textAnchor="middle" fontSize={8.5} fill={isSelected(b) ? "var(--ink)" : "var(--muted)"} fontWeight={isSelected(b) ? 650 : 400}>
                {b === TAIL_BLOCK ? DSA_VIZ.tailTag[lang] : isSelected(b) ? DSA_VIZ.selectedTag[lang] : DSA_VIZ.skippedTag[lang]}
              </text>
            ))}

          {/* t≥5:主注意力只读选中 block 的 KV */}
          {t >= 5 &&
            TOP_BLOCKS.concat(TAIL_BLOCK).map((b) => (
              <path
                key={`read-${b}`}
                d={`M ${QX + CELL_W / 2} 44 L ${blockX(b) + BLOCK_W / 2} 92`}
                fill="none"
                stroke="var(--series-1)"
                strokeWidth={1.6}
              />
            ))}
        </svg>
      </div>
      <p className="viz-hint" aria-live="polite" style={{ margin: "0.4rem 0 0" }}>
        {DSA_VIZ.events[lang][t]}
      </p>
    </VizStage>
  );
}
