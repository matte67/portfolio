import { Link } from "react-router-dom";

import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { ArrowMark, DownMark, DownloadMark } from "../components/SmartLink";
import { PdfReader } from "../thesis/PdfReader";

export function ThesisPage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "thesis");
  return (
    <>
      <DocumentMeta
        description={copy.meta.description}
        title={copy.meta.title}
      />
      <header className="thesis-hero page-shell">
        <div className="thesis-hero__cover border-4 border-(--color-border) rounded-2xl overflow-hidden">
          <img alt={copy.hero.coverAlt} src="/media/thesis/cover.png"  />
        </div>
        <div className="thesis-hero__content">
          <p className="eyebrow">{copy.hero.eyebrow}</p>
          <h1>{copy.hero.title}</h1>
          <p className="thesis-hero__authors">{copy.hero.authors}</p>
          <dl>
            <div><dt>{copy.hero.universityLabel}</dt><dd>Università degli Studi di Camerino</dd></div>
            <div><dt>{copy.hero.supervisorLabel}</dt><dd>Michele Loreti</dd></div>
            <div><dt>{copy.hero.coSupervisorLabel}</dt><dd>Vincenzo Fioriti · ENEA</dd></div>
            <div><dt>{copy.hero.yearLabel}</dt><dd>2025/2026</dd></div>
          </dl>
          <div className="thesis-hero__links">
            <a className="button-link" href="#pdf-reader-title">{copy.hero.read} <DownMark /></a>
            <a className="text-link" download href="/documents/thesis-matteo-vittori.pdf">{copy.hero.download} <DownloadMark /></a>
          </div>
        </div>
      </header>

      <section className="thesis-abstract page-shell section-space" aria-labelledby="abstract-title">
        <div><p className="eyebrow">{copy.abstract.eyebrow}</p><h2 id="abstract-title">{copy.abstract.title}</h2></div>
        <div>
          <p className="large-copy pb-3">{copy.abstract.lead}</p>
          <p>{copy.abstract.body}</p>
        </div>
      </section>

      <section className="thesis-contributions page-shell section-space" aria-labelledby="contributions-title">
        <header><p className="eyebrow">{copy.contributions.eyebrow}</p><h2 id="contributions-title">{copy.contributions.title}</h2></header>
        <ol>{copy.contributions.items.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ol>
      </section>

      <section className="chapter-overview page-shell section-space" aria-labelledby="chapters-title">
        <header><p className="eyebrow">{copy.chapters.eyebrow}</p><h2 id="chapters-title">{copy.chapters.title}</h2></header>
        <ol>{copy.chapters.items.map((chapter) => <li key={chapter.number}><span>{chapter.number}</span><h3>{chapter.title}</h3><p>{chapter.description}</p></li>)}</ol>
      </section>

      <section className="thesis-sef page-shell section-space">
        <div>
          <p className="eyebrow">{copy.sef.eyebrow}</p>
          <h2>{copy.sef.title}</h2>
        </div>
        <div>
          <p className="pb-3">{copy.sef.body}</p>
          <Link className="text-link" to="/work/sef">{copy.sef.link} <ArrowMark /></Link>
        </div>
      </section>

      <div className="page-shell"><PdfReader /></div>
    </>
  );
}
