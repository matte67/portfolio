import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type { ProjectMedia } from "../../core/project";
import { EditorialFigure } from "./EditorialMedia";
import { MockupPlayer } from "./MockupPlayer";

export type EditorialPageVariant = "article" | "project";

export interface EditorialFact {
  readonly label: string;
  readonly value: ReactNode;
}

interface EditorialMastheadProps {
  readonly actions?: ReactNode;
  readonly chips?: readonly string[];
  readonly collectionHref: string;
  readonly collectionLabel: string;
  readonly contextLabel: string;
  readonly eyebrow: ReactNode;
  readonly summary: ReactNode;
  readonly title: ReactNode;
  readonly variant: EditorialPageVariant;
}

/**
 * Common editorial masthead for articles and case studies.
 * Slots keep page-specific metadata out of the reusable layout.
 */
export function EditorialMasthead({
  actions,
  chips = [],
  collectionHref,
  collectionLabel,
  contextLabel,
  eyebrow,
  summary,
  title,
  variant,
}: EditorialMastheadProps) {
  return (
    <header className={`editorial-masthead editorial-masthead--${variant} page-shell`}>
      <div className="editorial-breadcrumb">
        <Link to={collectionHref}>{collectionLabel}</Link>
        <span aria-hidden="true">/</span>
        <span>{contextLabel}</span>
      </div>
      <div className="editorial-masthead__title">
        <div className="editorial-masthead__meta">
          <p className="eyebrow">{eyebrow}</p>
          <div className="flex gap-2">
          {chips.map((chip) => <span className="editorial-chip" key={chip}>{chip}</span>)}
          </div> 
        </div>
        <h1>{title}</h1>
        <p>{summary}</p>
      </div>
      {actions ? <div className="editorial-masthead__actions">{actions}</div> : null}
    </header>
  );
}

interface EditorialHeroProps {
  readonly fallback?: ReactNode;
  readonly media: ProjectMedia;
  readonly variant: EditorialPageVariant;
}

/** Shared hero contract with visual variants for long-form content types. */
export function EditorialHero({ fallback, media, variant }: EditorialHeroProps) {
  const position = media.position ?? "center";

  if (!media.src) {
    return fallback ? (
      <div className={`editorial-hero editorial-hero--${variant} page-shell`}>{fallback}</div>
    ) : null;
  }

  return (
    media.asMockupAnimation ? (
      <MockupPlayer
        mockupId={media.mockupAnimationId ?? ""}
        aspectRatio={media.aspectRatio ?? "16 / 9"}
        triggerLoop={media.triggerLoop ?? false}
        trigger={media.trigger ?? "load"}
        cursorRange={media.cursorRange ?? "5-7-5-15"}
        shakeIntensity={media.shakeIntensity}
        shakeZ={media.shakeZ}
        shakeAngle={media.shakeAngle}
        shakeDuration={media.shakeDuration}
        cameraZoom={media.cameraZoom ?? 21}
        className={`page-shell`}
      />
    ) : (
      <EditorialFigure
        alt={media.alt}
        className={`editorial-hero editorial-hero--${variant} editorial-hero--${position} page-shell`}
        fill
        priority
        src={media.src}
        wide
      />
    )
  );
}

interface EditorialReadingLayoutProps {
  readonly bodyClassName?: string;
  readonly children: ReactNode;
  readonly facts: readonly EditorialFact[];
  readonly factsLabel: string;
  readonly variant: EditorialPageVariant;
}

/** Shared two-column reading shell; only data and content remain page-owned. */
export function EditorialReadingLayout({
  bodyClassName = "",
  children,
  facts,
  factsLabel,
  variant,
}: EditorialReadingLayoutProps) {
  return (
    <div className={`editorial-reading-layout editorial-reading-layout--${variant} page-shell`}>
      <aside className="editorial-facts" aria-label={factsLabel}>
        <dl>
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </aside>
      <div className={["editorial-body", "editorial-reading-layout__body", bodyClassName]
        .filter(Boolean).join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
