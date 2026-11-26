import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { JUMP } from "./strings";
import { Blk, Frame, Scene } from "./scene";
import "./styles.css";

/* 讲座第 24 页:schema 把 {"summary": " 这 6 个 token 定死了。
   上框逐 token 解码:每一步弹出一个 token,每个 token 一次 forward(共 6 次)。
   下框 jump-forward:第一步就把整串追加进去(1 次 forward),之后每一步都在采样自由文本。
   自由文本的 token 用占位点表示,内容不重要。 */

const W = 820;
const H = 176;
const FORCED = ["{", "\"", "summary", "\"", ":", "\""];
const WIDTHS = [30, 30, 84, 30, 30, 30];
const TOTAL = FORCED.length;
const X0 = 26;
const GAP = 4;
const TOK_H = 28;
const LANE_Y = [42, 124];
const SAMPLED_W = 40;

const forcedX = (i: number) => X0 + WIDTHS.slice(0, i).reduce((n, w) => n + w + GAP, 0);
const WHOLE_W = forcedX(TOTAL) - X0 - GAP;

export default function JumpForwardViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 1);
  const { t } = player;
  const sampled = Math.max(0, t - 1);

  return (
    <VizStage
      title={JUMP.title[lang]}
      subtitle={JUMP.subtitle[lang]}
      player={player}
      lang={lang}
      className="evo-viz"
      footer={
        <Legend
          items={[
            { label: JUMP.forced[lang], swatch: { background: "var(--series-2)" } },
            { label: JUMP.sampled[lang], swatch: { background: "var(--series-1)" } },
          ]}
        />
      }
    >
      <Scene w={W} h={H} label={JUMP.title[lang]}>
        <Frame x={6} y={6} w={W - 12} h={76} label={JUMP.byToken[lang]} />
        <text className="evo-stat-text" x={W - 20} y={27} textAnchor="end" aria-live="polite">
          {JUMP.passes[lang]} {Math.min(t, TOTAL)}
        </text>
        {FORCED.map((tok, i) =>
          i < t ? (
            <g className={i === t - 1 ? "evo-pop" : ""} key={i}>
              <Blk x={forcedX(i)} y={LANE_Y[0]} w={WIDTHS[i]} h={TOK_H} label={tok} tone="ctx" look="solid" />
            </g>
          ) : (
            <Blk key={i} x={forcedX(i)} y={LANE_Y[0]} w={WIDTHS[i]} h={TOK_H} look="ghost" />
          ),
        )}

        <Frame x={6} y={88} w={W - 12} h={82} label={JUMP.jump[lang]} />
        <text className="evo-stat-text good" x={W - 20} y={109} textAnchor="end" aria-live="polite">
          {JUMP.passes[lang]} {Math.min(t, 1)}
        </text>
        {t >= 1 ? (
          <g className={t === 1 ? "evo-pop" : ""} key="whole">
            <Blk x={X0} y={LANE_Y[1]} w={WHOLE_W} h={TOK_H} label={`{"summary": "`} tone="ctx" look="solid" />
          </g>
        ) : (
          <Blk x={X0} y={LANE_Y[1]} w={WHOLE_W} h={TOK_H} look="ghost" />
        )}
        {Array.from({ length: TOTAL - 1 }, (_, i) => {
          const x = X0 + WHOLE_W + GAP + i * (SAMPLED_W + GAP);
          return i < sampled ? (
            <g className={i === sampled - 1 ? "evo-pop" : ""} key={i}>
              <Blk x={x} y={LANE_Y[1]} w={SAMPLED_W} h={TOK_H} label="···" tone="fix" look="solid" />
            </g>
          ) : (
            <Blk key={i} x={x} y={LANE_Y[1]} w={SAMPLED_W} h={TOK_H} look="ghost" />
          );
        })}
      </Scene>
    </VizStage>
  );
}
