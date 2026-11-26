import type { Locale } from "../../lib/i18n";
import { MILESTONES, TIMELINE } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 28 页的时间线。月份取自各 PR 的 merged_at(见 strings.ts 里的核对记录)。 */

export default function TimelineViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <Fig title={TIMELINE.title[lang]} subtitle={TIMELINE.subtitle[lang]}>
      <ol className="evo-timeline">
        {MILESTONES.map((m) => (
          <li className="evo-milestone evo-stag" key={m.name}>
            <span className="evo-milestone-date">{m.date[lang]}</span>
            <span className="evo-milestone-dot" aria-hidden="true" />
            <b>{m.name}</b>
            <span className="evo-milestone-why">{m.why[lang]}</span>
            <a href={m.url} title={m.prTitle} target="_blank" rel="noreferrer">
              {m.pr ? `#${m.pr}` : TIMELINE.blog[lang]}
            </a>
          </li>
        ))}
      </ol>
    </Fig>
  );
}
