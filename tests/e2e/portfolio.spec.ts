import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

test("desktop homepage communicates the portfolio and exposes the flowing project menu", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Hi, I’m Matteo" })).toBeVisible();
  const decryptedName = page.locator(".home-hero__decrypted-name");
  await expect(decryptedName).toBeVisible();
  await expect(decryptedName).toHaveAttribute("data-animating", "false");
  const decryptedNameBounds = await decryptedName.boundingBox();
  await decryptedName.hover();
  await expect(decryptedName).toHaveAttribute("data-animating", "true");
  await page.waitForTimeout(300);
  const encryptedNameBounds = await decryptedName.boundingBox();
  expect(decryptedNameBounds).not.toBeNull();
  expect(encryptedNameBounds).not.toBeNull();
  if (decryptedNameBounds && encryptedNameBounds) {
    expect(Math.abs(decryptedNameBounds.x - encryptedNameBounds.x)).toBeLessThan(1);
    expect(Math.abs(decryptedNameBounds.width - encryptedNameBounds.width)).toBeLessThan(1);
  }
  await page.locator(".home-hero__actions").hover();
  await expect(decryptedName).toHaveAttribute("data-animating", "false");
  const clickSparkCanvas = page.getByTestId("click-spark-canvas");
  await expect(clickSparkCanvas).toBeVisible();
  await page.mouse.click(100, 200);
  await page.waitForTimeout(80);
  await page.screenshot({ path: "test-results/screenshots/click-spark-active.png" });

  const brandMark = page.locator(".site-header__inner .site-brand__mark");
  await expect(brandMark).toHaveAttribute("src", "/global/matteo-vittori-mark-reverse.svg");
  await expect.poll(() => brandMark.evaluate(
    (image) => (image as HTMLImageElement).naturalWidth,
  )).toBeGreaterThan(0);
  const siteHeader = page.locator(".site-header");
  const siteFrame = page.locator(".site-frame__viewport");
  const bottomBlur = page.locator(".site-bottom-blur");
  await expect(siteHeader).toHaveAttribute("data-visible", "false");
  await expect(siteHeader).toHaveAttribute("data-merged", "true");
  await expect(siteFrame).toHaveCSS("position", "fixed");
  const headerCorners = siteHeader.locator(".site-frame__corner--position-absolute");
  await expect(headerCorners).toHaveCount(2);
  await expect(page.locator(".site-frame__corner--bottom")).toHaveCount(2);
  await expect(page.locator(".site-footer__merge-corner")).toHaveCount(2);
  const headerCornerBounds = await headerCorners.evaluateAll((elements) =>
    elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      return { bottom: bounds.bottom, left: bounds.left, right: bounds.right };
    }),
  );
  expect(headerCornerBounds.every(({ bottom }) => bottom < 160)).toBeTruthy();
  expect(headerCornerBounds.every(({ left }) => left >= 0)).toBeTruthy();
  expect(headerCornerBounds.every(({ right }) => right <= 1600)).toBeTruthy();
  const bottomFrameCornerLayer = await page.locator(".site-frame__corner--bottom").first().evaluate(
    (element) => Number.parseInt(getComputedStyle(element).zIndex, 10),
  );
  const blurLayer = await bottomBlur.evaluate(
    (element) => Number.parseInt(getComputedStyle(element).zIndex, 10),
  );
  const headerLayer = await siteHeader.evaluate(
    (element) => Number.parseInt(getComputedStyle(element).zIndex, 10),
  );
  expect(bottomFrameCornerLayer).toBeGreaterThan(blurLayer);
  expect(headerLayer).toBeGreaterThan(blurLayer);
  await expect(bottomBlur).toHaveAttribute("data-visible", "false");
  await expect.poll(() => siteHeader.evaluate((element) => {
    const translateY = new DOMMatrix(getComputedStyle(element).transform).m42;
    return translateY + element.getBoundingClientRect().height;
  })).toBeLessThan(-5);

  await page.mouse.wheel(0, 220);
  await expect(siteHeader).toHaveAttribute("data-visible", "false");
  await expect(siteHeader).toHaveAttribute("data-merged", "true");
  await expect(bottomBlur).toHaveAttribute("data-visible", "true");
  await expect.poll(() => bottomBlur.evaluate((element) => Number.parseFloat(
    getComputedStyle(element).opacity,
  ))).toBeGreaterThan(0.7);

  await page.mouse.wheel(0, -40);
  await expect(siteHeader).toHaveAttribute("data-visible", "true");
  await expect.poll(() => siteHeader.evaluate((element) => Math.abs(
    new DOMMatrix(getComputedStyle(element).transform).m42,
  ))).toBeLessThan(1);
  await page.screenshot({ path: "test-results/screenshots/navbar-scrolled.png" });

  await page.keyboard.press("End");
  await expect(siteHeader).toHaveAttribute("data-visible", "false");
  await expect(bottomBlur).toHaveAttribute("data-visible", "false");
  await expect.poll(() => bottomBlur.evaluate((element) => Number.parseFloat(
    getComputedStyle(element).opacity,
  ))).toBeLessThan(0.01);
  await page.screenshot({ path: "test-results/screenshots/bottom-blur-faded.png" });

  await page.mouse.wheel(0, -80);
  await expect(siteHeader).toHaveAttribute("data-visible", "true");

  const navigationSurface = page.locator(".site-header__inner");
  await expect(navigationSurface).toBeVisible();
  const navigationStyle = await navigationSurface.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backdropFilter: style.backdropFilter,
      borderBottomLeftRadius: Number.parseFloat(style.borderBottomLeftRadius),
      paddingLeft: Number.parseFloat(style.paddingLeft),
    };
  });
  expect(navigationStyle.backdropFilter).toBe("none");
  expect(navigationStyle.borderBottomLeftRadius).toBeGreaterThan(0);
  expect(navigationStyle.paddingLeft).toBeGreaterThanOrEqual(16);
  await expect(page.locator(".desktop-navigation svg[data-icon='arrow-up-right-from-square']")).toBeVisible();

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(siteHeader).toHaveAttribute("data-visible", "false");
  await expect(siteHeader).toHaveAttribute("data-merged", "true");
  await expect(bottomBlur).toHaveAttribute("data-visible", "false");
  await expect(page.locator(".home-hero")).not.toContainText("Architecture · CV · Web");
  await expect(page.locator(".home-hero")).not.toContainText("Video");
  await expect(page.locator(".home-hero")).not.toContainText("Signals");
  await expect(page.locator(".home-hero")).not.toContainText("Systems");
  const titleColors = await page.locator(".home-hero h1").evaluate((heading) => ({
    introduction: getComputedStyle(heading.querySelector("span")!).color,
    name: getComputedStyle(heading.querySelector("em")!).color,
  }));
  expect(titleColors.introduction).not.toBe(titleColors.name);
  await expect(page.getByTestId("magnetic-avatar")).toBeVisible();
  await expect(page.getByAltText("Illustrated portrait of Matteo Vittori")).toHaveJSProperty("complete", true);
  await expect.poll(() => page.getByAltText("Illustrated portrait of Matteo Vittori").evaluate(
    (image) => (image as HTMLImageElement).naturalWidth,
  )).toBeGreaterThan(0);
  await expect(page.locator(".home-hero .signal-field__mesh circle")).toHaveCount(8440);

  const composition = await page.evaluate(() => {
    const visual = document.querySelector<HTMLElement>(".home-hero__visual")!;
    const field = document.querySelector<HTMLElement>(".home-hero__visual > .signal-field")!;
    const copy = document.querySelector<HTMLElement>(".home-hero__copy")!;
    const avatar = document.querySelector<HTMLElement>(".magnetic-avatar")!;
    const visualBounds = visual.getBoundingClientRect();
    const fieldBounds = field.getBoundingClientRect();
    const avatarBounds = avatar.getBoundingClientRect();

    return {
      avatarCenterX: avatarBounds.left + avatarBounds.width / 2,
      avatarCenterY: avatarBounds.top + avatarBounds.height / 2,
      avatarWidth: avatarBounds.width,
      copyLayer: Number.parseInt(getComputedStyle(copy).zIndex, 10),
      fieldCenterX: fieldBounds.left + fieldBounds.width / 2,
      fieldCenterY: fieldBounds.top + fieldBounds.height / 2,
      fieldLayer: Number.parseInt(getComputedStyle(field).zIndex, 10),
      fieldWidth: fieldBounds.width,
      avatarLayer: Number.parseInt(getComputedStyle(avatar).zIndex, 10),
      visualCenterX: visualBounds.left + visualBounds.width / 2,
      visualCenterY: visualBounds.top + visualBounds.height / 2,
    };
  });

  expect(Math.abs(composition.avatarCenterX - composition.visualCenterX)).toBeLessThan(1);
  expect(Math.abs(composition.avatarCenterY - composition.visualCenterY)).toBeLessThan(1);
  expect(Math.abs(composition.fieldCenterX - composition.visualCenterX)).toBeLessThan(1);
  expect(Math.abs(composition.fieldCenterY - composition.visualCenterY)).toBeLessThan(1);
  expect(composition.avatarWidth).toBeGreaterThan(450);
  expect(composition.fieldWidth).toBeGreaterThan(900);
  expect(composition.fieldLayer).toBeLessThan(composition.copyLayer);
  expect(composition.copyLayer).toBeLessThan(composition.avatarLayer);

  const largestPointRadius = await page.locator(".signal-field__mesh circle").evaluateAll(
    (points) => Math.max(...points.map((point) => Number.parseFloat(point.getAttribute("r") ?? "0"))),
  );
  expect(largestPointRadius).toBeGreaterThan(1.85);

  const hero = page.locator(".home-hero");
  const avatarBody = page.getByTestId("magnetic-avatar-body");
  const signalField = page.getByTestId("magnetic-signal-field").first();
  const heroBounds = await hero.boundingBox();
  expect(heroBounds).not.toBeNull();

  if (heroBounds) {
    await page.mouse.move(
      heroBounds.x + heroBounds.width - 10,
      heroBounds.y + heroBounds.height * 0.42,
    );
    await expect.poll(async () => avatarBody.evaluate((element) => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return Math.abs(matrix.m41) + Math.abs(matrix.m42);
    })).toBeGreaterThan(2);
    await expect.poll(async () => signalField.evaluate((element) => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return Math.abs(matrix.m41) + Math.abs(matrix.m42);
    })).toBeGreaterThan(1);
    await hero.screenshot({ path: "test-results/screenshots/home-avatar-magnetic.png" });

    await page.locator(".home-hero").dispatchEvent("pointerleave");
    await page.locator(".home-hero__visual").dispatchEvent("pointerleave");
    await expect.poll(async () => avatarBody.evaluate((element) => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return Math.abs(matrix.m41) + Math.abs(matrix.m42);
    }), { timeout: 15_000 }).toBeLessThan(0.5);
    await expect.poll(async () => signalField.evaluate((element) => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return Math.abs(matrix.m41) + Math.abs(matrix.m42);
    }), { timeout: 15_000 }).toBeLessThan(0.5);
  }

  await page.screenshot({ path: "test-results/screenshots/home-hero-desktop.png" });

  const selectedProjects = page.getByRole("navigation", { name: "Selected projects" });
  const projectRows = selectedProjects.locator(".flowing-menu__item");
  await expect(projectRows).toHaveCount(5);
  const projectFontFamilies = await projectRows.locator(".flowing-menu__text").evaluateAll(
    (elements) => elements.map((element) => getComputedStyle(element).fontFamily),
  );
  expect(new Set(projectFontFamilies).size).toBe(5);
  await projectRows.nth(1).scrollIntoViewIfNeeded();
  await projectRows.nth(1).hover();

  const activeMarquee = projectRows.nth(1).locator(".flowing-menu__marquee");
  await expect.poll(() => activeMarquee.evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return Math.abs(matrix.m42);
  })).toBeLessThan(1);

  const marqueeInner = activeMarquee.locator(".flowing-menu__marquee-inner");
  const initialMarqueeX = await marqueeInner.evaluate((element) => (
    new DOMMatrix(getComputedStyle(element).transform).m41
  ));
  await page.waitForTimeout(300);
  const advancedMarqueeX = await marqueeInner.evaluate((element) => (
    new DOMMatrix(getComputedStyle(element).transform).m41
  ));
  expect(Math.abs(advancedMarqueeX - initialMarqueeX)).toBeGreaterThan(2);

  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/screenshots/flowing-menu-hover.png" });
});

