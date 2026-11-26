import { useState } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { COMMON, FORK, SPAN } from "./strings";
import { Seg, SWATCH_COMPUTE, SWATCH_REUSE, Tabs } from "./ui";
import type { SegMode, SpanKey } from "./ui";
import "./styles.css";

/* 讲座第 10 页:没有提示时,两个分支各自把 Shared context 算一遍(2 次);
   有提示时,前端先把 Shared context 单独发出去,算 1 次,两个分支都复用。 */

type Mode = "without" | "with";

interface Row {
  head: "ctx" | "fix" | "tests";
  segs: { span: SpanKey; tokens: number; mode: SegMode }[];
}

const ROWS: Record<Mode, Row[]> = {
  without: [
    { head: "fix", segs: [{ span: "ctx", tokens: 4, mode: "compute" }, { span: "fix", tokens: 2, mode: "compute" }] },
    { head: "tests", segs: [{ span: "ctx", tokens: 4, mode: "compute" }, { span: "tests", tokens: 3, mode: "compute" }] },
  ],
  with: [
    { head: "ctx", segs: [{ span: "ctx", tokens: 4, mode: "compute" }] },
    { head: "fix", segs: [{ span: "ctx", tokens: 4, mode: "reuse" }, { span: "fix", tokens: 2, mode: "compute" }] },
    { head: "tests", segs: [{ span: "ctx", tokens: 4, mode: "reuse" }, { span: "tests", tokens: 3, mode: "compute" }] },
  ],
};

export default function ForkHintViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<Mode>("without");
  const rows = ROWS[mode];
  const player = useSimPlayer(rows.length, 0.9);
  const { t } = player;

  const shown = rows.slice(0, t);
  const count = (m: SegMode) =>
    shown.reduce((n, r) => n + r.segs.filter((s) => s.span === "ctx" && s.mode === m).length, 0);
  const label = (k: SpanKey) =>
    k === "ctx" ? SPAN.ctx[lang] : k === "fix" ? SPAN.fix[lang] : SPAN.tests[lang];
  const head = (r: Row) => (r.head === "ctx" ? FORK.sentFirst[lang] : label(r.head));

  return (
    <VizStage
      title={FORK.title[lang]}
      subtitle={FORK.subtitle[lang]}
      player={player}
      lang={lang}
      className="evo-viz"
      headExtra={
        <Tabs
          label={FORK.tabs[lang]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            player.reset();
          }}
          options={[
            { key: "without", label: FORK.without[lang] },
            { key: "with", label: FORK.with[lang] },
          ]}
        />
      }
      footer={
        <Legend
          items={[
            { label: COMMON.computed[lang], swatch: SWATCH_COMPUTE },
            { label: COMMON.reused[lang], swatch: SWATCH_REUSE },
          ]}
        />
      }
    >
      <div className="evo-requests evo-fork" style={{ minHeight: "7.6rem" }}>
        {rows.map((r, i) => (
          <div className={`evo-request${i < t ? "" : " evo-hide"}`} key={`${mode}-${i}`}>
            <span className="evo-rowhead">{head(r)}</span>
            <div className="evo-row evo-row-7">
              {r.segs.map((s) => (
                <Seg key={s.span} span={s.span} tokens={s.tokens} mode={s.mode} label={label(s.span)} />
              ))}
              <span
                aria-hidden="true"
                style={{ flexGrow: 7 - r.segs.reduce((n, s) => n + s.tokens, 0), flexBasis: 0 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="evo-stats" aria-live="polite">
        <span>
          {FORK.ctxComputed[lang]} <b>{count("compute")}×</b>
        </span>
        {mode === "with" && (
          <span>
            {FORK.ctxReused[lang]} <b>{count("reuse")}×</b>
          </span>
        )}
      </div>
    </VizStage>
  );
}
