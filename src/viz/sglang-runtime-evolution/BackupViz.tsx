import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { BACKUP } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 53 页:一个 12-token 的节点备份到主机内存时,三种层各拷贝什么(窗口 4 tokens)。
   Full attention 拷贝 token 1–12;sliding window 只拷贝 9–12;recurrent 没有逐 token 的数据,只有 1 份状态。
   只有 full attention 的拷贝量随节点长度增长。 */

const MAX = 16;
const WINDOW = 4;
const range = Array.from({ length: MAX }, (_, i) => i + 1);

export default function BackupViz({ lang = "zh" }: { lang?: Locale }) {
  const [len, setLen] = useState(12);
  const windowStart = Math.max(1, len - WINDOW + 1);

  return (
    <Fig
      title={BACKUP.title[lang]}
      subtitle={BACKUP.subtitle[lang]}
      footer={
        <Legend
          items={[
            { label: BACKUP.copied[lang], swatch: { background: "color-mix(in srgb, var(--series-2) 40%, var(--surface))" } },
            { label: BACKUP.notCopied[lang], swatch: { background: "var(--evo-hatch)", border: "1px solid var(--grid)" } },
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
      <div className="evo-rows">
        <span className="evo-rowhead">{BACKUP.full[lang]}</span>
        <div className="evo-cells">
          {range.map((n) => (
            <span className={`evo-cell${n <= len ? " on" : " dim"}`} key={n}>
              {n}
            </span>
          ))}
        </div>
        <span className="evo-note" aria-live="polite">
          <b>{len}</b> {BACKUP.tokens[lang]}
        </span>

        <span className="evo-rowhead">{BACKUP.window[lang]}</span>
        <div className="evo-cells">
          {range.map((n) => (
            <span className={`evo-cell${n > len ? " dim" : n >= windowStart ? " on" : " hatch"}`} key={n}>
              {n}
            </span>
          ))}
        </div>
        <span className="evo-note">
          <b>{WINDOW}</b> {BACKUP.tokens[lang]}
        </span>

        <span className="evo-rowhead">{BACKUP.recurrent[lang]}</span>
        <div className="evo-cells">
          {range.map((n) => (
            <span className={`evo-cell${n > len ? " dim" : n === len ? " dot" : " hatch"}`} key={n} />
          ))}
        </div>
        <span className="evo-note">
          <b>{BACKUP.oneState[lang]}</b>
        </span>
      </div>
    </Fig>
  );
}
