import type { Locale } from "../../lib/i18n";
import { CAPACITY, STATIC_STATE_CAPACITY } from "./engine";
import type { Block } from "./engine";
import { S } from "./strings";

export const POOL_COLORS = { state: "var(--series-1)", kv: "var(--series-2)" };

export default function PoolStrip({ blocks, fixed = false, lang, label }: {
  blocks: Block[]; fixed?: boolean; lang: Locale; label: string;
}) {
  return (
    <div className="um-pool-wrap">
      <div className="um-pool" role="img" aria-label={label}>
        {Array.from({ length: CAPACITY }, (_, offset) => {
          const block = blocks.find((b) => offset >= b.start && offset < b.start + b.size);
          return <span className="um-cell" key={offset}
            style={{ background: block ? `color-mix(in srgb, ${POOL_COLORS[block.kind]} 24%, var(--surface))` : "var(--page-2)", borderColor: block ? POOL_COLORS[block.kind] : "var(--grid)" }}
            title={`${S.address[lang]} ${offset} · ${block ? `${block.id} · ${S[block.kind][lang]} · ${block.size} ${S.units[lang]}` : S.unused[lang]}`}>
            {block && offset === block.start ? block.id : ""}
          </span>;
        })}
        {fixed && <span className="um-wall" style={{ left: `${STATIC_STATE_CAPACITY / CAPACITY * 100}%` }} title={S.fixedWall[lang]} />}
      </div>
      <div className="um-address"><span>0</span><span>{S.address[lang]}</span><span>{CAPACITY}</span></div>
    </div>
  );
}
