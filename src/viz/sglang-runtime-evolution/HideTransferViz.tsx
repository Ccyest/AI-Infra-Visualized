import type { ReactNode } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { HIDE } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 55 页:把传输藏进请求本来就要花的时间里。时长取自幻灯片的图形坐标。
   排队期间:排队 4 + 取 3,排完队再取要到 7 才开始运行;排队时预取,4 就能开始。
   计算期间(3 层,每层加载 2、计算 3):全部加载完再计算共 15;流水线里每层只等自己那层的加载,共 11。 */

interface Block {
  label: string;
  start: number;
  len: number;
  cls: "queue" | "transfer" | "compute";
}

const LOAD = 2;
const COMPUTE = 3;
const LAYERS = ["L0", "L1", "L2"];
const loads: Block[] = LAYERS.map((l, i) => ({ label: l, start: i * LOAD, len: LOAD, cls: "transfer" }));

export default function HideTransferViz({ lang = "zh" }: { lang?: Locale }) {
  const q: Block = { label: `${HIDE.qLabel[lang]} 4`, start: 0, len: 4, cls: "queue" };
  const fetch = (start: number): Block => ({ label: `${HIDE.fLabel[lang]} 3`, start, len: 3, cls: "transfer" });
  const run = (start: number): Block => ({ label: HIDE.rLabel[lang], start, len: 2, cls: "compute" });

  const track = (blocks: Block[], span: number, bare = false) => (
    <div className={`evo-track${bare ? " bare" : ""}`}>
      {blocks.map((b) => (
        <span
          className={`evo-block ${b.cls}`}
          key={`${b.cls}-${b.start}`}
          style={{ left: `${(b.start / span) * 100}%`, width: `${(b.len / span) * 100}%` }}
        >
          {b.label}
        </span>
      ))}
    </div>
  );

  const seqCompute: Block[] = LAYERS.map((l, i) => ({ label: l, start: 3 * LOAD + i * COMPUTE, len: COMPUTE, cls: "compute" }));
  const pipeCompute: Block[] = LAYERS.map((l, i) => ({ label: l, start: LOAD + i * COMPUTE, len: COMPUTE, cls: "compute" }));

  const row = (head: string, note: string, tracks: ReactNode) => (
    <>
      <div className="evo-lane-head">
        <b>{head}</b>
        <span>{note}</span>
      </div>
      {tracks}
    </>
  );

  return (
    <Fig
      title={HIDE.title[lang]}
      subtitle={HIDE.subtitle[lang]}
      footer={
        <Legend
          items={[
            { label: HIDE.legendTransfer[lang], swatch: { background: "var(--surface)", border: "1px solid var(--axis)" } },
            { label: HIDE.legendCompute[lang], swatch: { background: "color-mix(in srgb, var(--series-1) 50%, var(--surface))" } },
            { label: HIDE.legendQueue[lang], swatch: { background: "color-mix(in srgb, var(--grid) 85%, var(--surface))" } },
          ]}
        />
      }
    >
      <div className="evo-lanes">
        <div className="evo-lane">
          <span className="evo-rowhead">1. {HIDE.queued[lang]}</span>
          {row(HIDE.fetchAfter[lang], `${HIDE.startsAt[lang]} 7`, track([q, fetch(4), run(7)], 9))}
          {row(
            HIDE.prefetch[lang],
            `${HIDE.startsAt[lang]} 4`,
            <>
              {track([q, run(4)], 9)}
              {track([fetch(0)], 9, true)}
            </>,
          )}
        </div>
        <div className="evo-lane">
          <span className="evo-rowhead">2. {HIDE.compute[lang]}</span>
          {row(HIDE.loadAll[lang], `15 ${HIDE.units[lang]}`, track([...loads, ...seqCompute], 15))}
          {row(
            HIDE.pipelined[lang],
            `11 ${HIDE.units[lang]}`,
            <>
              {track(pipeCompute, 15)}
              {track(loads, 15, true)}
            </>,
          )}
        </div>
      </div>
    </Fig>
  );
}
