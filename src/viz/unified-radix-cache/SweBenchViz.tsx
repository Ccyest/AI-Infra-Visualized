import type { Locale } from "../../lib/i18n";
import { SWE } from "./strings";
import "./styles.css";

/* SWE-bench 会话感知结果,数字取自博客正文:
   DeepSeek-V4-Pro:bs128 TTFT −11.0%(device 命中 42%→51%),bs256 −2.9%;
   Qwen3.5-397B-A17B:bs32 −13.5%(device 5%→34%),bs64 −16.6%(device+host 58%→67%)。
   原文只给出这些命中率组合,未给出的不补。 */

interface Row {
  bs: number;
  ttftDrop: number; // %
  hit?: { kind: "device" | "deviceHost"; from: number; to: number };
}

interface Panel {
  model: string;
  rows: Row[];
}

const PANELS: Panel[] = [
  {
    model: "DeepSeek-V4-Pro · TP8",
    rows: [
      { bs: 128, ttftDrop: 11.0, hit: { kind: "device", from: 42, to: 51 } },
      { bs: 256, ttftDrop: 2.9 },
    ],
  },
  {
    model: "Qwen3.5-397B-A17B · TP8",
    rows: [
      { bs: 32, ttftDrop: 13.5, hit: { kind: "device", from: 5, to: 34 } },
      { bs: 64, ttftDrop: 16.6, hit: { kind: "deviceHost", from: 58, to: 67 } },
    ],
  },
];

const MAX_DROP = 16.6;

export default function SweBenchViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage urc-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{SWE.title[lang]}</span>
      </div>

      <div className="urc-bench">
        {PANELS.map((p) => (
          <div className="urc-bench-panel" key={p.model}>
            <span className="urc-bench-model">{p.model}</span>
            <span className="urc-bench-head">{SWE.ttftHead[lang]}</span>
            {p.rows.map((r) => (
              <div className="urc-bar-row" key={r.bs}>
                <span>
                  {SWE.bs[lang]} {r.bs}
                </span>
                <span>
                  <span
                    className="urc-bar"
                    style={{
                      width: `${(r.ttftDrop / MAX_DROP) * 100}%`,
                      background: "var(--series-3)",
                    }}
                    title={`TTFT −${r.ttftDrop}%`}
                  />
                </span>
                <output>−{r.ttftDrop}%</output>
              </div>
            ))}
            <span className="urc-bench-head">{SWE.hitHead[lang]}</span>
            {p.rows
              .filter((r) => r.hit)
              .map((r) => (
                <span className="urc-hit-arrow" key={r.bs}>
                  {SWE.bs[lang]} {r.bs} ·{" "}
                  {r.hit!.kind === "device" ? SWE.device[lang] : SWE.deviceHost[lang]}{" "}
                  {r.hit!.from}% → <b>{r.hit!.to}%</b>
                </span>
              ))}
          </div>
        ))}
      </div>

      <div className="viz-footer">
      </div>
    </figure>
  );
}
