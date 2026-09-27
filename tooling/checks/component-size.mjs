/** Per-component gzip ratchet over static internal imports; external dependencies are excluded. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { measureComponents } from "@labs/tools/package-sizes";

const DIST = "dist/packages/ui";
const BASELINE = "packages/ui/component-size.baseline.json";
const TOLERANCE = { fraction: 0.12, bytes: 150 };

const measured = existsSync(DIST) ? measureComponents(DIST) : null;
if (!measured) {
  console.log("- component size: skipped (nothing built)");
  process.exit(0);
}

const baseline = existsSync(BASELINE)
  ? JSON.parse(readFileSync(BASELINE, "utf8"))
  : { note: "", components: {} };

const mode = process.argv[2] ?? "report";
const names = Object.keys(measured).sort();

if (mode === "write") {
  /* The note is the audit trail — it carries why the numbers last moved,
     which is the only part of this file a reviewer can judge. Kept when it
     exists, so raising a baseline does not erase the reason the previous
     one was chosen; the reason for a move is then a deliberate edit next
     to the numbers. Same fix as `tooling/checks/stories/snapshots.ts`, which had
     the same flaw. */
  const previousNote = baseline.note || undefined;

  writeFileSync(
    BASELINE,
    `${JSON.stringify(
      {
        note:
          previousNote ??
          "Gzipped bytes a consumer downloads per component, counted " +
            "transitively: the component's chunk plus every shared chunk and " +
            "stylesheet it imports. A ratchet, not a ceiling — the check " +
            "fails when one rises past its tolerance and when one drops well " +
            "below without this file being tightened. Run " +
            "`node tooling/checks/component-size.mjs write` after a deliberate change.",
        tolerance: TOLERANCE,
        components: Object.fromEntries(
          names.map((name) => [name, measured[name].total]),
        ),
      },
      null,
      2,
    )}\n`,
  );
  console.log(`component size baseline written for ${names.length} components`);
  process.exit(0);
}

const allowance = (committed) =>
  committed + Math.max(committed * TOLERANCE.fraction, TOLERANCE.bytes);

const failures = [];
for (const name of names) {
  const committed = baseline.components?.[name];
  const now = measured[name].total;
  if (committed === undefined) {
    failures.push(
      `${name} has no committed size. Run ` +
        `\`node tooling/checks/component-size.mjs write\` so its cost is a number ` +
        `someone chose.`,
    );
    continue;
  }
  if (now > allowance(committed)) {
    failures.push(
      `${name} grew to ${(now / 1024).toFixed(2)} KB from a committed ` +
        `${(committed / 1024).toFixed(2)} KB. Either the growth is intended ` +
        `— then write the baseline — or something was pulled in that this ` +
        `component does not need.`,
    );
  }
  // A saving that is not committed is a saving that can be given back.
  if (now < committed - Math.max(committed * 0.2, 250)) {
    failures.push(
      `${name} is now ${(now / 1024).toFixed(2)} KB against a committed ` +
        `${(committed / 1024).toFixed(2)} KB. Tighten the baseline so the ` +
        `gain holds.`,
    );
  }
}
for (const name of Object.keys(baseline.components ?? {})) {
  if (!measured[name]) {
    failures.push(`${name} is in the baseline and no longer built`);
  }
}

if (mode === "report") {
  const rows = names
    .map((name) => ({ name, ...measured[name] }))
    .sort((a, b) => b.total - a.total);
  console.log("Component size, gzip, transitive\n");
  console.log(
    `  ${"component".padEnd(19)}${"total".padStart(8)}${"js".padStart(8)}` +
      `${"css".padStart(8)}${"committed".padStart(11)}`,
  );
  for (const row of rows) {
    const committed = baseline.components?.[row.name];
    console.log(
      `  ${row.name.padEnd(19)}${(row.total / 1024).toFixed(2).padStart(8)}` +
        `${(row.js / 1024).toFixed(2).padStart(8)}` +
        `${(row.css / 1024).toFixed(2).padStart(8)}` +
        `${(committed === undefined ? "—" : (committed / 1024).toFixed(2)).padStart(11)}`,
    );
  }
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  console.log(
    `\n  ${rows.length} components, largest ${rows[0].name} at ` +
      `${(rows[0].total / 1024).toFixed(2)} KB, sum ` +
      `${(total / 1024).toFixed(1)} KB — which nobody downloads, because ` +
      `one component costs one component.`,
  );
  if (failures.length) {
    console.log("\n  Problems\n");
    for (const failure of failures) console.log(`    - ${failure}`);
  }
  process.exit(0);
}

if (failures.length) {
  console.error("Component size failed\n");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
const largest = names.reduce(
  (worst, name) =>
    measured[name].total > measured[worst].total ? name : worst,
  names[0],
);
console.log(
  `✓ component size: ${names.length} within tolerance, largest ${largest} ` +
    `at ${(measured[largest].total / 1024).toFixed(2)} KB gzip`,
);
