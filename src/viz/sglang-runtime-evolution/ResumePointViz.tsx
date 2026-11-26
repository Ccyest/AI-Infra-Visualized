import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { RESUME } from "./strings";
import { Blk, clickable, Scene } from "./scene";
import type { Look, Tone } from "./scene";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 31–38 页:三种层各自能从哪些 token 之后恢复。
   Full KV:任意匹配到的 token。
   Window KV(窗口 4):恢复到 token N 需要 N-3..N 的 KV;token 1–4 的 KV 已驱逐,所以 N ≥ 8。
   Recurrent state:只有保存过状态的位置(紫色圆点,点击格子可以增删)。默认保存在 4、8、16
   (第 38 页的设定:匹配 12 个 token 时,12 处没有保存状态,所以恢复点落在 8,复用 8,重算 4)。
   恢复点 = 所有启用的层都可用的最深位置,用一条跨三行的蓝色竖带标出,会随输入滑动。 */

const TOKENS = 16;
const WINDOW = 4;
const FIRST_RETAINED = 5;
const DEFAULT_SAVED = [4, 8, 16];

const W = 820;
const H = 168;
const CELL = { w: 34, gap: 4, h: 30, x0: 176 };
const ROW_Y = [34, 76, 118];
const range = Array.from({ length: TOKENS }, (_, i) => i + 1);
const cellX = (n: number) => CELL.x0 + (n - 1) * (CELL.w + CELL.gap);

export default function ResumePointViz({ lang = "zh" }: { lang?: Locale }) {
  const [match, setMatch] = useState(12);
  const [useWindow, setUseWindow] = useState(true);
  const [useRecurrent, setUseRecurrent] = useState(true);
  const [saved, setSaved] = useState<number[]>(DEFAULT_SAVED);

  const fullOk = (n: number) => n <= match;
  const windowOk = (n: number) => n <= match && n - WINDOW + 1 >= FIRST_RETAINED;
  const recurrentOk = (n: number) => n <= match && saved.includes(n);

  let resume = 0;
  for (const n of range) {
    if (fullOk(n) && (!useWindow || windowOk(n)) && (!useRecurrent || recurrentOk(n))) resume = n;
  }

  const toggleSaved = (n: number) =>
    setSaved((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)));

  const usable = (ok: boolean): { tone: Tone; look: Look } => (ok ? { tone: "tests", look: "soft" } : { tone: "other", look: "ghost" });

  return (
    <Fig
      title={RESUME.title[lang]}
      subtitle={RESUME.subtitle[lang]}
      footer={
        <Legend
          items={[
            { label: RESUME.usable[lang], swatch: { background: "color-mix(in srgb, var(--series-3) 30%, var(--surface))", border: "1px solid var(--series-3)" } },
            { label: RESUME.evicted[lang], swatch: { background: "transparent", border: "1px dashed var(--series-8)" } },
            { label: RESUME.saved[lang], swatch: { background: "var(--series-7)", borderRadius: "50%" } },
          ]}
        />
      }
    >
      <div className="evo-controls">
        <label className="evo-slider">
          <span>
            {RESUME.matchLen[lang]} <b>{match}</b>
          </span>
          <input type="range" min={4} max={TOKENS} step={1} value={match} onChange={(e) => setMatch(Number(e.target.value))} />
        </label>
        <span className="evo-checks" role="group" aria-label={RESUME.layers[lang]}>
          <label>
            <input type="checkbox" checked disabled /> {RESUME.full[lang]}
          </label>
          <label>
            <input type="checkbox" checked={useWindow} onChange={(e) => setUseWindow(e.target.checked)} /> {RESUME.window[lang]}
          </label>
          <label>
            <input type="checkbox" checked={useRecurrent} onChange={(e) => setUseRecurrent(e.target.checked)} /> {RESUME.recurrent[lang]}
          </label>
        </span>
      </div>

      <Scene w={W} h={H} label={RESUME.title[lang]}>
        {range.map((n) => (
          <text
            key={n}
            className="evo-tick"
            x={cellX(n) + CELL.w / 2}
            y={22}
            textAnchor="middle"
            style={n === resume ? { fill: "var(--accent)", fontWeight: 700 } : n > match ? { opacity: 0.4 } : undefined}
          >
            {n}
          </text>
        ))}

        <text className="evo-lbl" x={20} y={ROW_Y[0] + 19}>
          {RESUME.full[lang]}
        </text>
        {range.map((n) => (
          <Blk key={n} x={cellX(n)} y={ROW_Y[0]} w={CELL.w} h={CELL.h} {...usable(fullOk(n))} />
        ))}

        <g opacity={useWindow ? 1 : 0.25}>
          <text className="evo-lbl" x={20} y={ROW_Y[1] + 19}>
            {RESUME.window[lang]}
          </text>
          {range.map((n) =>
            n < FIRST_RETAINED ? (
              <Blk key={n} x={cellX(n)} y={ROW_Y[1]} w={CELL.w} h={CELL.h} tone="bad" look="gone" title={RESUME.evicted[lang]} />
            ) : (
              <Blk key={n} x={cellX(n)} y={ROW_Y[1]} w={CELL.w} h={CELL.h} {...usable(windowOk(n))} />
            ),
          )}
        </g>

        <g opacity={useRecurrent ? 1 : 0.25}>
          <text className="evo-lbl" x={20} y={ROW_Y[2] + 19}>
            {RESUME.recurrent[lang]}
          </text>
          {range.map((n) => {
            const isSaved = saved.includes(n);
            return (
              <g key={n} className="evo-hit" {...clickable(() => toggleSaved(n), `${RESUME.toggleSave[lang]} ${n}`, isSaved)}>
                <Blk x={cellX(n)} y={ROW_Y[2]} w={CELL.w} h={CELL.h} {...usable(recurrentOk(n))} />
                {isSaved && (
                  <circle
                    className="evo-pop"
                    cx={cellX(n) + CELL.w / 2}
                    cy={ROW_Y[2] + CELL.h / 2}
                    r={5.5}
                    fill="var(--series-7)"
                    opacity={n > match ? 0.4 : 1}
                  >
                    <title>{n > match ? RESUME.savedBeyond[lang] : RESUME.saved[lang]}</title>
                  </circle>
                )}
              </g>
            );
          })}
        </g>

        {/* 恢复点:跨三行的竖带,随匹配长度和保存点滑动 */}
        {resume > 0 && (
          <rect
            className="evo-band"
            x={-3}
            y={ROW_Y[0] - 4}
            width={CELL.w + 6}
            height={ROW_Y[2] + CELL.h - ROW_Y[0] + 8}
            rx={7}
            style={{ transform: `translateX(${cellX(resume)}px)` }}
          />
        )}
      </Scene>

      <div className="evo-stats" aria-live="polite">
        <span>
          {RESUME.resumeAfter[lang]} <b>{resume}</b>
        </span>
        <span>
          {RESUME.reuse[lang]} <b>{resume}</b>
        </span>
        <span>
          {RESUME.recompute[lang]} <b>{match - resume}</b>
        </span>
      </div>
    </Fig>
  );
}
