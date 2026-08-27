/**
 * Everything the server answers from, read once at start-up.
 *
 * All four sources are generated or checked by a gate in this repository —
 * `ui:inventory`, `ui:api-surface`, `ui:tokens-check` and the keyboard map's
 * own coverage test. That is the whole reason this server is worth having
 * rather than a document somebody maintains: it cannot drift on its own,
 * because everything it says is already something CI refuses to let go
 * stale.
 *
 * Read from disk rather than imported, so the server runs against a checkout
 * without a build step and answers about *that* checkout.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface InventoryProp {
  name: string;
  type: string;
  required: boolean;
  doc: string;
}

export interface InventoryComponent {
  component: string;
  props: InventoryProp[];
  parts: string[];
  slots: string[];
  status: string;
  useFor: string;
  insteadWhen: string;
  accessibility: string;
}

export interface KeyboardRow {
  component: string;
  story: string;
  owner: string;
  key: string;
  expectation: string;
}

/** The workspace root, from this file's own location. */
export function workspaceRoot(from: string): string {
  return join(from, "..", "..", "..");
}

export function loadInventory(root: string): InventoryComponent[] {
  const raw = readFileSync(join(root, "packages/ui/inventory.json"), "utf8");
  return (JSON.parse(raw) as { components: InventoryComponent[] }).components;
}

export function loadApiSurface(root: string): string {
  return readFileSync(join(root, "packages/ui/api-surface.md"), "utf8");
}

/**
 * The keyboard contract, parsed out of its TypeScript source.
 *
 * Parsed rather than imported, because importing it would mean this server
 * needs a TypeScript build to answer a question about a data table. The file
 * is a flat array of object literals with five string fields and a gate that
 * fails when a row has no test, so a regex over it is honest — and if the
 * shape ever stops being that, this returns nothing rather than something
 * wrong, which the server's own test checks for.
 */
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

/**
 * The design tokens, from `tokens.registry.ts`.
 *
 * Read from the registry rather than derived from the DTCG export, and that
 * was a correction. Flattening the DTCG tree looked equivalent and was not:
 * its top level is the tier, so the path produced `--uix-semantic-accent`
 * where the custom property a stylesheet types is `--uix-accent`. Every
 * semantic and component token came out with a name that does not exist —
 * confidently, in the shape of an answer.
 *
 * The registry is the right source for a different reason too. It carries the
 * tier and a description per token, which is what makes an answer useful
 * ("primitive: never reference this from a component"), and
 * `test/tokens.spec.ts` already fails when it drifts from the CSS. The DTCG
 * export exists to be read by other tools; this one is read by this
 * repository.
 *
 * Parsed with a regex, because the file is deliberately one line per token —
 * its own header says the layout is the data format — and importing it would
 * mean this server needs a TypeScript build to name a colour. The count is
 * checked against the import in `test/data.spec.ts`.
 */
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
  /* One `t(...)` call per line, which is the layout that file's own header
     calls the data format. Field by field rather than one greedy match: a
     value like `light-dark(var(--uix-red-600), var(--uix-red-400))` is full
     of commas and parentheses and contains no quotes, so quoting is the only
     boundary that holds. */
  /* One `t(...)` call per line, which is the layout that file's own header
     calls the data format. Field by field rather than one greedy match: a
     value like `light-dark(var(--uix-red-600), var(--uix-red-400))` is full
     of commas and parentheses, so quoting is the only boundary that holds.

     And the quoting allows escapes, which cost three tokens on the first
     attempt: `--uix-font-sans` is a font stack whose value contains
     `\"Atkinson Hyperlegible\"`, so a `[^"]*` field stopped inside it and
     the three font primitives simply did not appear. A parser that comes up
     short returns an answer rather than an error, which is why the count is
     checked against the import. */
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
