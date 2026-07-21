import type { ContentLocale } from "../core/content";

/** Formats date-only publication metadata without local timezone drift. */
export function formatPublicationDate(
  value: string | undefined,
  locale: ContentLocale,
): string | undefined {
  if (!value) return undefined;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}
