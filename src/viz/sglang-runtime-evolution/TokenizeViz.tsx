import { useState } from "react";
import type { CSSProperties } from "react";
import type { Locale } from "../../lib/i18n";
import { TOKENIZE } from "./strings";
import { Blk, centerOf, Fly, Frame, Scene } from "./scene";
import { Fig, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 83 页:左框是 router,右框是引擎。
   两边各自 tokenize:各自渲染 chat template,模板稍有不同就会差一个 token(示意 id:303 对 999),
   匹配到那里就断了,后面的 token 都对不上。
   router 只 tokenize 一次:id 从 router 一个一个飞到引擎,引擎跳过自己的 tokenizer,
   两边匹配的是同一组 id(sglang#28744)。再点一次同一个标签可以重播。 */

type Mode = "each" | "once";
const ROUTER_IDS = [101, 202, 303, 404, 505];
const ENGINE_IDS = [101, 202, 999, 404, 505];
const FIRST_DIFF = ENGINE_IDS.findIndex((id, i) => id !== ROUTER_IDS[i]);

const W = 820;
const H = 150;
const CELL = { w: 60, gap: 8, y: 58, h: 34 };
const ROUTER_X = 26;
const ENGINE_X = 454;
const cellX = (x0: number, i: number) => x0 + i * (CELL.w + CELL.gap);
const seq = (i: number) => ({ className: "evo-seq", style: { "--i": i * 2 } as CSSProperties });

export default function TokenizeViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<Mode>("each");
  const [run, setRun] = useState(0);

  return (
    <Fig
      title={TOKENIZE.title[lang]}
      subtitle={TOKENIZE.subtitle[lang]}
      headExtra={
        <Tabs
          label={TOKENIZE.tabs[lang]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setRun((n) => n + 1);
          }}
          options={[
            { key: "each", label: TOKENIZE.each[lang] },
            { key: "once", label: TOKENIZE.once[lang] },
          ]}
        />
      }
    >
      <Scene w={W} h={H} label={TOKENIZE.title[lang]}>
        <Frame x={6} y={6} w={380} h={H - 12} label={TOKENIZE.router[lang]} />
        <Frame x={434} y={6} w={380} h={H - 12} label={TOKENIZE.engine[lang]} />

        <g key={`${mode}-${run}`}>
          {ROUTER_IDS.map((id, i) => (
            <g key={`r${i}`} {...seq(i)}>
              <Blk x={cellX(ROUTER_X, i)} y={CELL.y} w={CELL.w} h={CELL.h} label={String(id)} tone="ctx" />
            </g>
          ))}

          {mode === "each" ? (
            <>
              {ENGINE_IDS.map((id, i) => (
                <g key={`e${i}`} {...seq(i)}>
                  <Blk
                    x={cellX(ENGINE_X, i)}
                    y={CELL.y}
                    w={CELL.w}
                    h={CELL.h}
                    label={String(id)}
                    tone={i === FIRST_DIFF ? "bad" : "ctx"}
                    look={i < FIRST_DIFF ? "reuse" : i === FIRST_DIFF ? "solid" : "ghost"}
                  />
                </g>
              ))}
              <text className="evo-stat-text bad evo-seq" style={{ "--i": 12 } as CSSProperties} x={cellX(ENGINE_X, FIRST_DIFF) + CELL.w / 2} y={CELL.y + CELL.h + 20} textAnchor="middle">
                {TOKENIZE.differs[lang]}
              </text>
            </>
          ) : (
            <>
              {ROUTER_IDS.map((id, i) => (
                <g key={`e${i}`} className="evo-arrive" style={{ animationDelay: `${i * 0.14}s` }}>
                  <Blk x={cellX(ENGINE_X, i)} y={CELL.y} w={CELL.w} h={CELL.h} label={String(id)} tone="ctx" look="reuse" />
                </g>
              ))}
              {ROUTER_IDS.map((id, i) => (
                <Fly
                  key={`f${i}`}
                  from={centerOf(cellX(ROUTER_X, i), CELL.y, CELL.w, CELL.h)}
                  to={centerOf(cellX(ENGINE_X, i), CELL.y, CELL.w, CELL.h)}
                  label={String(id)}
                  tone="ctx"
                  w={46}
                  delay={i * 0.14}
                />
              ))}
            </>
          )}
        </g>
      </Scene>
      <div className="evo-stats" aria-live="polite">
        <span className={mode === "each" ? "bad" : "good"}>
          {TOKENIZE.matched[lang]} <b>{mode === "each" ? FIRST_DIFF : ROUTER_IDS.length}</b>
        </span>
      </div>
    </Fig>
  );
}