test("SEF interactions expose pipeline and access-point state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/work/sef");

  await expect(page.getByRole("heading", { level: 1, name: "Signal Extraction Framework" })).toBeVisible();
  const signalExtractor = page.getByRole("button", { name: "03 Signal extractor" });
  await signalExtractor.click();
  await expect(signalExtractor).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Turns frames into measures, trajectories, motion, or temporal series.")).toBeVisible();

  await page.getByRole("tab", { name: "CLI" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("sef validate pipeline.yaml");

  await page.locator(".pipeline-explorer").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/screenshots/sef-pipeline.png" });
  const highlightedMetric = page.locator(".metric-grid .decrypted-text");
  await expect(highlightedMetric).toHaveCount(1);
  await highlightedMetric.scrollIntoViewIfNeeded();
  await expect(highlightedMetric).toHaveAttribute("data-animating", "false");
  await expectNoHorizontalOverflow(page);
});

test("localized project content follows the selected language", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("portfolio-language", "it");
  });
  await page.goto("/work/sef");

  await expect(page.getByRole("heading", { level: 2, name: "Il problema" })).toBeVisible();
  await expect(page.getByText("Tesi di laurea · A.A. 2025/26")).toBeVisible();
  await expect(page.getByText("Overhead in streaming")).toBeVisible();
});

