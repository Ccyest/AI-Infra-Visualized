import type { CSSProperties } from "react";
import type { Locale } from "../../lib/i18n";
import { CAPACITY, STATIC_STATE_CAPACITY } from "./engine";
import type { Block } from "./engine";
import { S } from "./strings";

export const POOL_COLORS = { state: "var(--series-1)", kv: "var(--series-2)" };

type BlockStyle = CSSProperties & { "--um-block-color": string };

export default function PoolStrip({ blocks, fixed = false, lang, label }: {
  blocks: Block[]; fixed?: boolean; lang: Locale; label: string;
}) {
  return (
    <div className="um-pool-wrap">
      <div className="um-pool-frame">
        <div className="um-pool" role="img" aria-label={label}>
          {Array.from({ length: CAPACITY }, (_, offset) => (
            <span className="um-cell" key={offset} style={{ gridColumn: offset + 1 }} />
          ))}
          {blocks.map((block) => (
            <span className="um-block" key={`${block.kind}-${block.id}`}
              data-single={block.size === 1}
              style={{
                gridColumn: `${block.start + 1} / span ${block.size}`,
                "--um-block-color": POOL_COLORS[block.kind],
              } as BlockStyle}
              title={`${block.id} · ${S[block.kind][lang]} · ${S.address[lang]} ${block.start} · ${block.size} ${S.units[lang]}`}>
              <span className="um-block-id">{block.id}</span>
            </span>
          ))}
          {fixed && <span className="um-wall"
            style={{ left: `${STATIC_STATE_CAPACITY / CAPACITY * 100}%` }}
            title={S.fixedWall[lang]} />}
        </div>
      </div>
      <div className="um-address"><span>0</span><span>{S.address[lang]}</span><span>{CAPACITY}</span></div>
    </div>
  );
}
