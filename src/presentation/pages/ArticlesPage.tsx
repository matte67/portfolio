import { Link } from "react-router-dom";

import { articleCatalog } from "../../app/dependencies";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { ArrowMark } from "../components/SmartLink";

function formatDate(value: string | undefined, language: "en" | "it") {
  if (!value) return "";
  return new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

export function ArticlesPage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "articles");
  const articles = articleCatalog.listArticles(language);

  return (
    <>
      <DocumentMeta description={copy.meta.description} title={copy.meta.title} />
      <header className="page-intro page-shell">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>

      <section className="article-list page-shell" aria-label={copy.sectionLabel}>
        {articles.length === 0 ? (
          <div className="article-list__empty">
            <h2>{copy.emptyTitle}</h2>
            <p>{copy.emptyDescription}</p>
          </div>
        ) : articles.map(({ metadata }) => (
          <article key={metadata.slug}>
            <div className="article-list__meta">
              <span>{formatDate(metadata.publishedAt, language)}</span>
              <span>{metadata.categories.join(" · ")}</span>
            </div>
            <h2><Link to={`/articles/${metadata.slug}`}>{metadata.title}</Link></h2>
            <p>{metadata.summary}</p>
            <Link className="text-link" to={`/articles/${metadata.slug}`}>
              {copy.read} <ArrowMark />
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
