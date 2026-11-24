import type { Locale } from "../../lib/i18n";
import { SWEEP } from "./strings";
import "./styles.css";

/* 序列长度 sweep 的生成吞吐(tokens/s),数字取自原文柱状图上的标注:
   GLM-5.1-FP8,两台 H20 节点,PD 分离部署。
   倍数 = HiSparse / baseline,由这两列数字直接相除得到。 */

const ROWS = [
  { config: "20K / 10K", baseline: 752, hisparse: 2320 },
  { config: "20K / 20K", baseline: 600, hisparse: 2280 },
  { config: "40K / 10K", baseline: 472, hisparse: 2080 },
  { config: "40K / 20K", baseline: 368, hisparse: 2050 },
  { config: "60K / 10K", baseline: 360, hisparse: 1820 },
  { config: "60K / 20K", baseline: 352, hisparse: 1720 },
] as const;

const MAX = 2320;
/* 条形最长占 82%,给右侧的数值标签留位置 */
const width = (value: number) => `${(value / MAX) * 82}%`;

export default function SweepBenchViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage hsp-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{SWEEP.title[lang]}</span>
        <span className="viz-subtitle">{SWEEP.subtitle[lang]}</span>
      </div>

      <div className="hsp-sweep">
        <div className="hsp-sweep-head">
          <span>{SWEEP.config[lang]}</span>
          <span className="viz-legend">
            <span className="viz-legend-item">
              <span className="viz-swatch" style={{ background: "var(--muted)" }} />
              {SWEEP.baseline[lang]}
            </span>
            <span className="viz-legend-item">
              <span className="viz-swatch" style={{ background: "var(--series-1)" }} />
              {SWEEP.hisparse[lang]}
            </span>
          </span>
          <span />
        </div>

        {ROWS.map((row) => (
          <div className="hsp-sweep-row" key={row.config}>
            <span>{row.config}</span>
            <span className="hsp-sweep-bars">
              <span className="hsp-sweep-bar">
                <span style={{ width: width(row.baseline), background: "var(--muted)" }} />
                <output>{row.baseline.toLocaleString("en-US")}</output>
              </span>
              <span className="hsp-sweep-bar">
                <span style={{ width: width(row.hisparse), background: "var(--series-1)" }} />
                <output>{row.hisparse.toLocaleString("en-US")}</output>
              </span>
            </span>
            <span className="hsp-sweep-ratio">{(row.hisparse / row.baseline).toFixed(1)}×</span>
          </div>
        ))}
      </div>
    </figure>
  );
}
