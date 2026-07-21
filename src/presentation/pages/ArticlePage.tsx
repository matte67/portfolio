import { Suspense } from "react";
import { Link, useParams } from "react-router-dom";

import { articleCatalog } from "../../app/dependencies";
import { formatPublicationDate } from "../../application/formatPublicationDate";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import {
  EditorialHero,
  EditorialMasthead,
  EditorialReadingLayout,
  type EditorialFact,
} from "../editorial/EditorialPageStructure";
import { editorialMdxComponents } from "../editorial/mdxComponents";

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
  const publishedDate = formatPublicationDate(metadata.publishedAt, language);
  const updatedDate = formatPublicationDate(metadata.updatedAt, language);
  const facts: EditorialFact[] = [
    ...(updatedDate ? [{ label: copy.updated, value: updatedDate }] : []),
    ...(metadata.categories.length > 0
      ? [{ label: copy.topics, value: metadata.categories.join(" · ") }]
      : []),
    ...(metadata.tags.length > 0
      ? [{ label: copy.tags, value: metadata.tags.join(" · ") }]
      : []),
  ];

  return (
    <>
      <DocumentMeta
        description={metadata.seo.description}
        image={metadata.seo.image ?? metadata.hero?.src}
        imageAlt={metadata.seo.imageAlt ?? metadata.hero?.alt}
        title={metadata.seo.title}
        type="article"
      />
      <article className="editorial-page article-page">
        <EditorialMasthead
          chips={metadata.categories}
          collectionHref="/articles"
          collectionLabel={copy.articles}
          contextLabel={metadata.categories[0] ?? metadata.title}
          eyebrow={publishedDate ? `${copy.published} · ${publishedDate}` : copy.articles}
          summary={metadata.summary}
          title={metadata.title}
          variant="article"
        />

        {metadata.hero ? <EditorialHero media={metadata.hero} variant="article" /> : null}

        <EditorialReadingLayout
          bodyClassName="article-body"
          facts={facts}
          factsLabel={copy.articles}
          variant="article"
        >
          <Suspense fallback={<p aria-busy="true">{copy.loadingContent}</p>}>
            <Content components={editorialMdxComponents} />
          </Suspense>
        </EditorialReadingLayout>
      </article>
    </>
  );
}
