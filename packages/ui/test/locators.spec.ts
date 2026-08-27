/**
 * A Playwright query has to name the element this repository owns.
 *
 * Playwright's strict mode already throws when a locator matches more than
 * one element, and it is a good check. It is also the check that gets
 * silenced: `.first()`, `.nth()` and `evaluateAll()` opt out of it, and a
 * chained `.locator()` narrows before it ever applies. That combination has
 * cost three assertions here, every one of them failing in the direction of
 * passing:
 *
 *   - `page.locator("thead th")` matched Storybook's own zero-height args
 *     table, so a sticky-header assertion compared 0 to 0 and passed
 *     against `position: static`.
 *   - the same in `browser/print.spec.ts`, where both table tests were
 *     reporting on Storybook rather than on `Table`. Measured: the first
 *     `tbody tr` on that page reads "propertyName".
 *   - `getByRole("toolbar", { name: "Table actions" })` also matched
 *     "Table actions, with a disabled control", because Playwright matches
 *     an accessible name as a **substring**. The control list ran across two
 *     toolbars and `End` landed on the wrong one's menu trigger.
 *
 * So two rules, absolute rather than heuristic:
 *
 * 1. A `page.locator` selector may not be nothing but element names. Scope
 *    it with the component's class, which is a name this repository owns
 *    and Storybook's chrome does not have.
 * 2. A string accessible name needs `exact: true`. A regex is fine — it
 *    says the looseness is deliberate.
 *
 * No exemptions, and paying for that was the point. The first version of
 * this file tried to fire only on a loose query *followed by* a
 * strict-mode escape, to keep the count at one. It caught nothing: prettier
 * wraps `page.locator(…)` onto its own line, and the real toolbar bug had a
 * `.locator()` between the query and the `.nth()`. It passed both breaks I
 * wrote for it, and the only thing it had ever flagged was the sentence in
 * its own docstring describing the pattern. Absolute rules cost ten
 * mechanical edits and are true.
 *
 * Playwright only. Testing Library matches a string name as the whole name,
 * so the trap is this library's default rather than a universal one.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = [
  "packages/ui/browser",
  "visual",
  "scripts/visual",
  "apps/site/e2e",
];

/** Whole-document selectors, which cannot be ambiguous. */
const WHOLE_DOCUMENT = new Set(["body", "html", ":root"]);

/**
 * Substitute the file's own string constants into a selector.
 *
 * `page.locator(`${STORY} button`)` reads as a bare element selector and is
 * not one: `STORY` is `"#storybook-root"` in both files that use it, so the
 * query is scoped by an id. Resolving the constant makes the rule read the
 * selector that will actually be sent rather than the source it was written
 * as.
 */
function resolve(selector: string, source: string): string {
  return selector.replace(/\$\{(\w+)\}/g, (whole, name) => {
    const found = new RegExp(
      `const\\s+${name}\\s*=\\s*["'\`]([^"'\`]*)["'\`]`,
    ).exec(source);
    return found ? found[1]! : whole;
  });
}

function specs(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const root of ROOTS) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root)) {
      if (!entry.endsWith(".ts")) continue;
      /* Comments stripped first. The previous version of this rule flagged
         its own explanation, because a sentence describing a bad pattern
         contains the bad pattern — the fifth time in this repository that a
         check has read prose as code. */
      const source = readFileSync(join(root, entry), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      out.push([`${root}/${entry}`, source]);
    }
  }
  return out;
}

/** The argument list of the call starting at `open`, by brace balance. */
function args(source: string, open: number): string {
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const c = source[i];
    if (c === "(") depth += 1;
    else if (c === ")") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return source.slice(open);
}

describe("playwright locators", () => {
  it("a page.locator selector is scoped, not a bare element name", () => {
    const offenders: string[] = [];
    for (const [file, source] of specs()) {
      for (const match of source.matchAll(/page\s*\.\s*locator\s*\(/g)) {
        const inner = args(source, match.index! + match[0].length - 1);
        const quoted = /^\s*["'`]([^"'`]*)["'`]/.exec(inner);
        if (!quoted) continue;
        const selector = resolve(quoted[1]!, source);
        if (/[.#[]/.test(selector)) continue;
        if (WHOLE_DOCUMENT.has(selector.trim())) continue;
        offenders.push(`${file}: page.locator("${selector}")`);
      }
    }
    expect(
      offenders,
      "these select by element name alone, so Storybook's own chrome can " +
        "satisfy them. Scope with the component's class",
    ).toEqual([]);
  });

  it("a string accessible name is exact", () => {
    const offenders: string[] = [];
    for (const [file, source] of specs()) {
      for (const match of source.matchAll(/getBy\w+\s*\(/g)) {
        const inner = args(source, match.index! + match[0].length - 1);
        if (!/name:\s*["'`]/.test(inner)) continue;
        if (/exact:\s*true/.test(inner)) continue;
        const name = /name:\s*["'`]([^"'`]*)/.exec(inner)?.[1] ?? "?";
        offenders.push(`${file}: name "${name}"`);
      }
    }
    expect(
      offenders,
      "Playwright matches an accessible name as a substring, so these also " +
        "match every longer name containing them. Add `exact: true`, or use " +
        "a regex to say the looseness is deliberate",
    ).toEqual([]);
  });
});
