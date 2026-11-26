import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { EXTRA, WINDOW } from "./strings";
import { Blk, clickable, Frame, Scene } from "./scene";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 31 页:窗口 4 tokens。上框是 12 个 token 的 window KV,分三段,每段都可以点击驱逐或放回。
   请求 A 匹配 12 个 token,恢复到 12 之后只需要 9–12 的 KV;请求 B 匹配 8 个,需要 5–8。
   驱逐 5–8:A 还能恢复,B 不能。下面两条括线标出各自需要的那一个窗口。 */

const W = 820;
const H = 214;
const CELL = { w: 48, gap: 6, y: 42, h: 30, x0: 150 };
const TOKENS = Array.from({ length: 12 }, (_, i) => i + 1);
const BLOCKS = [0, 1, 2];
const REQUESTS = [
  { key: "a", block: 2, match: 12, y: 124 },
  { key: "b", block: 1, match: 8, y: 170 },
] as const;

const cellX = (n: number) => CELL.x0 + (n - 1) * (CELL.w + CELL.gap);
const blockX = (b: number) => cellX(b * 4 + 1);
const BLOCK_W = 4 * CELL.w + 3 * CELL.gap;

export default function WindowViz({ lang = "zh" }: { lang?: Locale }) {
  const [evicted, setEvicted] = useState<number[]>([]);
  const toggle = (b: number) => setEvicted((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  return (
    <Fig title={WINDOW.title[lang]} subtitle={WINDOW.subtitle[lang]}>
      <Scene w={W} h={H} label={WINDOW.title[lang]}>
        <Frame x={6} y={6} w={W - 12} h={94} label={WINDOW.kv[lang]} />
        {BLOCKS.map((b) => {
          const gone = evicted.includes(b);
          return (
            <g key={b} className="evo-hit" {...clickable(() => toggle(b), `${WINDOW.toggle[lang]} ${b * 4 + 1}–${b * 4 + 4}`, gone)}>
              <g key={gone ? "gone" : "kept"} className="evo-pop">
                {TOKENS.slice(b * 4, b * 4 + 4).map((n) => (
                  <Blk key={n} x={cellX(n)} y={CELL.y} w={CELL.w} h={CELL.h} label={String(n)} tone={gone ? "bad" : "ctx"} look={gone ? "gone" : "soft"} />
                ))}
                <text className={`evo-tick${gone ? " " : ""}`} x={blockX(b) + BLOCK_W / 2} y={CELL.y + CELL.h + 15} textAnchor="middle" style={gone ? { fill: "var(--series-8)" } : undefined}>
                  {gone ? WINDOW.evicted[lang] : WINDOW.kept[lang]}
                </text>
              </g>
              <rect className="hit" x={blockX(b) - 3} y={CELL.y - 4} width={BLOCK_W + 6} height={CELL.h + 24} />
            </g>
          );
        })}

        {REQUESTS.map((r) => {
          const ok = !evicted.includes(r.block);
          const x0 = blockX(r.block);
          return (
            <g key={r.key}>
              <text className="evo-lbl" x={20} y={r.y + 4}>
                {r.key === "a" ? WINDOW.reqA[lang] : WINDOW.reqB[lang]}
              </text>
              {/* 这个请求需要的那一个窗口 */}
              <path className="evo-edge" style={{ stroke: ok ? "var(--good)" : "var(--series-8)", strokeWidth: 2 }} d={`M${x0 + 1} ${r.y - 8} v8 H${x0 + BLOCK_W - 1} v-8`} />
              <text
                key={ok ? "ok" : "no"}
                className={`evo-stat-text evo-pop ${ok ? "good" : "bad"}`}
                x={x0 + BLOCK_W / 2}
                y={r.y + 18}
                textAnchor="middle"
                aria-live="polite"
              >
                {EXTRA.needs[lang]} {r.block * 4 + 1}–{r.block * 4 + 4} · {ok ? WINDOW.canResume[lang] : WINDOW.cannotResume[lang]}
              </text>
            </g>
          );
        })}
      </Scene>
    </Fig>
  );
}
