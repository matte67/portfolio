import type {
  ProjectDocument,
  ProjectRepository,
} from "./ports/ProjectRepository";
import { isPublicContent, type ContentLocale } from "../core/content";
import type { ProjectMetadata } from "../core/project";

interface ProjectCatalogueOptions {
  readonly includeUnpublished?: boolean;
}

export interface ProjectCatalog<Content> {
  findProject(slug: string, locale: ContentLocale): ProjectDocument<Content> | undefined;
  getNextProject(current: ProjectMetadata): ProjectMetadata | undefined;
  listFeaturedProjects(locale: ContentLocale): readonly ProjectDocument<Content>[];
  listProjects(locale: ContentLocale): readonly ProjectDocument<Content>[];
}

/** Creates project queries around an injected repository and publication policy. */
export function createProjectCatalog<Content>(
  repository: ProjectRepository<Content>,
  options: ProjectCatalogueOptions = {},
): ProjectCatalog<Content> {
  const isVisible = (metadata: ProjectMetadata) =>
    options.includeUnpublished === true || isPublicContent(metadata);

  const listProjects = (locale: ContentLocale) =>
    repository.list(locale).filter(({ metadata }) => isVisible(metadata));

  return Object.freeze({
    listProjects,

    listFeaturedProjects(locale: ContentLocale) {
      return listProjects(locale).filter(({ metadata }) => metadata.featured);
    },

    findProject(slug: string, locale: ContentLocale) {
      const document = repository.findBySlug(slug, locale);
      return document && isVisible(document.metadata) ? document : undefined;
    },

    getNextProject(current: ProjectMetadata) {
      const projects = listProjects(current.locale);
      const currentIndex = projects.findIndex(
        ({ metadata }) => metadata.slug === current.slug,
      );
      if (currentIndex < 0 || projects.length < 2) return undefined;
      return projects[(currentIndex + 1) % projects.length].metadata;
    },
  });
}
