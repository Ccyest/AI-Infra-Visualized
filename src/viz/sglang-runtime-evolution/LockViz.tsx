import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { LOCKS } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 39 页:一个请求运行在节点 D,路径是 root → A → B → C → D。
   Full attention 要整条路径的 KV,锁 5 个节点;
   sliding window 只要最后一个窗口,锁 2 个;recurrent 只要 D 上那份状态,锁 1 个。 */

const NODES = ["root", "A", "B", "C", "D"];

export default function LockViz({ lang = "zh" }: { lang?: Locale }) {
  const rows = [
    { head: LOCKS.full[lang], locked: 5, note: LOCKS.locks5[lang] },
    { head: LOCKS.window[lang], locked: 2, note: LOCKS.locks2[lang] },
    { head: LOCKS.recurrent[lang], locked: 1, note: LOCKS.locks1[lang] },
  ];
  return (
    <Fig
      title={LOCKS.title[lang]}
      subtitle={LOCKS.subtitle[lang]}
      footer={
        <Legend
          items={[
            { label: LOCKS.locked[lang], swatch: { background: "color-mix(in srgb, var(--series-2) 40%, var(--surface))" } },
            { label: LOCKS.evictable[lang], swatch: { background: "color-mix(in srgb, var(--grid) 45%, transparent)", border: "1px solid var(--grid)" } },
          ]}
        />
      }
    >
      <div className="evo-rows">
        {rows.map((r) => [
          <span className="evo-rowhead" key={`${r.head}-h`}>
            {r.head}
          </span>,
          <div className="evo-cells" key={`${r.head}-c`}>
            {NODES.map((n, i) => (
              <span className={`evo-cell${i >= NODES.length - r.locked ? " on" : ""}`} key={n}>
                {n}
              </span>
            ))}
          </div>,
          <span className="evo-note" key={`${r.head}-n`}>
            {r.note}
          </span>,
        ])}
      </div>
    </Fig>
  );
}
