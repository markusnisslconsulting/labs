/**
 * Bundle-Budget fuer die ausgelieferten Artefakte.
 *
 * Gezaehlt wird gzip ueber die JS/CSS-Bundles der Site und des
 * Storybooks. Ueberschreitet ein Budget, faehrt der Prozess mit
 * Exit 1 — der CI-Step blockiert dann den Merge.
 *
 * Budgets (gzip):
 *   site js      220 KB    (React + Router + Demos)
 *   site css      60 KB
 *   storybook js 2600 KB   (Workbench inkl. Addons)
 *   token floor     4 KB   (was 10,7 KB, weil die kommentierten
 *                           Quelldateien unveraendert kopiert wurden)
 *   je Komponente   3 KB   (Median liegt bei 0,9 KB)
 *
 * Die letzten beiden sind neu und der Grund ist gemessen: das
 * veroeffentlichte Token-Layer war 31 KB, davon der grosse Teil
 * Kommentare fuer Wartende. Ein Konsument laedt die Kaskade, nicht die
 * Begruendung.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

function gzipSize(file) {
  return gzipSync(readFileSync(file)).length;
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(js|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

/**
 * Per-component cost, and the floor every page pays.
 *
 * A single number over the whole library hides the case that matters: one
 * component quietly growing. The floor is separate because it is the only
 * thing a page pays before it has used anything.
 */
function componentBudgets() {
  const dir = "dist/packages/ui";
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(path.join(dir, "components"))) {
    if (!entry.endsWith(".js")) continue;
    const name = entry.replace(/\.js$/, "");
    const files = [path.join(dir, "components", entry)];
    const css = path.join(dir, `${name}.css`);
    if (existsSync(css)) files.push(css);
    out.push({
      label: `component ${name}`,
      files,
      max: 3 * 1024,
      quiet: true,
    });
  }
  out.push({
    label: "token floor",
    files: walk(path.join(dir, "styles")),
    max: 4 * 1024,
  });
  return out;
}

const budgets = [
  { label: "site js", dir: "apps/site/dist", test: /\.js$/, max: 220 * 1024 },
  { label: "site css", dir: "apps/site/dist", test: /\.css$/, max: 60 * 1024 },
  {
    label: "storybook js",
    dir: "dist/packages/ui-storybook",
    test: /\.js$/,
    max: 2600 * 1024,
  },
];

let failed = false;
/**
 * No component pulls another component's CSS, except where it is reuse.
 *
 * The per-component split is only worth anything if importing one
 * component costs one component. Menu and Popover each pull Button.css
 * because their triggers *are* buttons, which is reuse and is documented;
 * anything else is a leak, and a leak here is invisible — the page simply
 * downloads more than it used.
 */
function checkCssIsolation() {
  const dir = "dist/packages/ui/components";
  if (!existsSync(dir)) return false;
  const allowed = { Menu: ["Button"], Popover: ["Button"] };
  let leaked = false;
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".js")) continue;
    const name = entry.replace(/\.js$/, "");
    const code = readFileSync(path.join(dir, entry), "utf8");
    // Whitespace optional. The first version matched only the minified
    // form and the emitted chunks are not minified, so it matched nothing
    // and the check passed for every component — a gate that reports
    // success because it looked in the wrong place.
    const sheets = [
      ...code.matchAll(/import\s*["']\.\.\/([\w-]+)\.css["']/g),
    ].map((hit) => hit[1]);
    const extra = sheets.filter(
      (sheet) =>
        sheet !== name &&
        !sheet.startsWith("_") &&
        !(allowed[name] ?? []).includes(sheet),
    );
    if (extra.length) {
      console.log(`✗ ${name} also pulls ${extra.join(", ")}.css`);
      leaked = true;
    }
  }
  if (!leaked)
    console.log("✓ css isolation: no unexpected cross-component CSS");
  return leaked;
}

/**
 * Every stylesheet a built component imports has to exist.
 *
 * Measured before this existed: 11 of 47 imports in `dist` pointed at
 * files the build never wrote. `_field.css` was imported by ten
 * components and shipped under a different name; TextField had no
 * stylesheet at all. Neither publint, nor attw, nor the isolation check
 * below noticed, because none of them resolves an import — they check
 * shape, types and *unexpected* sheets, and a missing one is none of
 * those three.
 *
 * A consumer would have found it immediately, which is the point: the
 * cheapest gate is the one that does what a consumer does.
 */
function checkCssResolves() {
  const dir = "dist/packages/ui/components";
  if (!existsSync(dir)) return false;
  const dead = [];
  let total = 0;
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".js")) continue;
    const code = readFileSync(path.join(dir, entry), "utf8");
    for (const hit of code.matchAll(
      /import\s*["'](\.\.?\/[\w./-]+\.css)["']/g,
    )) {
      total += 1;
      const target = path.resolve(dir, hit[1]);
      if (!existsSync(target)) {
        dead.push(`${entry.replace(/\.js$/, "")} -> ${hit[1]}`);
      }
    }
  }
  if (dead.length) {
    console.log(
      `✗ css imports: ${dead.length} of ${total} point at nothing:\n  ` +
        dead.join("\n  "),
    );
    return true;
  }
  console.log(`✓ css imports: all ${total} resolve`);
  return false;
}

let worst = { label: "", total: 0 };
for (const budget of [...budgets, ...componentBudgets()]) {
  if (budget.files) {
    const total = budget.files.reduce((sum, file) => sum + gzipSize(file), 0);
    const ok = total <= budget.max;
    if (total > worst.total) worst = { label: budget.label, total };
    if (!ok || !budget.quiet) {
      console.log(
        `${ok ? "✓" : "✗"} ${budget.label}: ${(total / 1024).toFixed(1)} KB gzip ` +
          `(Budget ${(budget.max / 1024).toFixed(0)} KB)`,
      );
    }
    if (!ok) failed = true;
    continue;
  }
  if (!existsSync(budget.dir)) {
    console.log(`- ${budget.label}: übersprungen (nichts gebaut)`);
    continue;
  }
  const total = walk(budget.dir)
    .filter((file) => budget.test.test(file))
    .reduce((sum, file) => sum + gzipSize(file), 0);
  const kb = (total / 1024).toFixed(1);
  const ok = total <= budget.max;
  console.log(
    `${ok ? "✓" : "✗"} ${budget.label}: ${kb} KB gzip (Budget ${(
      budget.max / 1024
    ).toFixed(0)} KB)`,
  );
  if (!ok) failed = true;
}

if (checkCssIsolation()) failed = true;
if (checkCssResolves()) failed = true;

if (worst.label) {
  console.log(
    `  largest single component or floor: ${worst.label} at ` +
      `${(worst.total / 1024).toFixed(1)} KB gzip`,
  );
}

process.exit(failed ? 1 : 0);
