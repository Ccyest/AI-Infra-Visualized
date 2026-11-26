import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { PD } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 84 页:384-token 的输入,每页 64 tokens,共 6 页。
   decode worker 上已经有 token 1–256 的 KV:复用 256,只传输缺的 128;
   复用的那几页在缺失的页到齐之前一直加锁,不能被驱逐。 */

const PAGE = 64;
const PAGES = 6;
const pageLabel = (i: number) => `${i * PAGE + 1}–${(i + 1) * PAGE}`;

export default function PdViz({ lang = "zh" }: { lang?: Locale }) {
  const [have, setHave] = useState(256);
  const reused = have / PAGE;

  return (
    <Fig title={PD.title[lang]} subtitle={PD.subtitle[lang]}>
      <div className="evo-controls">
        <label className="evo-slider">
          <span>
            {PD.have[lang]} <b>{have}</b>
          </span>
          <input type="range" min={0} max={PAGE * PAGES} step={PAGE} value={have} onChange={(e) => setHave(Number(e.target.value))} />
        </label>
      </div>
      <div className="evo-rows two">
        <span className="evo-rowhead">{PD.onDecode[lang]}</span>
        <div className="evo-cells">
          {Array.from({ length: PAGES }, (_, i) => (
            <span className={`evo-cell${i < reused ? " on" : " evo-hide"}`} title={i < reused ? PD.locked[lang] : undefined} key={i}>
              {pageLabel(i)}
            </span>
          ))}
        </div>
        <span className="evo-rowhead">{PD.sent[lang]}</span>
        <div className="evo-cells">
          {Array.from({ length: PAGES }, (_, i) => (
            <span className={`evo-cell${i >= reused ? " on c1" : " evo-hide"}`} key={i}>
              {pageLabel(i)}
            </span>
          ))}
        </div>
      </div>
      <div className="evo-stats" aria-live="polite">
        <span>
          {PD.reuse[lang]} <b>{have}</b>
        </span>
        <span>
          {PD.transfer[lang]} <b>{PAGE * PAGES - have}</b>
        </span>
        {reused > 0 && <span>{PD.locked[lang]}</span>}
      </div>
    </Fig>
  );
}
