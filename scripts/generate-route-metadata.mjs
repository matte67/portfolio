import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readContentCatalog } from "./content-catalog.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(projectRoot, "dist");
const productionOrigin = "https://matteo-vittori.netlify.app";
const defaultImage = "/social-preview.png";
const author = "Matteo Vittori";

const localeMetadata = Object.freeze({
  en: { html: "en", openGraph: "en_US" },
  it: { html: "it", openGraph: "it_IT" },
});

async function readJson(path) {
  return JSON.parse(await readFile(join(projectRoot, path), "utf8"));
}

const [catalog, homeCopy, workCopy, articlesCopy, thesisCopy, aboutCopy] = await Promise.all([
  readContentCatalog(projectRoot),
  readJson("content/i18n/en/home.json"),
  readJson("content/i18n/en/work.json"),
  readJson("content/i18n/en/articles.json"),
  readJson("content/i18n/en/thesis.json"),
  readJson("content/i18n/en/about.json"),
]);

/**
 * A route has no locale prefix, so it can expose one static social document.
 * Prefer English when translations share a slug, but retain locale-only content.
 */
function selectRouteContent(entries) {
  const bySlug = new Map();

  for (const entry of entries.filter(({ isPublic }) => isPublic)) {
    const selected = bySlug.get(entry.slug);
    if (!selected || (entry.locale === "en" && selected.locale !== "en")) {
      bySlug.set(entry.slug, entry);
    }
  }

  return [...bySlug.values()];
}

const publicProjects = selectRouteContent(catalog.projects);
const publicArticles = selectRouteContent(catalog.articles);

const homeRoute = {
  path: "/",
  ...homeCopy.meta,
  kind: "home",
  priority: "1.0",
  projects: publicProjects,
};

const routes = [
  { path: "/work", ...workCopy.meta, kind: "collection", items: publicProjects, priority: "0.9" },
  { path: "/articles", ...articlesCopy.meta, kind: "collection", items: publicArticles, priority: "0.8" },
  ...publicProjects.map((project) => ({
    path: `/work/${project.slug}`,
    title: project.seo.title,
    description: project.seo.description,
    image: project.seo.image ?? project.hero?.src,
    imageAlt: project.seo.imageAlt ?? project.hero?.alt,
    locale: project.locale,
    kind: "project",
    content: project,
    type: "article",
    structuredDataType: "CreativeWork",
    priority: "0.8",
    lastModified: project.updatedAt ?? project.publishedAt,
  })),
  ...publicArticles.map((article) => ({
    path: `/articles/${article.slug}`,
    title: article.seo.title,
    description: article.seo.description,
    image: article.seo.image ?? article.hero?.src,
    imageAlt: article.seo.imageAlt ?? article.hero?.alt,
    locale: article.locale,
    kind: "article",
    content: article,
    type: "article",
    structuredDataType: "Article",
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    section: article.categories?.[0],
    tags: article.tags,
    priority: "0.7",
    lastModified: article.updatedAt ?? article.publishedAt,
  })),
  {
    path: "/thesis",
    ...thesisCopy.meta,
    image: "/media/thesis/cover.png",
    imageAlt: thesisCopy.hero.coverAlt,
    type: "article",
    kind: "page",
    priority: "0.8",
  },
  { path: "/about", ...aboutCopy.meta, kind: "page", priority: "0.7" },
].map((route) => ({ ...route, title: `${route.title} — ${author}` }));

const allRoutes = [
  { ...homeRoute, title: `${homeRoute.title} — ${author}` },
  ...routes,
];

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

function normalizePagePath(path) {
  return path === "/" ? path : `${path.replace(/\/+$/, "")}/`;
}

function createStaticNavigation() {
  return `<nav aria-label="Primary navigation">
      <a href="/">Home</a>
      <a href="/work/">Work</a>
      <a href="/articles/">Articles</a>
      <a href="/thesis/">Thesis</a>
      <a href="/about/">About</a>
    </nav>`;
}

