interface MeterProps {
  label: string;
  /** 0..1 */
  value: number;
  color?: string;
}

/** 小型水平量表:用于利用率等 0–100% 指标 */
export default function Meter({ label, value, color }: MeterProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <span className="viz-meter">
      {label}
      <span className="viz-meter-track">
        <span
          className="viz-meter-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </span>
      <b style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
        {pct}%
      </b>
    </span>
  );
}
