import { createArticleCatalog } from "../application/articleCatalog";
import { createProjectCatalog } from "../application/projectCatalog";
import { mdxArticleRepository } from "../infrastructure/repositories/MdxArticleRepository";
import { mdxProjectRepository } from "../infrastructure/repositories/MdxProjectRepository";

const includeUnpublished =
  import.meta.env.DEV || import.meta.env.VITE_CONTENT_PREVIEW === "true";

/** Composition root for content adapters and application services. */
export const projectCatalog = createProjectCatalog(mdxProjectRepository, {
  includeUnpublished,
});

export const articleCatalog = createArticleCatalog(mdxArticleRepository, {
  includeUnpublished,
});
