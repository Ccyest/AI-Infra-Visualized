import { useMemo } from "react";
import VizStage from "../../components/core/VizStage";
import Legend from "../../components/core/Legend";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";

const STEPS = [
  { token: "A=1", key: "A", value: 1, old: 0, delta: 1 },
  { token: "B=2", key: "B", value: 2, old: 0, delta: 2 },
  { token: "A=4", key: "A", value: 4, old: 1, delta: 3 },
  { token: "A?", key: "A", value: 4, old: 4, delta: 0 },
];

const COPY = {
  title: { zh: "DeltaNet：同键改写时，先读、再擦、后写", en: "DeltaNet: read, erase, then write on rebinding" },
  subtitle: {
    zh: "A=4 不会和 A=1 叠在一起：delta 只把差值写回同一个键方向",
    en: "A=4 does not stack with A=1: the delta is written back to the same key direction",
  },
  before: { zh: "写入前的 S", en: "S before write" },
  read: { zh: "① 用当前 k 从 S 读旧值", en: "① use current k to read the old value" },
  diff: { zh: "② 算差值", en: "② compute the delta" },
  after: { zh: "③ 把差值写回 S", en: "③ write the delta back to S" },
  query: { zh: "A? 读到最新绑定", en: "A? reads the latest binding" },
  empty: { zh: "空", en: "empty" },
  old: { zh: "旧值", en: "old" },
  newValue: { zh: "新值", en: "new" },
  verdict: {
    zh: "关键动作：A=4 时，kᵀS 先读出 1，v−kᵀS=4−1=3；写入的是“擦掉 1 再补到 4”的差值，所以 S 里只保留 A=4。",
    en: "The key move: at A=4, kᵀS first reads 1, so v−kᵀS=4−1=3. Writing that delta erases the old 1 and brings the slot to 4, leaving only A=4 in S.",
  },
};

function label(locale: Locale, item: { zh: string; en: string }) {
  return item[locale];
}

function StateBox({ values, locale, highlight }: { values: Record<string, number>; locale: Locale; highlight?: string }) {
  const keys = ["A", "B"];
  return (
    <div className="delta-state-box" aria-label={keys.map((k) => `${k}=${values[k] ?? 0}`).join(", ")}>
      {keys.map((key) => {
        const value = values[key] ?? 0;
        return (
          <div className={`delta-slot${highlight === key ? " is-highlight" : ""}`} key={key}>
            <span className="delta-slot-key">{key}</span>
            <span className="delta-slot-value" style={{ background: value ? seriesColor(value) : "var(--grid)" }}>
              {value || label(locale, COPY.empty)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function DeltaRuleViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(STEPS.length, 1.35);
  const step = Math.min(player.t, STEPS.length);
  const current = step ? STEPS[step - 1] : null;
  const before = useMemo(() => {
    const values: Record<string, number> = {};
    for (let i = 0; i < Math.max(0, step - 1); i += 1) {
      const item = STEPS[i];
      if (item.token.endsWith("?")) continue;
      values[item.key] = item.value;
    }
    return values;
  }, [step]);
  const after = { ...before };
  if (current && !current.token.endsWith("?")) after[current.key] = current.value;
  const isWrite = current && !current.token.endsWith("?");

  return (
    <VizStage
      title={label(lang, COPY.title)}
      subtitle={label(lang, COPY.subtitle)}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend
            items={[
              {
                label: lang === "zh" ? "彩色 = 当前键的绑定值" : "color = current binding for the key",
                swatch: { background: "var(--series-1)" },
              },
              {
                label: lang === "zh" ? "灰色 = 没有值" : "gray = no value",
                swatch: { background: "var(--grid)" },
              },
            ]}
          />
          <div className="viz-verdict">{label(lang, COPY.verdict)}</div>
        </>
      }
    >
      <div className="delta-rule-flow">
        <div className="delta-rule-token-row">
          {STEPS.map((item, i) => (
            <span className={`delta-rule-token${i < step ? " is-seen" : ""}${i === step - 1 ? " is-current" : ""}`} key={item.token + i}>
              {item.token}
            </span>
          ))}
        </div>
        {current ? (
          <div className="delta-rule-stage">
            <div className="delta-rule-column">
              <span className="delta-rule-caption">{label(lang, COPY.before)}</span>
              <StateBox values={before} locale={lang} highlight={isWrite ? current.key : undefined} />
            </div>
            <div className="delta-rule-operation">
              {isWrite ? (
                <>
                  <div className="delta-operation-line">{label(lang, COPY.read)}: <b>{current.old}</b></div>
                  <div className="delta-operation-line">{label(lang, COPY.diff)}: <b>{current.value} − {current.old} = {current.delta}</b></div>
                  <div className="delta-operation-arrow">擦旧 → 写差值 →</div>
                </>
              ) : (
                <div className="delta-query-badge">{label(lang, COPY.query)}: <b>{current.value}</b></div>
              )}
            </div>
            <div className="delta-rule-column">
              <span className="delta-rule-caption">{label(lang, COPY.after)}</span>
              <StateBox values={after} locale={lang} highlight={isWrite ? current.key : undefined} />
            </div>
          </div>
        ) : (
          <div className="delta-rule-empty">{label(lang, COPY.before)} → {label(lang, COPY.after)}</div>
        )}
      </div>
    </VizStage>
  );
}
