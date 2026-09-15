import type { RefObject } from "react";
import type { Locale } from "../../lib/i18n";
import TransferFlight from "./TransferFlight";
import { UPDATE } from "./strings";

interface FlightProps {
  container: RefObject<HTMLDivElement | null>;
  restoring: boolean;
  progress: number;
  kind: "snapshot" | "kv";
  lang: Locale;
}

export default function CheckpointFlight({ container, restoring, progress, kind, lang }: FlightProps) {
  const selector = kind === "snapshot" ? '[data-document="true"]' : '.hc-checkpoint-pages span';
  return <TransferFlight container={container} progress={progress} kind={kind} className="hc-checkpoint-flight"
    source={`[data-tier="${restoring ? "host" : "gpu"}"] ${selector}`}
    destination={`[data-tier="${restoring ? "gpu" : "host"}"] ${selector}`}>
    <strong>{kind === "snapshot" ? UPDATE.state1[lang] : `${UPDATE.stateDocument[lang]} KV`}</strong>
  </TransferFlight>;
}
