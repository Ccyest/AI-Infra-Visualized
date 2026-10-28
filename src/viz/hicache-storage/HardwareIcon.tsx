export type HardwareNodeId = "gpu" | "hbm" | "cpu" | "host" | "ssd" | "remote";

function Chip({ isGpu }: { isGpu: boolean }) {
  return <>
    {[24, 36, 48, 60, 72].map(position => <path key={position}
      d={`M${position} 7 V15 M${position} 65 V73 M15 ${position - 8} H7 M81 ${position - 8} H89`} />)}
    <rect x="15" y="15" width="66" height="50" rx="6" className="hardware-icon-fill" />
    {isGpu ? [0, 1, 2].flatMap(row => [0, 1, 2, 3].map(column =>
      <rect key={`${row}-${column}`} x={25 + column * 12} y={25 + row * 11} width="8" height="7" rx="1" />))
      : <><rect x="29" y="25" width="38" height="30" rx="3" /><path d="M48 25 V55 M29 40 H67" /></>}
  </>;
}

export default function HardwareIcon({ kind }: { kind: HardwareNodeId }) {
  return <svg className="hardware-icon" viewBox="0 0 96 80" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {(kind === "gpu" || kind === "cpu") && <Chip isGpu={kind === "gpu"} />}
    {kind === "hbm" && <>
      {[0, 1, 2].map(layer => <rect key={layer} x="23" y={16 + layer * 17} width="50" height="13" rx="3" className="hardware-icon-fill" />)}
      <path d="M31 63 V70 M43 63 V70 M55 63 V70 M67 63 V70" />
    </>}
    {kind === "host" && <>
      <rect x="7" y="22" width="82" height="35" rx="4" className="hardware-icon-fill" />
      {[17, 36, 55, 74].map(x => <rect key={x} x={x} y="30" width="11" height="17" rx="2" />)}
      <path d="M15 57 V64 H44 V59 M51 59 V64 H81 V57 M22 59 V64 M30 59 V64 M38 59 V64 M59 59 V64 M67 59 V64 M75 59 V64" />
    </>}
    {kind === "ssd" && <>
      <rect x="9" y="21" width="78" height="39" rx="6" className="hardware-icon-fill" />
      <rect x="22" y="30" width="20" height="20" rx="2" /><rect x="50" y="30" width="20" height="20" rx="2" />
      <path d="M87 29 H93 M87 36 H93 M87 43 H93 M87 50 H93" /><circle cx="15" cy="41" r="2" />
    </>}
    {kind === "remote" && <>
      {[12, 32, 52].map(y => <g key={y}>
        <rect x="16" y={y} width="64" height="15" rx="3" className="hardware-icon-fill" />
        <circle cx="26" cy={y + 7.5} r="2" /><path d={`M39 ${y + 7.5} H68`} />
      </g>)}
    </>}
  </svg>;
}
