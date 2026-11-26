import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { PROGRAM, SPAN } from "./strings";
import { Fig, Seg, Tabs } from "./ui";
import type { SpanKey } from "./ui";
import "./styles.css";

/* 讲座第 4 页:同一个程序的两种视角。
   应用视角是一棵树(共享起点、两个分支、第二轮);服务端视角是三条各带完整历史的请求。
   token 数沿用第 18 页:Shared context 4,Fix bug 2,turn 2 为 1,Write tests 3。 */

type View = "app" | "server";

const TOKENS: Record<SpanKey, number> = { ctx: 4, fix: 2, turn: 1, tests: 3, other: 0, other2: 0 };

const REQUESTS: SpanKey[][] = [
  ["ctx", "fix"],
  ["ctx", "fix", "turn"],
  ["ctx", "tests"],
];

export default function ProgramViz({ lang = "zh" }: { lang?: Locale }) {
  const [view, setView] = useState<View>("app");
  const name = (k: SpanKey) =>
    k === "ctx" ? SPAN.ctx[lang] : k === "fix" ? SPAN.fix[lang] : k === "turn" ? SPAN.turnShort[lang] : SPAN.tests[lang];

  return (
    <Fig
      title={PROGRAM.title[lang]}
      subtitle={PROGRAM.subtitle[lang]}
      headExtra={
        <Tabs
          label={PROGRAM.tabs[lang]}
          value={view}
          onChange={setView}
          options={[
            { key: "app", label: PROGRAM.app[lang] },
            { key: "server", label: PROGRAM.server[lang] },
          ]}
        />
      }
    >
      {view === "app" ? (
        <div className="evo-program-tree">
          <div className="evo-row" style={{ gridColumn: "1 / span 4", gridRow: "1 / span 2" }}>
            <Seg span="ctx" tokens={1} label={name("ctx")} />
          </div>
          <div className="evo-row" style={{ gridColumn: "5 / span 2", gridRow: 1 }}>
            <Seg span="fix" tokens={1} label={name("fix")} />
          </div>
          <div className="evo-row" style={{ gridColumn: "7 / span 1", gridRow: 1 }}>
            <Seg span="turn" tokens={1} label={name("turn")} />
          </div>
          <div className="evo-row" style={{ gridColumn: "5 / span 3", gridRow: 2 }}>
            <Seg span="tests" tokens={1} label={name("tests")} />
          </div>
        </div>
      ) : (
        <div className="evo-requests">
          {REQUESTS.map((spans, i) => (
            <div className="evo-request" key={i}>
              <span className="evo-rowhead">
                {PROGRAM.request[lang]} {i + 1}
              </span>
              <div className="evo-row evo-row-7">
                {spans.map((k) => (
                  <Seg key={k} span={k} tokens={TOKENS[k]} label={name(k)} />
                ))}
                {/* 占位,让三条请求按同一比例尺对齐 */}
                <span
                  aria-hidden="true"
                  style={{ flexGrow: 7 - spans.reduce((n, k) => n + TOKENS[k], 0), flexBasis: 0 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Fig>
  );
}
