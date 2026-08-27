import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Rules about the catalogue, not about any component.
 *
 * Every one of these was a defect Markus found by scrolling Storybook,
 * and every one passed the whole pipeline first. The gates asserted
 * properties of the DOM; nobody asserted anything about the list a person
 * actually reads.
 */

const DIR = "packages/ui/src/components";
const files = readdirSync(DIR).filter((f) => f.endsWith(".stories.tsx"));

/** Source with comments removed, so a gate cannot pass on a docstring. */
function code(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** The `export const X = {...}` bodies in a story file. */
function stories(source: string) {
  const found: Array<{ name: string; body: string }> = [];
  const re = /export const (\w+)(?:: [^=]+)? = \{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const i = source.indexOf("{", m.index + m[0].length - 1);
    let depth = 0;
    let j = i;
    for (; j < source.length; j += 1) {
      if (source[j] === "{") depth += 1;
      else if (source[j] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    found.push({ name: m[1]!, body: source.slice(i, j + 1) });
  }
  return found;
}

describe("the story catalogue", () => {
  /**
   * 81 of 156 stories were interaction tests. They rendered in the
   * sidebar beside the examples, all of them showing the component's
   * resting state because the assertion had already run, so Accordion
   * offered three entries that were the same picture and Table offered
   * two. Every "why do these look identical" report traced back here.
   *
   * `!dev` takes a story out of the sidebar and leaves it in the test
   * run, which is what an interaction test wants to be.
   */
  it("keeps interaction tests out of the sidebar", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(join(DIR, file), "utf8");
      for (const { name, body } of stories(source)) {
        const play = code(body);
        if (!play.includes("play: async")) continue;

        /* Mutation is the disqualifier, not the presence of a `play`.
           The reason above is that those 81 stories showed the resting
           state *because the assertion had already run* — which is what a
           click or a keystroke does, and what a plain `expect` does not.
           ADR 0007 puts it the same way: a reference story does not
           mutate, it shows a state and at most checks it.

           Keyed on this because the rule as written and the rule as
           reasoned had come apart, and a story that only reads the DOM was
           being pushed out of the sidebar it belongs in. */
        const mutates = /\buserEvent\.|\bfireEvent\.|\.click\(|\.type\(/.test(
          play,
        );
        if (!mutates) continue;

        if (!body.includes('"!dev"')) offenders.push(`${file} › ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * A story that differs from its neighbour only in the interaction run
   * against it is not a second example. After the rule above there is no
   * mechanical way to have two, so this checks the other half: a
   * component whose sidebar shows exactly one entry is a component whose
   * variants are undocumented.
   */
  it("gives every component more than one thing to look at", () => {
    const thin: string[] = [];
    for (const file of files) {
      const source = readFileSync(join(DIR, file), "utf8");
      const visible = stories(source).filter(
        ({ body }) => !body.includes('"!dev"'),
      );
      if (visible.length < 2) thin.push(`${file} (${visible.length})`);
    }
    expect(thin).toEqual([]);
  });
});

describe("focus", () => {
  /**
   * --uix-focus-ring had one consumer — `a:focus-visible` — so thirteen
   * components wrote their own ring and fourteen wrote none and inherited
   * the browser's. The visible result was an Accordion ringed in Chrome
   * blue next to a Select ringed in the brand's red, and a different pair
   * again in Safari.
   *
   * The contract now lives in base.css at zero specificity. This asserts
   * it covers the elements that can hold focus, so the next component to
   * arrive gets a ring without asking for one.
   */
  it("is styled once, for everything focusable", () => {
    // Comments stripped first. The comment above this very rule names
    // `:where()` while explaining it, and matching on the raw file found
    // the prose instead of the selector — the fourth time in this suite
    // that a gate read a docstring and reported on the code.
    const base = code(readFileSync("packages/ui/src/styles/base.css", "utf8"));
    const at = base.indexOf(":where(");
    const rule = base.slice(at, base.indexOf(":focus-visible", at));
    for (const element of [
      "button",
      "input",
      "select",
      "textarea",
      "summary",
      "a[href]",
    ]) {
      expect(rule, `${element} takes focus and needs a ring`).toContain(
        element,
      );
    }
    expect(base).toContain("var(--uix-focus-ring)");
  });

  /**
   * A ring is the one indicator with no fallback, and forced-colors mode
   * throws author colours away. Highlight is the colour the reader chose
   * for exactly this.
   */
  it("survives forced colours", () => {
    const base = code(readFileSync("packages/ui/src/styles/base.css", "utf8"));
    const forced = base.slice(base.indexOf("forced-colors: active"));
    expect(forced).toContain("Highlight");
  });
});

describe("native control chrome", () => {
  /**
   * The engines only paint native form chrome when they believe a person
   * is looking, so a headless browser never draws it and no visual gate
   * could see it. A Combobox shipped with two arrows — ours and Chrome's
   * datalist indicator — and Safari drew a bevelled box with a checkmark
   * inside the Select we had already drawn.
   */
  it("is stripped in the reset, for every engine", () => {
    const reset = readFileSync("packages/ui/src/styles/reset.css", "utf8");
    for (const needle of [
      "-webkit-appearance: none",
      "::-webkit-calendar-picker-indicator",
      "::-webkit-inner-spin-button",
      "-moz-appearance: textfield",
    ]) {
      expect(reset).toContain(needle);
    }
  });

  /**
   * And nowhere else: a component that strips its own chrome is a
   * component that stripped it on the engine its author was using.
   */
  it("is not re-stripped per component", () => {
    for (const file of readdirSync(DIR).filter((f) => f.endsWith(".css"))) {
      const source = code(readFileSync(join(DIR, file), "utf8"));
      expect(source, `${file} strips native chrome the reset owns`).not.toMatch(
        /appearance:\s*none/,
      );
    }
  });
});

describe("severity", () => {
  /**
   * Banner changed its 4px edge per severity and nothing else, so all
   * four shared one background and a danger banner was an info banner
   * with a red sliver. Whatever carries severity has to change the fill
   * too.
   */
  it("changes more than a border on the components that carry it", () => {
    for (const name of ["Banner", "Alert"]) {
      const source = readFileSync(join(DIR, `${name}.css`), "utf8");
      const severity =
        source.match(/\[data-severity="danger"\][\s\S]*?\}/)?.[0] ?? "";
      expect(
        severity,
        `${name} distinguishes danger by a border alone`,
      ).not.toBe("");
    }
    const banner = readFileSync(join(DIR, "Banner.css"), "utf8");
    expect(banner).toContain("--uix-banner-severity");
    expect(banner).toContain("color-mix");
  });
});