test("articles expose a deliberate empty state before the first publication", async ({ page }) => {
  await page.goto("/articles");

  await expect(page.getByRole("heading", { level: 1, name: "Ideas made useful through detail." })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "The first article is being prepared." })).toBeVisible();
});

test("mobile layout, navigation, and thesis fallback remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const mobileHeader = page.locator(".site-header");
  await expect(mobileHeader).toHaveAttribute("data-visible", "false");
  await expect(mobileHeader).toHaveAttribute("data-merged", "true");
  await page.screenshot({ path: "test-results/screenshots/home-mobile.png" });

  await page.mouse.wheel(0, 140);
  await expect(mobileHeader).toHaveAttribute("data-visible", "false");
  await page.mouse.wheel(0, -50);
  await expect(mobileHeader).toHaveAttribute("data-visible", "true");
  await expect.poll(() => mobileHeader.evaluate((element) => Math.abs(
    new DOMMatrix(getComputedStyle(element).transform).m42,
  ))).toBeLessThan(1);
  await expect(mobileHeader.getByRole("link", { name: "Matteo Vittori, home" })).toBeVisible();
  await expect(page.locator(".mobile-menu-button svg[data-icon='bars']")).toBeVisible();
  await expect(page.getByTestId("magnetic-avatar")).toBeVisible();
  await page.screenshot({ path: "test-results/screenshots/home-avatar-mobile.png" });

  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.locator(".mobile-navigation")).toHaveClass(/is-open/);
  const mobileNavigationBounds = await page.locator(".mobile-navigation").boundingBox();
  expect(mobileNavigationBounds).not.toBeNull();
  if (mobileNavigationBounds) {
    expect(mobileNavigationBounds.height).toBeGreaterThanOrEqual(843.5);
  }
  await expect(page.locator("body")).toHaveClass(/menu-open/);
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/screenshots/mobile-menu.png" });
  await page.keyboard.press("Escape");
  await expect(page.locator(".mobile-navigation")).not.toHaveClass(/is-open/);
  await expect(page.locator("body")).not.toHaveClass(/menu-open/);

  await page.mouse.wheel(0, 100);
  await expect(mobileHeader).toHaveAttribute("data-visible", "false");
  await page.mouse.wheel(0, -50);
  await expect(mobileHeader).toHaveAttribute("data-visible", "true");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.locator(".mobile-navigation").getByRole("button", { name: "Close" }).click();

  await page.goto("/thesis");
  await expect(page.locator(".pdf-reader__desktop")).toBeHidden();
  await expect(page.locator(".pdf-reader__mobile")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open all 89 pages" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/screenshots/thesis-mobile.png", fullPage: true });
});

