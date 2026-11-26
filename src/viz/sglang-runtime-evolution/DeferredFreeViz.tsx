import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale, Localized } from "../../lib/i18n";
import { FREE } from "./strings";
import { Tabs } from "./ui";
import "./styles.css";

/* 讲座第 48、49 页:overlap 调度下,CPU 在 GPU forward 还没跑完时就处理了请求 X 的结束。
   立即释放:slot 7 马上分给 Y 并被覆盖,而那次 forward 还在读它,读到的是 Y 的数据。
   两阶段释放:页号立即空闲,物理 slot 先挂起,等 forward 结束才真正可写。 */

type Mode = "atOnce" | "twoStage";
type Cls = "on" | "warn" | "good" | "bad" | "";

interface Cell {
  text: Localized;
  cls: Cls;
}

const ROWS: Record<Mode, { head: Localized; cells: Cell[] }[]> = {
  atOnce: [
    {
      head: FREE.forward,
      cells: [
        { text: FREE.reads, cls: "on" },
        { text: FREE.readsBad, cls: "bad" },
        { text: FREE.done, cls: "" },
      ],
    },
    {
      head: FREE.slot,
      cells: [
        { text: FREE.held, cls: "on" },
        { text: FREE.given, cls: "bad" },
        { text: FREE.given, cls: "bad" },
      ],
    },
    {
      head: FREE.pageId,
      cells: [
        { text: FREE.held, cls: "on" },
        { text: FREE.freeNow, cls: "good" },
        { text: FREE.freeNow, cls: "good" },
      ],
    },
  ],
  twoStage: [
    {
      head: FREE.forward,
      cells: [
        { text: FREE.reads, cls: "on" },
        { text: FREE.reads, cls: "on" },
        { text: FREE.done, cls: "" },
      ],
    },
    {
      head: FREE.slot,
      cells: [
        { text: FREE.held, cls: "on" },
        { text: FREE.pending, cls: "warn" },
        { text: FREE.freeY, cls: "good" },
      ],
    },
    {
      head: FREE.pageId,
      cells: [
        { text: FREE.held, cls: "on" },
        { text: FREE.freeNow, cls: "good" },
        { text: FREE.freeNow, cls: "good" },
      ],
    },
  ],
};

const PHASES = [FREE.p1, FREE.p2, FREE.p3];

export default function DeferredFreeViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<Mode>("atOnce");
  const player = useSimPlayer(PHASES.length, 0.7);
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
      <div className="evo-phase-grid">
        <span />
        {PHASES.map((p, i) => (
          <span className={`evo-pcell head${t === i + 1 ? " active" : ""}`} key={p.en}>
            {p[lang]}
          </span>
        ))}
        {ROWS[mode].map((row) => [
          <span className="evo-rowhead" key={`${row.head.en}-h`}>
            {row.head[lang]}
          </span>,
          ...row.cells.map((c, i) => (
            <span className={`evo-pcell ${c.cls}${i < t ? (i === t - 1 ? " evo-pop" : "") : " evo-hide"}`} key={`${row.head.en}-${i}`}>
              {c.text[lang]}
            </span>
          )),
        ])}
      </div>
    </VizStage>
  );
}
