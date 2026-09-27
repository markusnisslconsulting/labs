import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { z } from "zod";
import { inventorySchema } from "@labs/ui-catalog";
import type {
  WorkbenchDirectory,
  WorkbenchReference,
} from "../src/catalog/workbench";

const entrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+--[a-z0-9-]+$/),
  title: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["story", "docs"]),
  tags: z.array(z.string()),
});
const indexSchema = z.object({ entries: z.record(z.string(), entrySchema) });

export function buildWorkbench(
  inventoryInput: unknown,
  indexInput: unknown,
): WorkbenchDirectory {
  const inventory = inventorySchema.parse(inventoryInput);
  const index = indexSchema.parse(indexInput);
  for (const [id, entry] of Object.entries(index.entries))
    if (entry.id !== id) throw new Error(`Storybook index ID mismatch: ${id}`);
  const entries = Object.values(index.entries);
  const components = inventory.components
    .map((component): WorkbenchReference => {
      const stories = entries.filter(
        (entry) => entry.title === `Components/${component.component}`,
      );
      const docs = stories.filter((entry) => entry.type === "docs");
      const examples = stories.filter(
        (entry) => entry.type === "story" && entry.tags.includes("dev"),
      );
      if (docs.length !== 1 || !examples.length)
        throw new Error(
          `${component.component}: expected one Docs page and a visible example`,
        );
      const example =
        examples.find((entry) => entry.name === "Matrix") ?? examples[0]!;
      return {
        name: component.component,
        description: component.useFor.replace(/`([^`]+)`/g, "$1"),
        status: component.status,
        kind: "component",
        id: docs[0]!.id,
        view: "docs",
        example: example.id,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
  const titles = [
    ...new Set(
      entries
        .filter((entry) => /^(Foundations|Guides)\//.test(entry.title))
        .map((entry) => entry.title),
    ),
  ];
  const foundations = titles
    .flatMap((title): WorkbenchReference[] => {
      const matches = entries.filter((entry) => entry.title === title);
      const entry =
        matches.find((entry) => entry.type === "docs") ??
        matches.find((entry) => entry.tags.includes("dev"));
      if (!entry) return [];
      return [
        {
          name: title.split("/").slice(1).join(" / "),
          kind: title.startsWith("Guides/") ? "guide" : "foundation",
          id: entry.id,
          view: entry.type,
        },
      ];
    })
    .sort(
      (a, b) =>
        a.kind.localeCompare(b.kind, "en") ||
        a.name.localeCompare(b.name, "en"),
    );
  return { components, foundations };
}

const workspace = fileURLToPath(new URL("../../..", import.meta.url));
export const workbenchInputs = [
  resolve(workspace, "packages/ui/inventory.json"),
  resolve(workspace, "dist/packages/ui-storybook/index.json"),
];
export function loadWorkbench() {
  return buildWorkbench(
    ...(workbenchInputs.map((path) =>
      JSON.parse(readFileSync(path, "utf8")),
    ) as [unknown, unknown]),
  );
}