test("tablet layouts preserve the editorial grid without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/screenshots/home-tablet.png" });

  await page.goto("/work/sef");
  await expect(page.getByRole("heading", { level: 1, name: "Signal Extraction Framework" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("case-study visuals remain inside the reading column while facts stay sticky", async ({ page }) => {
  const routes = [
    "/work/sef",
    "/work/unistays",
    "/work/rewild",
    "/work/hackathon-management-system",
  ];

  for (const width of [1440, 1024]) {
    await page.setViewportSize({ width, height: 900 });

    for (const route of routes) {
      await page.goto(route);
      const readingLayout = page.locator(".project-reading-layout");
      const facts = page.locator(".project-facts");
      const body = page.locator(".project-body");
      const visual = body.locator([
        ".project-figure--wide",
        ".project-gallery",
        ".pipeline-explorer",
        ".access-points",
        ".benchmark-panel",
        ".mechanic-sequence",
        ".character-field",
        ".architecture-layers",
      ].join(", ")).first();

      await visual.scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 120);

      const bounds = await Promise.all([
        readingLayout.boundingBox(),
        facts.boundingBox(),
        body.boundingBox(),
        visual.boundingBox(),
      ]);
      const [layoutBounds, factsBounds, bodyBounds, visualBounds] = bounds;

      expect(layoutBounds).not.toBeNull();
      expect(factsBounds).not.toBeNull();
      expect(bodyBounds).not.toBeNull();
      expect(visualBounds).not.toBeNull();

      if (layoutBounds && factsBounds && bodyBounds && visualBounds) {
        expect(factsBounds.x + factsBounds.width).toBeLessThan(bodyBounds.x);
        expect(visualBounds.x).toBeGreaterThanOrEqual(bodyBounds.x - 1);
        expect(visualBounds.x + visualBounds.width).toBeLessThanOrEqual(
          layoutBounds.x + layoutBounds.width + 1,
        );
      }

      await expect(facts).toHaveCSS("position", "sticky");
      await expectNoHorizontalOverflow(page);

      if (route === "/work/sef") {
        await page.mouse.wheel(0, -40);
        await expect.poll(() => page.locator(".site-header").evaluate((element) => Math.abs(
          new DOMMatrix(getComputedStyle(element).transform).m42,
        ))).toBeLessThan(1);
        await page.screenshot({
          path: `test-results/screenshots/sef-reading-layout-${width}.png`,
        });
      }
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/work/sef");
  const mobileFacts = page.locator(".project-facts");
  const mobileBody = page.locator(".project-body");
  await mobileBody.locator(".pipeline-explorer").scrollIntoViewIfNeeded();
  await expect(mobileFacts).toHaveCSS("position", "static");

  const [mobileFactsBounds, mobileBodyBounds] = await Promise.all([
    mobileFacts.boundingBox(),
    mobileBody.boundingBox(),
  ]);
  expect(mobileFactsBounds).not.toBeNull();
  expect(mobileBodyBounds).not.toBeNull();
  if (mobileFactsBounds && mobileBodyBounds) {
    expect(mobileFactsBounds.y + mobileFactsBounds.height).toBeLessThan(mobileBodyBounds.y);
  }

  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/screenshots/sef-reading-layout-mobile-final.png" });
});

test("remaining route mastheads are visually stable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const routes = [
    ["/work", "Systems are best understood through their decisions.", "work-index"],
    ["/work/unistays", "UniStays", "project-unistays"],
    ["/work/rewild", "RE:WILD", "project-rewild"],
    ["/work/hackathon-management-system", "HackHub", "project-hackathon"],
    ["/work/dormant-access-control-unit", "Dormant Access Control Unit", "project-access-control"],
    ["/thesis", "Design and development of a modular framework for video-stream analysis in Python.", "thesis-desktop"],
    ["/about", "Building from the core outward.", "about"],
  ] as const;

  for (const [path, heading, screenshotName] of routes) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `test-results/screenshots/${screenshotName}.png` });
  }
});

