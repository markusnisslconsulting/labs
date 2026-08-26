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
 * IMPORTANT: the total here is an ESTIMATE, and it has been wrong twice.
 * Measured builds captured 240 and then 204 snapshots where this model
 * said 114 and 100. The authoritative number is the one Chromatic prints
 * ("captured N snapshots"), and the gap is not yet explained. Use this to
 * catch a story-count regression, not to predict a bill.
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

/** How many modes each named set in .storybook/modes.ts declares. */
function namedModes(): Record<string, number> {
  const source = readFileSync("packages/ui/.storybook/modes.ts", "utf8");
  const base = (
    source.match(/const BASE = \{([\s\S]*?)\} as const;/)?.[1] ?? ""
  )
    .split("\n")
    .filter((line) => /^\s*\w+:\s*\{/.test(line)).length;
  const out: Record<string, number> = {};
  for (const hit of source.matchAll(
    /export const (\w+) = \{([\s\S]*?)\} as const;/g,
  )) {
    const own = hit[2]!
      .split("\n")
      .filter((line) => /^\s*[\w"']+:\s*\{/.test(line)).length;
    out[hit[1]!] = (/\.\.\.BASE/.test(hit[2]!) ? base : 0) + own;
  }
  return out;
}

/** Modes declared globally in preview.tsx, e.g. light + dark. */
function globalModes(): number {
  const preview = readFileSync(PREVIEW, "utf8");
  // `modes` does not have to be the first key inside `chromatic`, and
  // assuming it was made this return 1 and undercount the projection.
  const block = preview.match(/\n(\s*)modes:\s*\{([\s\S]*?)\n\1\},/);
  if (!block) return 1;
  return Math.max(
    1,
    [...block[2]!.matchAll(/^\s*[\w"'][\w"' -]*:\s*\{/gm)].length,
  );
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
    const end =
      index + 1 < hits.length ? hits[index + 1]!.index! : source.length;
    out.push({ name: hit[1]!, body: source.slice(start, end) });
  });
  return out;
}

function countModes(
  body: string,
  fallback: number,
  named: Record<string, number>,
): number {
  // `modes: { ...NARROW }` resolves through the named set; a literal
  // object is counted by its keys.
  const spread = body.match(/modes:\s*\{\s*\.\.\.(\w+)\s*\}/);
  if (spread && named[spread[1]!]) return named[spread[1]!]!;
  const modes = body.match(/modes:\s*\{([\s\S]*?)\n\s*\},/);
  if (!modes) return fallback;
  const keys = [...modes[1]!.matchAll(/^\s*["'\w][\w"' -]*:\s*\{/gm)].length;
  return Math.max(1, keys);
}

const fallbackModes = globalModes();
const named = namedModes();
const stories: Story[] = [];

for (const file of storyFiles()) {
  const source = readFileSync(file, "utf8");
  const component = file.split("/").pop()!.replace(".stories.tsx", "");
  const meta = source.match(/const meta = \{[\s\S]*?\} satisfies/);
  const metaOff = meta ? /disableSnapshot:\s*true/.test(meta[0]) : false;
  const metaModes = meta
    ? countModes(meta[0], fallbackModes, named)
    : fallbackModes;

  for (const { name, body } of bodies(source)) {
    if (name === "meta") continue;
    // Opt-in: the project default in preview.tsx is disabled, so a story
    // is only photographed when it says so.
    const on = /disableSnapshot:\s*false/.test(body);
    stories.push({
      component,
      name,
      snapshotted: on && !metaOff,
      modes: countModes(body, metaModes, named),
    });
  }
}

const snapshotted = stories.filter((s) => s.snapshotted);
const total = snapshotted.reduce((sum, s) => sum + s.modes, 0);

const byComponent = new Map<string, Story[]>();
for (const story of stories) {
  byComponent.set(story.component, [
    ...(byComponent.get(story.component) ?? []),
    story,
  ]);
}
/**
 * Pages that prove a contract rather than show a picture.
 *
 * Foundations/Contract asserts that a ref reaches a DOM element. Its
 * output is a list of tag names; photographing it would cost a snapshot
 * per theme to watch text that is only ever read by an assertion.
 */
const NOT_VISUAL: Record<string, string> = {
  Contract: "asserts the ref contract; its output is text for a test",
};

const uncovered = [...byComponent.entries()]
  .filter(([, list]) => !list.some((s) => s.snapshotted))
  .map(([component]) => component)
  .filter((component) => !NOT_VISUAL[component]);

const mode = process.argv[2] ?? "report";

if (mode === "report") {
  console.log("Snapshot budget\n");
  console.log(`  stories                 ${stories.length}`);
  console.log(`  snapshotted             ${snapshotted.length}`);
  console.log(
    `  opted out               ${stories.length - snapshotted.length}`,
  );
  console.log(`  global modes            ${fallbackModes}`);
  console.log(
    `  estimated snapshots     ${total}   (Chromatic is authoritative)\n`,
  );

  const rows = [...byComponent.entries()]
    .map(([component, list]) => ({
      component,
      on: list.filter((s) => s.snapshotted),
      off: list.length - list.filter((s) => s.snapshotted).length,
    }))
    .sort((a, b) => b.off - a.off);
  console.log(
    `  ${"component".padEnd(20)} ${"snapshots".padEnd(10)} opted out`,
  );
  for (const row of rows) {
    const cost = row.on.reduce((sum, s) => sum + s.modes, 0);
    console.log(
      `  ${row.component.padEnd(20)} ${String(cost).padEnd(10)} ${row.off}`,
    );
  }
  if (uncovered.length)
    console.log(`\n  NO SNAPSHOT AT ALL: ${uncovered.join(", ")}`);
  process.exit(0);
}

if (mode === "write-budget") {
  writeFileSync(
    BUDGET,
    `${JSON.stringify(
      {
        note:
          "ESTIMATED snapshots per full build (snapshotted stories x modes). This model has " +
          "under-counted twice against real builds (240 and 204 measured vs 114 and 100 " +
          "estimated), so treat it as a regression guard, not a bill forecast. " +
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
      `estimated snapshots ${total} exceed the committed ceiling ${committed}. ` +
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
