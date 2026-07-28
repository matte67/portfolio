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
const locales = Object.keys(localeMetadata);

async function readJson(path) {
  return JSON.parse(await readFile(join(projectRoot, path), "utf8"));
}

const [catalog, copiesByLocale] = await Promise.all([
  readContentCatalog(projectRoot),
  Promise.all(locales.map(async (locale) => [locale, {
    about: await readJson(`content/i18n/${locale}/about.json`),
    articles: await readJson(`content/i18n/${locale}/articles.json`),
    home: await readJson(`content/i18n/${locale}/home.json`),
    layout: await readJson(`content/i18n/${locale}/layout.json`),
    thesis: await readJson(`content/i18n/${locale}/thesis.json`),
    work: await readJson(`content/i18n/${locale}/work.json`),
  }])),
]);
const localizedCopy = Object.fromEntries(copiesByLocale);
const publicProjects = catalog.projects.filter(({ isPublic }) => isPublic);
const publicArticles = catalog.articles.filter(({ isPublic }) => isPublic);

function localePath(locale, path = "") {
  return `/${locale}${path}`;
}

function pageAlternates(path) {
  return locales.map((locale) => ({ locale, path: localePath(locale, path) }));
}

function contentAlternates(entries, entry, collectionPath) {
  return entries
    .filter(({ translationKey }) => translationKey === entry.translationKey)
    .map(({ locale, slug }) => ({ locale, path: localePath(locale, `${collectionPath}/${slug}`) }));
}

function staticLabels(copy) {
  return {
    navigation: copy.layout.navigation,
    noPublishedEntries: copy.articles.emptyDescription,
    selectedWork: copy.home.work.title,
  };
}

const allRoutes = locales.flatMap((locale) => {
  const copy = localizedCopy[locale];
  const projects = publicProjects.filter((project) => project.locale === locale);
  const articles = publicArticles.filter((article) => article.locale === locale);
  const labels = staticLabels(copy);

  return [
    {
      path: localePath(locale), ...copy.home.meta, alternates: pageAlternates(""), kind: "home",
      labels, locale, priority: "1.0", projects,
    },
    {
      path: localePath(locale, "/work"), ...copy.work.meta, alternates: pageAlternates("/work"),
      items: projects, kind: "collection", labels, locale, priority: "0.9",
    },
    {
      path: localePath(locale, "/articles"), ...copy.articles.meta, alternates: pageAlternates("/articles"),
      items: articles, kind: "collection", labels, locale, priority: "0.8",
    },
    ...projects.map((project) => ({
      path: localePath(locale, `/work/${project.slug}`),
      title: project.seo.title,
      description: project.seo.description,
      image: project.seo.image ?? project.hero?.src,
      imageAlt: project.seo.imageAlt ?? project.hero?.alt,
      alternates: contentAlternates(publicProjects, project, "/work"),
      kind: "project",
      content: project,
      labels,
      locale,
      type: "article",
      structuredDataType: "CreativeWork",
      priority: "0.8",
      lastModified: project.updatedAt ?? project.publishedAt,
    })),
    ...articles.map((article) => ({
      path: localePath(locale, `/articles/${article.slug}`),
      title: article.seo.title,
      description: article.seo.description,
      image: article.seo.image ?? article.hero?.src,
      imageAlt: article.seo.imageAlt ?? article.hero?.alt,
      alternates: contentAlternates(publicArticles, article, "/articles"),
      kind: "article",
      content: article,
      labels,
      locale,
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
      path: localePath(locale, "/thesis"), ...copy.thesis.meta, alternates: pageAlternates("/thesis"),
      image: "/media/thesis/cover.png", imageAlt: copy.thesis.hero.coverAlt, type: "article",
      kind: "page", labels, locale, priority: "0.8",
    },
    {
      path: localePath(locale, "/about"), ...copy.about.meta, alternates: pageAlternates("/about"),
      kind: "page", labels, locale, priority: "0.7",
    },
  ].map((route) => ({ ...route, title: `${route.title} — ${author}` }));
});

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

function createStaticNavigation(route) {
  const { navigation } = route.labels;
  const prefix = `/${route.locale}`;
  return `<nav aria-label="${escapeAttribute(navigation.primaryLabel)}">
      <a href="${prefix}/">${escapeAttribute(navigation.homeLabel)}</a>
      <a href="${prefix}/work/">${escapeAttribute(navigation.work)}</a>
      <a href="${prefix}/articles/">${escapeAttribute(navigation.articles)}</a>
      <a href="${prefix}/thesis/">${escapeAttribute(navigation.thesis)}</a>
      <a href="${prefix}/about/">${escapeAttribute(navigation.about)}</a>
    </nav>`;
}

function createCollectionLinks(items, basePath, noPublishedEntries) {
  if (!items?.length) return `<p>${escapeAttribute(noPublishedEntries)}</p>`;
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
        <h2 id="selected-work-title">${escapeAttribute(route.labels.selectedWork)}</h2>
        ${createCollectionLinks(route.projects, `/${route.locale}/work`, route.labels.noPublishedEntries)}
      </section>`;
  } else if (route.kind === "collection") {
    content += createCollectionLinks(
      route.items,
      route.path.endsWith("/work") ? `/${route.locale}/work` : `/${route.locale}/articles`,
      route.labels.noPublishedEntries,
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
    ${createStaticNavigation(route)}
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

function serializeAlternateLinks(route) {
  const alternates = route.alternates ?? [];
  const defaultPath = alternates.find(({ locale }) => locale === "en")?.path ?? route.path;
  const alternateLinks = alternates.map(({ locale, path }) => (
    `    <link rel="alternate" hreflang="${locale}" href="${new URL(normalizePagePath(path), `${productionOrigin}/`).toString()}" />`
  ));
  alternateLinks.push(
    `    <link rel="alternate" hreflang="x-default" href="${new URL(normalizePagePath(defaultPath), `${productionOrigin}/`).toString()}" />`,
  );
  return alternateLinks.join("\n");
}

function serializeOpenGraphAlternates(route) {
  return (route.alternates ?? [])
    .filter(({ locale }) => locale !== route.locale)
    .map(({ locale }) => `    <meta property="og:locale:alternate" content="${localeMetadata[locale].openGraph}" />`)
    .join("\n");
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
  const additionalHeadMarkup = [
    serializeAlternateLinks(route),
    serializeOpenGraphAlternates(route),
    structuredData ? `    <script type="application/ld+json">${structuredData}</script>` : "",
  ].filter(Boolean).join("\n");
  return document.replace("</head>", `${additionalHeadMarkup}\n  </head>`);
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
  const projectLines = publicProjects.filter(({ locale }) => locale === "en").map(
    (project) => `- [${project.shortTitle}](${productionOrigin}/en/work/${project.slug}/): ${project.summary}`,
  );
  const articleLines = publicArticles.filter(({ locale }) => locale === "en").map(
    (article) => `- [${article.title}](${productionOrigin}/en/articles/${article.slug}/): ${article.summary}`,
  );
  return `# Matteo Vittori Portfolio

Portfolio of Matteo Vittori, a Computer Science student focused on modular software architecture, computer vision, web products, and embedded systems.

## Main pages

- [Home](${productionOrigin}/en/): overview and selected work.
- [Work](${productionOrigin}/en/work/): project case studies.
- [Articles](${productionOrigin}/en/articles/): technical notes and design decisions.
- [Thesis](${productionOrigin}/en/thesis/): bachelor thesis on the Signal Extraction Framework.
- [About](${productionOrigin}/en/about/): background, principles, and education.

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
