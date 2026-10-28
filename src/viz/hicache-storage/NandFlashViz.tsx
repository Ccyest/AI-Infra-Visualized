import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { DETAIL } from "./strings";
import "./styles.css";
import "./details.css";

export default function NandFlashViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(4, 0.7);
  const pages = [
    [player.t >= 4 ? "empty" : player.t >= 1 ? "invalidA" : "oldA", player.t >= 4 ? "empty" : player.t >= 2 ? "invalidB" : "B", "empty", "empty"],
    [player.t >= 1 ? "newA" : "empty", player.t >= 2 ? "B" : "empty", "empty", "empty"],
  ];
  const labels: Record<string, string> = { empty: DETAIL.erased[lang], invalidA: `A · ${DETAIL.invalid[lang]}`,
    invalidB: `B · ${DETAIL.invalid[lang]}`, oldA: DETAIL.oldA[lang], newA: DETAIL.newA[lang], B: "B" };
  return <VizStage title={DETAIL.nand[lang]} subtitle={DETAIL.nandNote[lang]} player={player} lang={lang} className="storage-nand-detail">
    <div className="storage-body"><output className="storage-step" aria-live="polite">{DETAIL.nandSteps[player.t][lang]}</output>
      <div className="storage-flash-blocks">{pages.map((block, index) => <section key={index} className={`storage-flash-block${index === 0 && player.t === 3 ? " is-erasing" : ""}`}>
        <h4>{DETAIL.block[lang]} {index}</h4>
        {block.map((page, pageIndex) => <div key={pageIndex} className={`storage-flash-page ${page}`}>
          <small>{DETAIL.page[lang]} {pageIndex}</small><strong>{labels[page]}</strong></div>)}
      </section>)}</div>
      <div className="storage-mini-metrics"><span>{DETAIL.logical[lang]} → {DETAIL.block[lang]} {player.t ? 1 : 0}</span>
        <span>{DETAIL.requested[lang]}: {player.t ? 1 : 0}</span><span>{DETAIL.programmed[lang]}: {Math.min(player.t, 2)}</span></div>
    </div>
  </VizStage>;
}
