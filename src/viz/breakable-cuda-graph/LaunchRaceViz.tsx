import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale, Localized } from "../../lib/i18n";
import { RACE, raceFinished, raceLaunches } from "./strings";
import "./styles.css";

/* 教学时间模型(serialized launch-bound):
   每个 kernel 先要 CPU 发射 2 拍,才能在 GPU 上执行 1 拍。
   graph 段整段只发射一次;BCG 的 eager 区等前一段执行完再准备。 */

interface Block {
  start: number;
  end: number;
  kind: "launch" | "gk" | "ek" | "idle";
}

interface Lane {
  id: string;
  name: Localized;
  finish: number;
  launches: number;
  cpu: Block[];
  gpu: Block[];
}

const N = 12; // kernel 数
const TOTAL = 25;

function eagerLane(): Lane {
  const cpu: Block[] = [];
  const gpu: Block[] = [];
  // CPU 一直在发射(launch-bound):kernel i 发射 [2i, 2i+2),执行 [2i+2, 2i+3)
  for (let i = 0; i < N; i++) {
    cpu.push({ start: 2 * i, end: 2 * i + 2, kind: "launch" });
    if (i === 0) gpu.push({ start: 0, end: 2, kind: "idle" });
    gpu.push({ start: 2 * i + 2, end: 2 * i + 3, kind: "ek" });
    if (i < N - 1) gpu.push({ start: 2 * i + 3, end: 2 * i + 4, kind: "idle" });
  }
  return {
    id: "eager",
    name: RACE.laneEager,
    finish: 2 * (N - 1) + 3,
    launches: N,
    cpu,
    gpu,
  };
}

function fullLane(): Lane {
  const gpu: Block[] = [{ start: 0, end: 2, kind: "idle" }];
  for (let i = 0; i < N; i++) gpu.push({ start: 2 + i, end: 3 + i, kind: "gk" });
  return {
    id: "full",
    name: RACE.laneFull,
    finish: 2 + N,
    launches: 1,
    cpu: [{ start: 0, end: 2, kind: "launch" }],
    gpu,
  };
}

function bcgLane(): Lane {
  const cpu: Block[] = [
    { start: 0, end: 2, kind: "launch" }, // segment 1
    { start: 7, end: 9, kind: "launch" }, // eager op 1(等 segment 1 执行完)
    { start: 9, end: 11, kind: "launch" }, // eager op 2
    { start: 11, end: 13, kind: "launch" }, // segment 2
  ];
  const gpu: Block[] = [{ start: 0, end: 2, kind: "idle" }];
  for (let i = 0; i < 5; i++) gpu.push({ start: 2 + i, end: 3 + i, kind: "gk" });
  gpu.push({ start: 7, end: 9, kind: "idle" });
  gpu.push({ start: 9, end: 10, kind: "ek" });
  gpu.push({ start: 10, end: 11, kind: "idle" });
  gpu.push({ start: 11, end: 12, kind: "ek" });
  gpu.push({ start: 12, end: 13, kind: "idle" });
  for (let i = 0; i < 5; i++) gpu.push({ start: 13 + i, end: 14 + i, kind: "gk" });
  return {
    id: "bcg",
    name: RACE.laneBcg,
    finish: 18,
    launches: 4,
    cpu,
    gpu,
  };
}

const LANES: Lane[] = [eagerLane(), bcgLane(), fullLane()];

function Track({ blocks, t }: { blocks: Block[]; t: number }) {
  return (
    <span className="bcg-track">
      {blocks
        .filter((b) => b.start < t)
        .map((b) => (
          <i
            key={`${b.kind}-${b.start}`}
            className={`bcg-block ${b.kind}`}
            style={{
              left: `${(b.start / TOTAL) * 100}%`,
              width: `${((Math.min(b.end, t) - b.start) / TOTAL) * 100}%`,
            }}
          />
        ))}
      {t < TOTAL && (
        <i className="bcg-playhead" style={{ left: `${(t / TOTAL) * 100}%` }} />
      )}
    </span>
  );
}

export default function LaunchRaceViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 4);
  const { t } = player;

  return (
    <VizStage
      title={RACE.title[lang]}
      subtitle={RACE.subtitle[lang]}
      player={player}
      lang={lang}
      footer={
        <Legend
          items={[
            { label: RACE.legendLaunch[lang], swatch: { background: "var(--axis)" } },
            {
              label: RACE.legendGraphKernel[lang],
              swatch: { background: "var(--series-1)" },
            },
            {
              label: RACE.legendEagerKernel[lang],
              swatch: { background: "var(--series-2)" },
            },
            {
              label: RACE.legendIdle[lang],
              swatch: {
                background:
                  "repeating-linear-gradient(45deg, transparent 0 3px, var(--axis) 3px 4.5px)",
              },
            },
          ]}
        />
      }
    >
      <div className="bcg-race">
        {LANES.map((lane) => (
          <div className="bcg-race-lane" key={lane.id}>
            <div className="bcg-race-head">
              <b>{lane.name[lang]}</b>
              <small>{raceLaunches(lang, lane.launches)}</small>
              {t >= lane.finish && (
                <span className="bcg-race-finish">{raceFinished(lang, lane.finish)}</span>
              )}
            </div>
            <div className="bcg-race-row">
              <span>{RACE.cpuRow[lang]}</span>
              <Track blocks={lane.cpu} t={t} />
            </div>
            <div className="bcg-race-row">
              <span>{RACE.gpuRow[lang]}</span>
              <Track blocks={lane.gpu} t={t} />
            </div>
          </div>
        ))}
      </div>
    </VizStage>
  );
}
