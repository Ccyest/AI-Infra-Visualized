import { useState } from "react";
import type { CSSProperties } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale, Localized } from "../../lib/i18n";
import { FREE } from "./strings";
import { Blk, Scene } from "./scene";
import type { Look, Tone } from "./scene";
import { Tabs } from "./ui";
import "./styles.css";

/* 讲座第 48、49 页:overlap 调度下,CPU 在 GPU forward 还没跑完时就处理了请求 X 的结束。
   三列是三个时刻,三行是 GPU forward、slot 7、页号各自的状态,逐列弹出。
   立即释放:slot 7 马上分给 Y 并被覆盖,而那次 forward 还在读它,读到的是 Y 的数据(红色,描边脉冲)。
   两阶段释放:页号立即空闲,物理 slot 先挂起,等 forward 结束才真正可写。 */

type Mode = "atOnce" | "twoStage";
type Kind = "on" | "warn" | "good" | "bad" | "idle";

interface Cell {
  text: Localized;
  kind: Kind;
}

const c = (text: Localized, kind: Kind): Cell => ({ text, kind });

const ROWS: Record<Mode, { head: Localized; cells: Cell[] }[]> = {
  atOnce: [
    { head: FREE.forward, cells: [c(FREE.reads, "on"), c(FREE.readsBad, "bad"), c(FREE.done, "idle")] },
    { head: FREE.slot, cells: [c(FREE.held, "on"), c(FREE.given, "bad"), c(FREE.given, "bad")] },
    { head: FREE.pageId, cells: [c(FREE.held, "on"), c(FREE.freeNow, "good"), c(FREE.freeNow, "good")] },
  ],
  twoStage: [
    { head: FREE.forward, cells: [c(FREE.reads, "on"), c(FREE.reads, "on"), c(FREE.done, "idle")] },
    { head: FREE.slot, cells: [c(FREE.held, "on"), c(FREE.pending, "warn"), c(FREE.freeY, "good")] },
    { head: FREE.pageId, cells: [c(FREE.held, "on"), c(FREE.freeNow, "good"), c(FREE.freeNow, "good")] },
  ],
};

const LOOK: Record<Kind, { tone: Tone; look: Look }> = {
  on: { tone: "fix", look: "soft" },
  warn: { tone: "warn", look: "soft" },
  good: { tone: "tests", look: "soft" },
  bad: { tone: "bad", look: "solid" },
  idle: { tone: "other", look: "ghost" },
};

const PHASES = [FREE.p1, FREE.p2, FREE.p3];
const W = 820;
const H = 190;
const COL = { x0: 150, w: 212, gap: 10 };
const ROW_Y = [40, 90, 140];
const CELL_H = 34;
const colX = (i: number) => COL.x0 + i * (COL.w + COL.gap);

export default function DeferredFreeViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<Mode>("atOnce");
  const player = useSimPlayer(PHASES.length, 0.6);
  const { t } = player;

  return (
    <VizStage
      title={FREE.title[lang]}
      subtitle={FREE.subtitle[lang]}
      player={player}
      lang={lang}
      className="evo-viz"
      headExtra={
        <Tabs
          label={FREE.tabs[lang]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            player.reset();
          }}
          options={[
            { key: "atOnce", label: FREE.atOnce[lang] },
            { key: "twoStage", label: FREE.twoStage[lang] },
          ]}
        />
      }
    >
      <Scene w={W} h={H} label={FREE.title[lang]}>
        {PHASES.map((p, i) => (
          <text
            key={p.en}
            className="evo-tick"
            x={colX(i) + COL.w / 2}
            y={22}
            textAnchor="middle"
            style={t === i + 1 ? { fill: "var(--accent)", fontWeight: 700, fontSize: "11px" } : { fontSize: "11px" }}
          >
            {p[lang]}
          </text>
        ))}
        {ROWS[mode].map((row, ri) => (
          <g key={`${mode}-${ri}`}>
            <text className="evo-lbl" x={20} y={ROW_Y[ri] + 21}>
              {row.head[lang]}
            </text>
            {row.cells.map((cell, i) =>
              i < t ? (
                <g key={i} className={`${i === t - 1 ? "evo-seq" : ""}${cell.kind === "bad" && i === t - 1 ? " evo-pulse" : ""}`} style={{ "--i": ri * 3 } as CSSProperties}>
                  <Blk x={colX(i)} y={ROW_Y[ri]} w={COL.w} h={CELL_H} label={cell.text[lang]} {...LOOK[cell.kind]} />
                </g>
              ) : (
                <Blk key={i} x={colX(i)} y={ROW_Y[ri]} w={COL.w} h={CELL_H} look="ghost" />
              ),
            )}
          </g>
        ))}
      </Scene>
    </VizStage>
  );
}
