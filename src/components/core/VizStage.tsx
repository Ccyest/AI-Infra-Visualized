import type { ReactNode } from "react";
import { PLAYER_UI } from "../../lib/i18n";
import type { Locale } from "../../lib/i18n";
import type { SimPlayer } from "./useSimPlayer";

const SPEEDS = [0.5, 1, 2, 4];

interface VizStageProps {
  title: string;
  subtitle?: string;
  player: SimPlayer;
  lang?: Locale;
  /** 标题行右侧的额外控件(如场景切换) */
  headExtra?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * 可视化舞台:卡片容器 + 统一的播放/单步/拖动/调速控件。
 * 所有课程的动画都放在这个容器里,保证交互一致。
 */
export default function VizStage({
  title,
  subtitle,
  player,
  lang = "zh",
  headExtra,
  children,
  footer,
}: VizStageProps) {
  const { t, total, playing } = player;
  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{title}</span>
        {subtitle && <span className="viz-subtitle">{subtitle}</span>}
        {headExtra && <span className="viz-head-extra">{headExtra}</span>}
      </div>

      {children}

      <div className="viz-controls">
        <button
          type="button"
          className="viz-btn primary"
          onClick={player.toggle}
          aria-label={playing ? PLAYER_UI.pause[lang] : PLAYER_UI.play[lang]}
        >
          {playing
            ? PLAYER_UI.pause[lang]
            : t >= total
              ? PLAYER_UI.replay[lang]
              : PLAYER_UI.play[lang]}
        </button>
        <button
          type="button"
          className="viz-btn"
          onClick={() => player.stepBy(-1)}
          disabled={t === 0}
          aria-label={PLAYER_UI.stepBack[lang]}
        >
          ◀
        </button>
        <button
          type="button"
          className="viz-btn"
          onClick={() => player.stepBy(1)}
          disabled={t >= total}
          aria-label={PLAYER_UI.stepForward[lang]}
        >
          ▶
        </button>
        <button
          type="button"
          className="viz-btn"
          onClick={player.reset}
          disabled={t === 0}
          aria-label={PLAYER_UI.toStart[lang]}
        >
          ⏮
        </button>
        <input
          type="range"
          className="viz-scrub"
          min={0}
          max={total}
          step={1}
          value={t}
          onChange={(e) => player.seek(Number(e.target.value))}
          aria-label={PLAYER_UI.timeline[lang]}
        />
        <span className="viz-tick">
          t = {t}/{total}
        </span>
        <select
          className="viz-speed"
          value={player.speed}
          onChange={(e) => player.setSpeed(Number(e.target.value))}
          aria-label={PLAYER_UI.speed[lang]}
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </div>

      {footer && <div className="viz-footer">{footer}</div>}
    </figure>
  );
}
