import type { Locale } from "../../lib/i18n";
import { DECLARE, DECLARE_COLS } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 85 页:应用声明什么、runtime 推断什么,这条分界线在三个阶段怎么移动。 */

export default function DeclareViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <Fig title={DECLARE.title[lang]} subtitle={DECLARE.subtitle[lang]}>
      <div className="evo-declare">
        {DECLARE_COLS.map((col, i) => (
          <section className={`evo-declare-col${i === 2 ? " next" : ""}`} key={col.head.en}>
            <h4>{col.head[lang]}</h4>
            <span className="evo-declare-label app">{DECLARE.appRow[lang]}</span>
            <ul>
              {col.app.map((item) => (
                <li className="app" key={item.en}>
                  {item[lang]}
                </li>
              ))}
            </ul>
            <span className="evo-declare-label runtime">{DECLARE.runtimeRow[lang]}</span>
            <ul>
              {col.runtime.map((item) => (
                <li className="runtime" key={item.en}>
                  {item[lang]}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Fig>
  );
}
