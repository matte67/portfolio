import {
  assertNonEmptyText,
  assertSlug,
  validatePublicationMetadata,
  type PublicationMetadata,
  type SeoMetadata,
} from "./content";

export const projectStatuses = [
  "Released",
  "Research",
  "Prototype",
  "Concept",
  "Academic",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

export interface ProjectLink {
  readonly label: string;
  readonly href?: string;
  readonly kind: "code" | "demo" | "document" | "external";
}

export interface ProjectMedia {
  readonly asMockupAnimation?: boolean;
  readonly mockupAnimationId?: string;
  readonly trigger?: string;
  readonly triggerLoop?: boolean;
  readonly cursorRange?: string;
  readonly shakeIntensity?: number; 
  readonly shakeZ?: number;
  readonly shakeAngle?: number;
  readonly shakeDuration?: number;
  readonly cameraZoom?: number;
  readonly aspectRatio?: string;
  readonly src?: string;
  readonly alt: string;
  readonly position?: "center" | "top";
}

export interface ProjectMetric {
  readonly value: string;
  readonly label: string;
  readonly context: string;
}

/** Framework-independent metadata that can be validated before presentation. */
export interface ProjectMetadata extends PublicationMetadata {
  readonly slug: string;
  readonly index: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly subtitle: string;
  readonly summary: string;
  readonly year: string;
  readonly status: ProjectStatus;
  readonly disciplines: readonly string[];
  readonly role: string;
  readonly team: string;
  readonly duration: string;
  readonly technologies: readonly string[];
  readonly chip: string;
  readonly hero: ProjectMedia;
  readonly metrics: readonly ProjectMetric[];
  readonly links: readonly ProjectLink[];
  readonly featured: boolean;
  readonly order: number;
  readonly seo: SeoMetadata;
}

const requiredTextFields: readonly (keyof ProjectMetadata)[] = [
  "slug",
  "index",
  "title",
  "shortTitle",
  "subtitle",
  "summary",
  "year",
  "role",
  "team",
  "duration",
  "chip",
];

/** Fails early when hand-authored MDX metadata is incomplete. */
export function validateProjectMetadata(value: ProjectMetadata): ProjectMetadata {
  const label = `Project "${value.slug || "unknown"}"`;
  validatePublicationMetadata(value, label);
  assertSlug(value.slug, label);

  for (const field of requiredTextFields) {
    assertNonEmptyText(value[field], field, label);
  }

  if (!projectStatuses.includes(value.status)) {
    throw new Error(`${label} has unsupported project status "${value.status}".`);
  }

  if (!Array.isArray(value.technologies) || value.technologies.length === 0) {
    throw new Error(`Project "${value.slug}" requires at least one technology.`);
  }

  if (!Array.isArray(value.disciplines) || value.disciplines.length === 0) {
    throw new Error(`${label} requires at least one discipline.`);
  }

  if (!Array.isArray(value.metrics) || value.metrics.length === 0) {
    throw new Error(`${label} requires at least one contextual metric.`);
  }

  if (!Number.isFinite(value.order)) {
    throw new Error(`${label} requires a numeric order.`);
  }

  assertNonEmptyText(value.hero.alt, "hero.alt", label);
  assertNonEmptyText(value.seo?.title, "seo.title", label);
  assertNonEmptyText(value.seo?.description, "seo.description", label);
  if (value.seo?.image) {
    assertNonEmptyText(value.seo.imageAlt, "seo.imageAlt", label);
  }

  value.links.forEach((link, index) => {
    assertNonEmptyText(link.label, `links[${index}].label`, label);
    assertNonEmptyText(link.kind, `links[${index}].kind`, label);
  });

  return Object.freeze(value);
}
