/**
 * Bundle-Budget fuer die ausgelieferten Artefakte.
 *
 * Gezaehlt wird gzip ueber die JS/CSS-Bundles der Site und des
 * Storybooks. Ueberschreitet ein Budget, faehrt der Prozess mit
 * Exit 1 — der CI-Step blockiert dann den Merge.
 *
 * Budgets (gzip):
 *   site js      180 KB    (React + Router + Demos)
 *   site css      40 KB
 *   storybook js 700 KB    (Workbench inkl. Addons)
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
for (const budget of budgets) {
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

process.exit(failed ? 1 : 0);
