/**
 * The two audit records stage 06 asks for, checked for structure rather
 * than for outcome.
 *
 * Neither a WCAG conformance table nor a screen-reader matrix can be
 * satisfied by a test. What a test can do is refuse to let them rot:
 * every component has a row, every criterion appears once with evidence,
 * and every row claiming a check cites a file that exists — which is how
 * these tables usually go wrong, written once and then a file renamed.
 *
 * This lives beside the other specs rather than in `scripts/`, because
 * the records are the ui project's own data and a root script reaching
 * into `packages/ui/src` by relative path is what
 * `@nx/enforce-module-boundaries` exists to stop. The counts a person
 * wants to read are on the Guides/Conformance page, rendered from the
 * same two files.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PAIRINGS, SCREEN_READER_MATRIX } from "../src/audit/screen-readers";
import { WCAG_22_AA } from "../src/audit/wcag";

const COMPONENTS = "packages/ui/src/components";

/** The components the library ships. */
function shipped(): string[] {
  return readdirSync(COMPONENTS)
    .filter((file) => file.endsWith(".tsx") && !file.includes(".stories."))
    .map((file) => file.replace(/\.tsx$/, ""))
    .sort();
}

describe("the screen-reader matrix", () => {
  const rows = new Map(SCREEN_READER_MATRIX.map((row) => [row.component, row]));

  it("has a row for every component the library ships", () => {
    const missing = shipped().filter((name) => !rows.has(name));
    expect(
      missing,
      `no screen-reader row for these. Add one with the reason its ` +
        `announcement is worth a pass, or the matrix silently stops ` +
        `covering the library as it grows.`,
    ).toEqual([]);
  });

  it("has no row for a component that no longer exists", () => {
    const extra = [...rows.keys()].filter((name) => !shipped().includes(name));
    expect(extra, "rows for components the library no longer ships").toEqual(
      [],
    );
  });

  /**
   * A dated cell has to be readable and has to say something.
   *
   * Every cell reads `null` today — nobody has run a screen reader against
   * this library, and the record says so rather than guessing. These two
   * rules are what keep the first filled cell honest: a date a tool cannot
   * parse cannot go stale, and a pass with nothing written down is
   * indistinguishable from no pass at all.
   */
  const filled = SCREEN_READER_MATRIX.flatMap((row) =>
    PAIRINGS.map((pairing) => ({
      where: `${row.component} / ${pairing.id}`,
      cell: row.cells[pairing.id],
    })),
  ).filter((entry) => entry.cell.checked !== null);

  it("dates every pass in ISO form", () => {
    const bad = filled
      .filter((entry) => !/^\d{4}-\d{2}-\d{2}$/.test(entry.cell.checked!))
      .map((entry) => `${entry.where} = ${entry.cell.checked}`);
    expect(bad, "a date a tool cannot read cannot go stale").toEqual([]);
  });

  it("records what was heard on every pass", () => {
    const silent = filled
      .filter((entry) => !entry.cell.notes)
      .map((entry) => entry.where);
    expect(
      silent,
      "dated with no notes; that is indistinguishable from no pass",
    ).toEqual([]);
  });
});

