import { expect, test } from "@playwright/test";

const PRODUCTION_ORIGIN = "https://matteo-vittori.netlify.app";

test("homepage exposes complete production and social metadata", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Computer Science student — Matteo Vittori");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${PRODUCTION_ORIGIN}/`,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    `${PRODUCTION_ORIGIN}/`,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${PRODUCTION_ORIGIN}/social-preview.png`,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index, follow",
  );
});

test("project routes publish their own canonical URL and social image", async ({ page }) => {
  await page.goto("/work/sef");

  await expect(page).toHaveTitle("SEF — Matteo Vittori");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${PRODUCTION_ORIGIN}/work/sef/`,
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "article",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${PRODUCTION_ORIGIN}/media/sef/showcase.avif`,
  );
});

test("unknown routes are excluded from indexing", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
});

test("crawler assets expose the production route catalogue", async ({ request }) => {
  const robotsResponse = await request.get("/robots.txt");
  const sitemapResponse = await request.get("/sitemap.xml");
  const socialPreviewResponse = await request.get("/social-preview.png");

  expect(robotsResponse.ok()).toBeTruthy();
  expect(await robotsResponse.text()).toContain(
    `Sitemap: ${PRODUCTION_ORIGIN}/sitemap.xml`,
  );

  expect(sitemapResponse.ok()).toBeTruthy();
  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain(`<loc>${PRODUCTION_ORIGIN}/work/sef/</loc>`);
  expect(sitemap).toContain(`<loc>${PRODUCTION_ORIGIN}/articles/</loc>`);
  expect(sitemap).toContain(`<loc>${PRODUCTION_ORIGIN}/thesis/</loc>`);

  const manifestResponse = await request.get("/content-manifest.json");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.projects).toHaveLength(5);
  expect(manifest.articles).toHaveLength(1);

  expect(socialPreviewResponse.ok()).toBeTruthy();
  expect(socialPreviewResponse.headers()["content-type"]).toContain("image/png");
});

test("server responses expose route-specific metadata without JavaScript", async ({ request }) => {
  const response = await request.get("/work/sef");
  const html = await response.text();

  expect(response.ok()).toBeTruthy();
  expect(html).toContain("<title>SEF — Matteo Vittori</title>");
  expect(html).toContain(
    `<link rel="canonical" href="${PRODUCTION_ORIGIN}/work/sef/" />`,
  );
  expect(html).toContain(
    `<meta property="og:image" content="${PRODUCTION_ORIGIN}/media/sef/showcase.avif" />`,
  );
  expect(html).toContain('data-prerendered-route="/work/sef"');
  expect(html).toContain("SEF coordinates acquisition, processing, signal extraction");
});

test("locale-only articles expose static social metadata without JavaScript", async ({ request }) => {
  const response = await request.get("/articles/ddfgd");
  const html = await response.text();

  expect(response.ok()).toBeTruthy();
  expect(html).toContain('<html lang="it">');
  expect(html).toContain('<meta property="og:locale" content="it_IT" />');
  expect(html).toContain(
    `<meta property="og:url" content="${PRODUCTION_ORIGIN}/articles/ddfgd/" />`,
  );
  expect(html).toContain(
    `<meta property="og:image" content="${PRODUCTION_ORIGIN}/media/thesis/cover.png" />`,
  );
  expect(html).toContain('"@type":"Article"');
  expect(html).toContain('data-prerendered-route="/articles/ddfgd"');
  expect(html).toContain('<time datetime="2026-07-20">2026-07-20</time>');
});
