import { useState } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { COMMON, FORK, FORK_STEPS, SCENE, SPAN } from "./strings";
import { Blk, centerOf, Fly, Frame, Scene } from "./scene";
import type { Look, Tone } from "./scene";
import { SWATCH_COMPUTE, SWATCH_REUSE, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 9、10 页:左边是前端(它在两个请求发出之前就知道 fork),右边是 runtime。
   没有提示:两个分支各自把 Shared context 算一遍(2 次)。
   有提示:前端先把 Shared context 单独发出去,runtime 算 1 次并放进 KV 缓存,两个分支都复用。
   每一步有一张卡片从前端飞到 runtime。token 宽度按 4 / 2 / 3 个 token 画。 */

type Mode = "without" | "with";
type Part = "ctx" | "fix" | "tests";

const W = 820;
const H = 236;
const FRONT = { x: 26, w: 196, y: { ctx: 40, fix: 98, tests: 138 } };
const RUN_X = 276;
const UNIT = 52;
const TOKENS: Record<Part, number> = { ctx: 4, fix: 2, tests: 3 };
const ROW_Y = [40, 80, 120];
const CACHE = { x: 356, y: 172, w: TOKENS.ctx * UNIT, h: 30 };

interface Row {
  /** 这一行是由前端的哪一块发出来的 */
  from: Part;
  segs: { part: Part; look: Look }[];
}

const ROWS: Record<Mode, Row[]> = {
  without: [
    { from: "fix", segs: [{ part: "ctx", look: "solid" }, { part: "fix", look: "solid" }] },
    { from: "tests", segs: [{ part: "ctx", look: "solid" }, { part: "tests", look: "solid" }] },
  ],
  with: [
    { from: "ctx", segs: [{ part: "ctx", look: "solid" }] },
    { from: "fix", segs: [{ part: "ctx", look: "reuse" }, { part: "fix", look: "solid" }] },
    { from: "tests", segs: [{ part: "ctx", look: "reuse" }, { part: "tests", look: "solid" }] },
  ],
};

/** KV 缓存里出现 Shared context 的那一步 */
const CACHED_AT: Record<Mode, number> = { without: 2, with: 1 };

export default function ForkHintViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<Mode>("without");
  const rows = ROWS[mode];
  const player = useSimPlayer(rows.length, 0.42);
  const { t } = player;

  const label = (p: Part) => (p === "ctx" ? SPAN.ctx[lang] : p === "fix" ? SPAN.fix[lang] : SPAN.tests[lang]);
  const shown = rows.slice(0, t);
  const count = (look: Look) => shown.reduce((n, r) => n + r.segs.filter((s) => s.part === "ctx" && s.look === look).length, 0);
  const rowWidth = (r: Row) => r.segs.reduce((n, s) => n + TOKENS[s.part] * UNIT, 0);
  const cached = t >= CACHED_AT[mode];
  const flying = t >= 1 ? rows[t - 1] : null;

  return (
    <VizStage
      title={FORK.title[lang]}
      subtitle={FORK.subtitle[lang]}
      player={player}
      lang={lang}
      className="evo-viz"
      headExtra={
        <Tabs
          label={FORK.tabs[lang]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            player.reset();
          }}
          options={[
            { key: "without", label: FORK.without[lang] },
            { key: "with", label: FORK.with[lang] },
          ]}
        />
      }
      footer={
        <Legend
          items={[
            { label: COMMON.computed[lang], swatch: SWATCH_COMPUTE },
            { label: COMMON.reused[lang], swatch: SWATCH_REUSE },
          ]}
        />
      }
    >
      <Scene w={W} h={H} label={FORK.title[lang]}>
        {/* 前端:一段共享上下文,fork 出两个分支 */}
        <Frame x={6} y={6} w={236} h={H - 12} label={SCENE.frontend[lang]} />
        <Blk x={FRONT.x} y={FRONT.y.ctx} w={FRONT.w} label={label("ctx")} tone="ctx" />
        <text className="evo-tick" x={FRONT.x + FRONT.w / 2} y={88} textAnchor="middle">
          s.fork(2)
        </text>
        <Blk x={FRONT.x} y={FRONT.y.fix} w={FRONT.w} label={label("fix")} tone="fix" />
        <Blk x={FRONT.x} y={FRONT.y.tests} w={FRONT.w} label={label("tests")} tone="tests" />

        {/* runtime:每个到达的请求一行 prefill,下面是 KV 缓存 */}
        <Frame x={256} y={6} w={W - 262} h={H - 12} label={SCENE.runtime[lang]} />
        {rows.map((r, i) => {
          if (i >= t) return null;
          let x = RUN_X;
          return (
            <g className={i === t - 1 ? "evo-arrive" : ""} key={`${mode}-${i}`}>
              {r.segs.map((s) => {
                const w = TOKENS[s.part] * UNIT;
                const blk = <Blk key={s.part} x={x} y={ROW_Y[i]} w={w - 3} label={label(s.part)} tone={s.part as Tone} look={s.look} />;
                x += w;
                return blk;
              })}
            </g>
          );
        })}

        <text className="evo-lbl" x={RUN_X} y={CACHE.y + 20}>
          {SCENE.kvCache[lang]}
        </text>
        {cached ? (
          <g className={t === CACHED_AT[mode] ? "evo-arrive" : ""} key={`cache-${mode}`}>
            <Blk x={CACHE.x} y={CACHE.y} w={CACHE.w} h={CACHE.h} label={label("ctx")} tone="ctx" />
          </g>
        ) : (
          <Blk x={CACHE.x} y={CACHE.y} w={CACHE.w} h={CACHE.h} label={SCENE.empty[lang]} look="ghost" />
        )}
        <text className={`evo-stat-text${count("solid") > 1 ? " bad" : ""}`} x={CACHE.x + CACHE.w + 22} y={CACHE.y + 14}>
          {FORK.ctxComputed[lang]} {count("solid")}×
        </text>
        {mode === "with" && (
          <text className="evo-stat-text good" x={CACHE.x + CACHE.w + 22} y={CACHE.y + 30}>
            {FORK.ctxReused[lang]} {count("reuse")}×
          </text>
        )}

        {flying && (
          <Fly
            key={`${mode}-${t}`}
            from={centerOf(FRONT.x, FRONT.y[flying.from], FRONT.w, 30)}
            to={{ x: RUN_X + rowWidth(flying) / 2, y: ROW_Y[t - 1] + 15 }}
            label={label(flying.from)}
            tone={flying.from as Tone}
            w={108}
          />
        )}
      </Scene>
      <div className="evo-step" aria-live="polite">
        {FORK_STEPS[mode][t][lang]}
      </div>
    </VizStage>
  );
}
