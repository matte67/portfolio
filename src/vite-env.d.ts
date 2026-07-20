/// <reference types="vite/client" />

declare module "*.mdx" {
  import type { ComponentType } from "react";
  import type { MDXComponents } from "mdx/types";
  import type { ArticleMetadata } from "./core/article";
  import type { ProjectMetadata } from "./core/project";

  export const metadata: ArticleMetadata | ProjectMetadata;
  const MDXComponent: ComponentType<{
    components?: MDXComponents;
  }>;
  export default MDXComponent;
}

declare module "virtual:content-catalog" {
  import type { ArticleMetadata } from "./core/article";
  import type { ProjectMetadata } from "./core/project";

  interface SourceRecord {
    readonly isPublic: boolean;
    readonly sourcePath: string;
  }

  const catalog: {
    readonly articles: readonly (ArticleMetadata & SourceRecord)[];
    readonly projects: readonly (ProjectMetadata & SourceRecord)[];
  };

  export default catalog;
}
