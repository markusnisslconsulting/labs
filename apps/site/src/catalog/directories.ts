import type { CatalogEntry } from "./schema";

export const directories = [
  "demos",
  "components",
  "patterns",
  "foundations",
] as const;
export type Directory = (typeof directories)[number];

export function directoryAt(pathname: string): Directory | undefined {
  return directories.find((directory) => pathname === `/${directory}`);
}

export function publicRoutes(entries: Pick<CatalogEntry, "slug">[]) {
  return [
    "/",
    ...directories.map((directory) => `/${directory}`),
    ...entries.map((entry) => `/${entry.slug}`),
  ];
}
