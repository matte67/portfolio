import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { MDXComponents } from "mdx/types";
import contentCatalog from "virtual:content-catalog";

import type {
  ProjectDocument,
  ProjectRepository,
} from "../../application/ports/ProjectRepository";
import { supportedLocales, type ContentLocale } from "../../core/content";
import { validateProjectMetadata } from "../../core/project";

type MdxComponent = ComponentType<{ components?: MDXComponents }>;
export type MdxContent = LazyExoticComponent<MdxComponent>;

interface ProjectMdxModule {
  readonly default: MdxComponent;
}

const contentModules = import.meta.glob<ProjectMdxModule>(
  "../../../content/projects/{en,it}/*.mdx",
);

function localeFromPath(path: string): ContentLocale {
  const locale = supportedLocales.find((candidate) => path.includes(`/projects/${candidate}/`));
  if (!locale) throw new Error(`Unable to infer project locale from "${path}".`);
  return locale;
}

function buildDocuments(): readonly ProjectDocument<MdxContent>[] {
  const documents = contentCatalog.projects.map((rawMetadata) => {
    const metadata = validateProjectMetadata(rawMetadata);
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
        `Project "${metadata.slug}" declares locale "${metadata.locale}" but is stored under "${pathLocale}".`,
      );
    }

    return Object.freeze({ content: lazy(loadContent), metadata });
  });

  const uniqueKeys = new Set<string>();
  const uniqueOrders = new Set<string>();

  for (const { metadata } of documents) {
    const key = `${metadata.locale}:${metadata.slug}`;
    const translationKey = `${metadata.locale}:${metadata.translationKey}`;
    const orderKey = `${metadata.locale}:${metadata.order}`;

    if (uniqueKeys.has(key) || uniqueKeys.has(translationKey)) {
      throw new Error(`Duplicate project identity detected for "${key}".`);
    }
    if (uniqueOrders.has(orderKey)) {
      throw new Error(`Duplicate project order detected for "${orderKey}".`);
    }

    uniqueKeys.add(key);
    uniqueKeys.add(translationKey);
    uniqueOrders.add(orderKey);
  }

  return Object.freeze(
    documents.sort((left, right) => left.metadata.order - right.metadata.order),
  );
}

const documents = buildDocuments();

/** Vite/MDX adapter. File discovery is automatic and independent from the UI. */
export const mdxProjectRepository: ProjectRepository<MdxContent> = {
  list(locale) {
    return documents.filter((document) => document.metadata.locale === locale);
  },

  findBySlug(slug, locale) {
    return documents.find(
      (document) => document.metadata.locale === locale && document.metadata.slug === slug,
    );
  },
};
