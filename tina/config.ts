import { defineConfig, type Collection, type TinaField } from "tinacms";

type Locale = "en" | "it";

const branch =
  process.env.TINA_PUBLIC_BRANCH ?? process.env.HEAD ?? "main";

const publicationFields: TinaField[] = [
  {
    type: "string",
    name: "translationKey",
    label: "Translation key",
    description: "Lowercase kebab-case identifier shared by every translation.",
    required: true,
  },
  {
    type: "string",
    name: "publicationStatus",
    label: "Publication status",
    options: [
      { label: "Draft", value: "draft" },
      { label: "Published", value: "published" },
      { label: "Archived", value: "archived" },
    ],
    required: true,
  },
  {
    type: "string",
    name: "publishedAt",
    label: "Published on",
    description: "Use YYYY-MM-DD. Required for published content.",
  },
  {
    type: "string",
    name: "updatedAt",
    label: "Updated on",
    description: "Use YYYY-MM-DD when the public content changes materially.",
  },
];

const seoField: TinaField = {
  type: "object",
  name: "seo",
  label: "Search and social metadata",
  required: true,
  fields: [
    { type: "string", name: "title", label: "Title", required: true },
    {
      type: "string",
      name: "description",
      label: "Description",
      description: "Aim for a concise description suitable for search results.",
      required: true,
      ui: { component: "textarea" },
    },
    {
      type: "image",
      name: "image",
      label: "Social sharing image",
      description: "Use a JPEG or PNG image, ideally 1200 × 630 px.",
    },
    {
      type: "string",
      name: "imageAlt",
      label: "Social image alternative text",
      description: "Required when a social sharing image is provided.",
    },
  ],
};

const mdxTemplates = [
  ...[
    "AccessPoints",
    "ArchitectureLayers",
    "BenchmarkPanel",
    "CharacterField",
    "MechanicSequence",
    "PipelineExplorer",
    "UseCaseList",
  ].map((name) => ({
    name,
    label: name,
    fields: [
      {
        type: "string" as const,
        name: "editorHint",
        label: "Editor hint",
        ui: { component: "hidden" },
      },
    ],
  })),
  {
    name: "ContentNeeded",
    label: "Editorial checkpoint",
    fields: [
      { type: "string" as const, name: "label", label: "Label" },
      {
        type: "string" as const,
        name: "description",
        label: "Description",
        ui: { component: "textarea" },
      },
    ],
  },
  {
    name: "ProjectFigure",
    label: "Project figure",
    fields: [
      { type: "image" as const, name: "src", label: "Image", required: true },
      { type: "string" as const, name: "alt", label: "Alternative text", required: true },
      { type: "string" as const, name: "caption", label: "Caption" },
      { type: "boolean" as const, name: "wide", label: "Wide layout" },
    ],
  },
  {
    name: "ProjectGallery",
    label: "Project gallery",
    fields: [
      {
        type: "object" as const,
        name: "items",
        label: "Images",
        list: true,
        required: true,
        fields: [
          { type: "image" as const, name: "src", label: "Image", required: true },
          { type: "string" as const, name: "alt", label: "Alternative text", required: true },
        ],
      },
    ],
  },
];

const bodyField: TinaField = {
  type: "rich-text",
  name: "body",
  label: "Body",
  isBody: true,
  required: true,
  templates: mdxTemplates,
};

function localeField(locale: Locale): TinaField {
  return {
    type: "string",
    name: "locale",
    label: "Locale",
    options: [{ label: locale === "en" ? "English" : "Italiano", value: locale }],
    required: true,
  };
}

