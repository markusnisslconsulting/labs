import type { CatalogEntry } from "./schema";
import { localize } from "./localize";
import { directoryAt } from "./directories";

export type Execution =
  CatalogEntry["scenarios"][number]["execution"] | "storybook";
export const executionModes: Execution[] = [
  "scripted",
  "browser",
  "native",
  "integration",
  "storybook",
];
export type CatalogFilters = {
  query: string;
  tag: string;
  execution: Execution | "";
};

export function readFilters(params: URLSearchParams): CatalogFilters {
  const execution = params.get("execution");
  return {
    query: params.get("q") ?? "",
    tag: params.get("tag") ?? "",
    execution: executionModes.find((mode) => mode === execution) ?? "",
  };
}

export function updateFilter(
  params: URLSearchParams,
  key: "q" | "tag" | "execution",
  value: string,
) {
  const next = new URLSearchParams(params);
  if (value) next.set(key, value);
  else next.delete(key);
  return next;
}

export function entryExecutions(entry: CatalogEntry): Execution[] {
  return entry.renderer.type === "storybook"
    ? ["storybook"]
    : [...new Set(entry.scenarios.map((scenario) => scenario.execution))];
}

export function filterCatalog(
  entries: CatalogEntry[],
  filters: CatalogFilters,
  locale: string,
) {
  const needle = filters.query.trim().toLocaleLowerCase(locale);
  return entries.filter((entry) => {
    if (filters.tag && !entry.tags.includes(filters.tag)) return false;
    if (
      filters.execution &&
      !entryExecutions(entry).includes(filters.execution)
    )
      return false;
    return [
      entry.slug,
      localize(entry.title, locale),
      localize(entry.summary, locale),
      ...entry.tags,
    ]
      .join(" ")
      .toLocaleLowerCase(locale)
      .includes(needle);
  });
}

// Only catalog URLs can be used as an in-app return destination.
export function catalogReturn(value: unknown): string {
  if (typeof value !== "string") return "/";
  try {
    const url = new URL(value, "https://labs.invalid");
    if (
      url.origin === "https://labs.invalid" &&
      (url.pathname === "/" || directoryAt(url.pathname))
    )
      return url.pathname + url.search;
  } catch {
    /* Malformed history state falls back to the catalog. */
  }
  return "/";
}
