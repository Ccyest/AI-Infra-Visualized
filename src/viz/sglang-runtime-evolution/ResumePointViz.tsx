import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { RESUME } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 31–38 页:三种层各自能从哪些 token 之后恢复。
   Full KV:任意匹配到的 token。
   Window KV(窗口 4):恢复到 token N 需要 N-3..N 的 KV;token 1–4 的 KV 已驱逐,所以 N ≥ 8。
   Recurrent state:只有保存过状态的位置。默认保存在 4、8、16(第 38 页的设定:
   匹配 12 个 token 时,12 处没有保存状态,所以恢复点落在 8,复用 8,重算 4)。
   恢复点 = 所有启用的层都可用的最深位置。 */

const TOKENS = 16;
const WINDOW = 4;
const FIRST_RETAINED = 5;
const DEFAULT_SAVED = [4, 8, 16];

const range = Array.from({ length: TOKENS }, (_, i) => i + 1);

export default function ResumePointViz({ lang = "zh" }: { lang?: Locale }) {
  const [match, setMatch] = useState(12);
  const [useWindow, setUseWindow] = useState(true);
  const [useRecurrent, setUseRecurrent] = useState(true);
  const [saved, setSaved] = useState<number[]>(DEFAULT_SAVED);

  const fullOk = (n: number) => n <= match;
  const windowOk = (n: number) => n <= match && n - WINDOW + 1 >= FIRST_RETAINED;
  const recurrentOk = (n: number) => n <= match && saved.includes(n);

  let resume = 0;
  for (const n of range) {
    if (fullOk(n) && (!useWindow || windowOk(n)) && (!useRecurrent || recurrentOk(n))) resume = n;
  }

  const toggleSaved = (n: number) =>
    setSaved((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)));

  const col = (n: number) => `${n === resume ? " resume" : ""}${n > match ? " beyond" : ""}`;

  return (
    <Fig
      title={RESUME.title[lang]}
      subtitle={RESUME.subtitle[lang]}
      footer={
        <Legend
          items={[
            { label: RESUME.usable[lang], swatch: { background: "color-mix(in srgb, var(--series-3) 45%, var(--surface))" } },
            { label: RESUME.evicted[lang], swatch: { background: "var(--evo-hatch)", border: "1px solid var(--grid)" } },
            { label: RESUME.saved[lang], swatch: { background: "var(--series-7)", borderRadius: "50%" } },
          ]}
        />
      }
    >
      <div className="evo-controls">
        <label className="evo-slider">
          <span>
            {RESUME.matchLen[lang]} <b>{match}</b>
          </span>
          <input type="range" min={4} max={TOKENS} step={1} value={match} onChange={(e) => setMatch(Number(e.target.value))} />
        </label>
        <span className="evo-checks" role="group" aria-label={RESUME.layers[lang]}>
          <label>
            <input type="checkbox" checked disabled /> {RESUME.full[lang]}
          </label>
          <label>
            <input type="checkbox" checked={useWindow} onChange={(e) => setUseWindow(e.target.checked)} /> {RESUME.window[lang]}
          </label>
          <label>
            <input type="checkbox" checked={useRecurrent} onChange={(e) => setUseRecurrent(e.target.checked)} /> {RESUME.recurrent[lang]}
          </label>
        </span>
      </div>

      <div className="evo-resume-grid">
        <span className="evo-rowhead">{RESUME.token[lang]}</span>
        {range.map((n) => (
          <span className={`evo-rcell head${col(n)}`} key={`h${n}`}>
            {n}
          </span>
        ))}

        <span className="evo-rowhead">{RESUME.full[lang]}</span>
        {range.map((n) => (
          <span className={`evo-rcell${fullOk(n) ? " ok" : ""}${col(n)}`} key={`f${n}`} />
        ))}

        <span className={`evo-rowhead${useWindow ? "" : " off"}`}>{RESUME.window[lang]}</span>
        {range.map((n) => (
          <span
            className={`evo-rcell${!useWindow ? " off" : ""}${n < FIRST_RETAINED ? " evicted" : windowOk(n) ? " ok" : ""}${col(n)}`}
            title={n < FIRST_RETAINED ? RESUME.evicted[lang] : undefined}
            key={`w${n}`}
          />
        ))}

        <span className={`evo-rowhead${useRecurrent ? "" : " off"}`}>{RESUME.recurrent[lang]}</span>
        {range.map((n) => {
          const isSaved = saved.includes(n);
          return (
            <button
              type="button"
              className={`evo-rcell btn${!useRecurrent ? " off" : ""}${recurrentOk(n) ? " ok" : ""}${col(n)}`}
              aria-pressed={isSaved}
              aria-label={`${RESUME.toggleSave[lang]} ${n}`}
              title={isSaved ? (n > match ? RESUME.savedBeyond[lang] : RESUME.saved[lang]) : undefined}
              onClick={() => toggleSaved(n)}
              key={`r${n}`}
            >
              {isSaved && <i aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="evo-stats" aria-live="polite">
        <span>
          {RESUME.resumeAfter[lang]} <b>{resume}</b>
        </span>
        <span>
          {RESUME.reuse[lang]} <b>{resume}</b>
        </span>
        <span>
          {RESUME.recompute[lang]} <b>{match - resume}</b>
        </span>
      </div>
    </Fig>
  );
}
