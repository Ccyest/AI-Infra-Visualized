import type { LegendItem } from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import type { Mode } from "./engine";
import { LEGEND } from "./strings";

const HATCH =
  "repeating-linear-gradient(45deg, transparent 0 3px, var(--axis) 3px 4.5px)";
/* prefill:半透明底 + 同色 135° 斜杠,与网格里的画法一致 */
const PREFILL_HATCH =
  "repeating-linear-gradient(135deg, var(--series-1) 0 1.5px, color-mix(in srgb, var(--series-1) 30%, transparent) 1.5px 5px)";

export function legendItems(mode: Mode | "both", locale: Locale): LegendItem[] {
  const decode: LegendItem = {
    label: LEGEND.decode[locale],
    swatch: { background: "var(--series-1)" },
  };
  const prefill: LegendItem = {
    label: LEGEND.prefill[locale],
    swatch: { background: PREFILL_HATCH },
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
