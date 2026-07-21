import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { ArrowMark } from "../components/SmartLink";
import { EditorialImage } from "./EditorialMedia";

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
  readonly emptyState?: {
    readonly description: ReactNode;
    readonly title: ReactNode;
  };
  readonly items: readonly EditorialIndexItem[];
  readonly readLabel: string;
  readonly sectionLabel: string;
}

/**
 * Shared index for every long-form publication.
 * Domain pages map their metadata into this stable presentation contract.
 */
export function EditorialIndex({
  emptyState,
  items,
  readLabel,
  sectionLabel,
}: EditorialIndexProps) {
  return (
    <section className="editorial-index page-shell" aria-label={sectionLabel}>
      {items.length === 0 && emptyState ? (
        <div className="editorial-index__empty">
          <h2>{emptyState.title}</h2>
          <p>{emptyState.description}</p>
        </div>
      ) : items.map((item) => (
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
            <Link className="text-link" to={item.href}>{readLabel} <ArrowMark /></Link>
          </div>
        </article>
      ))}
    </section>
  );
}
