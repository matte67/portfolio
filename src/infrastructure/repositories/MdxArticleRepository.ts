import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { MDXComponents } from "mdx/types";
import contentCatalog from "virtual:content-catalog";

import type {
  ArticleDocument,
  ArticleRepository,
} from "../../application/ports/ArticleRepository";
import { validateArticleMetadata } from "../../core/article";
import { supportedLocales, type ContentLocale } from "../../core/content";

type MdxComponent = ComponentType<{ components?: MDXComponents }>;
type MdxContent = LazyExoticComponent<MdxComponent>;

interface ArticleMdxModule {
  readonly default: MdxComponent;
}

const contentModules = import.meta.glob<ArticleMdxModule>(
  "../../../content/articles/{en,it}/*.mdx",
);

function localeFromPath(path: string): ContentLocale {
  const locale = supportedLocales.find((candidate) => path.includes(`/articles/${candidate}/`));
  if (!locale) throw new Error(`Unable to infer article locale from "${path}".`);
  return locale;
}

function buildDocuments(): readonly ArticleDocument<MdxContent>[] {
  const documents = contentCatalog.articles.map((rawMetadata) => {
    const metadata = validateArticleMetadata(rawMetadata);
    const pathLocale = localeFromPath(rawMetadata.sourcePath);
    const loaderEntry = Object.entries(contentModules).find(([path]) =>
      path.endsWith(rawMetadata.sourcePath),
    );
    if (!loaderEntry) {
      throw new Error(`Missing MDX content loader for "${rawMetadata.sourcePath}".`);
    }
    const [, loadContent] = loaderEntry;

    if (metadata.locale !== pathLocale) {
      throw new Error(
        `Article "${metadata.slug}" declares locale "${metadata.locale}" but is stored under "${pathLocale}".`,
      );
    }

    return Object.freeze({ content: lazy(loadContent), metadata });
  });

  const identities = new Set<string>();
  for (const { metadata } of documents) {
    for (const identity of new Set([metadata.slug, metadata.translationKey])) {
      const key = `${metadata.locale}:${identity}`;
      if (identities.has(key)) {
        throw new Error(`Duplicate article identity detected for "${key}".`);
      }
      identities.add(key);
    }
  }

  return Object.freeze(
    documents.sort((left, right) =>
      (right.metadata.publishedAt ?? "").localeCompare(left.metadata.publishedAt ?? ""),
    ),
  );
}

const documents = buildDocuments();

/** Vite/MDX adapter for editorial articles. */
export const mdxArticleRepository: ArticleRepository<MdxContent> = {
  list(locale) {
    return documents.filter((document) => document.metadata.locale === locale);
  },

  findBySlug(slug, locale) {
    return documents.find(
      (document) => document.metadata.locale === locale && document.metadata.slug === slug,
    );
  },
};
