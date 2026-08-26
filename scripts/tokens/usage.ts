/**
 * Token usage analyser and deprecation gate.
 *
 * Why this exists
 * ---------------
 * In a multi-team system, tokens are a public API. Two questions get asked
 * constantly and are usually answered by grep:
 *
 *   1. "Is anything still using this? Can I delete it?"
 *   2. "We deprecated that six months ago — is anyone still adding uses?"
 *
 * grep answers both wrongly, because tokens alias each other. A primitive
 * with no direct reference in any component stylesheet is very much alive
 * if a semantic token aliases it. Usage is *transitive*, so the correct
 * formulation is reachability over the alias graph — not a text search.
 *
 * What it does
 * ------------
 *   nodes  every declared token
 *   edges  "A's value references B"
 *   roots  tokens referenced from a consumer (component CSS, base CSS,
 *          product code) or from inside a theme/brand override block
 *   live   reachable(roots)          dead = declared \ live
 *
 * On top of that it enforces a deprecation lifecycle. The important part
 * for coordination between teams is the *ratchet*: existing uses of a
 * deprecated token are tolerated against a committed baseline, while a new
 * use fails the build. That lets a migration proceed at each team's pace
 * without the system either blocking them or quietly losing ground.
 *
 * Modes
 * -----
 *   report    human-readable inventory (default)
 *   check     CI gate; non-zero exit on a regression
 *   baseline  rewrite the committed baseline after an intentional change
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

import { allTokens } from "@labs/ui/tokens.registry";

const ROOT = process.cwd();
const BASELINE = "packages/ui/token-usage.baseline.json";

const TOKEN_FILES = [
  "packages/ui/src/styles/tokens/primitive.css",
  "packages/ui/src/styles/tokens/semantic.css",
];
const BRAND_DIR = "packages/ui/src/styles/brands";
const COMPONENT_DIR = "packages/ui/src/components";

const VAR_REF = /var\(\s*(--uix-[\w-]+)/g;
const DECL = /(--uix-[\w-]+)\s*:\s*([^;]+);/g;

const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "");

function walk(dir: string, test: (file: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      out.push(...walk(path, test));
    } else if (test(entry.name)) {
      out.push(path);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ graph */

interface Declaration {
  value: string;
  file: string;
}

const declared = new Map<string, Declaration>();
const aliases = new Map<string, Set<string>>();
/** Tokens named inside a [data-theme]/[data-brand] block, which keeps their
 *  targets alive even when the base value is never referenced. */
const overrideRefs = new Set<string>();

for (const file of TOKEN_FILES) {
  const source = stripComments(readFileSync(file, "utf8"));
  for (const hit of source.matchAll(DECL)) {
    const [, name, raw] = hit;
    const value = raw!.replace(/\s+/g, " ").trim();
    // A theme block re-declares names that already exist; the base :root
    // value is the one the registry documents, so keep the first.
    if (!declared.has(name!)) declared.set(name!, { value, file });
    const edges = aliases.get(name!) ?? new Set<string>();
    for (const ref of value.matchAll(VAR_REF)) edges.add(ref[1]!);
    aliases.set(name!, edges);
  }
  for (const block of source.matchAll(/\[data-[^\]]+\][^{]*\{([^}]*)\}/g)) {
    for (const ref of (block[1] ?? "").matchAll(VAR_REF))
      overrideRefs.add(ref[1]!);
  }
}

if (existsSync(BRAND_DIR)) {
  for (const file of readdirSync(BRAND_DIR).filter((f) => f.endsWith(".css"))) {
    const source = stripComments(readFileSync(join(BRAND_DIR, file), "utf8"));
    for (const ref of source.matchAll(VAR_REF)) overrideRefs.add(ref[1]!);
  }
}

/* --------------------------------------------------------------- consumers */

