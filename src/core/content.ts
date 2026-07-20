export const supportedLocales = ["en", "it"] as const;

export type ContentLocale = (typeof supportedLocales)[number];

export const publicationStatuses = ["draft", "published", "archived"] as const;

export type PublicationStatus = (typeof publicationStatuses)[number];

export interface PublicationMetadata {
  readonly locale: ContentLocale;
  readonly publicationStatus: PublicationStatus;
  readonly publishedAt?: string;
  readonly translationKey: string;
  readonly updatedAt?: string;
}

export interface SeoMetadata {
  readonly description: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly title: string;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Validates metadata shared by every publishable content type. */
export function validatePublicationMetadata(
  value: PublicationMetadata,
  contentLabel: string,
): void {
  if (!supportedLocales.includes(value.locale)) {
    throw new Error(`${contentLabel} has unsupported locale "${value.locale}".`);
  }

  if (!publicationStatuses.includes(value.publicationStatus)) {
    throw new Error(
      `${contentLabel} has unsupported publication status "${value.publicationStatus}".`,
    );
  }

  if (!SLUG_PATTERN.test(value.translationKey)) {
    throw new Error(
      `${contentLabel} translationKey must use lowercase kebab-case.`,
    );
  }

  for (const [field, date] of [
    ["publishedAt", value.publishedAt],
    ["updatedAt", value.updatedAt],
  ] as const) {
    if (date !== undefined && !ISO_DATE_PATTERN.test(date)) {
      throw new Error(`${contentLabel} ${field} must use YYYY-MM-DD.`);
    }
  }

  if (value.publicationStatus === "published" && !value.publishedAt) {
    throw new Error(`${contentLabel} requires publishedAt when published.`);
  }
}

/** Returns whether an entry is eligible for the public production catalogue. */
export function isPublicContent(
  publication: PublicationMetadata,
  today = new Date(),
): boolean {
  if (publication.publicationStatus !== "published" || !publication.publishedAt) {
    return false;
  }

  const publicationDate = new Date(`${publication.publishedAt}T00:00:00.000Z`);
  return !Number.isNaN(publicationDate.valueOf()) && publicationDate <= today;
}

export function assertNonEmptyText(value: unknown, field: string, contentLabel: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${contentLabel} field "${field}" must be a non-empty string.`);
  }
}

export function assertSlug(value: string, contentLabel: string): void {
  if (!SLUG_PATTERN.test(value)) {
    throw new Error(`${contentLabel} slug must use lowercase kebab-case.`);
  }
}
