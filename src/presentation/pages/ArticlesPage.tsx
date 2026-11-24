import { articleCatalog } from "../../app/dependencies";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { SearchableEditorialIndex, type SearchableEditorialItem } from "../editorial/SearchableEditorialIndex";
import { toArticleIndexItem } from "../editorial/editorialIndexMappers";

export function ArticlesPage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "articles");
  const articles = articleCatalog.listArticles(language);
  const items: SearchableEditorialItem[] = articles.map(({ metadata }) => ({
    ...toArticleIndexItem(metadata, language),
    search: {
      tags: [...metadata.categories, ...metadata.tags],
      terms: [metadata.title, metadata.summary, metadata.publishedAt ?? ""],
      years: metadata.publishedAt ? [Number(metadata.publishedAt.slice(0, 4))] : [],
    },
  }));

  return (
    <>
      <DocumentMeta description={copy.meta.description} title={copy.meta.title} />
      <header className="page-intro page-shell">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="pt-4">{copy.description}</p>
      </header>

      <SearchableEditorialIndex
        emptyState={{ description: copy.emptyDescription, title: copy.emptyTitle }}
        items={items}
        mode="roller"
        readLabel={copy.read}
        searchLabel={copy.searchLabel}
        sectionLabel={copy.sectionLabel}
      />
    </>
  );
}