describe("the WCAG 2.2 table", () => {
  it("lists each criterion once, with a criterion number", () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    const malformed: string[] = [];
    for (const criterion of WCAG_22_AA) {
      if (seen.has(criterion.id)) duplicates.push(criterion.id);
      seen.add(criterion.id);
      if (!/^\d\.\d\.\d+$/.test(criterion.id)) malformed.push(criterion.id);
    }
    expect(duplicates, "criteria listed twice").toEqual([]);
    expect(malformed, "not criterion numbers").toEqual([]);
  });

  /**
   * WCAG 2.2 has 31 Level A and 24 Level AA success criteria. A table off
   * that count is either missing rows or has invented one, and a
   * conformance table that is quietly partial is the thing this file
   * exists to prevent.
   */
  it("is complete for Level A and AA", () => {
    const levels = {
      A: WCAG_22_AA.filter((criterion) => criterion.level === "A").length,
      AA: WCAG_22_AA.filter((criterion) => criterion.level === "AA").length,
    };
    expect(levels).toEqual({ A: 31, AA: 24 });
  });

  it("gives every criterion evidence", () => {
    const empty = WCAG_22_AA.filter(
      (criterion) => !criterion.evidence.trim(),
    ).map((criterion) => criterion.id);
    expect(empty, "a status with no evidence is an assertion").toEqual([]);
  });

  /**
   * A row claiming a check has to cite something that exists.
   *
   * The evidence field is prose, so this cannot verify that the named gate
   * checks what the row claims — nothing can, short of reading both. It
   * can verify the citation resolves, which is the failure that actually
   * happens. Writing this found two rows citing `contrast.ts` and
   * `base.css` by bare filename, neither of which is where those files
   * live.
   */
  it("cites files that exist wherever it claims a check", () => {
    const dead: string[] = [];
    for (const criterion of WCAG_22_AA.filter(
      (entry) => entry.status === "gate",
    )) {
      const cited =
        criterion.evidence.match(/[\w./-]+\.(?:ts|css|mjs)\b/g) ?? [];
      for (const reference of cited) {
        const candidates = [
          reference,
          `packages/ui/${reference}`,
          `packages/ui/src/${reference}`,
          `packages/ui/test/${reference}`,
        ];
        if (!candidates.some((candidate) => existsSync(candidate))) {
          dead.push(`${criterion.id} cites ${reference}`);
        }
      }
    }
    expect(dead, "a conformance claim pointing at nothing").toEqual([]);
  });

  /**
   * And the one rule about honesty that can be mechanised: the count of
   * criteria claiming a check may not rise without the checks rising with
   * it. Held as a floor rather than an exact number so adding a gate is
   * not a chore, and as a ceiling on optimism — a table that suddenly
   * claims forty gates has been edited by wishful thinking.
   */
  it("claims a plausible number of checks", () => {
    const gated = WCAG_22_AA.filter(
      (criterion) => criterion.status === "gate",
    ).length;
    expect(gated).toBeGreaterThanOrEqual(25);
    expect(
      gated,
      "more than two thirds of WCAG gated by CI would be a claim no " +
        "component library can make; check what was reclassified",
    ).toBeLessThan(38);
  });
});

/**
 * The instructions an assistant reads have to point at things that exist.
 *
 * `AGENTS.md` is stage 12's other half: the rules as instructions rather
 * than as prose, so generated code is conformant by construction. Every
 * rule in it names the gate that enforces it, and a named gate that has
 * been renamed turns the document into confident fiction — which is worse
 * for a model than for a person, because a model cannot tell.
 *
 * The same rule already applies to the WCAG table above, and it caught
 * two dead citations there on its first run.
 */
describe("the agent instructions", () => {
  const RULES = "AGENTS.md";

  it.each([RULES, "docs/roadmap.md", "CONTRIBUTING.md"])(
    "%s cites files that exist",
    (document) => {
      const text = readFileSync(document, "utf8");
      const cited = new Set(
        (text.match(/[\w./-]+\.(?:ts|tsx|css|mjs|json|yml)\b/g) ?? []).filter(
          (reference) => reference.includes("/") || reference.includes("."),
        ),
      );
      const dead: string[] = [];
      for (const reference of cited) {
        const candidates = [
          reference,
          `packages/ui/${reference}`,
          `packages/ui/src/${reference}`,
          `packages/ui/src/components/${reference}`,
          `packages/ui/src/styles/${reference}`,
          `scripts/${reference}`,
        ];
        if (!candidates.some((candidate) => existsSync(candidate))) {
          dead.push(reference);
        }
      }
      expect(
        dead,
        `${document} names these and they are not on disk. A document that ` +
          `cites a gate which has moved reads as authoritative and is not.`,
      ).toEqual([]);
    },
  );

  /**
   * And the inventory it tells a reader to consult exists and is current.
   *
   * The first line of the document says to read `inventory.json` before
   * anything else. If that file is missing or stale, every rule after it
   * is being applied to a library that no longer looks like that.
   */
  it("points at an inventory that exists", () => {
    expect(existsSync("packages/ui/inventory.json")).toBe(true);
    const inventory = JSON.parse(
      readFileSync("packages/ui/inventory.json", "utf8"),
    ) as { components: Array<{ component: string }> };
    const listed = new Set(
      inventory.components.map((entry) => entry.component),
    );
    const missing = shipped().filter((name) => !listed.has(name));
    expect(
      missing,
      "the inventory is missing components the library ships; run " +
        "`nx run ui:inventory-write`",
    ).toEqual([]);
  });
});
