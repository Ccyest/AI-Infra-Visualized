import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { WINDOW } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 31 页:窗口 4 tokens。
   请求 A 匹配 12 个 token,恢复到 12 之后只需要 9–12 的 KV;
   请求 B 匹配 8 个,需要 5–8。驱逐 5–8:A 还能恢复,B 不能。
   三段 KV 都可以点击驱逐或放回。 */

const BLOCKS = ["1–4", "5–8", "9–12"];
/** 每个请求需要的那一段(下标),以及它用不到的段 */
const REQUESTS = [
  { key: "a", needs: 2, unused: -1 },
  { key: "b", needs: 1, unused: 2 },
] as const;

export default function WindowViz({ lang = "zh" }: { lang?: Locale }) {
  const [evicted, setEvicted] = useState<number[]>([]);
  const toggle = (i: number) =>
    setEvicted((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <Fig title={WINDOW.title[lang]} subtitle={WINDOW.subtitle[lang]}>
      <div className="evo-rows">
        <span className="evo-rowhead">{WINDOW.kv[lang]}</span>
        <div className="evo-cells" role="group" aria-label={WINDOW.toggle[lang]}>
          {BLOCKS.map((b, i) => {
            const gone = evicted.includes(i);
            return (
              <button
                type="button"
                className={`evo-cell${gone ? " hatch" : " on"}`}
                aria-pressed={gone}
                onClick={() => toggle(i)}
                key={b}
              >
                <b>{b}</b>
                <small>{gone ? WINDOW.evicted[lang] : WINDOW.kept[lang]}</small>
              </button>
            );
          })}
        </div>
        <span className="evo-note" />

        {REQUESTS.map((r) => {
          const ok = !evicted.includes(r.needs);
          return [
            <span className="evo-rowhead" key={`${r.key}-h`}>
              {r.key === "a" ? WINDOW.reqA[lang] : WINDOW.reqB[lang]}
            </span>,
            <div className="evo-cells" key={`${r.key}-c`}>
              {BLOCKS.map((b, i) => (
                <span
                  className={`evo-cell${i === r.needs ? (ok ? " on c3" : " miss") : i === r.unused ? " dim" : ""}`}
                  key={b}
                >
                  {b}: {i === r.needs ? WINDOW.needed[lang] : i === r.unused ? WINDOW.notUsed[lang] : WINDOW.evictable[lang]}
                </span>
              ))}
            </div>,
            <span className={`evo-note ${ok ? "good" : "bad"}`} aria-live="polite" key={`${r.key}-n`}>
              {ok ? WINDOW.canResume[lang] : WINDOW.cannotResume[lang]}
            </span>,
          ];
        })}
      </div>
    </Fig>
  );
}
