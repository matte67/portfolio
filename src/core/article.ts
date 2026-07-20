import {
  assertNonEmptyText,
  assertSlug,
  validatePublicationMetadata,
  type PublicationMetadata,
  type SeoMetadata,
} from "./content";
import type { ProjectMedia } from "./project";

export interface ArticleMetadata extends PublicationMetadata {
  readonly categories: readonly string[];
  readonly hero?: ProjectMedia;
  readonly seo: SeoMetadata;
  readonly slug: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly title: string;
}

/** Validates article frontmatter before it reaches the presentation layer. */
export function validateArticleMetadata(value: ArticleMetadata): ArticleMetadata {
  const label = `Article "${value.slug || "unknown"}"`;
  validatePublicationMetadata(value, label);
  assertSlug(value.slug, label);

  for (const field of ["title", "summary"] as const) {
    assertNonEmptyText(value[field], field, label);
  }

  assertNonEmptyText(value.seo?.title, "seo.title", label);
  assertNonEmptyText(value.seo?.description, "seo.description", label);

  if (!Array.isArray(value.categories) || !Array.isArray(value.tags)) {
    throw new Error(`${label} categories and tags must be arrays.`);
  }

  if (value.hero) {
    assertNonEmptyText(value.hero.alt, "hero.alt", label);
  }

  return Object.freeze(value);
}
