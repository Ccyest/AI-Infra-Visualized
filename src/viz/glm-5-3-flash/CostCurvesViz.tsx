import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { COST_VIZ } from "./strings";
import "./styles.css";

/**
 * Z.ai blog 两张曲线图的复刻:每层 KV cache、每 token attention compute,
 * 均为随序列长度线性增长的直线;终点值按原图读出,4.44× / 3.01× 是原图标注。
 * 时间轴 = 序列长度(每步 100K),播放时曲线逐段生长。
 */

const STEPS = 10; // ×100K

interface Line {
  key: keyof typeof COST_VIZ;
  end: number;
  color: string;
  dash?: string;
  opacity?: number;
  /** 终点数值标签的纵向错位,避免相近线的标签互压 */
  labelDy?: number;
}

const KV_LINES: Line[] = [
  { key: "glm53", end: 600, color: seriesColor(2) },
  { key: "flash", end: 135, color: seriesColor(1), labelDy: -6 },
  { key: "k3", end: 128, color: seriesColor(3), dash: "6 4", labelDy: 7 },
  { key: "dsv4", end: 78, color: seriesColor(4), dash: "6 4", labelDy: 4 },
];

const COMPUTE_LINES: Line[] = [
  { key: "k3Decode", end: 146, color: seriesColor(3), dash: "6 4" },
  { key: "k3Prefill", end: 48, color: seriesColor(3), dash: "2 4", opacity: 0.75 },
  { key: "glm53", end: 17, color: seriesColor(2), labelDy: -6 },
  { key: "dsv4", end: 15, color: seriesColor(4), dash: "6 4", labelDy: 6 },
  { key: "flash", end: 5.6, color: seriesColor(1), labelDy: 4 },
];

interface PanelSpec {
  title: keyof typeof COST_VIZ;
  x0: number;
  lines: Line[];
  yMax: number;
  yTicks: number[];
  ratio: { label: string; from: number; to: number };
}

const PANELS: PanelSpec[] = [
  { title: "kvTitle", x0: 64, lines: KV_LINES, yMax: 620, yTicks: [0, 200, 400, 600], ratio: { label: "4.44×", from: 600, to: 135 } },
  { title: "computeTitle", x0: 560, lines: COMPUTE_LINES, yMax: 155, yTicks: [0, 50, 100, 150], ratio: { label: "3.01×", from: 146, to: 5.6 } },
];

const PW = 330;
const PY = 56;
const PH = 240;

export default function CostCurvesViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(STEPS, 1.6);
  const { t } = player;

  const panel = (spec: PanelSpec) => {
    const { x0, lines, yMax, yTicks } = spec;
    const px = (step: number) => x0 + (step / STEPS) * PW;
    const py = (v: number) => PY + PH - (v / yMax) * PH;
    return (
      <g key={spec.title}>
        <text x={x0 + PW / 2} y={PY - 26} textAnchor="middle" fontSize={11} fontWeight={650} fill="var(--ink)">
          {COST_VIZ[spec.title][lang]}
        </text>
        <line x1={x0} y1={PY} x2={x0} y2={PY + PH} stroke="var(--axis)" strokeWidth={1} />
        <line x1={x0} y1={PY + PH} x2={x0 + PW} y2={PY + PH} stroke="var(--axis)" strokeWidth={1} />
        {yTicks.map((v) => (
          <g key={`yt-${v}`}>
            <line x1={x0} y1={py(v)} x2={x0 + PW} y2={py(v)} stroke="var(--grid)" strokeWidth={0.7} />
            <text x={x0 - 8} y={py(v) + 3} textAnchor="end" fontSize={9} fill="var(--muted)">
              {v}
            </text>
          </g>
        ))}
        {[0, 5, 10].map((s) => (
          <text key={`xt-${s}`} x={px(s)} y={PY + PH + 16} textAnchor="middle" fontSize={9} fill="var(--muted)">
            {s === 0 ? "0" : s === 5 ? "500K" : "1M"}
          </text>
        ))}
        <text x={x0 + PW / 2} y={PY + PH + 32} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
          {COST_VIZ.xAxis[lang]}
        </text>

        {/* 曲线:画到当前 t */}
        {lines.map((l) => {
          const tipV = (l.end * t) / STEPS;
          return (
            <g key={l.key} opacity={l.opacity ?? 1}>
              <line x1={px(0)} y1={py(0)} x2={px(t)} y2={py(tipV)} stroke={l.color} strokeWidth={l.key === "flash" ? 2.6 : 1.9} strokeDasharray={l.dash} />
              {t > 0 && (
                <text x={px(t) + 5} y={py(tipV) + 3 + (l.labelDy ?? 0)} fontSize={9} fontWeight={l.key === "flash" ? 700 : 500} fill={l.color}>
                  {tipV >= 10 ? Math.round(tipV) : tipV.toFixed(1)}
                </text>
              )}
            </g>
          );
        })}

        {/* 终点的倍数标注(原图口径) */}
        {t >= STEPS && (
          <g>
            <line x1={px(10) + 34} y1={py(spec.ratio.from)} x2={px(10) + 34} y2={py(spec.ratio.to)} stroke="var(--ink)" strokeWidth={1.2} markerEnd="url(#g53c-arr)" markerStart="url(#g53c-arr)" />
            <text x={px(10) + 40} y={(py(spec.ratio.from) + py(spec.ratio.to)) / 2 + 3} fontSize={10.5} fontWeight={700} fill="var(--ink)">
              {spec.ratio.label}
            </text>
          </g>
        )}

        {/* 面板内图例 */}
        {lines.map((l, i) => (
          <g key={`lg-${l.key}`} opacity={l.opacity ?? 1}>
            <line x1={x0 + 10} y1={PY + 10 + i * 14} x2={x0 + 30} y2={PY + 10 + i * 14} stroke={l.color} strokeWidth={2.2} strokeDasharray={l.dash} />
            <text x={x0 + 36} y={PY + 13 + i * 14} fontSize={8.8} fill="var(--ink-2)">
              {COST_VIZ[l.key][lang]}
            </text>
          </g>
        ))}
      </g>
    );
  };

  return (
    <VizStage title={COST_VIZ.title[lang]} subtitle={COST_VIZ.subtitle[lang]} player={player} lang={lang}>
      <div className="viz-grid-wrap">
        <svg className="viz-grid" style={{ minWidth: 820 }} viewBox="0 0 990 340" role="img" aria-label={COST_VIZ.title[lang]}>
          <defs>
            <marker id="g53c-arr" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--ink)" />
            </marker>
          </defs>
          {PANELS.map(panel)}
        </svg>
      </div>
    </VizStage>
  );
}
