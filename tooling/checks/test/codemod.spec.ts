/**
 * The token codemod, tested on the case that would have broken it.
 *
 * There is nothing to migrate right now — no token is both deprecated and
 * superseded — so the only way to know the transform works is to run it
 * against the strings it will one day see. The important one is a prefix
 * collision, and this repo is full of them: `--uix-radius-s` is a prefix
 * of `--uix-radius-surface`, and `--uix-gap-sm` of nothing yet but
 * `--uix-control-sm` of `--uix-control-sm-*` the moment someone adds one.
 * A bare string replace turns `var(--uix-radius-surface)` into
 * `var(--uix-radius-inseturface)` and the page keeps rendering, slightly
 * wrong, with no error anywhere.
 *
 * It lives here rather than in packages/ui/test because the code it tests
 * lives here. Putting it next to the token tests made `ui` import from
 * `scripts` while `scripts` already imports the registry from `ui`, and
 * the module-boundary rule reported the cycle immediately — which is what
 * that rule is for.
 */
import { describe, expect, it } from "vitest";

import { applyAll, rename } from "../tokens/codemod";

describe("token codemod", () => {
  it("rewrites a var() call", () => {
    expect(
      rename(
        "  border-radius: var(--uix-radius-m);",
        "--uix-radius-m",
        "--uix-radius-control",
      ),
    ).toBe("  border-radius: var(--uix-radius-control);");
  });

  it("rewrites a declaration and a fallback in the same line", () => {
    expect(
      rename("--uix-old: var(--uix-old, 1rem);", "--uix-old", "--uix-new"),
    ).toBe("--uix-new: var(--uix-new, 1rem);");
  });

  it("rewrites a string literal in TypeScript", () => {
    expect(
      rename('t("--uix-old", "1rem", "semantic")', "--uix-old", "--uix-new"),
    ).toBe('t("--uix-new", "1rem", "semantic")');
  });

  it("does not rewrite a token that merely starts with the same text", () => {
    const source =
      "a { border-radius: var(--uix-radius-surface); }\n" +
      "b { border-radius: var(--uix-radius-s); }";
    const out = rename(source, "--uix-radius-s", "--uix-radius-inset");
    expect(out, "the longer name was corrupted by a prefix match").toContain(
      "--uix-radius-surface",
    );
    expect(out).toContain("--uix-radius-inset");
    expect(out).not.toContain("--uix-radius-inseturface");
  });

  it("applies several renames and reports which ones matched", () => {
    const { text, hits } = applyAll(
      "var(--uix-a) var(--uix-b)",
      new Map([
        ["--uix-a", "--uix-x"],
        ["--uix-b", "--uix-y"],
        ["--uix-c", "--uix-z"],
      ]),
    );
    expect(text).toBe("var(--uix-x) var(--uix-y)");
    // Only the renames that actually changed something are reported, so a
    // dry run's output is a list of work rather than a list of rules.
    expect(hits.map(([from]) => from)).toEqual(["--uix-a", "--uix-b"]);
  });
});
