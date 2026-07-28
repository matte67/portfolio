import type { ArticleMetadata } from "../../core/article";
import type { Language } from "../../application/i18n";
import { toLocalizedPath } from "../../application/localizedPath";
import { formatPublicationDate } from "../../application/formatPublicationDate";
import type { EditorialIndexItem } from "./EditorialIndex";

/** Maps article domain metadata to the shared editorial index contract. */
export function toArticleIndexItem(
  metadata: ArticleMetadata,
  language: Language,
): EditorialIndexItem {
  return {
    ariaLabel: metadata.title,
    eyebrow: formatPublicationDate(metadata.publishedAt, language),
    href: toLocalizedPath(`/articles/${metadata.slug}`, language),
    media: {
      alt: metadata.hero?.alt ?? "",
      src: metadata.hero?.src,
    },
    metadata: [metadata.categories.join(" · ")],
    summary: metadata.summary,
    title: metadata.title,
  };
}
