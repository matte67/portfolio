import { Suspense } from "react";
import { Link, useParams } from "react-router-dom";

import { articleCatalog } from "../../app/dependencies";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { projectMdxComponents } from "../project/mdxComponents";

function formatDate(value: string | undefined, language: "en" | "it") {
  if (!value) return undefined;
  return new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

export function ArticlePage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "article");
  const { slug = "" } = useParams();
  const document = articleCatalog.findArticle(slug, language);

  if (!document) {
    return (
      <>
        <DocumentMeta noIndex title={copy.notFoundMetaTitle} />
        <section className="not-found page-shell">
          <p className="eyebrow">{copy.notFoundEyebrow}</p>
          <h1>{copy.notFoundTitle}</h1>
          <Link className="button-link" to="/articles">{copy.returnArticles}</Link>
        </section>
      </>
    );
  }

  const { metadata, content: Content } = document;
  const publishedDate = formatDate(metadata.publishedAt, language);
  const updatedDate = formatDate(metadata.updatedAt, language);

  return (
    <>
      <DocumentMeta
        description={metadata.seo.description}
        image={metadata.seo.image ?? metadata.hero?.src}
        imageAlt={metadata.seo.imageAlt ?? metadata.hero?.alt}
        title={metadata.seo.title}
        type="article"
      />
      <article className="article-page">
        <header className="article-masthead page-shell">
          <div className="project-masthead__breadcrumb">
            <Link to="/articles">{copy.articles}</Link>
            <span aria-hidden="true">/</span>
            <span>{metadata.categories[0] ?? metadata.title}</span>
          </div>
          <div className="article-masthead__title">
            <p className="eyebrow">
              {publishedDate ? `${copy.published} · ${publishedDate}` : copy.articles}
            </p>
            <h1>{metadata.title}</h1>
            <p>{metadata.summary}</p>
          </div>
        </header>

        {metadata.hero?.src ? (
          <div className="project-hero page-shell">
            <img
              alt={metadata.hero.alt}
              className={`project-hero__image project-hero__image--${metadata.hero.position ?? "center"}`}
              src={metadata.hero.src}
            />
          </div>
        ) : null}

        <div className="article-reading-layout page-shell">
          <aside className="article-facts" aria-label={copy.articles}>
            <dl>
              {updatedDate ? <div><dt>{copy.updated}</dt><dd>{updatedDate}</dd></div> : null}
              {metadata.categories.length > 0 ? (
                <div><dt>{copy.topics}</dt><dd>{metadata.categories.join(" · ")}</dd></div>
              ) : null}
            </dl>
          </aside>
          <div className="project-body">
            <Suspense fallback={<p aria-busy="true">{copy.loadingContent}</p>}>
              <Content components={projectMdxComponents} />
            </Suspense>
          </div>
        </div>
      </article>
    </>
  );
}
