import { expect, test } from "@playwright/test";

const PRODUCTION_ORIGIN = "https://matteo-vittori.netlify.app";

test("homepage exposes complete production and social metadata", async ({ page }) => {
  await page.goto("/en/");

  await expect(page).toHaveTitle("Computer Science student — Matteo Vittori");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${PRODUCTION_ORIGIN}/en/`,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    `${PRODUCTION_ORIGIN}/en/`,
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
  await page.goto("/en/work/sef");

  await expect(page).toHaveTitle("SEF — Matteo Vittori");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${PRODUCTION_ORIGIN}/en/work/sef/`,
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
  await page.goto("/en/this-route-does-not-exist");

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
  expect(sitemap).toContain(`<loc>${PRODUCTION_ORIGIN}/en/work/sef/</loc>`);
  expect(sitemap).toContain(`<loc>${PRODUCTION_ORIGIN}/it/work/sef/</loc>`);
  expect(sitemap).toContain(`<loc>${PRODUCTION_ORIGIN}/en/articles/</loc>`);
  expect(sitemap).toContain(`<loc>${PRODUCTION_ORIGIN}/it/thesis/</loc>`);

  const manifestResponse = await request.get("/content-manifest.json");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.projects).toHaveLength(10);
  expect(manifest.articles).toHaveLength(2);

  expect(socialPreviewResponse.ok()).toBeTruthy();
  expect(socialPreviewResponse.headers()["content-type"]).toContain("image/png");
});

test("server responses expose route-specific metadata without JavaScript", async ({ request }) => {
  const response = await request.get("/en/work/sef");
  const html = await response.text();

  expect(response.ok()).toBeTruthy();
  expect(html).toContain("<title>SEF — Matteo Vittori</title>");
  expect(html).toContain(
    `<link rel="canonical" href="${PRODUCTION_ORIGIN}/en/work/sef/" />`,
  );
  expect(html).toContain(
    `<meta property="og:image" content="${PRODUCTION_ORIGIN}/media/sef/showcase.avif" />`,
  );
  expect(html).toContain('data-prerendered-route="/en/work/sef"');
  expect(html).toContain("SEF coordinates acquisition, processing, signal extraction");
});

test("published articles expose static social metadata without JavaScript", async ({ request }) => {
  const response = await request.get("/it/articles/ai-goal-oriented-programming");
  const html = await response.text();

  expect(response.ok()).toBeTruthy();
  expect(html).toContain('<html lang="it">');
  expect(html).toContain('<meta property="og:locale" content="it_IT" />');
  expect(html).toContain(
    `<meta property="og:url" content="${PRODUCTION_ORIGIN}/it/articles/ai-goal-oriented-programming/" />`,
  );
  expect(html).toContain(
    `<meta property="og:image" content="${PRODUCTION_ORIGIN}/social-preview.png" />`,
  );
  expect(html).toContain('"@type":"Article"');
  expect(html).toContain('data-prerendered-route="/it/articles/ai-goal-oriented-programming"');
  expect(html).toContain('<time datetime="2026-07-19">2026-07-19</time>');
});

test("localized documents expose reciprocal language alternatives and preserve legacy links", async ({ request }) => {
  const italianResponse = await request.get("/it/work/sef");
  const legacyResponse = await request.get("/work/sef", { maxRedirects: 0 });
  const italianHtml = await italianResponse.text();

  expect(italianResponse.ok()).toBeTruthy();
  expect(italianHtml).toContain(
    `<link rel="alternate" hreflang="en" href="${PRODUCTION_ORIGIN}/en/work/sef/" />`,
  );
  expect(italianHtml).toContain(
    `<link rel="alternate" hreflang="it" href="${PRODUCTION_ORIGIN}/it/work/sef/" />`,
  );
  expect(italianHtml).toContain(
    `<link rel="alternate" hreflang="x-default" href="${PRODUCTION_ORIGIN}/en/work/sef/" />`,
  );
  expect(legacyResponse.status()).toBe(301);
  expect(legacyResponse.headers().location).toBe("/en/work/sef");
});

test("the language control keeps visitors on the equivalent localized page", async ({ page }) => {
  await page.goto("/en/work/sef");

  await page.getByRole("button", { name: "Change language" }).evaluate((button) => button.click());

  await expect(page).toHaveURL(/\/it\/work\/sef$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "it");
  await expect(page.getByRole("heading", { level: 2, name: "Il problema" })).toBeVisible();
});
