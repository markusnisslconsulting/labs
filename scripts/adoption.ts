/**
 * Component coverage: how much of the product is built from the system.
 *
 * The metric every design-system maturity model names first, and the one
 * this repo did not have. Everything here measured the system against
 * itself — tokens parity, story coverage, contrast — which says whether
 * the system is *correct* and nothing about whether it is *used*. A
 * design system with perfect gates and one consumer that reimplements
 * buttons in local CSS is a failed design system with a green pipeline.
 *
 * What is counted, per product file:
 *
 *   - **System elements**: JSX tags that resolve to an import from
 *     `@labs/ui`.
 *   - **Bespoke elements**: JSX tags carrying a class the product invented
 *     — anything that is not a `uix-` class. A `<div>` with no class is
 *     layout and counted as neither; it is not a missed component.
 *
 * Coverage is system / (system + bespoke). It is deliberately not 100%:
 * a product needs page scaffolding the system has no opinion about. The
 * number matters as a direction, so `check` holds it against a committed
 * floor and fails when it drops — the same ratchet shape the snapshot
 * budget and the deprecation baseline use.
 *
 * Usage: tsx scripts/adoption.ts [report|check|write-floor]
 */
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { argv, exit } from "node:process";

const PRODUCTS = ["apps/site/src"];
const FLOOR = "packages/ui/adoption-floor.json";

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (entry.endsWith(".tsx")) out.push(path);
  }
  return out;
}

interface FileReport {
  file: string;
  system: number;
  bespoke: number;
  components: Map<string, number>;
}

function inspect(file: string): FileReport {
  const source = readFileSync(file, "utf8");

  // What this file imports from the design system, including aliases.
  const imported = new Set<string>();
  for (const hit of source.matchAll(
    /import\s*\{([^}]+)\}\s*from\s*["']@labs\/ui[^"']*["']/g,
  )) {
    for (const part of hit[1]!.split(",")) {
      const name = part
        .trim()
        .split(/\s+as\s+/)
        .pop()!
        .replace(/^type\s+/, "");
      if (name) imported.add(name.trim());
    }
  }

  const components = new Map<string, number>();
  let system = 0;
  for (const hit of source.matchAll(/<([A-Z][\w.]*)/g)) {
    // `Card.Body` belongs to `Card`.
    const root = hit[1]!.split(".")[0]!;
    if (!imported.has(root)) continue;
    system += 1;
    components.set(hit[1]!, (components.get(hit[1]!) ?? 0) + 1);
  }

  // A class the product invented. `uix-` classes are the system's own, so
  // a product reusing one is using the system, not working around it.
  let bespoke = 0;
  for (const hit of source.matchAll(/className=["']([^"']+)["']/g)) {
    const classes = hit[1]!.split(/\s+/).filter(Boolean);
    if (classes.length && classes.every((name) => !name.startsWith("uix-"))) {
      bespoke += 1;
    }
  }

  return { file, system, bespoke, components };
}

const reports = PRODUCTS.filter(existsSync).flatMap((root) =>
  walk(root).map(inspect),
);
const system = reports.reduce((sum, r) => sum + r.system, 0);
const bespoke = reports.reduce((sum, r) => sum + r.bespoke, 0);
const total = system + bespoke;
const coverage = total ? Math.round((system / total) * 1000) / 10 : 0;

const usage = new Map<string, number>();
for (const report of reports) {
  for (const [name, count] of report.components) {
    usage.set(name, (usage.get(name) ?? 0) + count);
  }
}

const mode = argv[2] ?? "report";

if (mode === "report") {
  console.log("Component coverage\n");
  console.log(`  system elements         ${system}`);
  console.log(`  bespoke elements        ${bespoke}`);
  console.log(`  coverage                ${coverage}%\n`);

  const worst = [...reports]
    .filter((r) => r.bespoke > 0)
    .sort((a, b) => b.bespoke - a.bespoke)
    .slice(0, 8);
  console.log(
    "  Most bespoke markup — where a component is missing or unknown",
  );
  for (const r of worst) {
    console.log(
      `  ${r.file.replace("apps/site/src/", "").padEnd(42)} ${String(r.bespoke).padStart(3)} bespoke, ${r.system} system`,
    );
  }

  console.log("\n  Most used components");
  for (const [name, count] of [...usage]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)) {
    console.log(`  ${name.padEnd(24)} ${count}`);
  }

  // The other half of adoption: what the system ships and nobody wants.
  const shipped = readdirSync("packages/ui/src/components")
    .filter((f) => f.endsWith(".tsx") && !f.includes(".stories."))
    .map((f) => f.replace(/\.tsx$/, ""));
  const unused = shipped.filter(
    (name) => ![...usage.keys()].some((used) => used.split(".")[0] === name),
  );
  console.log(
    `\n  Shipped but unused by any product (${unused.length}/${shipped.length}):`,
  );
  console.log(`  ${unused.join(", ")}`);
  exit(0);
}

if (mode === "write-floor") {
  writeFileSync(
    FLOOR,
    `${JSON.stringify(
      {
        note:
          "Component coverage may not fall below this. Raise it when it rises; " +
          "lowering it is a decision that belongs in a reviewed diff, not in a " +
          "quiet afternoon of local CSS. Run `nx run ui:adoption-write-floor`.",
        coverage,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`floor written: ${coverage}%`);
  exit(0);
}

if (mode === "check") {
  const floor = existsSync(FLOOR)
    ? (JSON.parse(readFileSync(FLOOR, "utf8")).coverage as number)
    : 0;
  if (coverage < floor) {
    console.error(
      `Component coverage fell to ${coverage}%, below the committed floor of ${floor}%.\n\n` +
        `  Something was built with local markup that the system could have ` +
        `provided, or a component was replaced by hand-rolled CSS. Run\n` +
        `  \`nx run ui:adoption-report\` to see which files.`,
    );
    exit(1);
  }
  console.log(
    `Component coverage ${coverage}% (floor ${floor}%) — ${system} system, ${bespoke} bespoke.`,
  );
  exit(0);
}

console.error(`unknown mode: ${mode} (expected report | check | write-floor)`);
exit(2);
