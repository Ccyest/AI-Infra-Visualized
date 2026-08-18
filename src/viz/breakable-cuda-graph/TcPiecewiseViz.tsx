import type { Locale } from "../../lib/i18n";
import { TC } from "./strings";
import "./styles.css";

/* BCG 之前的编译器路线:trace 整个 forward → FX graph 切分 → 逐 piece 编译再 capture。
   编译占准备时间 78–86%,replay 还要每次过 Dynamo guard/dispatch。 */

const OPS = ["A1", "A2", "A3", "E", "B1", "B2", "B3"];

function Ops({ pieces }: { pieces: boolean }) {
  return (
    <span className={`bcg-tc-ops${pieces ? " pieces" : ""}`} aria-hidden="true">
      {OPS.map((op) => (
        <i key={op} className={op === "E" ? "eager" : ""}>
          {op}
        </i>
      ))}
    </span>
  );
}

export default function TcPiecewiseViz({ lang = "zh" }: { lang?: Locale }) {
  const stages = [
    { name: TC.stage1[lang], badge: TC.stage1Badge[lang], visual: <Ops pieces={false} /> },
    { name: TC.stage2[lang], badge: TC.stage2Badge[lang], visual: null },
    { name: TC.stage3[lang], badge: TC.stage3Badge[lang], visual: <Ops pieces /> },
    { name: TC.stage4[lang], badge: TC.stage4Badge[lang], visual: null },
  ];

  return (
    <figure className="viz-stage bcg-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{TC.title[lang]}</span>
        <span className="viz-subtitle">{TC.subtitle[lang]}</span>
      </div>

      <div className="bcg-tc-flow">
        {stages.map((s, i) => (
          <div className="bcg-tc-item" key={s.name}>
            {i > 0 && (
              <span className="bcg-tc-arrow" aria-hidden="true">
                →
              </span>
            )}
            <section className="bcg-tc-stage">
              <b>{s.name}</b>
              {s.visual}
              <small>{s.badge}</small>
            </section>
          </div>
        ))}
      </div>

      <div className="bcg-tc-timebar">
        <span>{TC.timebarLabel[lang]}</span>
        <span className="bcg-tc-bar" aria-hidden="true">
          <i className="compile" style={{ width: "82%" }}>
            {TC.timebarCompile[lang]} 78–86%
          </i>
          <i className="capture" style={{ width: "18%" }}>
            {TC.timebarCapture[lang]}
          </i>
        </span>
        <small>{TC.timebarNumbers[lang]}</small>
      </div>

      <div className="viz-footer">
        <span className="bcg-pad-note">{TC.replayNote[lang]}</span>
      </div>
    </figure>
  );
}