/** Files that *use* tokens rather than define them. */
const consumers = [
  ...walk(COMPONENT_DIR, (f) => f.endsWith(".css")),
  "packages/ui/src/styles/base.css",
  ...walk("apps/site/src", (f) => f.endsWith(".css") || f.endsWith(".tsx")),
].filter(existsSync);

interface Site {
  file: string;
  line: number;
}
const usage = new Map<string, Site[]>();

for (const file of consumers) {
  const lines = stripComments(readFileSync(file, "utf8")).split("\n");
  lines.forEach((text, index) => {
    for (const ref of text.matchAll(VAR_REF)) {
      const sites = usage.get(ref[1]!) ?? [];
      sites.push({ file: relative(ROOT, file), line: index + 1 });
      usage.set(ref[1]!, sites);
    }
  });
}

/* ------------------------------------------------------------ reachability */

const roots = new Set<string>([...usage.keys(), ...overrideRefs]);
const live = new Set<string>();
const stack = [...roots].filter((name) => declared.has(name));
while (stack.length) {
  const name = stack.pop()!;
  if (live.has(name)) continue;
  live.add(name);
  for (const next of aliases.get(name) ?? []) {
    if (declared.has(next) && !live.has(next)) stack.push(next);
  }
}

const dead = [...declared.keys()].filter((name) => !live.has(name)).sort();

/** Component tokens are override slots and deliberately undeclared. */
const slots = new Set(
  allTokens.filter((t) => t.level === "component").map((t) => t.name),
);
const unknown = [...usage.keys()]
  .filter((name) => !declared.has(name) && !slots.has(name))
  .sort();

const registry = new Map(allTokens.map((token) => [token.name, token]));
const deprecatedInUse = [...usage.entries()]
  .filter(([name]) => registry.get(name)?.deprecated)
  .map(([name, sites]) => ({ name, count: sites.length, sites }))
  .sort((a, b) => b.count - a.count);

/* ------------------------------------------------------------------ output */

const mode = process.argv[2] ?? "report";
const pad = (value: string | number, width: number) =>
  String(value).padEnd(width);

