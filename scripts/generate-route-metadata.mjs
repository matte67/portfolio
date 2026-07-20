import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readContentCatalog } from "./content-catalog.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(projectRoot, "dist");
const productionOrigin = "https://matteo-vittori.netlify.app";
const defaultImage = "/social-preview.png";
const author = "Matteo Vittori";

async function readJson(path) {
  return JSON.parse(await readFile(join(projectRoot, path), "utf8"));
}

const [catalog, workCopy, articlesCopy, thesisCopy, aboutCopy] = await Promise.all([
  readContentCatalog(projectRoot),
  readJson("content/i18n/en/work.json"),
  readJson("content/i18n/en/articles.json"),
  readJson("content/i18n/en/thesis.json"),
  readJson("content/i18n/en/about.json"),
]);

const publicProjects = catalog.projects.filter(
  (entry) => entry.locale === "en" && entry.isPublic,
);
const publicArticles = catalog.articles.filter(
  (entry) => entry.locale === "en" && entry.isPublic,
);

const routes = [
  { path: "/work", ...workCopy.meta, priority: "0.9" },
  { path: "/articles", ...articlesCopy.meta, priority: "0.8" },
  ...publicProjects.map((project) => ({
    path: `/work/${project.slug}`,
    title: project.seo.title,
    description: project.seo.description,
    image: project.hero?.src,
    imageAlt: project.hero?.alt,
    type: "article",
    priority: "0.8",
    lastModified: project.updatedAt ?? project.publishedAt,
  })),
  ...publicArticles.map((article) => ({
    path: `/articles/${article.slug}`,
    title: article.seo.title,
    description: article.seo.description,
    image: article.hero?.src,
    imageAlt: article.hero?.alt,
    type: "article",
    priority: "0.7",
    lastModified: article.updatedAt ?? article.publishedAt,
  })),
  {
    path: "/thesis",
    ...thesisCopy.meta,
    image: "/media/thesis/cover.png",
    imageAlt: thesisCopy.hero.coverAlt,
    type: "article",
    priority: "0.8",
  },
  { path: "/about", ...aboutCopy.meta, priority: "0.7" },
].map((route) => ({ ...route, title: `${route.title} — ${author}` }));

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXml(value) {
  return escapeAttribute(value).replaceAll("'", "&apos;");
}

function replaceMeta(html, attribute, key, content) {
  const pattern = new RegExp(
    `<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*/?>`,
  );
  const replacement = `<meta ${attribute}="${key}" content="${escapeAttribute(content)}" />`;
  if (!pattern.test(html)) throw new Error(`Base document is missing ${attribute}="${key}".`);
  return html.replace(pattern, replacement);
}

function removeMeta(html, attribute, key) {
  return html.replace(
    new RegExp(`\\s*<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*/?>`),
    "",
  );
}

function createRouteDocument(baseDocument, route) {
  const canonicalUrl = new URL(route.path, `${productionOrigin}/`).toString();
  const imageUrl = new URL(route.image ?? defaultImage, `${productionOrigin}/`).toString();
  const imageAlt = route.imageAlt ?? "Matteo Vittori portfolio homepage";
  let document = baseDocument.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeAttribute(route.title)}</title>`,
  );

  document = document.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${canonicalUrl}" />`,
  );
  document = replaceMeta(document, "name", "description", route.description);
  document = replaceMeta(document, "property", "og:type", route.type ?? "website");
  document = replaceMeta(document, "property", "og:title", route.title);
  document = replaceMeta(document, "property", "og:description", route.description);
  document = replaceMeta(document, "property", "og:url", canonicalUrl);
  document = replaceMeta(document, "property", "og:image", imageUrl);
  document = replaceMeta(document, "property", "og:image:alt", imageAlt);

  if (route.image) {
    document = removeMeta(document, "property", "og:image:width");
    document = removeMeta(document, "property", "og:image:height");
  }

  document = replaceMeta(document, "name", "twitter:title", route.title);
  document = replaceMeta(document, "name", "twitter:description", route.description);
  document = replaceMeta(document, "name", "twitter:image", imageUrl);
  return replaceMeta(document, "name", "twitter:image:alt", imageAlt);
}

function createNotFoundDocument(baseDocument) {
  let document = baseDocument.replace(
    /<title>[^<]*<\/title>/,
    `<title>Page not found — ${author}</title>`,
  );
  document = replaceMeta(document, "name", "robots", "noindex, nofollow");
  document = replaceMeta(document, "name", "description", "The requested page does not exist.");
  return document;
}

function createSitemap() {
  const entries = [
    { path: "/", priority: "1.0" },
    ...routes.map(({ path, priority, lastModified }) => ({ path, priority, lastModified })),
  ];
  const urls = entries.map((entry) => {
    const location = new URL(entry.path, `${productionOrigin}/`).toString();
    const lastModified = entry.lastModified
      ? `\n    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`
      : "";
    return `  <url>\n    <loc>${escapeXml(location)}</loc>${lastModified}\n    <priority>${entry.priority}</priority>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

function createLlmsDocument() {
  const projectLines = publicProjects.map(
    (project) => `- [${project.shortTitle}](${productionOrigin}/work/${project.slug}): ${project.summary}`,
  );
  const articleLines = publicArticles.map(
    (article) => `- [${article.title}](${productionOrigin}/articles/${article.slug}): ${article.summary}`,
  );
  return `# Matteo Vittori Portfolio

Portfolio of Matteo Vittori, a Computer Science student focused on modular software architecture, computer vision, web products, and embedded systems.

## Main pages

- [Home](${productionOrigin}/): overview and selected work.
- [Work](${productionOrigin}/work): project case studies.
- [Articles](${productionOrigin}/articles): technical notes and design decisions.
- [Thesis](${productionOrigin}/thesis): bachelor thesis on the Signal Extraction Framework.
- [About](${productionOrigin}/about): background, principles, and education.

## Selected projects

${projectLines.join("\n") || "No public projects."}

## Articles

${articleLines.join("\n") || "No public articles yet."}
`;
}

const baseDocument = await readFile(join(outputDirectory, "index.html"), "utf8");

await Promise.all([
  ...routes.map(async (route) => {
    const routeDirectory = join(outputDirectory, route.path.slice(1));
    await mkdir(routeDirectory, { recursive: true });
    await writeFile(join(routeDirectory, "index.html"), createRouteDocument(baseDocument, route), "utf8");
  }),
  writeFile(join(outputDirectory, "404.html"), createNotFoundDocument(baseDocument), "utf8"),
  writeFile(join(outputDirectory, "sitemap.xml"), createSitemap(), "utf8"),
  writeFile(join(outputDirectory, "llms.txt"), createLlmsDocument(), "utf8"),
  writeFile(
    join(outputDirectory, "content-manifest.json"),
    JSON.stringify({
      projects: publicProjects,
      articles: publicArticles,
    }, null, 2),
    "utf8",
  ),
]);

console.log(`Generated ${routes.length} public route documents from the content catalogue.`);
