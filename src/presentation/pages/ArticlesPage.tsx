import { articleCatalog } from "../../app/dependencies";
import { formatPublicationDate } from "../../application/formatPublicationDate";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { EditorialIndex, type EditorialIndexItem } from "../editorial/EditorialIndex";

export function ArticlesPage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "articles");
  const articles = articleCatalog.listArticles(language);
  const items: EditorialIndexItem[] = articles.map(({ metadata }) => ({
    ariaLabel: metadata.title,
    eyebrow: formatPublicationDate(metadata.publishedAt, language),
    href: `/articles/${metadata.slug}`,
    media: {
      alt: metadata.hero?.alt ?? "",
      src: metadata.hero?.src,
    },
    metadata: [metadata.categories.join(" · ")],
    summary: metadata.summary,
    title: metadata.title,
  }));

  return (
    <>
      <DocumentMeta description={copy.meta.description} title={copy.meta.title} />
      <header className="page-intro page-shell">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="pt-4">{copy.description}</p>
      </header>

      <EditorialIndex
        emptyState={{ description: copy.emptyDescription, title: copy.emptyTitle }}
        items={items}
        readLabel={copy.read}
        sectionLabel={copy.sectionLabel}
      />
    </>
  );
}
