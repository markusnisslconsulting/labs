/**
 * What a consumer actually downloads, asked of a real bundler.
 *
 * `scripts/check-size.mjs` reads our own emitted chunks and looks for a
 * component importing a stylesheet that is not its own. That is static
 * analysis of our output, and it has been wrong twice in the way static
 * analysis goes wrong: once matching only minified import statements
 * while the chunks are unminified — so it matched nothing and reported
 * success for every component — and once missing that 11 of 47 CSS
 * imports in the published package pointed at files the build never
 * wrote.
 *
 * This asks from the other side. It builds two applications that use one
 * component, one importing through the barrel and one by subpath, and
 * compares what Rollup kept. `sideEffects`, `exports`, the barrel's shape
 * and the per-component chunking all have to be right together for the
 * guarantee to hold, and only a bundler evaluates all four at once.
 *
 * Usage: node scripts/consumer/check.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

if (!existsSync(path.join(root, "dist/packages/ui/index.js"))) {
  console.log("- consumer probe: skipped (nothing built)");
  process.exit(0);
}

function build(entry) {
  execFileSync(
    "node",
    [
      path.join(root, "node_modules/vite/bin/vite.js"),
      "build",
      "--config",
      path.join(here, "vite.config.ts"),
    ],
    { cwd: root, env: { ...process.env, ENTRY: entry }, stdio: "pipe" },
  );
  const dir = path.join(here, ".out", entry);
  const files = readdirSync(dir);
  const css = files.filter((f) => f.endsWith(".css"));
  const js = files.filter((f) => f.endsWith(".js"));
  return {
    css: css.map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n"),
    js: js.map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n"),
  };
}

const barrel = build("barrel");
const subpath = build("subpath");
let failed = false;

/** Classes belonging to components the app never imported. */
const FOREIGN = [
  "uix-field",
  "uix-menu",
  "uix-dialog",
  "uix-table",
  "uix-tabs",
  "uix-accordion",
  "uix-switch",
  "uix-toast",
];

for (const [label, built] of [
  ["barrel", barrel],
  ["subpath", subpath],
]) {
  const leaked = FOREIGN.filter((cls) => built.css.includes(cls));
  if (leaked.length) {
    console.log(
      `✗ consumer probe (${label}): the CSS carries ${leaked.join(", ")} for ` +
        `components this app never imported`,
    );
    failed = true;
  }
  if (!built.css.includes("uix-button")) {
    console.log(
      `✗ consumer probe (${label}): Button's own CSS is missing from the ` +
        `bundle, so importing the component does not carry its styles`,
    );
    failed = true;
  }
}

/* The barrel must cost no more than the subpath. If it does, importing
   from "@labs/ui" is a penalty and every consumer has to know to reach
   for the deep path instead — which is the coupling the exports map
   exists to remove. */
if (barrel.css.length !== subpath.css.length) {
  console.log(
    `✗ consumer probe: the barrel yields ${barrel.css.length} bytes of CSS ` +
      `and the subpath ${subpath.css.length}. One component should cost the ` +
      `same either way.`,
  );
  failed = true;
}

if (!failed) {
  console.log(
    `✓ consumer probe: one component costs one component ` +
      `(${(barrel.css.length / 1024).toFixed(1)} KB css, ` +
      `${(barrel.js.length / 1024).toFixed(1)} KB js, barrel = subpath)`,
  );
}

process.exit(failed ? 1 : 0);
