import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { JUMP } from "./strings";
import "./styles.css";

/* 讲座第 24 页:schema 把 {"summary": " 这 6 个 token 定死了。
   逐 token 解码每个 token 一次 forward(6 次);jump-forward 一次把整串追加进去(1 次),
   之后就开始采样自由文本。自由文本的 token 用占位点表示,内容不重要。 */

const FORCED = ["{", "\"", "summary", "\"", ":", "\""];
const TOTAL = FORCED.length;

export default function JumpForwardViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 1.1);
  const { t } = player;

  const lane = (kind: "token" | "jump") => {
    const forcedPasses = kind === "token" ? Math.min(t, TOTAL) : Math.min(t, 1);
    const sampled = kind === "token" ? 0 : Math.max(0, t - 1);
    return (
      <div className="evo-lane">
        <div className="evo-lane-head">
          <b>{kind === "token" ? JUMP.byToken[lang] : JUMP.jump[lang]}</b>
          <span aria-live="polite">
            {JUMP.passes[lang]} {forcedPasses}
          </span>
        </div>
        <div className="evo-tokens">
          {kind === "token"
            ? FORCED.map((tok, i) => (
                <code className={`evo-tok forced${i < t ? "" : " evo-hide"}`} key={i}>
                  {tok}
                </code>
              ))
            : (
                <code className={`evo-tok forced wide${t >= 1 ? "" : " evo-hide"}`}>{FORCED.join("").replace(":", ": ")}</code>
              )}
          {Array.from({ length: TOTAL - 1 }, (_, i) => (
            <code className={`evo-tok sampled${i < sampled ? "" : " evo-hide"}`} key={`s${i}`} aria-hidden="true">
              ···
            </code>
          ))}
        </div>
      </div>
    );
  };

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
            { label: JUMP.forced[lang], swatch: { background: "color-mix(in srgb, var(--series-2) 30%, var(--surface))", border: "1px solid var(--series-2)" } },
            { label: JUMP.sampled[lang], swatch: { background: "color-mix(in srgb, var(--series-1) 30%, var(--surface))", border: "1px solid var(--series-1)" } },
          ]}
        />
      }
    >
      <div className="evo-lanes">
        {lane("token")}
        {lane("jump")}
      </div>
    </VizStage>
  );
}
