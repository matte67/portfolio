import type { ProjectMetadata } from "../../core/project";
import type { ContentLocale } from "../../core/content";

export interface ProjectDocument<Content> {
  readonly content: Content;
  readonly metadata: ProjectMetadata;
}

/** Source-agnostic read port for project documents. */
export interface ProjectRepository<Content> {
  findBySlug(slug: string, locale: ContentLocale): ProjectDocument<Content> | undefined;
  list(locale: ContentLocale): readonly ProjectDocument<Content>[];
}
