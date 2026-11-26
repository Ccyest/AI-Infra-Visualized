import type { Locale } from "../../lib/i18n";
import { SHARE, SHARE_ROWS } from "./strings";
import { Bar, Scene } from "./scene";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 42 页:Reflection Beam 上 window 层实际需要的 KV 内存占比。
   数学 53%,benchmark 28%,agent 9%;默认切分(--swa-full-tokens-ratio 0.8)给了 80%(红色虚线)。
   三根横条入场时从左侧生长出来。 */

const W = 820;
const H = 188;
const TRACK = { x0: 270, w: 440 };
const ROW_Y = [38, 88, 138];
const DEFAULT_PCT = 80;

export default function ShareViz({ lang = "zh" }: { lang?: Locale }) {
  const markerX = TRACK.x0 + (TRACK.w * DEFAULT_PCT) / 100;
  return (
    <Fig title={SHARE.title[lang]} subtitle={SHARE.subtitle[lang]}>
      <Scene w={W} h={H} label={SHARE.title[lang]}>
        {SHARE_ROWS.map((r, i) => (
          <g key={r.pct}>
            <text className="evo-lbl" x={20} y={ROW_Y[i] + 11} style={{ fontSize: "12px" }}>
              {r.name[lang]}
            </text>
            <text className="evo-tick" x={20} y={ROW_Y[i] + 26}>
              {r.sub[lang]}
            </text>
            <rect className="evo-frame" x={TRACK.x0} y={ROW_Y[i]} width={TRACK.w} height={28} rx={5} />
            <Bar x={TRACK.x0} y={ROW_Y[i]} w={(TRACK.w * r.pct) / 100} h={28} tone="tests" look="solid" />
            <text className="evo-stat-text" x={TRACK.x0 + TRACK.w + 12} y={ROW_Y[i] + 19}>
              {r.pct}%
            </text>
          </g>
        ))}
        <line x1={markerX} y1={22} x2={markerX} y2={H - 12} stroke="var(--series-8)" strokeWidth={2} strokeDasharray="5 4" />
        <text className="evo-stat-text bad" x={markerX} y={14} textAnchor="middle">
          {SHARE.defaultSplit[lang]}
        </text>
      </Scene>
    </Fig>
  );
}
