import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig, type Plugin } from "vite";

import { readContentCatalog } from "./scripts/content-catalog.mjs";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const virtualCatalogId = "virtual:content-catalog";
const resolvedVirtualCatalogId = `\0${virtualCatalogId}`;

/** Exposes frontmatter as a tiny virtual module without eagerly bundling every MDX body. */
function contentCatalogPlugin(): Plugin {
  return {
    name: "portfolio-content-catalog",

    resolveId(id) {
      return id === virtualCatalogId ? resolvedVirtualCatalogId : undefined;
    },

    async load(id) {
      if (id !== resolvedVirtualCatalogId) return undefined;
      const catalog = await readContentCatalog(projectRoot);
      return `export default ${JSON.stringify(catalog)};`;
    },

    handleHotUpdate(context) {
      if (!context.file.includes("/content/")) return;
      const catalogModule = context.server.moduleGraph.getModuleById(resolvedVirtualCatalogId);
      if (!catalogModule) return;
      context.server.moduleGraph.invalidateModule(catalogModule);
      return [catalogModule];
    },
  };
}

export default defineConfig({
  plugins: [
    contentCatalogPlugin(),
    mdx({
      providerImportSource: "@mdx-js/react",
      remarkPlugins: [
        remarkFrontmatter,
        [remarkMdxFrontmatter, { name: "metadata" }],
      ],
    }),
    tailwindcss(),
    react(),
  ],
});
