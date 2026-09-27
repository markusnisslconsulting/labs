import { lazy, type ComponentType } from "react";
import type { CatalogEntry } from "./schema";
import { DemoLoadError } from "../recovery/DemoLoadError";

// Vite validates these manifests before serving or building the application.
const manifests = import.meta.glob<CatalogEntry>(
  ["../labs/*/lab.json", "../patterns/*/lab.json"],
  { eager: true, import: "default" },
);
const loaders = import.meta.glob<ComponentType>(
  ["../labs/*/LabDemo.tsx", "../patterns/*/LabDemo.tsx"],
  { import: "default" },
);

export const catalog = Object.values(manifests).sort((a, b) =>
  a.slug.localeCompare(b.slug, "en"),
);
export const catalogBySlug = (slug: string | undefined) =>
  catalog.find((entry) => entry.slug === slug);

export const demoComponents: Record<string, ComponentType> = Object.fromEntries(
  catalog.flatMap((entry) => {
    if (entry.renderer.type !== "demo") return [];
    const load = loaders[`../${entry.renderer.entry}`];
    if (!load) throw new Error(`Missing demo for ${entry.slug}`);
    return [
      [
        entry.slug,
        lazy(async () => {
          try {
            return { default: await load() };
          } catch (error) {
            throw new DemoLoadError(error);
          }
        }),
      ],
    ];
  }),
);

export { storybookHref } from "./workbench";
