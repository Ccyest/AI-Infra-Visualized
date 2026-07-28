import type { LegendItem } from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import type { Mode } from "./engine";
import { LEGEND } from "./strings";

const HATCH =
  "repeating-linear-gradient(45deg, transparent 0 3px, var(--axis) 3px 4.5px)";

export function legendItems(mode: Mode | "both", locale: Locale): LegendItem[] {
  const decode: LegendItem = {
    label: LEGEND.decode[locale],
    swatch: { background: "var(--series-1)" },
  };
  const prefill: LegendItem = {
    label: LEGEND.prefill[locale],
    swatch: { background: "var(--series-1)", opacity: 0.4 },
  };
  const bubble: LegendItem = {
    label: LEGEND.bubble[locale],
    swatch: { background: HATCH, border: "1px solid var(--grid)" },
  };
  const blank: LegendItem = {
    label: LEGEND.blank[locale],
    swatch: { background: "transparent", border: "1px solid var(--grid)" },
  };
  if (mode === "static") return [decode, prefill, bubble];
  if (mode === "continuous") return [decode, prefill, blank];
  return [decode, prefill, bubble, blank];
}
