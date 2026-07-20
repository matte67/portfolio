import type { ArticleMetadata } from "../../core/article";
import type { ContentLocale } from "../../core/content";

export interface ArticleDocument<Content> {
  readonly content: Content;
  readonly metadata: ArticleMetadata;
}

/** Source-agnostic read port for article documents. */
export interface ArticleRepository<Content> {
  findBySlug(slug: string, locale: ContentLocale): ArticleDocument<Content> | undefined;
  list(locale: ContentLocale): readonly ArticleDocument<Content>[];
}
