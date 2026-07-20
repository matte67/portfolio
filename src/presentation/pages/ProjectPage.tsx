import { Suspense } from "react";
import { Link, useParams } from "react-router-dom";

import { projectCatalog } from "../../app/dependencies";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { ArrowMark } from "../components/SmartLink";
import { DecryptedText } from "../effects/DecryptedText";
import { projectMdxComponents } from "../project/mdxComponents";
import { ProjectLinks } from "../project/ProjectLinks";
import { PlaceholderVisual } from "../visuals/PlaceholderVisual";

export function ProjectPage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "project");
  const notFoundCopy = getPageCopy(language, "notFound");
  const { slug = "" } = useParams();
  const document = projectCatalog.findProject(slug, language);

  if (!document) {
    return (
      <>
        <DocumentMeta noIndex title={notFoundCopy.projectMetaTitle} />
        <section className="not-found page-shell">
          <p className="eyebrow">{notFoundCopy.projectEyebrow}</p>
          <h1>{notFoundCopy.projectTitle}</h1>
          <Link className="button-link" to="/work">{notFoundCopy.returnWork}</Link>
        </section>
      </>
    );
  }

  const { metadata, content: Content } = document;
  const nextProject = projectCatalog.getNextProject(metadata);

  return (
    <>
      <DocumentMeta
        description={metadata.seo.description}
        image={metadata.seo.image ?? metadata.hero.src}
        imageAlt={metadata.seo.imageAlt ?? metadata.hero.alt}
        title={metadata.seo.title}
        type="article"
      />
      <article className={`project-page project-page--${metadata.slug}`}>
        <header className="project-masthead page-shell">
          <div className="project-masthead__breadcrumb">
            <Link to="/work">{copy.work}</Link><span aria-hidden="true">/</span><span>{metadata.index}</span>
          </div>
          <div className="project-masthead__title">
            <p className="eyebrow">{copy.statuses[metadata.status]} · {metadata.year}</p>
            <h1>{metadata.title}</h1>
            <p>{metadata.subtitle}</p>
          </div>
          <ProjectLinks links={metadata.links} />
        </header>

        <div className="project-hero page-shell">
          {metadata.hero.src ? (
            <img
              alt={metadata.hero.alt}
              className={`project-hero__image project-hero__image--${metadata.hero.position ?? "center"}`}
              src={metadata.hero.src}
            />
          ) : (
            <PlaceholderVisual label={copy.assetPending} />
          )}
        </div>

        <div className="project-reading-layout page-shell">
          <aside className="project-facts" aria-label={copy.factsLabel}>
            <dl>
              <div><dt>{copy.role}</dt><dd>{metadata.role}</dd></div>
              <div><dt>{copy.team}</dt><dd>{metadata.team}</dd></div>
              <div><dt>{copy.duration}</dt><dd>{metadata.duration}</dd></div>
              <div><dt>{copy.disciplines}</dt><dd>{metadata.disciplines.join(" · ")}</dd></div>
              <div><dt>{copy.technology}</dt><dd>{metadata.technologies.join(" · ")}</dd></div>
            </dl>
          </aside>
          <div className="project-body">
            <p className="project-lede">{metadata.summary}</p>
            <Suspense fallback={<p aria-busy="true">{copy.loadingContent}</p>}>
              <Content components={projectMdxComponents} />
            </Suspense>
          </div>
        </div>

        <section className="project-results page-shell" aria-labelledby="project-results-title">
          <header>
            <p className="eyebrow">{copy.atAGlance}</p>
            <h2 id="project-results-title">{copy.evidence}</h2>
          </header>
          <div className="metric-grid">
            {metadata.metrics.map((metric, index) => (
              <article key={metric.label}>
                <strong>
                  {index === 0 ? (
                    <DecryptedText
                      animateOn="inViewHover"
                      encryptedClassName="decrypted-text__character--encrypted"
                      parentClassName="text-(--color-accent)"
                      revealDirection="start"
                      sequential
                      speed={165}
                      text={metric.value}
                    />
                  ) : metric.value}
                </strong>
                <h3>{metric.label}</h3>
                <p>{metric.context}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="project-end page-shell">
          <div>
            <p className="eyebrow">{copy.links}</p>
            <ProjectLinks links={metadata.links} />
          </div>
          {nextProject ? (
            <Link className="next-project" to={`/work/${nextProject.slug}`}>
              <span>{copy.next} · {nextProject.index}</span>
              <strong>{nextProject.shortTitle}</strong>
              <ArrowMark />
            </Link>
          ) : null}
        </section>
      </article>
    </>
  );
}
