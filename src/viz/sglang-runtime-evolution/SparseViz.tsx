import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { SPARSE, SPARSE_STEPS } from "./strings";
import "./styles.css";

/* 讲座第 58–60 页:稀疏注意力每一步只读 12 条里的 4 条。
   HiSparse 把完整的 12 条放在主机内存,GPU 缓冲区只放 4 条。
   第 N 步选中 2、5、9、11;第 N+1 步选中 2、5、9、12:3 条命中原地复用,
   12 未命中,从主机内存加载并顶替最久未用的 11。 */

const ENTRIES = Array.from({ length: 12 }, (_, i) => i + 1);
const SELECTED = [
  [2, 5, 9, 11],
  [2, 5, 9, 12],
  [2, 5, 9, 12],
];
const BUFFER = [
  [2, 5, 9, 11],
  [2, 5, 9, 11],
  [2, 5, 9, 12],
];

export default function SparseViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(SPARSE_STEPS.length - 1, 0.6);
  const { t } = player;
  const selected = SELECTED[t];
  const buffer = BUFFER[t];

  return (
    <VizStage
      title={SPARSE.title[lang]}
      subtitle={SPARSE.subtitle[lang]}
      player={player}
      lang={lang}
      className="evo-viz"
      footer={
        <Legend
          items={[
            { label: SPARSE.selected[lang], swatch: { background: "color-mix(in srgb, var(--series-2) 40%, var(--surface))" } },
            { label: SPARSE.loaded[lang], swatch: { background: "color-mix(in srgb, var(--series-3) 45%, var(--surface))" } },
          ]}
        />
      }
    >
      <div className="evo-rows two">
        <span className="evo-rowhead">{SPARSE.host[lang]}</span>
        <div className="evo-cells">
          {ENTRIES.map((n) => (
            <span
              className={`evo-cell${selected.includes(n) ? " on" : ""}${t === 1 && n === 12 ? " miss" : ""}`}
              key={n}
            >
              {n}
            </span>
          ))}
        </div>

        <span className="evo-rowhead">{SPARSE.gpu[lang]}</span>
        <div className="evo-cells">
          {buffer.map((n) => (
            <span
              className={`evo-cell${t === 2 && n === 12 ? " new" : selected.includes(n) ? " on" : " dim"}`}
              key={n}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
      <div className="evo-stats" aria-live="polite">
        <span>
          {SPARSE.hits[lang]} <b>{t === 0 ? 4 : 3}</b>
        </span>
        <span>
          {SPARSE.loads[lang]} <b>{t === 2 ? 1 : 0}</b>
        </span>
      </div>
      <div className="evo-step" aria-live="polite">
        {SPARSE_STEPS[t][lang]}
      </div>
    </VizStage>
  );
}
