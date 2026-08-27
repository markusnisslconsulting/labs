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
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
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
  /**
   * Every project declares the targets the gate list runs.
   *
   * `nx run-many -t lint` runs lint for the projects that *have* a lint
   * target and says nothing about the ones that do not. So a new package
   * arrives unlinted and the run stays green — which is what happened to
   * `ui-mcp`: added without a lint target, it carried two
   * `@nx/enforce-module-boundaries` errors through three green CI runs. One
   * was real. Its tests reached into `../../ui/src`, which is a dependency on
   * another package's file layout rather than on its published surface, and
   * the rule that exists to catch exactly that had never been pointed at the
   * file.
   *
   * `test` is exemptible with a reason and the other two are not: a project
   * can legitimately have nothing to unit-test, and cannot legitimately be
   * unchecked.
   */
  const NO_UNIT_TESTS: Record<string, string> = {
    site:
      "the site's checks are end-to-end: `site:a11y` drives the built pages " +
      "with Playwright and axe. A unit test over a page that is mostly " +
      "composition would assert the composition.",
  };

  it("every project declares lint and typecheck, and test or a reason", () => {
    const roots = ["packages", "apps"];
    const missing: string[] = [];

    for (const root of roots) {
      if (!existsSync(root)) continue;
      for (const entry of readdirSync(root)) {
        const config = join(root, entry, "project.json");
        if (!existsSync(config)) continue;
        const project = JSON.parse(readFileSync(config, "utf8")) as {
          name?: string;
          targets: Record<string, unknown>;
        };
        const targets = new Set(Object.keys(project.targets));
        const name = project.name ?? entry;

        for (const required of ["lint", "typecheck"]) {
          if (!targets.has(required)) {
            missing.push(`${name} has no ${required} target`);
          }
        }
        if (!targets.has("test") && !NO_UNIT_TESTS[name]) {
          missing.push(
            `${name} has no test target and no entry in NO_UNIT_TESTS`,
          );
        }
      }
    }

    expect(
      missing,
      "nx run-many runs a target for the projects that have it and reports " +
        "nothing about the projects that do not, so this is the only place " +
        "an unchecked project shows up",
    ).toEqual([]);
  });

  /**
   * A cached test declares every workspace file it reads.
   *
   * The general form of the two defects this file already records, and it
   * took a third instance to see it. `ui:test` reads `AGENTS.md`,
   * `CONTRIBUTING.md` and `docs/roadmap.md` — the citation checker in
   * `audit.spec.ts` is entirely about them — and declared none of them.
   * `default` covers `{projectRoot}/**` and `sharedGlobals` covers three
   * files at the root; a document two directories away is in neither.
   *
   * Measured: with those inputs undeclared, appending a citation of
   * `nothing/at/all.ts` to the roadmap and running `nx run ui:test` reported
   * "188 passed" from the cache. CI ran cold, caught it, and that is the
   * only reason it was ever seen.
   *
   * And writing this rule found a fourth: `build.spec.ts` reads `nx.json`,
   * so the gate about cache inputs was itself replayable when the cache
   * configuration changed.
   *
   * The check reads every path-shaped string literal in the specs rather
   * than only the arguments of `readFileSync`. That is deliberate: the
   * documents that started this are passed to `it.each` as a list and read
   * through a variable, so a scan of literal read calls finds `nx.json` and
   * misses the three that mattered — a gate that would have passed while the
   * bug was live.
   */
  it("every workspace file the tests read is an input", () => {
    const dir = "packages/ui/test";
    const named = new Map<string, string[]>();
    for (const entry of readdirSync(dir)) {
      if (!entry.endsWith(".spec.ts")) continue;
      const source = readFileSync(join(dir, entry), "utf8");
      for (const match of source.matchAll(
        /"([A-Za-z0-9_./-]+\.(?:ts|tsx|json|md|mjs|css|yml))"/g,
      )) {
        const path = match[1]!;
        /* Inside the project is covered by `default`; a relative specifier
           is an import rather than a file being read. */
        if (path.startsWith("packages/ui/") || path.startsWith(".")) continue;
        if (!existsSync(path)) continue;
        named.set(path, [...(named.get(path) ?? []), entry]);
      }
    }

    const declared = new Set(
      (
        JSON.parse(readFileSync("packages/ui/project.json", "utf8")) as {
          targets: Record<string, { inputs?: string[] }>;
        }
      ).targets["test"]?.inputs ?? [],
    );

    const undeclared = [...named.entries()]
      .filter(([path]) => !declared.has(`{workspaceRoot}/${path}`))
      .map(([path, where]) => `${path} (read by ${where.join(", ")})`);

    expect(
      undeclared,
      "these files are read by a cached test and are not among its inputs, " +
        "so editing one replays the previous result",
    ).toEqual([]);
  });

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
