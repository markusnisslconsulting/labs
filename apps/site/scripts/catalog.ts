import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { z } from "zod";
import { inventorySchema } from "@labs/ui-catalog";
import { catalogSchema, validateReferences } from "../src/catalog/schema.ts";

const workspaceRoot = fileURLToPath(new URL("../../..", import.meta.url));
const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8"));
const storyIndexSchema = z.object({
  entries: z.record(
    z.string(),
    z.object({
      id: z.string(),
      type: z.enum(["story", "docs"]),
    }),
  ),
});

function exportsDefault(path: string) {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  return source.statements.some(
    (node) =>
      (ts.isExportAssignment(node) && !node.isExportEquals) ||
      ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
        ts
          .getModifiers(node)
          ?.some(
            (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
          )) ||
      (ts.isExportDeclaration(node) &&
        node.exportClause &&
        !node.isTypeOnly &&
        ts.isNamedExports(node.exportClause) &&
        node.exportClause.elements.some(
          (item) => !item.isTypeOnly && item.name.text === "default",
        )),
  );
}

export function loadCatalog(
  options: {
    root?: string;
    storybookIndex?: string;
  } = {},
) {
  const root = options.root ?? workspaceRoot;
  const sourceRoot = resolve(root, "apps/site/src");
  const files = ["labs", "patterns"]
    .flatMap((folder) => {
      const path = resolve(sourceRoot, folder);
      if (!existsSync(path)) return [];
      return readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => resolve(path, entry.name, "lab.json"))
        .filter((file) => existsSync(file));
    })
    .sort();
  if (!files.length) throw new Error("The catalog has no manifests");
  const entries = catalogSchema
    .parse(
      files.map((file) => {
        try {
          return readJson(file);
        } catch (cause) {
          throw new Error(`Invalid catalog JSON: ${relative(root, file)}`, {
            cause,
          });
        }
      }),
    )
    .sort((a, b) => a.slug.localeCompare(b.slug, "en"));
  const inventory = inventorySchema.parse(
    readJson(resolve(root, "packages/ui/inventory.json")),
  );
  const demos = new Set<string>();
  for (const entry of entries) {
    if (entry.renderer.type !== "demo") continue;
    const path = resolve(sourceRoot, entry.renderer.entry);
    if (existsSync(path) && exportsDefault(path))
      demos.add(entry.renderer.entry);
  }
  const stories = options.storybookIndex
    ? new Map(
        Object.entries(
          storyIndexSchema.parse(readJson(options.storybookIndex)).entries,
        ).map(([key, entry]) => {
          if (key !== entry.id)
            throw new Error(`Storybook index ID mismatch: ${key}`);
          return [entry.id, entry.type] as const;
        }),
      )
    : undefined;
  validateReferences(entries, {
    components: new Set(
      inventory.components.map((component) => component.component),
    ),
    demos,
    ...(stories ? { stories } : {}),
  });
  return { entries, files };
}
