import { useId, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { restoreCost } from "./cost";
import { TEXT } from "./strings";
import "./styles.css";

const CONTROLS = [
  { key: "size", min: 100, max: 4000, step: 100 },
  { key: "hostBandwidth", min: 10, max: 100, step: 10 },
  { key: "storageBandwidth", min: 1, max: 50, step: 1 },
  { key: "lead", min: 0, max: 500, step: 10 },
  { key: "recompute", min: 10, max: 500, step: 10 },
] as const;

export default function CostViz({ lang = "zh" }: { lang?: Locale }) {
  const id = useId();
  const [values, setValues] = useState({ size: 1000, hostBandwidth: 50, storageBandwidth: 10, lead: 0, recompute: 150 });
  const cost = restoreCost({ sizeMB: values.size, hostGBs: values.hostBandwidth,
    storageGBs: values.storageBandwidth, leadMs: values.lead });
  const maxMs = Math.max(cost.l3Ms, values.recompute);
  const rows = [
    { label: TEXT.l2[lang], segments: [0, cost.hostMs, 0] },
    { label: TEXT.l3[lang], segments: [cost.storageWaitMs, cost.hostMs, 0] },
    { label: TEXT.compute[lang], segments: [0, 0, values.recompute] },
  ];
  const labels = [TEXT.storageWait[lang], TEXT.hostCopy[lang], TEXT.compute[lang]];
  return (
    <figure className="viz-stage storage-viz" aria-label={TEXT.cost[lang]}>
      <div className="viz-head"><span className="viz-title">{TEXT.cost[lang]}</span>
        <span className="viz-subtitle">{TEXT.costNote[lang]}</span></div>
      <div className="storage-body">
        <div className="storage-inputs">{CONTROLS.map((control) => <label key={control.key} htmlFor={`${id}-${control.key}`}>
          <span>{TEXT[control.key][lang]} <output>{values[control.key]}</output></span>
          <input id={`${id}-${control.key}`} type="range" {...{ min: control.min, max: control.max, step: control.step }}
            value={values[control.key]} onChange={(event) => setValues({ ...values, [control.key]: Number(event.target.value) })} />
        </label>)}</div>
        <div className="storage-bars" aria-live="polite">{rows.map((row) => <div className="storage-bar-row" key={row.label}>
          <span>{row.label}</span><div className="storage-bar-track">{row.segments.map((duration, index) =>
            <i key={index} style={{ width: `${duration / maxMs * 100}%`, background: `var(--series-${index + 1})` }}
              title={`${labels[index]}: ${duration.toFixed(1)} ms`} />)}</div>
          <output>{row.segments.reduce((a, b) => a + b, 0).toFixed(1)} ms</output>
        </div>)}</div>
        <div className="storage-legend">{labels.map((label, index) => <span key={label}>
          <i style={{ background: `var(--series-${index + 1})` }} />{label}</span>)}</div>
        <div className="storage-hidden">{TEXT.hidden[lang]}: {cost.hiddenMs.toFixed(1)} ms</div>
      </div>
    </figure>
  );
}
