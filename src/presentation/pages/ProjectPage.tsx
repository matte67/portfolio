import { Suspense } from "react";
import { Link, useParams } from "react-router-dom";

import { projectCatalog } from "../../app/dependencies";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { ArrowMark } from "../components/SmartLink";
import { DecryptedText } from "../effects/DecryptedText";
import {
  EditorialHero,
  EditorialMasthead,
  EditorialReadingLayout,
  type EditorialFact,
} from "../editorial/EditorialPageStructure";
import { editorialMdxComponents } from "../editorial/mdxComponents";
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
  const facts: EditorialFact[] = [
    { label: copy.role, value: metadata.role },
    { label: copy.team, value: metadata.team },
    { label: copy.duration, value: metadata.duration },
    { label: copy.disciplines, value: metadata.disciplines.join(" · ") },
    { label: copy.technology, value: metadata.technologies.join(" · ") },
  ];

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
        <EditorialMasthead
          actions={<ProjectLinks links={metadata.links} />}
          collectionHref="/work"
          collectionLabel={copy.work}
          contextLabel={metadata.index}
          eyebrow={`${copy.statuses[metadata.status]} · ${metadata.year}`}
          summary={metadata.subtitle}
          title={metadata.title}
          variant="project"
        />

        <EditorialHero
          fallback={<PlaceholderVisual label={copy.assetPending} />}
          media={metadata.hero}
          variant="project"
        />

        <EditorialReadingLayout facts={facts} factsLabel={copy.factsLabel} variant="project">
          <p className="project-lede">{metadata.summary}</p>
          <Suspense fallback={<p aria-busy="true">{copy.loadingContent}</p>}>
            <Content components={editorialMdxComponents} />
          </Suspense>
        </EditorialReadingLayout>

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
