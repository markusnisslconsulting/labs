/** Load the checked catalog and supporting metadata from a workspace. */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { inventorySchema, type InventoryComponent } from "@labs/ui-catalog";
export type { InventoryComponent } from "@labs/ui-catalog";

export interface KeyboardRow {
  component: string;
  story: string;
  owner: string;
  key: string;
  expectation: string;
}

/** This server reads a checkout; it does not ship a separate catalog artifact. */
export function workspaceRoot(workspace: string | undefined): string {
  if (!workspace)
    throw new Error("Usage: server.ts --workspace <labs checkout>");
  const root = resolve(workspace);
  const required = [
    "pnpm-workspace.yaml",
    "packages/ui/inventory.json",
    "packages/ui/api-surface.md",
    "packages/ui/src/keyboard.map.ts",
    "packages/ui/src/tokens.registry.ts",
  ];
  for (const file of required) {
    if (!existsSync(join(root, file)))
      throw new Error(`Invalid labs workspace: missing ${file} in ${root}`);
  }
  return root;
}

export function loadInventory(root: string): InventoryComponent[] {
  const raw = readFileSync(join(root, "packages/ui/inventory.json"), "utf8");
  return inventorySchema.parse(JSON.parse(raw)).components;
}

export function loadApiSurface(root: string): string {
  return readFileSync(join(root, "packages/ui/api-surface.md"), "utf8");
}

/** Parse the flat keyboard map; parity tests compare every row with its exports. */
export function loadKeyboard(root: string): KeyboardRow[] {
  const source = readFileSync(
    join(root, "packages/ui/src/keyboard.map.ts"),
    "utf8",
  );
  const rows: KeyboardRow[] = [];
  const pattern =
    /\{\s*component:\s*"([^"]+)",\s*story:\s*"([^"]+)",\s*owner:\s*"([^"]+)",[\s\S]*?key:\s*"([^"]+)",[\s\S]*?expectation:\s*([\s\S]*?),\n\s*\}/g;
  for (const match of source.matchAll(pattern)) {
    /* The expectation is sometimes a concatenation across lines, so the
       quoted pieces are joined rather than the first one taken. */
    const text = [...match[5]!.matchAll(/"([^"]*)"/g)]
      .map((piece) => piece[1])
      .join("");
    rows.push({
      component: match[1]!,
      story: match[2]!,
      owner: match[3]!,
      key: match[4]!,
      expectation: text,
    });
  }
  return rows;
}

export interface Token {
  name: string;
  value: string;
  level: string;
  type: string;
  description?: string;
}

export function loadTokens(root: string): Token[] {
  const source = readFileSync(
    join(root, "packages/ui/src/tokens.registry.ts"),
    "utf8",
  );
  const rows: Token[] = [];
  // Registry fields may contain escaped quotes, commas and nested CSS functions.
  const quoted = String.raw`"((?:[^"\\]|\\.)*)"`;
  const pattern = new RegExp(
    String.raw`\bt\(\s*` +
      [quoted, quoted, quoted, quoted].join(String.raw`,\s*`) +
      String.raw`(?:\s*,\s*${quoted})?`,
    "g",
  );
  /** Undo the source's own escaping, so a font stack reads as CSS would. */
  const unescape = (text: string) => text.replace(/\\(.)/g, "$1");
  for (const match of source.matchAll(pattern)) {
    if (!match[1]!.startsWith("--uix-")) continue;
    rows.push({
      name: match[1]!,
      value: unescape(match[2]!),
      level: match[3]!,
      type: match[4]!,
      ...(match[5] ? { description: unescape(match[5]) } : {}),
    });
  }
  return rows;
}
