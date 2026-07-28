import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { ArrowMark } from "../components/SmartLink";
import { EditorialImage } from "./EditorialMedia";
import { useEditorialIndexParallax } from "./useEditorialIndexParallax";
import { useEditorialRoller } from "./useEditorialRoller";

export interface EditorialIndexItem {
  readonly ariaLabel: string;
  readonly eyebrow: ReactNode;
  readonly href: string;
  readonly media: {
    readonly alt: string;
    readonly fallback?: ReactNode;
    readonly src?: string;
  };
  readonly metadata: readonly ReactNode[];
  readonly summary: ReactNode;
  readonly title: ReactNode;
}

interface EditorialIndexProps {
  readonly className?: string;
  readonly contained?: boolean;
  readonly emptyState?: {
    readonly description: ReactNode;
    readonly title: ReactNode;
  };
  readonly items: readonly EditorialIndexItem[];
  readonly mode?: "cards" | "roller";
  readonly readLabel: string;
  readonly sectionLabel: string;
  readonly variant?: "default" | "preview";
  readonly showLinks?: boolean;
}

/**
 * Shared index for every long-form publication.
 * Domain pages map their metadata into this stable presentation contract.
 */
export function EditorialIndex({
  className = "",
  contained = true,
  emptyState,
  items,
  mode = "cards",
  readLabel,
  sectionLabel,
  variant = "default",
  showLinks = true,
}: EditorialIndexProps) {
  const cardIndexRef = useEditorialIndexParallax(items.length);
  const { activeIndex, rootRef: rollerRef, selectItem } = useEditorialRoller(items.length);
  const indexClassName = [
    "editorial-index",
    `editorial-index--${variant}`,
    `editorial-index--${mode}`,
    contained ? "page-shell" : "",
    className,
  ].filter(Boolean).join(" ");

  if (items.length === 0 && emptyState) {
    return (
      <section className={indexClassName} aria-label={sectionLabel}>
        <div className="editorial-index__empty">
          <h2>{emptyState.title}</h2>
          <p>{emptyState.description}</p>
        </div>
      </section>
    );
  }

  if (mode === "roller") {
    const activeItem = items[activeIndex] ?? items[0];

    return (
      <section className={indexClassName} aria-label={sectionLabel} ref={rollerRef}>
        <div className="editorial-roller__track">
          {items.map((item, index) => (
            <article
              className="editorial-roller__item"
              data-active={index === activeIndex}
              key={item.href}
            >
              <div className="editorial-roller__media-viewport">
                <Link
                  aria-label={item.ariaLabel}
                  className="editorial-roller__media editorial-card__media"
                  onFocus={() => selectItem(index)}
                  to={item.href}
                >
                  {item.media.src ? (
                    <EditorialImage alt={item.media.alt} fill src={item.media.src} />
                  ) : item.media.fallback ?? (
                    <span aria-hidden="true" className="editorial-card__media-fallback" />
                  )}
                </Link>
              </div>
              <div className="editorial-roller__mobile-copy">
                <RollerCopy item={item} readLabel={readLabel} showLinks={showLinks} />
              </div>
            </article>
          ))}
        </div>
        <aside className="editorial-roller__panel">
          <div className="editorial-roller__panel-inner" key={activeItem.href}>
            <RollerCopy item={activeItem} readLabel={readLabel} showLinks={showLinks} />
          </div>
        </aside>
      </section>
    );
  }

  return (
    <section className={indexClassName} aria-label={sectionLabel} ref={cardIndexRef}>
      {items.map((item) => (
        <article className="editorial-card" key={item.href}>
          <Link aria-label={item.ariaLabel} className="editorial-card__media" to={item.href}>
            {item.media.src ? (
              <EditorialImage
                alt={item.media.alt}
                fill
                src={item.media.src}
              />
            ) : item.media.fallback ?? (
              <span aria-hidden="true" className="editorial-card__media-fallback" />
            )}
          </Link>
          <div className="editorial-card__copy">
            <span className="eyebrow">{item.eyebrow}</span>
            <h2><Link to={item.href}>{item.title}</Link></h2>
            <p>{item.summary}</p>
            {item.metadata.length > 0 ? (
              <div className="editorial-card__meta">
                {item.metadata.map((value, index) => <span key={index}>{value}</span>)}
              </div>
            ) : null}
            {showLinks && <Link className="text-link" to={item.href}>{readLabel} <ArrowMark /></Link>}
          </div>
        </article>
      ))}
    </section>
  );
}

function RollerCopy({
  item,
  readLabel,
  showLinks,
}: Pick<EditorialIndexProps, "readLabel" | "showLinks"> & { readonly item: EditorialIndexItem }) {
  return (
    <div className="editorial-roller__copy">
      <span className="eyebrow">{item.eyebrow}</span>
      <h2><Link to={item.href}>{item.title}</Link></h2>
      <p>{item.summary}</p>
      {item.metadata.length > 0 ? (
        <div className="editorial-card__meta">
          {item.metadata.map((value, index) => <span key={index}>{value}</span>)}
        </div>
      ) : null}
      {showLinks && <Link className="text-link" to={item.href}>{readLabel} <ArrowMark /></Link>}
    </div>
  );
}
