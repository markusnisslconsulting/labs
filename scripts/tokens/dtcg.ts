/**
 * Publish the token registry in the W3C Design Tokens format.
 *
 * The Design Tokens Format Module reached its first stable version
 * (2025.10) under the W3C Community Group, with Adobe, Figma, Google,
 * Microsoft, Salesforce, Shopify and Tokens Studio behind it. That makes
 * it the interchange format: a designer points Tokens Studio at a file
 * like this one, a native team runs it through Style Dictionary, and
 * nobody re-types a hex value into a second tool.
 *
 * Until now the registry existed only as TypeScript, which is readable by
 * exactly one toolchain — ours. The registry stays the source of truth;
 * these files are generated from it, committed so a design tool can fetch
 * them by URL, and checked in CI so they cannot drift.
 *
 * Two things the format does not have, and how they are handled:
 *
 *   - `light-dark()`. DTCG has no notion of a mode inside a value, so a
 *     theme is a file: labs.light.tokens.json and labs.dark.tokens.json,
 *     each fully resolved. That is also how Tokens Studio models modes,
 *     so it is the shape a tool expects rather than a workaround.
 *   - Our `var(--uix-x)` aliases. Those become DTCG references,
 *     `{primitive.color.blue-600}`, which is the part that makes the
 *     graph portable instead of a wall of hex.
 *
 * Usage: tsx scripts/tokens/dtcg.ts [write|check]
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { allTokens, type TokenDescriptor } from "@labs/ui/tokens.registry";

const OUT = "packages/ui/tokens";
const BRANDS = "packages/ui/src/styles/brands";

/** DTCG `$type` for each of our registry types. */
function dtcgType(token: TokenDescriptor): string {
  switch (token.type) {
    case "color":
      return "color";
    case "radius":
    case "space":
      return "dimension";
    case "elevation":
      return "shadow";
    case "motion":
      return /cubic-bezier/.test(token.value) ? "cubicBezier" : "duration";
    case "density":
    case "opacity":
    case "z-index":
      return "number";
    case "typography":
      if (/font-size/.test(token.name) || /rem|px|em/.test(token.value))
        return "dimension";
      if (/weight/.test(token.name)) return "fontWeight";
      if (/line-height/.test(token.name)) return "number";
      return "fontFamily";
    default:
      return "string";
  }
}

/**
 * Where a token sits in the emitted tree: tier, then the role prefix its
 * name already carries. `--uix-bg-page` becomes semantic.bg.page, which
 * is the grouping a designer sees in Tokens Studio.
 */
function path(token: TokenDescriptor): string[] {
  const bare = token.name.replace(/^--uix-/, "");
  const parts = bare.split("-");
  // Two segments is enough structure to be navigable and shallow enough
  // that a reference stays readable.
  return parts.length > 1
    ? [token.level, parts[0]!, parts.slice(1).join("-")]
    : [token.level, bare];
}

const byName = new Map(allTokens.map((token) => [token.name, token]));

