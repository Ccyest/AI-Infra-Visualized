import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { TOKENIZE } from "./strings";
import { Fig, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 83 页:如果 router 和引擎各自渲染 chat template,模板稍有不同就会差一个 token,
   匹配到那里就断了(示意 id:303 对 999)。router 只 tokenize 一次并把 id 转发给引擎,
   引擎跳过自己的 tokenizer,两边匹配的是同一组 id(sglang#28744)。 */

type Mode = "each" | "once";
const ROUTER_IDS = [101, 202, 303, 404, 505];
const ENGINE_IDS = [101, 202, 999, 404, 505];
const FIRST_DIFF = ENGINE_IDS.findIndex((id, i) => id !== ROUTER_IDS[i]);

export default function TokenizeViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<Mode>("each");

  const cells = (ids: number[], breakAt: number) =>
    ids.map((id, i) => (
      <span className={`evo-cell${i < breakAt ? " on" : i === breakAt ? " miss" : " dim"}`} key={i}>
        {id}
      </span>
    ));

  return (
    <Fig
      title={TOKENIZE.title[lang]}
      subtitle={TOKENIZE.subtitle[lang]}
      headExtra={
        <Tabs
          label={TOKENIZE.tabs[lang]}
          value={mode}
          onChange={setMode}
          options={[
            { key: "each", label: TOKENIZE.each[lang] },
            { key: "once", label: TOKENIZE.once[lang] },
          ]}
        />
      }
    >
      {mode === "each" ? (
        <div className="evo-rows">
          <span className="evo-rowhead">{TOKENIZE.router[lang]}</span>
          <div className="evo-cells">{cells(ROUTER_IDS, FIRST_DIFF)}</div>
          <span className="evo-note" />
          <span className="evo-rowhead">{TOKENIZE.engine[lang]}</span>
          <div className="evo-cells">{cells(ENGINE_IDS, FIRST_DIFF)}</div>
          <span className="evo-note bad">{TOKENIZE.differs[lang]}</span>
        </div>
      ) : (
        <div className="evo-rows">
          <span className="evo-rowhead">{TOKENIZE.both[lang]}</span>
          <div className="evo-cells">{cells(ROUTER_IDS, ROUTER_IDS.length)}</div>
          <span className="evo-note" />
        </div>
      )}
      <div className="evo-stats" aria-live="polite">
        <span>
          {TOKENIZE.matched[lang]} <b>{mode === "each" ? FIRST_DIFF : ROUTER_IDS.length}</b>
        </span>
      </div>
    </Fig>
  );
}
