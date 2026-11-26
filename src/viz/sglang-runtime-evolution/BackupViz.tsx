import { useState } from "react";
import type { CSSProperties } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { BACKUP, EXTRA } from "./strings";
import { Blk, Frame, Scene } from "./scene";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 53 页:一个 12-token 的节点备份到主机内存时,三种层各拷贝什么(窗口 4 tokens)。
   上框是 GPU 上的节点,下框是主机内存里的副本:
   Full attention 拷贝 token 1–12;sliding window 只拷贝 9–12;recurrent 没有逐 token 的数据,只有 1 份状态。
   只有 full attention 的拷贝量随节点长度增长。拖动滑块时,被拷贝的格子会按顺序重新落一遍。 */

const MAX = 16;
const WINDOW = 4;
const W = 820;
const H = 234;
const CELL = { w: 34, gap: 4, h: 26, x0: 170 };
const NODE_Y = 38;
const ROW_Y = [112, 146, 180];
const range = Array.from({ length: MAX }, (_, i) => i + 1);
const cellX = (n: number) => CELL.x0 + (n - 1) * (CELL.w + CELL.gap);
const seq = (i: number) => ({ className: "evo-seq", style: { "--i": i } as CSSProperties });

export default function BackupViz({ lang = "zh" }: { lang?: Locale }) {
  const [len, setLen] = useState(12);
  const windowStart = Math.max(1, len - WINDOW + 1);
  const countX = cellX(MAX) + CELL.w + 12;

  return (
    <Fig
      title={BACKUP.title[lang]}
      subtitle={BACKUP.subtitle[lang]}
      footer={
        <Legend
          items={[
            { label: BACKUP.copied[lang], swatch: { background: "var(--series-2)" } },
            { label: BACKUP.notCopied[lang], swatch: { background: "transparent", border: "1px dashed var(--axis)" } },
          ]}
        />
      }
    >
      <div className="evo-controls">
        <label className="evo-slider">
          <span>
            {BACKUP.nodeLen[lang]} <b>{len}</b>
          </span>
          <input type="range" min={WINDOW} max={MAX} step={1} value={len} onChange={(e) => setLen(Number(e.target.value))} />
        </label>
      </div>
      <Scene w={W} h={H} label={BACKUP.title[lang]}>
        <Frame x={6} y={6} w={W - 12} h={70} label={EXTRA.nodeOnGpu[lang]} />
        {range.map((n) => (
          <Blk key={n} x={cellX(n)} y={NODE_Y} w={CELL.w} h={CELL.h} label={String(n)} tone="ctx" look={n <= len ? "soft" : "ghost"} className="small" />
        ))}

        <Frame x={6} y={84} w={W - 12} h={H - 90} label={EXTRA.hostCopy[lang]} />
        <text className="evo-lbl" x={20} y={ROW_Y[0] + 18}>
          {BACKUP.full[lang]}
        </text>
        <text className="evo-lbl" x={20} y={ROW_Y[1] + 18}>
          {BACKUP.window[lang]}
        </text>
        <text className="evo-lbl" x={20} y={ROW_Y[2] + 18}>
          {BACKUP.recurrent[lang]}
        </text>

        <g key={len}>
          {range.map((n) =>
            n <= len ? (
              <g key={`f${n}`} {...seq(n)}>
                <Blk x={cellX(n)} y={ROW_Y[0]} w={CELL.w} h={CELL.h} label={String(n)} tone="ctx" look="solid" className="small" />
              </g>
            ) : (
              <Blk key={`f${n}`} x={cellX(n)} y={ROW_Y[0]} w={CELL.w} h={CELL.h} look="ghost" />
            ),
          )}
          {range.map((n) =>
            n <= len && n >= windowStart ? (
              <g key={`w${n}`} {...seq(n - windowStart)}>
                <Blk x={cellX(n)} y={ROW_Y[1]} w={CELL.w} h={CELL.h} label={String(n)} tone="ctx" look="solid" className="small" />
              </g>
            ) : (
              <Blk key={`w${n}`} x={cellX(n)} y={ROW_Y[1]} w={CELL.w} h={CELL.h} look="ghost" />
            ),
          )}
          {range.map((n) =>
            n === len ? (
              <g key={`r${n}`} {...seq(0)}>
                <Blk x={cellX(n)} y={ROW_Y[2]} w={CELL.w} h={CELL.h} label="S" tone="turn" look="solid" className="small" />
              </g>
            ) : (
              <Blk key={`r${n}`} x={cellX(n)} y={ROW_Y[2]} w={CELL.w} h={CELL.h} look="ghost" />
            ),
          )}
        </g>

        <text className="evo-stat-text" x={countX} y={ROW_Y[0] + 18} aria-live="polite">
          {len}
        </text>
        <text className="evo-stat-text" x={countX} y={ROW_Y[1] + 18}>
          {WINDOW}
        </text>
        <text className="evo-stat-text" x={countX} y={ROW_Y[2] + 18}>
          1
        </text>
      </Scene>
    </Fig>
  );
}
