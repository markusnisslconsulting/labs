/** Validate accessibility coverage records and documentation references. */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
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

describe("documentation references", () => {
  const RULES = "AGENTS.md";

  it.each([RULES, "docs/screen-reader-pass.md", "CONTRIBUTING.md"])(
    "%s cites files that exist",
    (document) => {
      const text = readFileSync(document, "utf8");
      /* A bare extension is not a citation. Writing about `.d.ts` files
         put one through this check, which can never resolve and reported
         the document as citing a missing file — a gate failing on prose
         about file types rather than on a moved gate.

         Filtered on the reference rather than by tightening the pattern.
         Requiring a match to start with a word character was the first
         attempt and it was worse: `\b[\w]` matches mid-token, so
         `.github/workflows/ci.yml` came out as `github/workflows/ci.yml`
         and two documents that cite it correctly began to fail. The
         distinguishing property is "leading dot and no slash", which is
         what an extension is and a path never is. */
      const cited = new Set(
        (text.match(/[\w./-]+\.(?:ts|tsx|css|mjs|json|yml)\b/g) ?? []).filter(
          (reference) =>
            (reference.includes("/") || reference.includes(".")) &&
            !(reference.startsWith(".") && !reference.includes("/")),
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
          `tooling/checks/${reference}`,
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

  /**
   * The test above checks that the inventory names every component. It said
   * nothing about what it says *about* them, and for a while that was wrong
   * in both directions: the extractor in `tooling/checks/inventory.ts` matched a
   * prop's type as `[^;]+`, so a type containing its own semicolon was cut
   * short and the leftovers were parsed as another prop. `AvatarGroup.person`
   * was published as a prop called `src`. Then the fix counted `<` and `>` as
   * nesting, and `=> void` drove the depth negative, so the scan ate every
   * prop after the first callback: 105 of 357 props were simply absent.
   *
   * Both defects passed the component check, because the component check
   * looked at the list and not at the entries. So this reads the props back
   * with a deliberately different method: the repo is prettier-formatted, so
   * a top-level interface member is indented exactly two spaces, and a member
   * nested inside a multi-line type is indented four or more. A balanced-
   * bracket scanner and an indentation rule have no failure mode in common,
   * which is the only reason one is evidence about the other.
   */
  it("lists exactly the props each component declares", () => {
    const inventory = JSON.parse(
      readFileSync("packages/ui/inventory.json", "utf8"),
    ) as {
      components: Array<{
        component: string;
        props: Array<{ name: string; type: string }>;
      }>;
    };

    const wrong: string[] = [];
    for (const entry of inventory.components) {
      const file = `packages/ui/src/components/${entry.component}.tsx`;
      if (!existsSync(file)) continue;
      const source = readFileSync(file, "utf8");

      const body =
        new RegExp(
          `interface ${entry.component}OwnProps[^{]*\\{([\\s\\S]*?)\\n\\}`,
        ).exec(source)?.[1] ??
        new RegExp(
          `interface ${entry.component}Props[^{]*\\{([\\s\\S]*?)\\n\\}`,
        ).exec(source)?.[1];
      if (body === undefined) continue;

      const declared = new Set(
        [...body.matchAll(/^ {2}(\w+)\??:/gm)].map((hit) => hit[1]!),
      );
      const listed = new Set(entry.props.map((prop) => prop.name));

      for (const name of declared) {
        if (!listed.has(name)) {
          wrong.push(`${entry.component}.${name} is declared but not listed`);
        }
      }
      for (const name of listed) {
        if (!declared.has(name)) {
          wrong.push(`${entry.component}.${name} is listed but not declared`);
        }
      }
    }

    expect(
      wrong,
      "inventory.json disagrees with the source about which props exist; " +
        "run `nx run ui:inventory-write` and if that does not fix it, the " +
        "extractor in tooling/checks/inventory.ts is misparsing a signature",
    ).toEqual([]);
  });

  /**
   * The truncation defect also left types that ended mid-signature, which is
   * visible without any second parse: a published type whose brackets do not
   * balance was cut off somewhere.
   */
  it("publishes prop types that are bracket-balanced", () => {
    const inventory = JSON.parse(
      readFileSync("packages/ui/inventory.json", "utf8"),
    ) as {
      components: Array<{
        component: string;
        props: Array<{ name: string; type: string }>;
      }>;
    };

    const pairs: Record<string, string> = { "}": "{", ")": "(", "]": "[" };
    const truncated: string[] = [];
    for (const entry of inventory.components) {
      for (const prop of entry.props) {
        const stack: string[] = [];
        for (const char of prop.type) {
          if (char === "{" || char === "(" || char === "[") stack.push(char);
          else if (char in pairs && stack.pop() !== pairs[char]) {
            stack.push("!");
            break;
          }
        }
        if (stack.length > 0) {
          truncated.push(`${entry.component}.${prop.name}: ${prop.type}`);
        }
      }
    }

    expect(truncated, "these published prop types are cut off").toEqual([]);
  });
});

/**
 * Every story the visual suite names still exists.
 *
 * `tooling/visual/regression/visual.spec.ts` listed `foundations-brands--side-by-side` for
 * weeks after that story was deleted — the brand comparison came out of the
 * foundations pages and nobody updated the list. Playwright's failure was
 * "element is not visible", which reads like a rendering problem rather than
 * a missing story, and `ui:visual-test` is deliberately not in `pnpm gates`
 * because its baselines are per-platform and CI has none. So a gate rotted
 * quietly, and the tool whose whole job is noticing that things changed was
 * the thing nobody was watching.
 *
 * Ids are derived here the way Storybook derives them — the title and the
 * export name, sanitised — rather than read from a built `index.json`, so
 * this runs in the unit suite with no build behind it.
 */
describe("the visual suite points at stories that exist", () => {
  const sanitize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  /** `AllTones` -> `all-tones`, the way `storyNameFromExport` does it. */
  const fromExport = (name: string) =>
    sanitize(name.replace(/([a-z0-9])([A-Z])/g, "$1 $2"));

  /* Walked rather than listed. The first version named three directories and
     got two of them wrong — the focus story lives in `foundations`, which
     was not among them — so the check called an existing story missing. A
     hard-coded list of places to look is the same kind of rot this test
     exists to catch. */
  const storyFiles = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? storyFiles(join(dir, entry.name))
        : entry.name.endsWith(".stories.tsx")
          ? [join(dir, entry.name)]
          : [],
    );

  const storyIds = (): Set<string> => {
    const ids = new Set<string>();
    const root = "packages/ui/src";
    if (existsSync(root)) {
      for (const path of storyFiles(root)) {
        const source = readFileSync(path, "utf8");
        const title = /title:\s*["'`]([^"'`]+)["'`]/.exec(source)?.[1];
        if (!title) continue;
        const prefix = sanitize(title);
        for (const [, name] of source.matchAll(/^export const (\w+)[^=]*=/gm)) {
          ids.add(`${prefix}--${fromExport(name!)}`);
        }
      }
    }
    return ids;
  };

  it("derives ids that match the ones in use", () => {
    /* The derivation is a reimplementation of somebody else's rule, so it is
       checked against ids known to exist before it is trusted to judge the
       list. Without this the test could pass by deriving nothing. */
    const ids = storyIds();
    expect(ids.size, "no stories found at all").toBeGreaterThan(100);
    for (const known of [
      "components-button--matrix",
      "components-select--matrix",
      "components-statuspill--all-tones",
    ]) {
      expect(ids.has(known), `${known} was not derived`).toBe(true);
    }
  });

  it("names only stories that exist", () => {
    const spec = readFileSync(
      "tooling/visual/regression/visual.spec.ts",
      "utf8",
    );
    const list = /const stories = \[([\s\S]*?)\] as const;/.exec(spec)?.[1];
    expect(list, "could not find the story list").toBeDefined();

    /* Comments first: the list carries a paragraph naming the deleted story
       as an example, and a check that read its own explanation would fail on
       the thing it documents. */
    const named = [
      ...list!.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/"([^"]+)"/g),
    ].map((hit) => hit[1]!);
    expect(named.length, "the story list parsed as empty").toBeGreaterThan(2);

    const ids = storyIds();
    const missing = named.filter((id) => !ids.has(id));
    expect(
      missing,
      "these stories are named in tooling/visual/regression/visual.spec.ts and do not exist. " +
        "Update the list and run `nx run ui:visual-update`.",
    ).toEqual([]);
  });
});
