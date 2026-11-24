import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readContentCatalog, supportedLocales } from "../../scripts/content-catalog.mjs";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const defaultTimeline = fileURLToPath(new URL("output/biographical-route/scene_timeline.json", import.meta.url));
const timelinePath = process.argv[2] ? resolve(process.argv[2]) : defaultTimeline;
const timeline = JSON.parse(await readFile(timelinePath, "utf8"));
const { projects } = await readContentCatalog(projectRoot);

/** Resolve the live route and copy from the same MDX catalogue used by the site. */
function localizedProject(key, locale) {
  const entry = projects.find((project) => project.translationKey === key && project.locale === locale);
  if (!entry) throw new Error(`No ${locale} portfolio project exists for ${key}.`);
  return {
    title: entry.shortTitle,
    publicationStatus: entry.publicationStatus,
    href: entry.isPublic ? `/${locale}/work/${entry.slug}/` : null,
    ...(entry.isPublic ? { summary: entry.summary } : {}),
  };
}

const keys = timeline.stops.flatMap((stop) => stop.projectKeys);
const assigned = new Set(keys);
if (assigned.size !== keys.length) throw new Error("Each project must appear on one island only.");
for (const project of projects) {
  if (project.publicationStatus !== "archived" && !assigned.has(project.translationKey)) {
    throw new Error(`Project has no assigned island: ${project.translationKey}.`);
  }
}

const stops = timeline.stops.map(({ projectKeys, ...stop }) => ({
  ...stop,
  projects: projectKeys.map((key) => ({
    translationKey: key,
    locales: Object.fromEntries(supportedLocales.map((locale) => [locale, localizedProject(key, locale)])),
  })),
}));
const outputPath = resolve(dirname(timelinePath), "scroll_timeline.json");
await writeFile(outputPath, `${JSON.stringify({ ...timeline, stops }, null, 2)}\n`);
console.log(`Exported ${stops.length} scroll stops for ${assigned.size} projects to ${outputPath}.`);
