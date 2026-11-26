import type { Locale } from "../../lib/i18n";
import { SHARE, SHARE_ROWS } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 42 页:Reflection Beam 上 window 层实际需要的 KV 内存占比。
   数学 53%,benchmark 28%,agent 9%;默认切分(--swa-full-tokens-ratio 0.8)给了 80%。 */

export default function ShareViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <Fig title={SHARE.title[lang]} subtitle={SHARE.subtitle[lang]}>
      <div className="evo-rows">
        {SHARE_ROWS.map((r) => [
          <span className="evo-share-name" key={`${r.pct}-h`}>
            {r.name[lang]}
            <small>{r.sub[lang]}</small>
          </span>,
          <div className="evo-share-track" key={`${r.pct}-t`}>
            <i style={{ width: `${r.pct}%` }} />
          </div>,
          <span className="evo-note" key={`${r.pct}-n`}>
            <b>{r.pct}%</b>
          </span>,
        ])}
      </div>
      <div className="evo-stats">
        <span className="bad">
          <b>{SHARE.defaultSplit[lang]}</b>
        </span>
      </div>
    </Fig>
  );
}
