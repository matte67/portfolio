import { expect, test } from "@playwright/test";

const projects = [
  { slug: "boccone", title: "boccone." },
  { slug: "spesino", title: "Spesino" },
] as const;

// Exercise both discovery and the independently lazy-loaded translations.
for (const locale of ["it", "en"] as const) {
  test(`${locale}: new projects expose complete case studies and working showcase media`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/work`);
    for (const { slug } of projects) {
      await expect(page.locator(`a[href="/${locale}/work/${slug}"]`).first()).toBeVisible();
    }

    for (const slug of ["nodale", "spazio"]) {
      await expect(page.locator(`a[href="/${locale}/work/${slug}"]`)).toHaveCount(0);
    }
    const chip = page.locator('img[src="/media/boccone/chip.avif"]').first();
    await chip.scrollIntoViewIfNeeded();
    await expect.poll(() => chip.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await page.screenshot({ path: `test-results/screenshots/${locale}-focused-work-index.png`, animations: "disabled" });

    for (const { slug, title } of projects) {
      await page.goto(`/${locale}/work/${slug}`);
      await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
      await expect(page.locator("h2").first()).toBeVisible();
      const hero = page.locator(`.editorial-hero img[src^="/media/${slug}/"]`).first();
      await expect(hero).toBeVisible();
      await expect.poll(() => hero.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await hero.evaluate((element) => (element as HTMLImageElement).decode());
      await page.screenshot({ path: `test-results/screenshots/${locale}-${slug}-desktop.png`, animations: "disabled" });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: `test-results/screenshots/${locale}-${slug}-mobile.png`, animations: "disabled" });
      const dimensions = await page.evaluate(() => ({
        actual: document.documentElement.scrollWidth,
        available: document.documentElement.clientWidth,
      }));
      expect(dimensions.actual).toBeLessThanOrEqual(dimensions.available);
      // Each use-case figure must load when reached, including the editor and handoff.
      for (const image of await page.locator("main img").all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      }
      await page.setViewportSize({ width: 1440, height: 900 });
    }
  });
}

test("new case studies remain navigable with reduced motion at minimum width", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 740 });
  for (const { slug, title } of projects) {
    await page.goto(`/it/work/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

// Drafts must disappear from static publication as well as the client catalogue.
test("only the two focused case studies remain publicly indexed", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  for (const locale of ["it", "en"]) {
    for (const slug of ["nodale", "spazio"]) {
      expect(xml).not.toContain(`/${locale}/work/${slug}`);
      expect((await request.get(`/${locale}/work/${slug}`)).status()).toBe(404);
    }
  }
});

// A dense desktop screenshot must not be the only view on a phone.
test("Spesino figures select readable mobile screenshots and restore desktop sources", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/it/work/spesino");
  for (const feature of ["offers", "checklist", "watches"]) {
    const image = page.locator(`img[src="/media/spesino/${feature}.webp"]`);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).currentSrc)).toContain(`${feature}-mobile.webp`);
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const checklist = page.locator('img[src="/media/spesino/checklist.webp"]');
  await expect.poll(() => checklist.evaluate((element) => (element as HTMLImageElement).currentSrc)).toContain("/checklist.webp");
});
