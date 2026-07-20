# Content publishing workflow

Projects and articles are authored as MDX, validated before every build, and edited through TinaCMS. Git remains the source of truth: the public site never depends on TinaCloud at request time.

## Content structure

```text
content/
├── projects/
│   ├── en/
│   └── it/
└── articles/
    ├── en/
    └── it/
```

Each translation is a separate document. Matching documents share `translationKey`; `locale` must match the parent directory. The filename must match `slug` exactly.

Projects and articles are separate domain types and Tina collections. This keeps their schemas focused and prevents article-specific fields from leaking into project pages.

## Local editorial workflow

Install dependencies once:

```bash
npm install
```

Start the site together with TinaCMS:

```bash
npm run dev:cms
```

Open `http://127.0.0.1:5173/admin/index.html`. If that port is occupied, use the Vite URL printed in the terminal.

Tina writes directly to the local MDX files. Existing pages update through Vite hot reload. New files are discovered automatically; no TypeScript catalogue needs to be edited.

Use `npm run dev` when the editorial panel is not needed.

## Creating a project

1. Open the project collection for the target language.
2. Create a document whose filename and `slug` use lowercase kebab-case.
3. Use the same `translationKey` for its English and Italian versions.
4. Complete all required metadata, SEO fields, image alternative text, metrics, and body content.
5. Keep `publicationStatus` set to `draft` while editing.
6. Run the preview and validate both viewport sizes and languages.
7. Set `publishedAt` using `YYYY-MM-DD`, then change the status to `published`.
8. Run `npm run check` before publishing.

Display order must be unique inside each locale. Only projects with `featured: true` appear on the homepage.

## Creating an article

Follow the same workflow in the Articles collection. Categories and tags must be present as arrays, even when initially empty. Once published, an article is discovered automatically at `/articles/:slug` and added to static metadata, sitemap, the content manifest, and `llms.txt`.

The article index intentionally exposes a translated empty state until the first article is published.

## Publication states

- `draft`: visible only during local development or when `VITE_CONTENT_PREVIEW=true`.
- `published`: included publicly when `publishedAt` is today or earlier.
- `archived`: excluded from public catalogues and generated routes.

A future `publishedAt` does not schedule a Netlify build. A deploy must still occur when the publication date is reached; add scheduled builds only if timed publishing becomes necessary.

## Validation and build

```bash
npm run validate:content
npm run cms:audit
npm run test:unit
npm run lint
npm run build
npm run test:e2e
```

`validate:content` checks the file-backed domain rules without starting Tina. `cms:audit` additionally verifies that Tina can parse every field and custom MDX block.

The build pipeline is:

```text
validate content
→ build Tina admin when cloud credentials exist
→ type-check
→ build Vite application
→ generate static route documents, sitemap, llms.txt, 404, and content manifest
```

Published MDX bodies are lazy-loaded per route. Homepage and indexes receive only the generated metadata catalogue, so adding translations does not load every case study into the initial bundle.

`npm audit --omit=dev` currently reports no production dependency vulnerabilities. The full audit still reports transitive advisories below `@tinacms/cli`; they affect CMS/build tooling rather than the visitor bundle, and no compatible upstream upgrade is currently available. Keep the Tina development server private, avoid automatic forced fixes, and update `tinacms` and `@tinacms/cli` together when Tina publishes a compatible release.

## Netlify setup

Configure the following environment variables in Netlify:

- `TINA_PUBLIC_CLIENT_ID`
- `TINA_TOKEN`
- optionally `TINA_PUBLIC_BRANCH`

The standard `npm run build` detects those credentials and includes the production admin. Without them, it builds the public site and explicitly skips only the cloud admin.

When Netlify is connected to the GitHub repository, a Tina save to the production branch creates a Git commit, which triggers the regular Netlify deployment. No additional build hook is needed for this flow.

For protected preview deployments, set `VITE_CONTENT_PREVIEW=true`. Never enable it for the production context because it deliberately exposes draft and archived content.

## Media

Tina’s repository-backed media manager writes below `public/media`. Use AVIF or WebP for photographic assets where practical and keep meaningful alternative text in every locale. Documents remain under `public/documents`.

Media committed to the repository is public. Do not upload private drafts, credentials, personal data, or source assets that should not be downloadable.

## Current multilingual SEO boundary

The interface and project content support English and Italian, but the selected language currently lives in `localStorage` and both variants share the same URL. Static crawler documents therefore use English as the canonical representation.

True bilingual indexing, `hreflang`, and separate canonical URLs require a subsequent routing migration such as `/en/work/...` and `/it/work/...`. The content model already supports that change without another data migration.