/** Resolve light-dark() to one side, leaving everything else alone. */
function pickScheme(value: string, theme: "light" | "dark"): string {
  const at = value.search(/light-dark\(/i);
  if (at === -1) return value;
  const open = at + value.slice(at).indexOf("(");
  let depth = 0;
  let end = -1;
  for (let i = open; i < value.length; i += 1) {
    if (value[i] === "(") depth += 1;
    else if (value[i] === ")") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return value;
  const inner = value.slice(open + 1, end);
  const parts: string[] = [];
  let level = 0;
  let current = "";
  for (const char of inner) {
    if (char === "(") level += 1;
    if (char === ")") level -= 1;
    if (char === "," && level === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  const chosen = (theme === "dark" ? parts[1] : parts[0]) ?? "";
  return (
    value.slice(0, at) +
    pickScheme(chosen.trim(), theme) +
    pickScheme(value.slice(end + 1), theme)
  );
}

/** var(--uix-x) becomes {tier.group.name} when x is a token we publish. */
function toReferences(value: string): string {
  return value.replace(
    /var\(\s*(--uix-[\w-]+)\s*(?:,[^)]*)?\)/g,
    (whole, name) => {
      const target = byName.get(name as string);
      return target ? `{${path(target).join(".")}}` : whole;
    },
  );
}

/** DTCG models a shadow as an object, not a CSS string. */
function shadowValue(value: string): unknown {
  const match = /^(-?[\d.]+\w*)\s+(-?[\d.]+\w*)\s+(-?[\d.]+\w*)\s+(.+)$/.exec(
    value.trim(),
  );
  if (!match) return value === "none" ? [] : value;
  return {
    offsetX: match[1],
    offsetY: match[2],
    blur: match[3],
    spread: "0",
    color: match[4]!.trim(),
  };
}

interface Group {
  [key: string]: Group | Record<string, unknown>;
}

function build(theme: "light" | "dark"): Group {
  const root: Group = {
    $description:
      "Generated from packages/ui/src/tokens.registry.ts. Do not edit: " +
      "run `nx run ui:tokens-dtcg-write`. " +
      `Theme: ${theme}.`,
  } as unknown as Group;

  for (const token of allTokens) {
    const resolved = toReferences(pickScheme(token.value, theme));
    const type = dtcgType(token);
    const leaf: Record<string, unknown> = {
      $type: type,
      $value: type === "shadow" ? shadowValue(resolved) : resolved,
      $description: token.description,
      $extensions: {
        "com.markusnissl.labs": {
          cssVariable: token.name,
          tier: token.level,
        },
      },
    };
    if (token.deprecated) leaf["$deprecated"] = token.deprecated;

    const segments = path(token);
    let cursor = root;
    for (const segment of segments.slice(0, -1)) {
      cursor[segment] ??= {};
      cursor = cursor[segment] as Group;
    }
    cursor[segments.at(-1)!] = leaf;
  }
  return root;
}

/** A brand is a partial override set, which is exactly a DTCG file too. */
function buildBrand(brand: string, theme: "light" | "dark"): Group | null {
  const css = readFileSync(join(BRANDS, `${brand}.css`), "utf8");
  const declarations = [
    ...css.matchAll(/(--uix-[\w-]+):\s*([^;]+);/g),
  ] as Array<RegExpMatchArray>;
  if (!declarations.length) return null;

  const root: Group = {
    $description: `Brand override: ${brand}. Theme: ${theme}. Generated.`,
  } as unknown as Group;
  for (const [, name, raw] of declarations) {
    const token = byName.get(name!);
    if (!token) continue;
    const resolved = toReferences(pickScheme(raw!.trim(), theme));
    const type = dtcgType(token);
    const segments = path(token);
    let cursor = root;
    for (const segment of segments.slice(0, -1)) {
      cursor[segment] ??= {};
      cursor = cursor[segment] as Group;
    }
    cursor[segments.at(-1)!] = {
      $type: type,
      $value: type === "shadow" ? shadowValue(resolved) : resolved,
      $description: token.description,
    };
  }
  return root;
}

function files(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const theme of ["light", "dark"] as const) {
    out[`labs.${theme}.tokens.json`] =
      `${JSON.stringify(build(theme), null, 2)}\n`;
  }
  for (const file of readdirSync(BRANDS).filter((f) => f.endsWith(".css"))) {
    const brand = file.replace(/\.css$/, "");
    for (const theme of ["light", "dark"] as const) {
      const tree = buildBrand(brand, theme);
      if (tree) {
        out[`${brand}.${theme}.tokens.json`] =
          `${JSON.stringify(tree, null, 2)}\n`;
      }
    }
  }
  return out;
}

const mode = process.argv[2] ?? "check";
const emitted = files();

if (mode === "write") {
  mkdirSync(OUT, { recursive: true });
  for (const [name, body] of Object.entries(emitted)) {
    writeFileSync(join(OUT, name), body);
  }
  console.log(`wrote ${Object.keys(emitted).length} token file(s) to ${OUT}/`);
  process.exit(0);
}

if (mode === "check") {
  const problems: string[] = [];
  for (const [name, body] of Object.entries(emitted)) {
    let onDisk: string;
    try {
      onDisk = readFileSync(join(OUT, name), "utf8");
    } catch {
      problems.push(`${name} is missing`);
      continue;
    }
    if (onDisk !== body) problems.push(`${name} is out of date`);
  }
  const extra = readdirSync(OUT, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tokens.json"))
    .map((entry) => entry.name)
    .filter((name) => !(name in emitted));
  for (const name of extra) problems.push(`${name} is no longer generated`);

  if (problems.length) {
    console.error("DTCG token export is stale\n");
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error("\nRun `nx run ui:tokens-dtcg-write` and commit the result.");
    process.exit(1);
  }
  console.log(
    `DTCG export in sync — ${Object.keys(emitted).length} file(s), ${allTokens.length} tokens.`,
  );
  process.exit(0);
}

console.error(`unknown mode: ${mode} (expected write | check)`);
process.exit(2);
