/**
 * Snapshot budget.
 *
 * Chromatic bills snapshots, and snapshots multiply: stories times modes.
 * Adding the second theme quietly doubled the bill, and a per-variant
 * story habit multiplied it again — fourteen components were paying for
 * one image per variant when one matrix shows every variant at once.
 *
 * Two things this enforces, because a number nobody watches is not a
 * budget:
 *
 *   1. Every component has at least one snapshotted story. Opting the
 *      per-variant stories out is only safe while something still
 *      photographs the component.
 *   2. The projected total stays under a committed ceiling. When the
 *      ceiling has to move, it moves in a diff someone reviewed.
 *
 * Counting rules mirror Chromatic: a story is snapshotted unless
 * `chromatic.disableSnapshot` is set on it or on its meta, and each
 * snapshotted story costs one image per mode.
 *
 * Usage: tsx scripts/stories/snapshots.ts [report|check|write-budget]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["packages/ui/src/components", "packages/ui/src/foundations"];
const PREVIEW = "packages/ui/.storybook/preview.tsx";
const BUDGET = "packages/ui/snapshot-budget.json";

/** Modes declared globally in preview.tsx, e.g. light + dark. */
function globalModes(): number {
  const preview = readFileSync(PREVIEW, "utf8");
  const block = preview.match(/chromatic:\s*\{\s*modes:\s*\{([\s\S]*?)\n\s{4}\},/);
  if (!block) return 1;
  return Math.max(1, [...block[1]!.matchAll(/^\s{8}[\w"' -]+:\s*\{/gm)].length);
}

interface Story {
  component: string;
  name: string;
  snapshotted: boolean;
  modes: number;
}

function storyFiles(): string[] {
  return ROOTS.filter(existsSync).flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => f.endsWith(".stories.tsx"))
      .map((f) => join(dir, f)),
  );
}

/** The body of one exported story, up to the next top-level export. */
function bodies(source: string): Array<{ name: string; body: string }> {
  const out: Array<{ name: string; body: string }> = [];
  const hits = [...source.matchAll(/^export const (\w+)[^=]*=\s*\{/gm)];
  hits.forEach((hit, index) => {
    const start = hit.index!;
    const end = index + 1 < hits.length ? hits[index + 1]!.index! : source.length;
    out.push({ name: hit[1]!, body: source.slice(start, end) });
  });
  return out;
}

function countModes(body: string, fallback: number): number {
  const modes = body.match(/modes:\s*\{([\s\S]*?)\n\s*\},/);
  if (!modes) return fallback;
  const keys = [...modes[1]!.matchAll(/^\s*["'\w][\w"' -]*:\s*\{/gm)].length;
  return Math.max(1, keys);
}

const fallbackModes = globalModes();
const stories: Story[] = [];

for (const file of storyFiles()) {
  const source = readFileSync(file, "utf8");
  const component = file.split("/").pop()!.replace(".stories.tsx", "");
  const meta = source.match(/const meta = \{[\s\S]*?\} satisfies/);
  const metaOff = meta ? /disableSnapshot:\s*true/.test(meta[0]) : false;
  const metaModes = meta ? countModes(meta[0], fallbackModes) : fallbackModes;

  for (const { name, body } of bodies(source)) {
    if (name === "meta") continue;
    const off = metaOff || /disableSnapshot:\s*true/.test(body);
    stories.push({
      component,
      name,
      snapshotted: !off,
      modes: countModes(body, metaModes),
    });
  }
}

const snapshotted = stories.filter((s) => s.snapshotted);
const total = snapshotted.reduce((sum, s) => sum + s.modes, 0);

const byComponent = new Map<string, Story[]>();
for (const story of stories) {
  byComponent.set(story.component, [...(byComponent.get(story.component) ?? []), story]);
}
const uncovered = [...byComponent.entries()]
  .filter(([, list]) => !list.some((s) => s.snapshotted))
  .map(([component]) => component);

const mode = process.argv[2] ?? "report";

if (mode === "report") {
  console.log("Snapshot budget\n");
  console.log(`  stories                 ${stories.length}`);
  console.log(`  snapshotted             ${snapshotted.length}`);
  console.log(`  opted out               ${stories.length - snapshotted.length}`);
  console.log(`  global modes            ${fallbackModes}`);
  console.log(`  projected snapshots     ${total}\n`);

  const rows = [...byComponent.entries()]
    .map(([component, list]) => ({
      component,
      on: list.filter((s) => s.snapshotted),
      off: list.length - list.filter((s) => s.snapshotted).length,
    }))
    .sort((a, b) => b.off - a.off);
  console.log(`  ${"component".padEnd(20)} ${"snapshots".padEnd(10)} opted out`);
  for (const row of rows) {
    const cost = row.on.reduce((sum, s) => sum + s.modes, 0);
    console.log(`  ${row.component.padEnd(20)} ${String(cost).padEnd(10)} ${row.off}`);
  }
  if (uncovered.length) console.log(`\n  NO SNAPSHOT AT ALL: ${uncovered.join(", ")}`);
  process.exit(0);
}

if (mode === "write-budget") {
  writeFileSync(
    BUDGET,
    `${JSON.stringify(
      {
        note:
          "Projected Chromatic snapshots per full build: snapshotted stories x modes. " +
          "The check fails when this is exceeded, so a rise in the bill arrives as a " +
          "reviewable diff. Run `nx run ui:snapshot-budget-write` after an intentional change.",
        ceiling: total,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`budget written: ceiling ${total}`);
  process.exit(0);
}

if (mode === "check") {
  const failures: string[] = [];
  if (uncovered.length) {
    failures.push(
      `${uncovered.length} component(s) have no snapshotted story: ${uncovered.join(", ")}`,
    );
  }
  const committed = existsSync(BUDGET)
    ? (JSON.parse(readFileSync(BUDGET, "utf8")).ceiling as number)
    : Infinity;
  if (total > committed) {
    failures.push(
      `projected snapshots ${total} exceed the committed ceiling ${committed}. ` +
        `Either consolidate variants into a matrix story or raise the ceiling deliberately.`,
    );
  }
  if (failures.length) {
    console.error("Snapshot budget failed\n");
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(
    `Snapshot budget passed — ${total} projected snapshots ` +
      `(ceiling ${committed === Infinity ? "unset" : committed}), ` +
      `${uncovered.length} components without coverage.`,
  );
  process.exit(0);
}

console.error(`unknown mode: ${mode} (expected report | check | write-budget)`);
process.exit(2);
