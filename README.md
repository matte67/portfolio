# Matteo Vittori — Portfolio

Editorial React portfolio for Matteo Vittori, focused on modular software architecture, computer vision, and web products.

## Architecture

- `content/projects/{en,it}/`: localized MDX case studies and editable frontmatter.
- `content/articles/{en,it}/`: localized editorial articles.
- `src/core/`: framework-independent publication, project, and article invariants.
- `src/application/`: repository ports and content catalogue use cases.
- `src/infrastructure/`: automatically discovered, lazy-loaded MDX adapters.
- `src/presentation/`: layouts, pages, project blocks, diagrams, PDF reader, and interactive components.
- `tina/`: TinaCMS collections, editor schema, and cloud lockfile.
- `public/media/`: web-ready project imagery derived from the supplied source material.
- `public/documents/`: CV, thesis, pitches, and presentation PDFs.
- `tests/e2e/`: Playwright functional, responsive, reduced-motion, and visual QA.
- `scripts/content-catalog.mjs`: shared build-time validation and publication catalogue.
- `scripts/generate-route-metadata.mjs`: dynamic static metadata, sitemap, manifest, 404, and `llms.txt` generation.

The content and domain layers remain independent from route and component concerns. Interactive JavaScript is limited to project previews, technical diagrams, tabs, mobile navigation, and PDF controls.

The production build also emits a small static HTML entry for every public route. Netlify serves these files directly and returns the generated `404.html` for unknown URLs, so social previews and crawlers receive correct status codes and route-specific metadata even when they do not execute JavaScript.

## Routes

- `/`
- `/work`
- `/work/sef`
- `/work/unistays`
- `/work/rewild`
- `/work/hackathon-management-system`
- `/work/dormant-access-control-unit`
- `/articles`
- `/articles/:slug` for every published article
- `/thesis`
- `/about`

## Local development

```bash
npm install
npm run dev
```

Run the local content editor at `/admin/index.html` with:

```bash
npm run dev:cms
```

## Verification

```bash
npm run lint
npm run test:unit
npm run build
npm run cms:audit
npx playwright install chromium
npm run test:e2e
```

## Editing project content

Each MDX file stores structured YAML frontmatter and a narrative body. Metadata is checked before the app builds, while approved presentation blocks are supplied through `src/presentation/project/mdxComponents.tsx` and registered in TinaCMS.

New files are discovered automatically. `draft` and `archived` documents are excluded from production; published content automatically generates its public route and crawler metadata.

Do not add unverified metrics. Use a `ContentNeeded` checkpoint until evidence or a public link is available.

See [CONTENT_CHECKLIST.md](./CONTENT_CHECKLIST.md) for the remaining publication work.
See [docs/CONTENT_PUBLISHING.md](./docs/CONTENT_PUBLISHING.md) for the complete editorial, TinaCloud, and Netlify workflow.
