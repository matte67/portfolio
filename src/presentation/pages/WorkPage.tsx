import { Link } from "react-router-dom";

import { projectCatalog } from "../../app/dependencies";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { ArrowMark } from "../components/SmartLink";
import { DecryptedText } from "../effects/DecryptedText";
import { PlaceholderVisual } from "../visuals/PlaceholderVisual";

export function WorkPage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "work");
  const projects = projectCatalog.listProjects(language);

  return (
    <>
      <DocumentMeta description={copy.meta.description} title={copy.meta.title} />
      <header className="page-intro page-shell">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>
          {copy.headingPrefix}
          <DecryptedText
            animateOn="inViewHover"
            encryptedClassName="decrypted-text__character--encrypted"
            parentClassName="text-(--color-accent)"
            revealDirection="start"
            sequential
            speed={165}
            text={copy.headingEmphasis}
          />
        </h1>
        <p className="pt-4">{copy.description}</p>
      </header>
      <section className="work-list page-shell" aria-label={copy.sectionLabel}>
        {projects.map(({ metadata }) => (
          <article key={metadata.slug}>
            <Link className="work-list__media" to={`/work/${metadata.slug}`} aria-label={`${copy.view} ${metadata.title}`}>
              {metadata.hero.src ? <img alt={metadata.hero.alt} decoding="async" loading="lazy" src={metadata.hero.src} /> : <PlaceholderVisual />}
            </Link>
            <div className="work-list__copy">
              <span className="eyebrow">{metadata.index} · {metadata.year}</span>
              <h2><Link to={`/work/${metadata.slug}`}>{metadata.title}</Link></h2>
              <p>{metadata.summary}</p>
              <div className="work-list__meta"><span>{metadata.role}</span><span>{metadata.disciplines.join(" · ")}</span></div>
              <Link className="text-link" to={`/work/${metadata.slug}`}>{copy.read} <ArrowMark /></Link>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