function projectCollection(locale: Locale): Collection {
  return {
    name: `project${locale === "en" ? "En" : "It"}`,
    label: locale === "en" ? "Projects — English" : "Progetti — Italiano",
    path: `content/projects/${locale}`,
    format: "mdx",
    frontmatterFormat: "yaml",
    defaultItem: () => ({
      locale,
      publicationStatus: "draft",
      featured: false,
    }),
    ui: {
      filename: {
        slugify: (values) => values.slug || "new-project",
      },
    },
    fields: [
      localeField(locale),
      ...publicationFields,
      { type: "string", name: "slug", label: "URL slug", required: true },
      { type: "string", name: "index", label: "Display index", required: true },
      { type: "string", name: "title", label: "Title", required: true },
      { type: "string", name: "shortTitle", label: "Short title", required: true },
      {
        type: "string",
        name: "subtitle",
        label: "Subtitle",
        required: true,
        ui: { component: "textarea" },
      },
      {
        type: "string",
        name: "summary",
        label: "Summary",
        required: true,
        ui: { component: "textarea" },
      },
      { type: "string", name: "year", label: "Year", required: true },
      {
        type: "string",
        name: "status",
        label: "Project maturity",
        options: ["Released", "Research", "Prototype", "Concept", "Academic"],
        required: true,
      },
      { type: "string", name: "disciplines", label: "Disciplines", list: true, required: true },
      { type: "string", name: "role", label: "Role", required: true },
      { type: "string", name: "team", label: "Team", required: true },
      { type: "string", name: "duration", label: "Duration", required: true },
      { type: "string", name: "technologies", label: "Technologies", list: true, required: true },
      { type: "image", name: "chip", label: "Menu image", required: true },
      {
        type: "object",
        name: "hero",
        label: "Hero image",
        required: true,
        fields: [
          { type: "image", name: "src", label: "Image" },
          { type: "string", name: "alt", label: "Alternative text", required: true },
          {
            type: "string",
            name: "position",
            label: "Image position",
            options: ["center", "top"],
          },
        ],
      },
      {
        type: "object",
        name: "metrics",
        label: "Metrics",
        list: true,
        required: true,
        fields: [
          { type: "string", name: "value", label: "Value", required: true },
          { type: "string", name: "label", label: "Label", required: true },
          {
            type: "string",
            name: "context",
            label: "Context",
            required: true,
            ui: { component: "textarea" },
          },
        ],
      },
      {
        type: "object",
        name: "links",
        label: "Links",
        list: true,
        fields: [
          { type: "string", name: "label", label: "Label", required: true },
          { type: "string", name: "href", label: "URL" },
          {
            type: "string",
            name: "kind",
            label: "Kind",
            options: ["code", "demo", "document", "external"],
            required: true,
          },
        ],
      },
      { type: "boolean", name: "featured", label: "Show on homepage", required: true },
      { type: "number", name: "order", label: "Display order", required: true },
      seoField,
      bodyField,
    ],
  };
}

function articleCollection(locale: Locale): Collection {
  return {
    name: `article${locale === "en" ? "En" : "It"}`,
    label: locale === "en" ? "Articles — English" : "Articoli — Italiano",
    path: `content/articles/${locale}`,
    format: "mdx",
    frontmatterFormat: "yaml",
    defaultItem: () => ({
      locale,
      publicationStatus: "draft",
      categories: [],
      tags: [],
    }),
    ui: {
      filename: {
        slugify: (values) => values.slug || "new-article",
      },
    },
    fields: [
      localeField(locale),
      ...publicationFields,
      { type: "string", name: "slug", label: "URL slug", required: true },
      { type: "string", name: "title", label: "Title", required: true },
      {
        type: "string",
        name: "summary",
        label: "Summary",
        required: true,
        ui: { component: "textarea" },
      },
      { type: "string", name: "categories", label: "Categories", list: true, required: true },
      { type: "string", name: "tags", label: "Tags", list: true, required: true },
      {
        type: "object",
        name: "hero",
        label: "Hero image",
        fields: [
          { type: "image", name: "src", label: "Image" },
          { type: "string", name: "alt", label: "Alternative text", required: true },
          {
            type: "string",
            name: "position",
            label: "Image position",
            options: ["center", "top"],
          },
        ],
      },
      seoField,
      bodyField,
    ],
  };
}

export default defineConfig({
  branch,
  clientId: process.env.TINA_PUBLIC_CLIENT_ID ?? "local-development",
  token: process.env.TINA_TOKEN ?? "local-development",
  build: {
    publicFolder: "public",
    outputFolder: "admin",
  },
  media: {
    tina: {
      publicFolder: "public",
      mediaRoot: "media",
    },
  },
  schema: {
    collections: [
      projectCollection("en"),
      projectCollection("it"),
      articleCollection("en"),
      articleCollection("it"),
    ],
  },
});
