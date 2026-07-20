import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { readContentCatalog } from "../../scripts/content-catalog.mjs";

function projectDocument(overrides = {}) {
  const data = {
    locale: "en",
    translationKey: "example-project",
    publicationStatus: "published",
    publishedAt: "2026-01-10",
    slug: "example-project",
    index: "01",
    title: "Example project",
    shortTitle: "Example",
    subtitle: "A complete example project.",
    summary: "A valid summary used by the catalogue tests.",
    year: "2026",
    status: "Prototype",
    disciplines: ["Software architecture"],
    role: "Engineering",
    team: "Independent",
    duration: "One month",
    technologies: ["TypeScript"],
    chip: "/media/example.avif",
    hero: { alt: "Example project interface" },
    metrics: [{ value: "1", label: "Example", context: "Test context" }],
    links: [],
    featured: true,
    order: 1,
    seo: { title: "Example", description: "A valid search description." },
    ...overrides,
  };

  return `---\n${Object.entries(data).filter(([, value]) => value !== undefined).map(([key, value]) => {
    if (typeof value === "string") return `${key}: ${JSON.stringify(value)}`;
    return `${key}: ${JSON.stringify(value)}`;
  }).join("\n")}\n---\n\n## Body\n`;
}

async function withFixture(run) {
  const root = await mkdtemp(join(tmpdir(), "portfolio-content-"));
  await Promise.all([
    mkdir(join(root, "content/projects/en"), { recursive: true }),
    mkdir(join(root, "content/projects/it"), { recursive: true }),
    mkdir(join(root, "content/articles/en"), { recursive: true }),
    mkdir(join(root, "content/articles/it"), { recursive: true }),
  ]);

  try {
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("catalogue distinguishes public and draft documents", async () => {
  await withFixture(async (root) => {
    await Promise.all([
      writeFile(
        join(root, "content/projects/en/example-project.mdx"),
        projectDocument(),
      ),
      writeFile(
        join(root, "content/projects/en/draft-project.mdx"),
        projectDocument({
          translationKey: "draft-project",
          publicationStatus: "draft",
          publishedAt: undefined,
          slug: "draft-project",
          title: "Draft project",
          order: 2,
        }),
      ),
    ]);

    const catalogue = await readContentCatalog(root, new Date("2026-07-20T00:00:00Z"));
    assert.equal(catalogue.projects.length, 2);
    assert.equal(catalogue.projects.find(({ slug }) => slug === "example-project")?.isPublic, true);
    assert.equal(catalogue.projects.find(({ slug }) => slug === "draft-project")?.isPublic, false);
  });
});

test("catalogue rejects duplicate locale identities", async () => {
  await withFixture(async (root) => {
    await Promise.all([
      writeFile(join(root, "content/projects/en/example-project.mdx"), projectDocument()),
      writeFile(
        join(root, "content/projects/en/second-project.mdx"),
        projectDocument({ slug: "second-project", order: 2 }),
      ),
    ]);

    await assert.rejects(
      () => readContentCatalog(root),
      /Duplicate project identity "en:example-project"/,
    );
  });
});

test("catalogue requires filenames to match public slugs", async () => {
  await withFixture(async (root) => {
    await writeFile(
      join(root, "content/projects/en/wrong-file.mdx"),
      projectDocument(),
    );

    await assert.rejects(
      () => readContentCatalog(root),
      /filename must match slug "example-project"/,
    );
  });
});
