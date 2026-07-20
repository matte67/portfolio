import type {
  ArticleDocument,
  ArticleRepository,
} from "./ports/ArticleRepository";
import { isPublicContent, type ContentLocale } from "../core/content";

interface ArticleCatalogueOptions {
  readonly includeUnpublished?: boolean;
}

export interface ArticleCatalog<Content> {
  findArticle(slug: string, locale: ContentLocale): ArticleDocument<Content> | undefined;
  listArticles(locale: ContentLocale): readonly ArticleDocument<Content>[];
}

/** Creates article queries around an injected repository and publication policy. */
export function createArticleCatalog<Content>(
  repository: ArticleRepository<Content>,
  options: ArticleCatalogueOptions = {},
): ArticleCatalog<Content> {
  const isVisible = (document: ArticleDocument<Content>) =>
    options.includeUnpublished === true || isPublicContent(document.metadata);

  return Object.freeze({
    listArticles(locale: ContentLocale) {
      return repository.list(locale).filter(isVisible);
    },

    findArticle(slug: string, locale: ContentLocale) {
      const document = repository.findBySlug(slug, locale);
      return document && isVisible(document) ? document : undefined;
    },
  });
}
