import type { ReactNode } from "react";
import { PLAYER_UI } from "../../lib/i18n";
import type { Locale } from "../../lib/i18n";
import type { SimPlayer } from "./useSimPlayer";

/* 控件图标一律内联 SVG:unicode 三角(◀ ▶ ⏮)的墨迹在字符框里不居中,
   且随平台字体漂移,flex 居中救不了;SVG 按 viewBox 几何中心画,永远居中。 */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="viz-icon" viewBox="0 0 16 16" width={13} height={13} aria-hidden="true">
      {children}
    </svg>
  );
}

const ICON_PLAY = (
  <Icon>
    <path d="M4.8 2.6 13.2 8 4.8 13.4Z" fill="currentColor" />
  </Icon>
);
const ICON_PAUSE = (
  <Icon>
    <rect x="3.6" y="2.9" width="3.1" height="10.2" rx="0.8" fill="currentColor" />
    <rect x="9.3" y="2.9" width="3.1" height="10.2" rx="0.8" fill="currentColor" />
  </Icon>
);
const ICON_REPLAY = (
  <Icon>
    <path d="M8 3A5 5 0 1 0 13 8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M8.6 0.8 4.8 3l3.8 2.2Z" fill="currentColor" />
  </Icon>
);
const ICON_STEP_BACK = (
  <Icon>
    <path d="M11.4 2.9 4.6 8l6.8 5.1Z" fill="currentColor" />
  </Icon>
);
const ICON_STEP_FWD = (
  <Icon>
    <path d="M4.6 2.9 11.4 8 4.6 13.1Z" fill="currentColor" />
  </Icon>
);
const ICON_TO_START = (
  <Icon>
    <rect x="3.4" y="2.9" width="1.7" height="10.2" rx="0.6" fill="currentColor" />
    <path d="M12.6 2.9 5.8 8l6.8 5.1Z" fill="currentColor" />
  </Icon>
);

interface VizStageProps {
  title: string;
  subtitle?: string;
  player: SimPlayer;
  lang?: Locale;
  /** 标题行右侧的额外控件(如场景切换) */
  headExtra?: ReactNode;
  /** 追加到 .viz-stage 上的类名(如课程专用的字号变量) */
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * 可视化舞台:卡片容器 + 统一的播放/单步/拖动控件。
 * 所有课程的动画都放在这个容器里,保证交互一致。
 */
export default function VizStage({
  title,
  subtitle,
  player,
  lang = "zh",
  headExtra,
  className,
  children,
  footer,
}: VizStageProps) {
  const { t, total, playing } = player;
  return (
    <figure
      className={`viz-stage${className ? ` ${className}` : ""}`}
      style={{ margin: "1.6rem 0" }}
    >
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
          {playing ? (
            <>
              {ICON_PAUSE}
              {PLAYER_UI.pause[lang]}
            </>
          ) : t >= total ? (
            <>
              {ICON_REPLAY}
              {PLAYER_UI.replay[lang]}
            </>
          ) : (
            <>
              {ICON_PLAY}
              {PLAYER_UI.play[lang]}
            </>
          )}
        </button>
        <button
          type="button"
          className="viz-btn icon"
          onClick={() => player.stepBy(-1)}
          disabled={t === 0}
          aria-label={PLAYER_UI.stepBack[lang]}
        >
          {ICON_STEP_BACK}
        </button>
        <button
          type="button"
          className="viz-btn icon"
          onClick={() => player.stepBy(1)}
          disabled={t >= total}
          aria-label={PLAYER_UI.stepForward[lang]}
        >
          {ICON_STEP_FWD}
        </button>
        <button
          type="button"
          className="viz-btn icon"
          onClick={player.reset}
          disabled={t === 0}
          aria-label={PLAYER_UI.toStart[lang]}
        >
          {ICON_TO_START}
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
      </div>

      {footer && <div className="viz-footer">{footer}</div>}
    </figure>
  );
}
