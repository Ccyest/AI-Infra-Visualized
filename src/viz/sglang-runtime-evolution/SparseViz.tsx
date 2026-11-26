import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { SCENE, SPARSE, SPARSE_STEPS } from "./strings";
import { Blk, centerOf, Fly, Frame, Scene } from "./scene";
import "./styles.css";

/* 讲座第 58–60 页:稀疏注意力每一步只读 12 条里的 4 条。
   上框是 GPU 上只有 4 槽的 KV 缓冲区,下框是主机内存里完整的 12 条。
   第 N 步选中 2、5、9、11;第 N+1 步选中 2、5、9、12:3 条命中原地复用,
   12 未命中,从主机内存飞进缓冲区,顶替最久未用的 11。 */

const W = 820;
const H = 226;
const SLOT = { x0: 40, w: 132, gap: 18, y: 44, h: 40 };
const CELL = { x0: 40, w: 52, gap: 10, y: 166, h: 30 };
const ENTRIES = Array.from({ length: 12 }, (_, i) => i + 1);
const SELECTED = [
  [2, 5, 9, 11],
  [2, 5, 9, 12],
  [2, 5, 9, 12],
];
const VICTIM_SLOT = 3;
const MISS = 12;

const slotX = (i: number) => SLOT.x0 + i * (SLOT.w + SLOT.gap);
const cellX = (n: number) => CELL.x0 + (n - 1) * (CELL.w + CELL.gap);

export default function SparseViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(SPARSE_STEPS.length - 1, 0.42);
  const { t } = player;
  const selected = SELECTED[t];
  const buffer = t >= 2 ? [2, 5, 9, 12] : [2, 5, 9, 11];

  return (
    <VizStage
      title={SPARSE.title[lang]}
      subtitle={SPARSE.subtitle[lang]}
      player={player}
      lang={lang}
      className="evo-viz"
      footer={
        <Legend
          items={[
            { label: SPARSE.selected[lang], swatch: { background: "var(--series-1)" } },
            { label: SPARSE.hits[lang], swatch: { background: "transparent", border: "2px solid var(--series-3)" } },
            { label: SPARSE.loaded[lang], swatch: { background: "var(--series-2)" } },
          ]}
        />
      }
    >
      <Scene w={W} h={H} label={SPARSE.title[lang]}>
        <Frame x={6} y={6} w={W - 12} h={104} label={SCENE.gpuBuffer[lang]} />
        {buffer.map((n, i) => {
          const isVictim = i === VICTIM_SLOT;
          const hit = selected.includes(n);
          return (
            <g key={i}>
              {isVictim && t === 2 && (
                <g className="evo-leave">
                  <Blk x={slotX(i)} y={SLOT.y} w={SLOT.w} h={SLOT.h} label="11" tone="bad" look="gone" />
                </g>
              )}
              <g className={isVictim && t === 2 ? "evo-arrive" : ""} key={`${i}-${n}`}>
                <Blk
                  x={slotX(i)}
                  y={SLOT.y}
                  w={SLOT.w}
                  h={SLOT.h}
                  label={String(n)}
                  tone={isVictim && t === 2 ? "ctx" : hit ? "tests" : "bad"}
                  look={isVictim && t === 2 ? "soft" : hit ? "reuse" : "gone"}
                />
              </g>
              {isVictim && t === 1 && (
                <text className="evo-stat-text bad" x={slotX(i) + SLOT.w / 2} y={SLOT.y + SLOT.h + 15} textAnchor="middle">
                  LRU
                </text>
              )}
            </g>
          );
        })}
        <text className="evo-stat-text good" x={slotX(4) + 8} y={SLOT.y + 17}>
          {SPARSE.hits[lang]} {t === 0 ? 4 : 3}
        </text>
        <text className="evo-stat-text" x={slotX(4) + 8} y={SLOT.y + 35} style={{ fill: "var(--series-2)" }}>
          {SPARSE.loads[lang]} {t === 2 ? 1 : 0}
        </text>

        <Frame x={6} y={120} w={W - 12} h={100} label={SCENE.hostFull[lang]} />
        {ENTRIES.map((n) => {
          const isSelected = selected.includes(n);
          const miss = t === 1 && n === MISS;
          return (
            <Blk
              key={n}
              x={cellX(n)}
              y={CELL.y}
              w={CELL.w}
              h={CELL.h}
              label={String(n)}
              tone={miss ? "ctx" : isSelected ? "fix" : "other"}
              look={isSelected ? "solid" : "soft"}
            />
          );
        })}

        {t === 2 && (
          <Fly
            key="swap-in"
            from={centerOf(cellX(MISS), CELL.y, CELL.w, CELL.h)}
            to={centerOf(slotX(VICTIM_SLOT), SLOT.y, SLOT.w, SLOT.h)}
            label={String(MISS)}
            tone="ctx"
            w={44}
          />
        )}
      </Scene>
      <div className="evo-step" aria-live="polite">
        {SPARSE_STEPS[t][lang]}
      </div>
    </VizStage>
  );
}
