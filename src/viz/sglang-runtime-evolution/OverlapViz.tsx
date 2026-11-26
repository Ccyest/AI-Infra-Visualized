import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { OVERLAP } from "./strings";
import { Fig, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 66、68 页:串行时每批耗时 CPU + GPU;overlap 之后稳态是 max(CPU, GPU)。
   CPU 2 / GPU 6:8 → 6。CPU 8 / GPU 6:14 → 8,这时 CPU 决定节奏,GPU 每批空等 2。
   调度规则:C(i+1) 在 G(i) 启动时开始;G(i) 要等 C(i) 和 G(i-1) 都结束。 */

const BATCHES = 3;

type Preset = "cold" | "warm" | "custom";

interface Block {
  label: string;
  start: number;
  len: number;
}

function schedule(cpu: number, gpu: number, overlapped: boolean): { cpu: Block[]; gpu: Block[] } {
  const c: Block[] = [];
  const g: Block[] = [];
  for (let i = 0; i < BATCHES; i++) {
    const prevG = g[i - 1];
    const cStart = i === 0 ? 0 : overlapped ? prevG.start : prevG.start + prevG.len;
    const gStart = Math.max(cStart + cpu, prevG ? prevG.start + prevG.len : 0);
    c.push({ label: `C${i + 1}`, start: cStart, len: cpu });
    g.push({ label: `G${i + 1}`, start: gStart, len: gpu });
  }
  return { cpu: c, gpu: g };
}

export default function OverlapViz({ lang = "zh" }: { lang?: Locale }) {
  const [cpu, setCpu] = useState(2);
  const [gpu, setGpu] = useState(6);
  const span = BATCHES * (cpu + gpu);
  const preset: Preset = cpu === 2 && gpu === 6 ? "cold" : cpu === 8 && gpu === 6 ? "warm" : "custom";

  const panel = (overlapped: boolean) => {
    const s = schedule(cpu, gpu, overlapped);
    const per = overlapped ? Math.max(cpu, gpu) : cpu + gpu;
    const row = (blocks: Block[], cls: string) => (
      <div className="evo-track">
        {blocks.map((b) => (
          <span
            className={`evo-block ${cls}`}
            key={b.label}
            style={{ left: `${(b.start / span) * 100}%`, width: `${(b.len / span) * 100}%` }}
          >
            {b.label}
          </span>
        ))}
      </div>
    );
    return (
      <div className="evo-lane">
        <div className="evo-lane-head">
          <b>{overlapped ? OVERLAP.overlapped[lang] : OVERLAP.serial[lang]}</b>
          <span aria-live="polite">
            {per} ms {OVERLAP.perBatch[lang]}
          </span>
        </div>
        <div className="evo-tracks">
          <span className="evo-rowhead">CPU</span>
          {row(s.cpu, "cpu")}
          <span className="evo-rowhead">GPU</span>
          {row(s.gpu, "gpu")}
        </div>
      </div>
    );
  };

  return (
    <Fig
      title={OVERLAP.title[lang]}
      subtitle={OVERLAP.subtitle[lang]}
      headExtra={
        <Tabs
          label={OVERLAP.presets[lang]}
          value={preset}
          onChange={(p) => {
            if (p === "custom") return;
            setCpu(p === "cold" ? 2 : 8);
            setGpu(6);
          }}
          options={[
            { key: "cold", label: OVERLAP.cold[lang] },
            { key: "warm", label: OVERLAP.warm[lang] },
          ]}
        />
      }
      footer={
        <Legend
          items={[
            { label: "CPU", swatch: { background: "var(--series-4)" } },
            { label: "GPU", swatch: { background: "var(--series-1)" } },
          ]}
        />
      }
    >
      <div className="evo-controls two">
        <label className="evo-slider">
          <span>
            {OVERLAP.cpu[lang]} <b>{cpu} ms</b>
          </span>
          <input type="range" min={1} max={10} step={1} value={cpu} onChange={(e) => setCpu(Number(e.target.value))} />
        </label>
        <label className="evo-slider">
          <span>
            {OVERLAP.gpu[lang]} <b>{gpu} ms</b>
          </span>
          <input type="range" min={1} max={10} step={1} value={gpu} onChange={(e) => setGpu(Number(e.target.value))} />
        </label>
      </div>
      <div className="evo-lanes single">
        {panel(false)}
        {panel(true)}
      </div>
    </Fig>
  );
}
