import { lazy, Suspense, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../../application/i18n";
import { getProcessCopy } from "../../application/processCopy";
import { workJourneyMedia } from "../../application/workJourney";
import type { ArticleMetadata } from "../../core/article";
import { DocumentMeta } from "../components/DocumentMeta";
import { NextMark } from "../components/SmartLink";
import { FilmComparison } from "../process/FilmComparison";
import "../process/Process.css";

const asset = "/media/process";
const BlenderJourney = lazy(() => import("../process/BlenderJourney"));
const models = ["blockout", "first-person", "biographical", "look-v1", "approved"];
const references = [
  ["amandola", "Amandola"], ["camerino", "Università di Camerino"],
  ["london", "The Gherkin"], ["polimi", "Politecnico di Milano"],
];
const frames = [
  ["00-apertura", "Partenza", "Opening"], ["01-infanzia", "Infanzia", "Childhood"],
  ["02-amandola", "Amandola", "Amandola"], ["03-camerino", "Camerino", "Camerino"],
  ["04-unistays", "UniStays", "UniStays"], ["05-laurea-sef-londra", "Laurea e Londra", "Graduation and London"],
  ["06-boccone-spesino-nodale", "Boccone, Spesino e Nodale", "Boccone, Spesino and Nodale"],
  ["07-prenivo", "Prenivo", "Prenivo"], ["08-politecnico", "Politecnico", "Politecnico"],
  ["09-tempio-finale", "Tempio", "Temple"],
];

function Chapter({ id, title, text, children }: {
  id: string; title: string; text?: string; children: ReactNode;
}) {
  return (
    <section className="process__chapter" id={id} aria-labelledby={`${id}-title`}>
      <div className="process__copy">
        <h2 id={`${id}-title`}>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {children}
    </section>
  );
}

/** Walks through the real production assets in the order they were used. */
export default function ProcessArticle({ metadata }: { metadata: ArticleMetadata }) {
  const { language, toLocalizedPath } = useLanguage();
  const copy = getProcessCopy(language);
  const [model, setModel] = useState(0);
  const [frame, setFrame] = useState(0);
  const frameLabel = (index: number) => frames[index][language === "it" ? 1 : 2];
  const [sketch, blender, lookdev, keyframes, film] = copy.chapters;

  return (
    <article className="process page-shell">
      <DocumentMeta {...metadata.seo} image={metadata.hero?.src} imageAlt={metadata.hero?.alt} type="article" />
      <header className="process__hero">
        <img src="/media/work/temple.webp" alt="" width={1280} height={720} fetchPriority="high" />
        <div><h1>{metadata.title}</h1><p>{metadata.summary}</p></div>
      </header>

      <Chapter id="sketch" title={sketch.title}>
        <img className="process__original-sketch" src={`${asset}/original-sketch.png`}
          alt={copy.sketchAlt} width={2048} height={768} loading="lazy" />
      </Chapter>
      <Chapter id="blender" {...blender}>
        <div className="process__blender-frame">
          <div className="process__switch">
            {copy.versions.slice(0, 3).map((label, index) => (
              <button type="button" key={label} aria-pressed={model === index} onClick={() => setModel(index)}>{label}</button>
            ))}
          </div>
          <Suspense fallback={<div className="blender-journey__viewport" aria-busy="true" />}>
            <BlenderJourney key={model} model={models[model]} title={copy.versions[model]} label={copy.travel} />
          </Suspense>
        </div>
      </Chapter>
      <Chapter id="references" {...lookdev}>
        <div className="process__references">
          {references.map(([id, label]) => (
            <figure key={id}>
              <img src={`${asset}/ref-${id}.webp`} alt="" loading="lazy" />
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
        <div className="process__comparison">
          {models.slice(3).map((version, index) => (
            <figure key={version}>
              <img className="process__wide" src={`${asset}/${version}.webp`} alt="" loading="lazy" width={1280} height={720} />
              <figcaption>{copy.versions[index + 3]}</figcaption>
            </figure>
          ))}
        </div>
      </Chapter>
      <Chapter id="frames" {...keyframes}>
        <figure>
          <img key={frame} className="process__wide process__reveal" src={`${asset}/${frames[frame][0]}.webp`} alt={frameLabel(frame)} loading="lazy" width={800} height={450} />
        </figure>
        <div className="process__strip">
          {frames.map(([id], index) => (
            <button key={id} type="button" aria-label={frameLabel(index)} aria-pressed={frame === index} onClick={() => setFrame(index)}>
              <img src={`${asset}/${id}.webp`} alt="" width={800} height={450} loading="lazy" />
            </button>
          ))}
        </div>
      </Chapter>
      <Chapter id="film" {...film}>
        <FilmComparison
          guide={{ src: `${asset}/camera-guide.mp4`, poster: `${asset}/biographical.webp`, label: copy.filmLabels[0] }}
          film={{ src: workJourneyMedia.src, poster: "/media/work/opening.webp", label: copy.filmLabels[1] }}
          labels={copy.comparison}
        />
        <Link className="text-link process__out" to={toLocalizedPath("/work")}>{copy.work} <NextMark /></Link>
      </Chapter>
    </article>
  );
}
