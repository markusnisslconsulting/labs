/**
 * Rewrite call sites of deprecated tokens to their replacement.
 *
 * The deprecation story had two of three parts. The registry can mark a
 * token `deprecated`, and the ratchet in `usage.ts` fails on a new use of
 * one — so a deprecation cannot spread. What was missing is the part that
 * makes it *shrink*: something that moves the existing uses.
 *
 * Without it, "deprecated" means every consumer performs the same
 * search-and-replace by hand, or does not, and the token outlives three
 * releases and the person who deprecated it. Material UI and Chakra both
 * ship codemods for exactly this reason.
 *
 * This one is deliberately narrow. It rewrites token names — in CSS
 * `var()` calls, in declarations, and in string literals in TypeScript —
 * and nothing else. Component prop renames need a real AST tool
 * (jscodeshift); a token is a name, and a name is a text problem.
 *
 * Usage: tsx scripts/tokens/codemod.ts [report|write] [path ...]
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { argv, exit } from "node:process";
import { pathToFileURL } from "node:url";

import { allTokens } from "@labs/ui/tokens.registry";

const DEFAULT_PATHS = ["packages", "apps"];
const EXTENSIONS = [".css", ".ts", ".tsx", ".mdx", ".json"];
const SKIP = new Set(["node_modules", "dist", ".nx", "storybook-static"]);

/** Deprecated tokens that say what replaces them. */
const renames = new Map(
  allTokens
    .filter((token) => token.deprecated && token.supersededBy)
    .map((token) => [token.name, token.supersededBy!]),
);

/**
 * Replace one token name with another, wherever a token name can appear.
 *
 * Anchored on the boundary rather than doing a bare string replace:
 * `--uix-gap-sm` is a prefix of nothing today, but `--uix-radius-s` is a
 * prefix of `--uix-radius-surface`, and a bare replace would have
 * produced `--uix-radius-inseturface`.
 */
export function rename(source: string, from: string, to: string): string {
  return source.replace(
    new RegExp(
      `${from.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}(?![\\w-])`,
      "g",
    ),
    to,
  );
}

export function applyAll(
  source: string,
  pairs: Iterable<[string, string]>,
): { text: string; hits: Array<[string, string]> } {
  let text = source;
  const hits: Array<[string, string]> = [];
  for (const [from, to] of pairs) {
    const next = rename(text, from, to);
    if (next !== text) hits.push([from, to]);
    text = next;
  }
  return { text, hits };
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (EXTENSIONS.some((ext) => entry.endsWith(ext))) out.push(path);
  }
  return out;
}

/**
 * The transform above is importable; everything below is the command.
 *
 * Without this guard, importing the module to test `rename()` ran the CLI
 * and called process.exit — the test file reported "0 test" and passed,
 * which is the worst of both outcomes. The other scripts here have the
 * same shape and nothing imports them yet; this is the one that has to be
 * both.
 */
const isMain =
  argv[1] !== undefined && import.meta.url === pathToFileURL(argv[1]).href;

if (isMain) {
  const mode = argv[2] ?? "report";
  const paths = argv.slice(3);
  const roots = paths.length ? paths : DEFAULT_PATHS;

  if (mode !== "report" && mode !== "write") {
    console.error(`unknown mode: ${mode} (expected report | write)`);
    exit(2);
  }

  if (!renames.size) {
    console.log(
      "Nothing to migrate: no token is both deprecated and marked with " +
        "supersededBy. A deprecation without a replacement cannot be " +
        "automated, so it stays a conversation.",
    );
    exit(0);
  }

  let touched = 0;
  const summary = new Map<string, number>();

  for (const root of roots) {
    for (const file of walk(root)) {
      // The registry is where the deprecation is declared; rewriting it
      // would erase the declaration.
      if (file.endsWith("tokens.registry.ts")) continue;
      const before = readFileSync(file, "utf8");
      const { text, hits } = applyAll(before, renames);
      if (!hits.length) continue;
      touched += 1;
      for (const [from] of hits)
        summary.set(from, (summary.get(from) ?? 0) + 1);
      if (mode === "write") writeFileSync(file, text);
      console.log(
        `${mode === "write" ? "rewrote" : "would rewrite"} ${file}: ` +
          hits.map(([from, to]) => `${from} -> ${to}`).join(", "),
      );
    }
  }

  if (!touched) {
    console.log(
      `No call sites left for ${renames.size} superseded token(s). ` +
        `They can be removed from the registry.`,
    );
    exit(0);
  }

  console.log(
    `\n${mode === "write" ? "Rewrote" : "Would rewrite"} ${touched} file(s):`,
  );
  for (const [name, count] of [...summary].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${name.padEnd(32)} ${count} file(s)`);
  }
  if (mode === "report") {
    console.log("\nRun `nx run ui:tokens-codemod-write` to apply.");
  }
}
