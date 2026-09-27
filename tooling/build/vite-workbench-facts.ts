import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { inventorySchema } from "@labs/ui-catalog";
import { importedSize, measureComponents } from "@labs/tools/package-sizes";

export function readWorkbenchFacts(
  workspace: string,
  measuredAt = new Date().toISOString(),
) {
  const directory = join(workspace, "dist/packages/ui");
  const inventory = inventorySchema.parse(
    JSON.parse(
      readFileSync(join(workspace, "packages/ui/inventory.json"), "utf8"),
    ),
  );
  const components = measureComponents(directory);
  const names = inventory.components
    .map((component) => component.component)
    .sort();
  if (JSON.stringify(names) !== JSON.stringify(Object.keys(components)))
    throw new Error(
      "Build @labs/ui: the inventory and package components differ.",
    );
  const costs = Object.entries(components)
    .map(([name, size]) => ({ name, ...size }))
    .sort((a, b) => a.total - b.total || a.name.localeCompare(b.name));
  if (!costs.length)
    throw new Error("Cannot report an empty component package.");
  const stylesheet = readFileSync(join(directory, "styles.css"), "utf8");
  const layers = /@layer\s+([\w,\s]+);/
    .exec(stylesheet)?.[1]
    ?.split(",")
    .map((name) => name.trim());
  if (!layers?.length)
    throw new Error("The built stylesheet has no layer order.");
  const middle = Math.floor(costs.length / 2);
  const median =
    costs.length % 2
      ? costs[middle]!.total
      : (costs[middle - 1]!.total + costs[middle]!.total) / 2;
  return {
    measuredAt,
    componentCount: names.length,
    layers,
    globalStyles: importedSize(join(directory, "styles.css")).css,
    median,
    largest: costs.at(-1)!,
  };
}
export type WorkbenchFacts = ReturnType<typeof readWorkbenchFacts>;

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}

export function workbenchFacts(workspace: string): Plugin {
  const id = "virtual:labs-facts";
  return {
    name: "labs-workbench-facts",
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    load(source) {
      if (source !== `\0${id}`) return;
      this.addWatchFile(join(workspace, "packages/ui/inventory.json"));
      for (const file of files(join(workspace, "dist/packages/ui")))
        this.addWatchFile(file);
      return `export const facts = ${JSON.stringify(readWorkbenchFacts(workspace))};`;
    },
  };
}
