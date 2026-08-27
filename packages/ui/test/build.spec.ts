/**
 * The build cache has to see the files the build is made of.
 *
 * This file exists because of one measured defect. `build-storybook` was
 * given the `production` input set, copied from `build` — and `production`
 * ends with an exclusion for every `*.stories.tsx` in the project.
 *
 * That exclusion is correct for `build` and deliberate: the library bundle
 * does not contain stories, so a story change must not invalidate it, which
 * ADR 0009 records as a reason. Reused on `build-storybook` it inverts,
 * because a Storybook build is *made of* stories.
 *
 * Measured. With a warm cache and one word changed in a story:
 *
 *     production inputs -> Cache: 1/1 hit (100%), the word never reached dist
 *     storybook inputs  -> Cache: 0/1 hit, the word is in the emitted chunk
 *
 * The cost was not the stale bundle. Four gates depend on that build —
 * `browser-test`, `visual-test`, `visual-sweep`, `visual-axes` — so each of
 * them was testing the *previous* set of stories whenever the cache was
 * warm, and reporting success about a build nobody had made. Working around
 * it with `--skip-nx-cache` treats a wrong cache as a fact of life; the
 * cache was simply configured to ignore the input that matters.
 *
 * Both halves are asserted, because the two targets have to *differ* and a
 * single-sided rule invites somebody to make them the same.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface NxConfig {
  namedInputs: Record<string, string[]>;
  targetDefaults: Record<string, { inputs?: string[] }>;
}

const nx = JSON.parse(readFileSync("nx.json", "utf8")) as NxConfig;

/**
 * Flatten a target's inputs, following named-input references.
 *
 * Nx resolves a bare string as a named input when one exists and as a glob
 * otherwise, so this does the same. Depth is bounded by the set of names,
 * which is what stops a cycle.
 */
function patterns(target: string): string[] {
  const start = nx.targetDefaults[target]?.inputs;
  if (!start) throw new Error(`${target} declares no inputs`);

  const out: string[] = [];
  const seen = new Set<string>();
  const queue = [...start];
  while (queue.length) {
    const entry = queue.shift() as string;
    const named = nx.namedInputs[entry];
    if (named && !seen.has(entry)) {
      seen.add(entry);
      queue.push(...named);
      continue;
    }
    if (!named) out.push(entry);
  }
  return out;
}

/** Whether the resolved set excludes story files. */
const excludesStories = (target: string) =>
  patterns(target).some(
    (pattern) => pattern.startsWith("!") && pattern.endsWith("*.stories.tsx"),
  );

describe("nx cache inputs", () => {
  it("the storybook build sees stories", () => {
    expect(
      excludesStories("build-storybook"),
      "build-storybook excludes *.stories.tsx from its inputs, so editing a " +
        "story leaves the cache warm and every gate that depends on this " +
        "build tests the previous one",
    ).toBe(false);
  });

  it("the library build does not, and that is deliberate", () => {
    expect(
      excludesStories("build"),
      "build now sees stories, so a story change invalidates the library " +
        "bundle it is not part of. ADR 0009 gives the reason for the " +
        "exclusion; if it has been removed on purpose, change the ADR in " +
        "the same commit",
    ).toBe(true);
  });
});
