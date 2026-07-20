export interface BuildContentRecord extends Record<string, unknown> {
  readonly sourcePath: string;
}

export interface BuildContentCatalog {
  readonly articles: readonly BuildContentRecord[];
  readonly projects: readonly BuildContentRecord[];
}

export function readContentCatalog(
  projectRoot: string,
  now?: Date,
): Promise<BuildContentCatalog>;
