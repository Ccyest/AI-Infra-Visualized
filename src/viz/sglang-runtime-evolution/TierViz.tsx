import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { SCENE, TIER, TIER_STEPS } from "./strings";
import { Blk, Fly, Frame, Scene } from "./scene";
import type { Pt } from "./scene";
import { Fig, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 51、52 页:三层内存,attention 只能从 GPU 显存读。
   命中在 GPU:不用拷贝。命中在主机内存:host → GPU,1 次拷贝。
   命中在存储:storage → host → GPU,2 次拷贝。每一次拷贝是一张飞过去的卡片,
   再点一次同一个标签可以重播。 */

type Hit = "gpu" | "host" | "storage";

const W = 820;
const H = 128;
const FRAME_W = 256;
const GAP = 20;
const TIERS: Hit[] = ["gpu", "host", "storage"];
const CARD = { w: 150, h: 36, y: 58 };
/** 一次拷贝的动画时长(与 .evo-fly 一致),第二跳在第一跳落地后出发 */
const HOP = 1.05;

const frameX = (i: number) => 6 + i * (FRAME_W + GAP);
const cardPt = (i: number): Pt => ({ x: frameX(i) + FRAME_W / 2, y: CARD.y + CARD.h / 2 });

export default function TierViz({ lang = "zh" }: { lang?: Locale }) {
  const [hit, setHit] = useState<Hit>("storage");
  const [run, setRun] = useState(0);
  const src = TIERS.indexOf(hit);
  const copies = src;

  const name = (tier: Hit) => (tier === "gpu" ? TIER.gpu[lang] : tier === "host" ? TIER.host[lang] : TIER.storage[lang]);

  return (
    <Fig
      title={TIER.title[lang]}
      subtitle={TIER.subtitle[lang]}
      headExtra={
        <Tabs
          label={TIER.tabs[lang]}
          value={hit}
          onChange={(h) => {
            setHit(h);
            setRun((n) => n + 1);
          }}
          options={[
            { key: "gpu", label: TIER.hitGpu[lang] },
            { key: "host", label: TIER.hitHost[lang] },
            { key: "storage", label: TIER.hitStorage[lang] },
          ]}
        />
      }
    >
      <Scene w={W} h={H} label={TIER.title[lang]}>
        {TIERS.map((tier, i) => (
          <Frame key={tier} x={frameX(i)} y={6} w={FRAME_W} h={H - 12} label={name(tier)} />
        ))}

        <g key={`${hit}-${run}`}>
          {TIERS.map((tier, i) => {
            if (i > src) return null;
            /* 命中的那一层原本就有;它上面的每一层在对应的那一跳落地后才出现 */
            const hopsBefore = src - i;
            const isGpu = i === 0;
            return (
              <g
                key={tier}
                className={hopsBefore > 0 ? "evo-arrive" : ""}
                style={hopsBefore > 0 ? { animationDelay: `${(hopsBefore - 1) * HOP}s` } : undefined}
              >
                <Blk
                  x={frameX(i) + (FRAME_W - CARD.w) / 2}
                  y={CARD.y}
                  w={CARD.w}
                  h={CARD.h}
                  label={TIER.kv[lang]}
                  sub={isGpu ? SCENE.ready[lang] : SCENE.copyStays[lang]}
                  tone="ctx"
                  look={isGpu ? "reuse" : "soft"}
                />
              </g>
            );
          })}
          {Array.from({ length: copies }, (_, hop) => {
            const from = src - hop;
            return (
              <Fly key={hop} from={cardPt(from)} to={cardPt(from - 1)} label={TIER.kv[lang]} tone="ctx" w={96} delay={hop * HOP} />
            );
          })}
        </g>
      </Scene>
      <div className="evo-stats" aria-live="polite">
        <span>
          {TIER.copies[lang]} <b>{copies}</b>
        </span>
      </div>
      <div className="evo-step" aria-live="polite">
        {TIER_STEPS[hit][lang]}
      </div>
    </Fig>
  );
}