test("minimum viewport and reduced motion are supported", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/work/hackathon-management-system");

  await expect(page.getByRole("heading", { level: 1, name: "HackHub" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/");
  await expect(page.getByTestId("click-spark-canvas")).toBeHidden();
  await expect(page.locator(".home-hero__decrypted-name")).toHaveAttribute("data-animating", "false");
  await expect(page.locator(".flowing-menu__marquee").first()).toBeHidden();
  const reducedMotionAvatar = page.getByTestId("magnetic-avatar-body");
  const reducedMotionSignalField = page.getByTestId("magnetic-signal-field").first();
  const reducedMotionHeroBounds = await page.locator(".home-hero").boundingBox();
  if (reducedMotionHeroBounds) {
    await page.mouse.move(
      reducedMotionHeroBounds.x + reducedMotionHeroBounds.width - 5,
      reducedMotionHeroBounds.y + reducedMotionHeroBounds.height / 2,
    );
  }

  await page.waitForTimeout(100);
  const avatarDisplacement = await reducedMotionAvatar.evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return Math.abs(matrix.m41) + Math.abs(matrix.m42);
  });
  expect(avatarDisplacement).toBeLessThan(0.1);
  const signalFieldDisplacement = await reducedMotionSignalField.evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return Math.abs(matrix.m41) + Math.abs(matrix.m42);
  });
  expect(signalFieldDisplacement).toBeLessThan(0.1);
  await page.screenshot({ path: "test-results/screenshots/home-320-reduced-motion.png" });

  const animationDuration = await page.locator(".signal-field__mesh").evaluate(
    (element) => getComputedStyle(element).animationDuration,
  );
  expect(Number.parseFloat(animationDuration)).toBeLessThanOrEqual(0.001);
});