if (mode === "report") {
  console.log("Token usage\n");
  console.log(`  declared (primitive + semantic)   ${declared.size}`);
  console.log(`  component override slots         ${slots.size}`);
  console.log(`  referenced directly by consumers ${usage.size}`);
  console.log(`  reachable through aliases        ${live.size}`);
  console.log(`  unreachable                      ${dead.length}`);

  if (dead.length) {
    console.log(
      "\nUnreachable — nothing in this repo can resolve to these.\n" +
        "  Tokens are a public API, so unused *here* is not the same as safe\n" +
        "  to delete: a consuming product may hold a reference this repo\n" +
        "  cannot see. Mark them `deprecated` in the registry first.\n",
    );
    for (const name of dead) {
      console.log(
        `  ${pad(name, 30)} ${declared.get(name)!.value.slice(0, 40)}`,
      );
    }
  }

  if (deprecatedInUse.length) {
    console.log("\nDeprecated but still used\n");
    for (const { name, count, sites } of deprecatedInUse) {
      const token = registry.get(name)!;
      console.log(`  ${pad(name, 30)} ${count} use(s) — ${token.deprecated}`);
      for (const site of sites.slice(0, 4)) {
        console.log(`      ${site.file}:${site.line}`);
      }
      if (sites.length > 4) console.log(`      … ${sites.length - 4} more`);
    }
  }

  if (unknown.length) {
    console.log("\nReferenced but never declared (likely typos)\n");
    for (const name of unknown) {
      console.log(`  ${pad(name, 30)} ${usage.get(name)!.length} use(s)`);
    }
  }

  const busiest = [...usage.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  console.log("\nMost referenced\n");
  for (const [name, sites] of busiest) {
    console.log(`  ${pad(name, 30)} ${sites.length}`);
  }
  process.exit(0);
}

/* ------------------------------------------------------------- the ratchet */

interface Baseline {
  note: string;
  deprecated: Record<string, number>;
}

const counts: Record<string, number> = {};
for (const { name, count } of deprecatedInUse) counts[name] = count;

if (mode === "baseline") {
  const next: Baseline = {
    note:
      "Tolerated uses of deprecated tokens. The check fails when a count " +
      "rises, so a migration can proceed at each team's pace without the " +
      "system losing ground. Lower these as call sites are removed; run " +
      "`nx run ui:tokens-baseline` after an intentional change.",
    deprecated: counts,
  };
  writeFileSync(BASELINE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `baseline written: ${Object.keys(counts).length} deprecated token(s) tracked`,
  );
  process.exit(0);
}

/**
 * Tokens that nothing in this repo reaches, on purpose.
 *
 * "Unreachable" sat in the report as a number for weeks, which is the
 * failure mode this repo keeps arguing against: a count nobody watches is
 * not a gate. But the four entries were not dead API either — each is a
 * step in a scale, and a scale with a hole in it is worse than a step
 * nobody has needed yet. A product picking 200ms for a transition should
 * find --uix-duration-base there.
 *
 * So the exemption is written down with its reason, and anything *not*
 * listed fails the check. That is the difference between an allowlist and
 * an excuse.
 */
const INTENTIONALLY_UNREFERENCED: Record<string, string> = {
  "--uix-duration-base": "middle step of the motion scale",
  "--uix-font-size-600": "largest step of the type scale",
  "--uix-z-popover": "layer between dropdown and modal, reserved",
};

if (mode === "check") {
  const failures: string[] = [];

  if (unknown.length) {
    failures.push(
      `${unknown.length} token(s) referenced but never declared: ${unknown.join(", ")}`,
    );
  }

  const unexplained = dead.filter(
    (name) => !(name in INTENTIONALLY_UNREFERENCED),
  );
  if (unexplained.length) {
    failures.push(
      `${unexplained.length} token(s) nothing can reach and nothing explains: ` +
        `${unexplained.join(", ")}. Either deprecate them, or add them to ` +
        `INTENTIONALLY_UNREFERENCED with the reason they exist.`,
    );
  }

  // The other direction: an exemption for a token that is now used, or that
  // no longer exists, is a stale comment pretending to be a decision.
  for (const name of Object.keys(INTENTIONALLY_UNREFERENCED)) {
    if (!registry.has(name)) {
      failures.push(
        `${name} is exempted as intentionally unreferenced but is no longer in the registry`,
      );
      continue;
    }
    if (!dead.includes(name)) {
      failures.push(
        `${name} is exempted as intentionally unreferenced but something now references it; drop the exemption`,
      );
    }
  }

  const baseline: Baseline = existsSync(BASELINE)
    ? JSON.parse(readFileSync(BASELINE, "utf8"))
    : { note: "", deprecated: {} };

  for (const [name, count] of Object.entries(counts)) {
    const allowed = baseline.deprecated[name] ?? 0;
    if (count > allowed) {
      const token = registry.get(name)!;
      failures.push(
        `${name}: ${count} uses, ${allowed} allowed — it is deprecated (${token.deprecated}). ` +
          `Do not add uses; migrate instead.`,
      );
    }
  }

  // A count that dropped is good news, but the baseline should follow so the
  // ratchet keeps tightening rather than silently allowing a regression later.
  for (const [name, allowed] of Object.entries(baseline.deprecated)) {
    const count = counts[name] ?? 0;
    if (count < allowed) {
      failures.push(
        `${name}: ${count} uses but baseline still allows ${allowed}. ` +
          `Run \`nx run ui:tokens-baseline\` to tighten it.`,
      );
    }
  }

  if (failures.length) {
    console.error("Token check failed\n");
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(
    `Token check passed — ${live.size} live, ${dead.length} unreachable ` +
      `(all explained), ` +
      `${Object.keys(counts).length} deprecated token(s) held at baseline.`,
  );
  process.exit(0);
}

console.error(`unknown mode: ${mode} (expected report | check | baseline)`);
process.exit(2);
