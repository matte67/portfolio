import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { readContentCatalog } from "./content-catalog.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const catalog = await readContentCatalog(projectRoot);
const publishedProjects = catalog.projects.filter((entry) => entry.isPublic).length;
const publishedArticles = catalog.articles.filter((entry) => entry.isPublic).length;

console.log(
  `Validated ${catalog.projects.length} projects and ${catalog.articles.length} articles (${publishedProjects} projects and ${publishedArticles} articles public).`,
);