function createCollectionLinks(items, basePath) {
  if (!items?.length) return "<p>No published entries yet.</p>";
  return `<ul>${items.map((item) => `
        <li>
          <a href="${normalizePagePath(`${basePath}/${item.slug}`)}">${escapeAttribute(item.title)}</a>
          <p>${escapeAttribute(item.summary)}</p>
        </li>`).join("")}
      </ul>`;
}

/** Provides meaningful first-response HTML while React remains the interactive UI. */
function createStaticRouteContent(route) {
  let content = `<h1>${escapeAttribute(route.title.replace(` — ${author}`, ""))}</h1>
      <p>${escapeAttribute(route.description)}</p>`;

  if (route.kind === "home") {
    content += `<section aria-labelledby="selected-work-title">
        <h2 id="selected-work-title">Selected work</h2>
        ${createCollectionLinks(route.projects, "/work")}
      </section>`;
  } else if (route.kind === "collection") {
    content += createCollectionLinks(
      route.items,
      route.path === "/work" ? "/work" : "/articles",
    );
  } else if (route.kind === "project") {
    const project = route.content;
    content = `<h1>${escapeAttribute(project.title)}</h1>
      <p>${escapeAttribute(project.subtitle)}</p>
      <p>${escapeAttribute(project.summary)}</p>
      <dl>
        <dt>Year</dt><dd>${escapeAttribute(project.year)}</dd>
        <dt>Role</dt><dd>${escapeAttribute(project.role)}</dd>
        <dt>Disciplines</dt><dd>${escapeAttribute(project.disciplines.join(", "))}</dd>
        <dt>Technologies</dt><dd>${escapeAttribute(project.technologies.join(", "))}</dd>
      </dl>`;
  } else if (route.kind === "article") {
    const article = route.content;
    content = `<article>
        <h1>${escapeAttribute(article.title)}</h1>
        <p>${escapeAttribute(article.summary)}</p>
        <p>Published <time datetime="${escapeAttribute(article.publishedAt)}">${escapeAttribute(article.publishedAt)}</time></p>
        ${article.categories?.length ? `<p>Topics: ${escapeAttribute(article.categories.join(", "))}</p>` : ""}
      </article>`;
  }

  return `<main data-prerendered-route="${escapeAttribute(route.path)}">
    ${createStaticNavigation()}
    ${content}
  </main>`;
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

function upsertMeta(html, attribute, key, content) {
  const pattern = new RegExp(
    `<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*/?>`,
  );
  const tag = `<meta ${attribute}="${key}" content="${escapeAttribute(content)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function imageMimeType(imagePath) {
  const extension = imagePath.split(".").pop()?.toLowerCase();
  return ({ avif: "image/avif", jpeg: "image/jpeg", jpg: "image/jpeg", png: "image/png", webp: "image/webp" })[extension];
}

function serializeStructuredData(route, canonicalUrl, imageUrl) {
  if (!route.structuredDataType) return undefined;

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": route.structuredDataType,
    headline: route.title,
    description: route.description,
    image: imageUrl,
    url: canonicalUrl,
    inLanguage: route.locale ?? "en",
    datePublished: route.publishedAt,
    dateModified: route.updatedAt ?? route.publishedAt,
    articleSection: route.section,
    keywords: route.tags?.length ? route.tags.join(", ") : undefined,
    author: { "@type": "Person", name: author, url: productionOrigin },
  }).replaceAll("<", "\\u003c");
}

function createRouteDocument(baseDocument, route) {
  const canonicalUrl = new URL(normalizePagePath(route.path), `${productionOrigin}/`).toString();
  const imageUrl = new URL(route.image ?? defaultImage, `${productionOrigin}/`).toString();
  const imageAlt = route.imageAlt ?? "Matteo Vittori portfolio homepage";
  const locale = localeMetadata[route.locale] ?? localeMetadata.en;
  let document = baseDocument.replace(
    /<html lang="[^"]*">/,
    `<html lang="${locale.html}">`,
  ).replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeAttribute(route.title)}</title>`,
  );

  document = document.replace(
    '<div id="root"></div>',
    `<div id="root">${createStaticRouteContent(route)}</div>`,
  );

  document = document.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${canonicalUrl}" />`,
  );
  document = replaceMeta(document, "name", "description", route.description);
  document = replaceMeta(document, "property", "og:type", route.type ?? "website");
  document = replaceMeta(document, "property", "og:locale", locale.openGraph);
  document = replaceMeta(document, "property", "og:title", route.title);
  document = replaceMeta(document, "property", "og:description", route.description);
  document = replaceMeta(document, "property", "og:url", canonicalUrl);
  document = replaceMeta(document, "property", "og:image", imageUrl);
  document = replaceMeta(document, "property", "og:image:alt", imageAlt);
  document = upsertMeta(document, "property", "og:image:secure_url", imageUrl);

  const mimeType = imageMimeType(imageUrl);
  if (mimeType) document = upsertMeta(document, "property", "og:image:type", mimeType);

  if (route.publishedAt) {
    document = upsertMeta(document, "property", "article:published_time", route.publishedAt);
  }
  if (route.updatedAt) {
    document = upsertMeta(document, "property", "article:modified_time", route.updatedAt);
  }
  if (route.section) {
    document = upsertMeta(document, "property", "article:section", route.section);
  }

  if (route.image) {
    document = removeMeta(document, "property", "og:image:width");
    document = removeMeta(document, "property", "og:image:height");
  }

  document = replaceMeta(document, "name", "twitter:title", route.title);
  document = replaceMeta(document, "name", "twitter:description", route.description);
  document = replaceMeta(document, "name", "twitter:image", imageUrl);
  document = replaceMeta(document, "name", "twitter:image:alt", imageAlt);

  const structuredData = serializeStructuredData(route, canonicalUrl, imageUrl);
  return structuredData
    ? document.replace("</head>", `    <script type="application/ld+json">${structuredData}</script>\n  </head>`)
    : document;
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
  const entries = allRoutes.map(({ path, priority, lastModified }) => ({
    path,
    priority,
    lastModified,
  }));
  const urls = entries.map((entry) => {
    const location = new URL(normalizePagePath(entry.path), `${productionOrigin}/`).toString();
    const lastModified = entry.lastModified
      ? `\n    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`
      : "";
    return `  <url>\n    <loc>${escapeXml(location)}</loc>${lastModified}\n    <priority>${entry.priority}</priority>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

function createLlmsDocument() {
  const projectLines = publicProjects.map(
    (project) => `- [${project.shortTitle}](${productionOrigin}/work/${project.slug}/): ${project.summary}`,
  );
  const articleLines = publicArticles.map(
    (article) => `- [${article.title}](${productionOrigin}/articles/${article.slug}/): ${article.summary}`,
  );
  return `# Matteo Vittori Portfolio

Portfolio of Matteo Vittori, a Computer Science student focused on modular software architecture, computer vision, web products, and embedded systems.

## Main pages

- [Home](${productionOrigin}/): overview and selected work.
- [Work](${productionOrigin}/work/): project case studies.
- [Articles](${productionOrigin}/articles/): technical notes and design decisions.
- [Thesis](${productionOrigin}/thesis/): bachelor thesis on the Signal Extraction Framework.
- [About](${productionOrigin}/about/): background, principles, and education.

## Selected projects

${projectLines.join("\n") || "No public projects."}

## Articles

${articleLines.join("\n") || "No public articles yet."}
`;
}

const baseDocument = await readFile(join(outputDirectory, "index.html"), "utf8");

await Promise.all([
  ...allRoutes.map(async (route) => {
    if (route.path === "/") {
      await writeFile(join(outputDirectory, "index.html"), createRouteDocument(baseDocument, route), "utf8");
      return;
    }
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

console.log(`Generated ${allRoutes.length} public route documents from the content catalogue.`);
