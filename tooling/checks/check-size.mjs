/** Gzip bundle budgets plus component stylesheet isolation and import integrity. */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { importedSize } from "@labs/tools/package-sizes";

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

function globalStyleBudget() {
  const entry = "dist/packages/ui/styles.css";
  return existsSync(entry)
    ? [
        {
          label: "global styles",
          bytes: importedSize(entry).css,
          // Includes explicit density resets and brand-scope precedence.
          max: 4.1 * 1024,
        },
      ]
    : [];
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
 * component costs one component. Reuse is the exception and it has to be
 * declared: a composite component legitimately pulls the stylesheets of
 * the components it renders, and the map below says which. Anything else
 * is a leak, and a leak here is invisible — the page simply downloads more
 * than it used.
 */
function checkCssIsolation() {
  const dir = "dist/packages/ui/components";
  if (!existsSync(dir)) return false;
  /* A component may pull the stylesheet of a component it actually
     renders. Each entry says which and, by naming it here, makes the
     dependency a decision in the repository rather than something the
     bundle does quietly. Anything not listed is a leak. */
  const allowed = {
    // Their triggers *are* buttons.
    Menu: ["Button"],
    Popover: ["Button"],
    // It renders Avatars; the ring and the overlap are all it adds.
    AvatarGroup: ["Avatar"],
    // One half is a Button, and the popup is a Menu — its parts are
    // Menu's, re-exported rather than a second copy of them.
    SplitButton: ["Button", "Menu"],
  };
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
for (const budget of [...budgets, ...globalStyleBudget()]) {
  if (budget.bytes !== undefined) {
    const total = budget.bytes;
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
    console.log(`- ${budget.label}: skipped (nothing built)`);
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
    `  global stylesheet total: ${worst.label} at ` +
      `${(worst.total / 1024).toFixed(1)} KB gzip`,
  );
}

process.exit(failed ? 1 : 0);
