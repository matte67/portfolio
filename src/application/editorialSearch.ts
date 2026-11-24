export interface EditorialSearchEntry {
  readonly terms: readonly string[];
  readonly tags: readonly string[];
  readonly years: readonly number[];
  readonly featured?: boolean;
}

export interface EditorialFilters {
  readonly query: string;
  readonly tag: string;
  readonly year: string;
  readonly featured: boolean;
}

export const emptyEditorialFilters: EditorialFilters = {
  query: "",
  tag: "",
  year: "",
  featured: false,
};

function normalizeSearchText(text: string, locale: string): string {
  return text
    .toLocaleLowerCase(locale)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Expands the case-study period so a project can match any year it spans. */
export function projectYears(period: string): readonly number[] {
  const match = /^(\d{4})(?:\s*[–—-]\s*(\d{2}|\d{4}))?$/.exec(period);
  if (!match) return [];
  const first = Number(match[1]);
  const end = match[2];
  if (!end) return [first];
  const last = end.length === 2
    ? first + ((Number(end) - first % 100 + 100) % 100)
    : Number(end);
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, offset) => first + offset);
}

/** Combines text and facet filters while preserving catalogue order. */
export function filterEditorialEntries<T extends { readonly search: EditorialSearchEntry }>(
  entries: readonly T[],
  filters: EditorialFilters,
  locale: string,
): readonly T[] {
  const words = normalizeSearchText(filters.query, locale).split(" ").filter(Boolean);
  if (!words.length && !filters.tag && !filters.year && !filters.featured) return entries;

  return entries.filter(({ search }) => {
    if (filters.featured && !search.featured) return false;
    if (filters.tag && !search.tags.includes(filters.tag)) return false;
    if (filters.year && !search.years.includes(Number(filters.year))) return false;

    const text = normalizeSearchText([...search.terms, ...search.tags].join(" "), locale);
    return words.every((word) => text.includes(word));
  });
}
