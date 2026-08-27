/**
 * A change to the public API surface needs a line in the changelog.
 *
 * Stage 07 asks for "semver applied to components, not the repository", and
 * `packages/ui/api-surface.md` made the first half possible: which component
 * moved is a line in a diff rather than a reading exercise. This is the
 * second half. Without it the surface file records the change and nothing
 * requires anyone to say what it means — and a changelog that is right when
 * somebody remembers is a changelog nobody can trust for a version number.
 *
 * What it checks, and only this: if `api-surface.md` differs from the base,
 * `CHANGELOG.md` differs too. It does not read the entry, does not match it
 * to a component, and does not judge the level. A check that tried would be
 * guessing at prose, and the thing worth enforcing mechanically is that
 * somebody was made to write one.
 *
 * The base comes from the same place CI's `nx affected` gets it, because two
 * ways of deciding "what changed" that can disagree is how a gate ends up
 * reporting on a different diff than the one being reviewed.
 *
 * Usage:
 *   node scripts/changelog-gate.mjs              # against HEAD~1
 *   node scripts/changelog-gate.mjs origin/main  # against a base
 */
import { execFileSync } from "node:child_process";

const SURFACE = "packages/ui/api-surface.md";
const CHANGELOG = "CHANGELOG.md";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

const base = process.argv[2] ?? process.env["NX_BASE"] ?? "HEAD~1";

let changed;
try {
  /* Three dots: what this branch changed since it left the base, rather
     than every difference between two points. Two dots would report a
     surface change somebody else made on main as this branch's. */
  changed = git("diff", "--name-only", `${base}...HEAD`).split("\n");
} catch {
  /* A shallow clone or a first commit has no base to compare against. That
     is a fact about the checkout rather than a verdict about the change, so
     it says so and passes — the same shape as check-size skipping when
     nothing is built. CI uses fetch-depth: 0 precisely so this does not
     happen there. */
  console.log(`- changelog gate: skipped (no base "${base}" in this clone)`);
  process.exit(0);
}

const movedSurface = changed.includes(SURFACE);
const movedChangelog = changed.includes(CHANGELOG);

if (movedSurface && !movedChangelog) {
  console.error(
    `${SURFACE} changed and ${CHANGELOG} did not.\n\n` +
      `  A component's public API moved in this change. Somebody importing\n` +
      `  that component needs to know, and which component it was is the\n` +
      `  thing a per-component version number is built from.\n\n` +
      `  Add an entry under the right level — breaking, added, fixed or\n` +
      `  internal — naming the component. If the surface change really is\n` +
      `  internal, say so there; "internal" is an answer and silence is not.\n`,
  );
  process.exit(1);
}

console.log(
  movedSurface
    ? `✓ changelog gate: the API surface moved and ${CHANGELOG} has an entry`
    : `✓ changelog gate: the API surface did not move`,
);
