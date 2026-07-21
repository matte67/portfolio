import { articleCatalog } from "../../app/dependencies";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { EditorialIndex, type EditorialIndexItem } from "../editorial/EditorialIndex";
import { toArticleIndexItem } from "../editorial/editorialIndexMappers";

export function ArticlesPage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "articles");
  const articles = articleCatalog.listArticles(language);
  const items: EditorialIndexItem[] = articles.map(({ metadata }) => (
    toArticleIndexItem(metadata, language)
  ));

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
