import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { BCG_STEP, BCG_STEPS } from "./strings";
import "./styles.css";

/* 12 步走查:capture 一次(t=1..5),replay 两次(t=6..9、t=10..12)。
   状态全部由 t 推导,无内部随机性。 */

const TOTAL = 12;

type SegState = "idle" | "recording" | "sealed" | "replaying";

function seg1State(t: number): SegState {
  if (t === 0) return "idle";
  if (t === 1) return "recording";
  if (t === 6 || t === 10) return "replaying";
  return "sealed";
}

function seg2State(t: number): SegState {
  if (t < 4) return "idle";
  if (t === 4) return "recording";
  if (t === 9 || t === 12) return "replaying";
  return "sealed";
}

function eagerRunning(t: number): boolean {
  return t === 3 || t === 7 || t === 11;
}

/** boundary buffer 当前的值(t<3 时不存在) */
function bufferValue(t: number): string | null {
  if (t < 3) return null;
  if (t < 8) return "v₀";
  if (t < 11) return "v₁";
  return "v₂";
}

/** 临时新 tensor(仅 replay 时出现) */
function freshTensor(t: number): { addr: string; value: string } | null {
  if (t === 7 || t === 8) return { addr: "0x7A10", value: "v₁" };
  if (t === 11) return { addr: "0x9C20", value: "v₂" };
  return null;
}

function segStateLabel(state: SegState, lang: Locale): string {
  switch (state) {
    case "recording":
      return BCG_STEP.stateRecording[lang];
    case "sealed":
      return BCG_STEP.stateSealed[lang];
    case "replaying":
      return BCG_STEP.stateReplaying[lang];
    default:
      return "";
  }
}

function Segment({
  ops,
  name,
  state,
  lang,
}: {
  ops: string[];
  name: string;
  state: SegState;
  lang: Locale;
}) {
  return (
    <div className={`bcg-seg ${state !== "idle" ? state : ""}`}>
      <span className="bcg-seg-label">
        {state === "idle" ? "" : `${name} · ${segStateLabel(state, lang)}`}
      </span>
      <span className="bcg-seg-ops">
        {ops.map((op) => (
          <span className="bcg-op" key={op}>
            {op}
          </span>
        ))}
      </span>
    </div>
  );
}

export default function BcgStepViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 0.9);
  const { t } = player;

  const phases = [
    { label: BCG_STEP.phaseCapture[lang], active: t >= 1 && t <= 5 },
    { label: BCG_STEP.phaseReplay1[lang], active: t >= 6 && t <= 9 },
    { label: BCG_STEP.phaseReplay2[lang], active: t >= 10 },
  ];

  const buf = bufferValue(t);
  const fresh = freshTensor(t);
  const copying = t === 8 || t === 11;
  const writing = t === 3 || copying;
  const reading = t === 4 || t === 9 || t === 12;

  return (
    <VizStage
      title={BCG_STEP.title[lang]}
      player={player}
      lang={lang}
    >
      <div className="bcg-phases">
        {phases.map((p) => (
          <span className={`bcg-phase${p.active ? " active" : ""}`} key={p.label}>
            {p.label}
          </span>
        ))}
      </div>

      <div className="bcg-ops">
        <Segment
          ops={["A1", "A2", "A3"]}
          name={BCG_STEP.seg1[lang]}
          state={seg1State(t)}
          lang={lang}
        />
        <div className={`bcg-eager${eagerRunning(t) ? " running" : ""}`}>
          <span className="bcg-eager-badge">{BCG_STEP.eagerBadge[lang]}</span>
          <span className="bcg-seg-ops" style={{ justifyContent: "center" }}>
            <span className="bcg-op">E</span>
          </span>
          <span className="bcg-op-state">
            {eagerRunning(t) ? BCG_STEP.stateEagerRun[lang] : ""}
          </span>
        </div>
        <Segment
          ops={["B1", "B2", "B3"]}
          name={BCG_STEP.seg2[lang]}
          state={seg2State(t)}
          lang={lang}
        />
      </div>

      <div className="bcg-mem">
        <div className={`bcg-buf fresh${fresh ? " visible" : ""}`}>
          <span className="bcg-buf-name">{BCG_STEP.freshName[lang]}</span>
          <span className="bcg-buf-addr">{fresh ? fresh.addr : "—"}</span>
          <span className="bcg-buf-value">{fresh ? fresh.value : ""}</span>
        </div>
        <span className={`bcg-mem-arrow${copying ? " visible" : ""}`}>
          → {BCG_STEP.copyArrow[lang]} →
        </span>
        <div className={`bcg-buf fixed${buf ? " visible" : ""}${writing ? " writing" : ""}`}>
          <span className="bcg-buf-name">{BCG_STEP.bufferName[lang]}</span>
          <span className="bcg-buf-addr">{BCG_STEP.bufferAddr[lang]}</span>
          <span className="bcg-buf-value">{buf ?? ""}</span>
        </div>
        <span className={`bcg-mem-hint${reading || t === 4 ? " visible" : ""}`}>
          {t === 4 ? BCG_STEP.captureAgainst[lang] : `segment 2 ${BCG_STEP.readFrom[lang]}`}
        </span>
      </div>

      <div className="bcg-step-desc">{BCG_STEPS[t][lang]}</div>
    </VizStage>
  );
}
