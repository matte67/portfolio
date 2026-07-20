import { readdir, readFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";

import matter from "gray-matter";

export const supportedLocales = ["en", "it"];
const publicationStatuses = new Set(["draft", "published", "archived"]);
const projectStatuses = new Set(["Released", "Research", "Prototype", "Concept", "Academic"]);
const projectLinkKinds = new Set(["code", "demo", "document", "external"]);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function assertText(value, field, sourcePath) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${sourcePath}: "${field}" must be a non-empty string.`);
  }
}

function validateCommon(data, locale, sourcePath) {
  for (const field of ["locale", "translationKey", "publicationStatus", "slug", "title"]) {
    assertText(data[field], field, sourcePath);
  }

  if (data.locale !== locale) {
    throw new Error(`${sourcePath}: locale must match its parent directory (${locale}).`);
  }
  if (!slugPattern.test(data.slug) || !slugPattern.test(data.translationKey)) {
    throw new Error(`${sourcePath}: slug and translationKey must use lowercase kebab-case.`);
  }
  if (!publicationStatuses.has(data.publicationStatus)) {
    throw new Error(`${sourcePath}: unsupported publicationStatus "${data.publicationStatus}".`);
  }
  if (basename(sourcePath, ".mdx") !== data.slug) {
    throw new Error(`${sourcePath}: filename must match slug "${data.slug}".`);
  }

  for (const field of ["publishedAt", "updatedAt"]) {
    const value = data[field];
    if (value !== undefined && (typeof value !== "string" || !datePattern.test(value))) {
      throw new Error(`${sourcePath}: ${field} must use YYYY-MM-DD.`);
    }
  }

  if (data.publicationStatus === "published" && !data.publishedAt) {
    throw new Error(`${sourcePath}: published content requires publishedAt.`);
  }

  assertText(data.seo?.title, "seo.title", sourcePath);
  assertText(data.seo?.description, "seo.description", sourcePath);
}

function validateProject(data, sourcePath) {
  for (const field of ["index", "shortTitle", "subtitle", "summary", "year", "status", "role", "team", "duration", "chip"]) {
    assertText(data[field], field, sourcePath);
  }
  if (!projectStatuses.has(data.status)) {
    throw new Error(`${sourcePath}: unsupported project status "${data.status}".`);
  }
  assertText(data.hero?.alt, "hero.alt", sourcePath);
  if (!Number.isFinite(data.order)) {
    throw new Error(`${sourcePath}: order must be numeric.`);
  }
  if (!Array.isArray(data.technologies) || data.technologies.length === 0) {
    throw new Error(`${sourcePath}: at least one technology is required.`);
  }
  if (!Array.isArray(data.disciplines) || data.disciplines.length === 0) {
    throw new Error(`${sourcePath}: at least one discipline is required.`);
  }
  if (!Array.isArray(data.metrics) || data.metrics.length === 0) {
    throw new Error(`${sourcePath}: at least one contextual metric is required.`);
  }
  for (const [index, link] of (data.links ?? []).entries()) {
    assertText(link.label, `links[${index}].label`, sourcePath);
    assertText(link.kind, `links[${index}].kind`, sourcePath);
    if (!projectLinkKinds.has(link.kind)) {
      throw new Error(`${sourcePath}: unsupported link kind "${link.kind}".`);
    }
  }
}

function validateArticle(data, sourcePath) {
  assertText(data.summary, "summary", sourcePath);
  if (!Array.isArray(data.categories) || !Array.isArray(data.tags)) {
    throw new Error(`${sourcePath}: categories and tags must be arrays.`);
  }
  if (data.hero) assertText(data.hero.alt, "hero.alt", sourcePath);
}

function isPublic(data, now) {
  if (data.publicationStatus !== "published" || !data.publishedAt) return false;
  return new Date(`${data.publishedAt}T00:00:00.000Z`) <= now;
}

async function readCollection(projectRoot, type, now) {
  const records = [];

  for (const locale of supportedLocales) {
    const directory = join(projectRoot, "content", type, locale);
    let entries = [];
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue;
      const absolutePath = join(directory, entry.name);
      const sourcePath = relative(projectRoot, absolutePath);
      const { data } = matter(await readFile(absolutePath, "utf8"));

      validateCommon(data, locale, sourcePath);
      if (type === "projects") validateProject(data, sourcePath);
      else validateArticle(data, sourcePath);

      records.push({
        ...data,
        sourcePath,
        isPublic: isPublic(data, now),
      });
    }
  }

  return records;
}

function assertUnique(records, type) {
  const identities = new Set();
  const orders = new Set();

  for (const record of records) {
    for (const identity of new Set([record.slug, record.translationKey])) {
      const key = `${record.locale}:${identity}`;
      if (identities.has(key)) throw new Error(`Duplicate ${type} identity "${key}".`);
      identities.add(key);
    }

    if (type === "project") {
      const orderKey = `${record.locale}:${record.order}`;
      if (orders.has(orderKey)) throw new Error(`Duplicate project order "${orderKey}".`);
      orders.add(orderKey);
    }
  }
}

/** Reads and validates the complete file-backed editorial catalogue. */
export async function readContentCatalog(projectRoot, now = new Date()) {
  const projects = await readCollection(projectRoot, "projects", now);
  const articles = await readCollection(projectRoot, "articles", now);
  assertUnique(projects, "project");
  assertUnique(articles, "article");

  return {
    projects: projects.sort((left, right) => left.order - right.order),
    articles: articles.sort((left, right) =>
      (right.publishedAt ?? "").localeCompare(left.publishedAt ?? ""),
    ),
  };
}
