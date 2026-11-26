import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { TIER } from "./strings";
import { Fig, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 51、52 页:三层内存,attention 只能从 GPU 显存读。
   命中在 GPU:不用拷贝。命中在主机内存:host → GPU,1 次拷贝。
   命中在存储:storage → host → GPU,2 次拷贝。命中得越深,请求运行前要做的拷贝越多。 */

type Hit = "gpu" | "host" | "storage";
const COPIES: Record<Hit, number> = { gpu: 0, host: 1, storage: 2 };

export default function TierViz({ lang = "zh" }: { lang?: Locale }) {
  const [hit, setHit] = useState<Hit>("storage");
  const copies = COPIES[hit];

  const box = (tier: Hit, name: string) => (
    <div className={`evo-box${tier === "gpu" ? " active" : ""}`}>
      <b>{name}</b>
      {hit === tier && <span className="evo-chip">{TIER.kv[lang]}</span>}
    </div>
  );

  return (
    <Fig
      title={TIER.title[lang]}
      subtitle={TIER.subtitle[lang]}
      headExtra={
        <Tabs
          label={TIER.tabs[lang]}
          value={hit}
          onChange={setHit}
          options={[
            { key: "gpu", label: TIER.hitGpu[lang] },
            { key: "host", label: TIER.hitHost[lang] },
            { key: "storage", label: TIER.hitStorage[lang] },
          ]}
        />
      }
    >
      <div className="evo-boxes">
        {box("gpu", TIER.gpu[lang])}
        <span className={`evo-arrow${copies >= 1 ? " on" : ""}`} aria-hidden="true">
          ←
        </span>
        {box("host", TIER.host[lang])}
        <span className={`evo-arrow${copies >= 2 ? " on" : ""}`} aria-hidden="true">
          ←
        </span>
        {box("storage", TIER.storage[lang])}
      </div>
      <div className="evo-stats" aria-live="polite">
        <span>
          {TIER.copies[lang]} <b>{copies}</b>
        </span>
      </div>
    </Fig>
  );
}
