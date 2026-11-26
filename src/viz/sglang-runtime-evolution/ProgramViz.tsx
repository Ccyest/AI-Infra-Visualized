import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { PROGRAM, PROGRAM_STEPS, SPAN } from "./strings";
import { Blk, centerOf, Fly, Frame, Scene } from "./scene";
import "./styles.css";

/* 讲座第 4 页:同一个程序的两种视角。
   左框是应用知道的:一棵树(共享起点、两个分支、第二轮)。右框是服务端收到的:三条各带完整历史的请求。
   每一步有一条请求从树上的某个叶子飞到服务端,落成一整行——结构就在这一步丢掉了。
   token 数沿用第 18 页:Shared context 4,Fix bug 2,turn 2 为 1,Write tests 3。 */

type Part = "ctx" | "fix" | "turn" | "tests";

const W = 820;
const H = 220;
const NODE: Record<Part, { x: number; y: number; w: number }> = {
  ctx: { x: 22, y: 96, w: 118 },
  fix: { x: 164, y: 56, w: 80 },
  turn: { x: 256, y: 56, w: 62 },
  tests: { x: 164, y: 136, w: 120 },
};
const NODE_H = 30;
const TOKENS: Record<Part, number> = { ctx: 4, fix: 2, turn: 1, tests: 3 };
const UNIT = 50;
const ROW_X = 446;
const ROW_Y = [46, 100, 154];
const REQUESTS: Part[][] = [
  ["ctx", "fix"],
  ["ctx", "fix", "turn"],
  ["ctx", "tests"],
];

export default function ProgramViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(REQUESTS.length, 0.42);
  const { t } = player;

  const name = (p: Part) =>
    p === "ctx" ? SPAN.ctx[lang] : p === "fix" ? SPAN.fix[lang] : p === "turn" ? SPAN.turnShort[lang] : SPAN.tests[lang];
  const current = t >= 1 ? REQUESTS[t - 1] : [];
  const rowWidth = (r: Part[]) => r.reduce((n, p) => n + TOKENS[p] * UNIT, 0);
  const edge = (a: Part, b: Part) => {
    const x1 = NODE[a].x + NODE[a].w;
    const y1 = NODE[a].y + NODE_H / 2;
    const x2 = NODE[b].x;
    const y2 = NODE[b].y + NODE_H / 2;
    const mid = (x1 + x2) / 2;
    const hot = current.includes(a) && current.includes(b);
    return <path key={`${a}-${b}`} className={`evo-edge${hot ? " hot" : ""}`} d={`M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`} />;
  };

  return (
    <VizStage title={PROGRAM.title[lang]} subtitle={PROGRAM.subtitle[lang]} player={player} lang={lang} className="evo-viz">
      <Scene w={W} h={H} label={PROGRAM.title[lang]}>
        <Frame x={6} y={6} w={330} h={H - 12} label={PROGRAM.app[lang]} />
        {edge("ctx", "fix")}
        {edge("fix", "turn")}
        {edge("ctx", "tests")}
        {(Object.keys(NODE) as Part[]).map((p) => (
          <Blk key={p} x={NODE[p].x} y={NODE[p].y} w={NODE[p].w} h={NODE_H} label={name(p)} tone={p} pick={current.includes(p)} />
        ))}

        <Frame x={350} y={6} w={W - 356} h={H - 12} label={PROGRAM.server[lang]} />
        {REQUESTS.map((r, i) => {
          let x = ROW_X;
          return (
            <g key={i}>
              <text className="evo-lbl" x={366} y={ROW_Y[i] + 20} opacity={i < t ? 1 : 0.35}>
                {PROGRAM.request[lang]} {i + 1}
              </text>
              {i < t ? (
                <g className={i === t - 1 ? "evo-arrive" : ""}>
                  {r.map((p) => {
                    const w = TOKENS[p] * UNIT;
                    const blk = <Blk key={p} x={x} y={ROW_Y[i]} w={w - 3} h={NODE_H} label={name(p)} tone={p} />;
                    x += w;
                    return blk;
                  })}
                </g>
              ) : (
                <Blk x={ROW_X} y={ROW_Y[i]} w={rowWidth(r) - 3} h={NODE_H} look="ghost" />
              )}
            </g>
          );
        })}

        {t >= 1 && (
          <Fly
            key={t}
            from={centerOf(NODE[current[current.length - 1]].x, NODE[current[current.length - 1]].y, NODE[current[current.length - 1]].w, NODE_H)}
            to={{ x: ROW_X + rowWidth(current) / 2, y: ROW_Y[t - 1] + NODE_H / 2 }}
            label={`${PROGRAM.request[lang]} ${t}`}
            tone={current[current.length - 1]}
            w={86}
          />
        )}
      </Scene>
      <div className="evo-step" aria-live="polite">
        {PROGRAM_STEPS[t][lang]}
      </div>
    </VizStage>
  );
}
