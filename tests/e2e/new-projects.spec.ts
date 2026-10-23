import { expect, test } from "@playwright/test";

const projects = [
  { slug: "boccone", title: "boccone." },
  { slug: "spesino", title: "Spesino" },
  { slug: "nodale", title: "nodale." },
  { slug: "spazio", title: "Spazio" },
] as const;

// Exercise both discovery and the independently lazy-loaded translations.
for (const locale of ["it", "en"] as const) {
  test(`${locale}: new projects expose complete case studies and working showcase media`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/work`);
    for (const { slug } of projects) {
      await expect(page.locator(`a[href="/${locale}/work/${slug}"]`).first()).toBeVisible();
    }

    for (const { slug, title } of projects) {
      await page.goto(`/${locale}/work/${slug}`);
      await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
      await expect(page.locator("h2").first()).toBeVisible();
      const hero = page.locator(`img[src="/media/${slug}/showcase.webp"]`).first();
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
      // Lazy figures must load when reached, including the TV theme gallery.
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
