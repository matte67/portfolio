import { faMagnifyingGlass, faSliders, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useId, useRef, useState, type ComponentProps } from "react";

import {
  emptyEditorialFilters,
  filterEditorialEntries,
  type EditorialFilters,
  type EditorialSearchEntry,
} from "../../application/editorialSearch";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { EditorialIndex, type EditorialIndexItem } from "./EditorialIndex";
import { FilterWheel } from "./FilterWheel";
import "./SearchableEditorialIndex.css";

export interface SearchableEditorialItem extends EditorialIndexItem {
  readonly search: EditorialSearchEntry;
}

interface SearchableEditorialIndexProps
  extends Omit<ComponentProps<typeof EditorialIndex>, "items"> {
  readonly items: readonly SearchableEditorialItem[];
  readonly searchLabel: string;
  readonly showFeaturedFilter?: boolean;
}

/** Adds optional catalogue search without changing the editorial preview on the home page. */
export function SearchableEditorialIndex({
  items,
  searchLabel,
  showFeaturedFilter = false,
  ...indexProps
}: SearchableEditorialIndexProps) {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "editorial").search;
  const [filters, setFilters] = useState(emptyEditorialFilters);
  const filtersId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const tags = [...new Set(items.flatMap(({ search }) => search.tags))]
    .sort((left, right) => left.localeCompare(right, language));
  const years = [...new Set(items.flatMap(({ search }) => search.years))]
    .sort((left, right) => right - left);
  const results = filterEditorialEntries(items, filters, language);
  const activeFacets = Number(Boolean(filters.tag)) + Number(Boolean(filters.year)) + Number(filters.featured);
  const canFilter = showFeaturedFilter || tags.length > 0 || years.length > 1;

  function updateFilter<Key extends keyof EditorialFilters>(key: Key, value: EditorialFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      {items.length > 0 && (
        <div className="editorial-search page-shell" role="search" aria-label={searchLabel}>
          <div className="editorial-search__field">
            <FontAwesomeIcon aria-hidden="true" icon={faMagnifyingGlass} />
            <input
              aria-label={searchLabel}
              onChange={(event) => updateFilter("query", event.currentTarget.value)}
              placeholder={copy.placeholder}
              ref={inputRef}
              type="search"
              value={filters.query}
            />
            {filters.query && (
              <button
                aria-label={copy.clear}
                onClick={() => {
                  updateFilter("query", "");
                  inputRef.current?.focus();
                }}
                type="button"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
              </button>
            )}
          </div>

          {canFilter && (
            <>
              <button
                aria-label={activeFacets ? `${copy.filters} (${activeFacets})` : copy.filters}
                className="editorial-search__trigger"
                data-filtered={activeFacets > 0}
                popoverTarget={filtersId}
                type="button"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faSliders} />
                {activeFacets > 0 && <span aria-hidden="true">{activeFacets}</span>}
              </button>
              <div
                aria-label={copy.filters}
                className="editorial-search__filters"
                id={filtersId}
                popover="auto"
                role="group"
              >
                {showFeaturedFilter && (
                  <label className="editorial-search__check">
                    <input
                      checked={filters.featured}
                      onChange={(event) => updateFilter("featured", event.currentTarget.checked)}
                      type="checkbox" role="switch"
                    />
                    {copy.featured}
                  </label>
                )}
                {tags.length > 0 && (
                  <FilterWheel label={copy.tag} options={tags} all={copy.allTags} value={filters.tag} onChange={(tag) => updateFilter("tag", tag)} />
                )}
                {years.length > 1 && (
                  <FilterWheel label={copy.year} options={years.map(String)} all={copy.allYears} value={filters.year} onChange={(year) => updateFilter("year", year)} />
                )}
                <button
                  hidden={activeFacets === 0}
                  className="editorial-search__reset"
                  onClick={() => {
                    if (activeFacets > 0) {
                      setFilters(({ query }) => ({ ...emptyEditorialFilters, query }));
                      document.getElementById(filtersId)?.hidePopover();
                      inputRef.current?.focus();
                    }
                  }}
                  type="button"
                >
                  {copy.reset}
                </button>
              </div>
            </>
          )}
          <p className="sr-only" role="status">{copy.results.replace("{count}", String(results.length))}</p>
        </div>
      )}

      <EditorialIndex
        {...indexProps}
        emptyState={items.length > 0 ? { title: copy.noResults, description: copy.tryAgain } : indexProps.emptyState}
        items={results}
        key={JSON.stringify(results.map(({ href }) => href))}
      />
    </>
  );
}
