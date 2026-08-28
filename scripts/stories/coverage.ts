/**
 * Story coverage gate.
 *
 * The library had Button with nine stories and Banner with one, and no
 * rule saying which was right. "Add more stories" is not a standard; it
 * is a mood. This makes coverage a property of the component's own type
 * signature, so what a component owes Storybook is derived rather than
 * negotiated:
 *
 *   1. Every value of every union prop is rendered by some story, and
 *      every state boolean is set true by some story. A state nobody can
 *      see is a state nobody reviews, and Chromatic cannot baseline it.
 *   2. At least one assertion somewhere. A story with no expect is a
 *      picture; the point of stories here is that they are also checks.
 *   3. If the component is operable, a story drives it from the keyboard.
 *      33 of 34 components had no keyboard story while the docs claimed
 *      keyboard support, which is the gap this closes.
 *   4. Every value and state above appears in a story Chromatic actually
 *      photographs. Rule 1 is satisfied by a story that exists, and one
 *      photographed story per component is the policy that keeps the
 *      snapshot bill flat — so a variant rendered only by an
 *      interaction story is reviewed by nobody and baselined by
 *      nothing. This is the rule behind "we still don't have everywhere
 *      the matrix".
 *
 * Exceptions are listed in EXCEPTIONS with a reason, so an exemption is a
 * decision in the repository rather than a silence.
 *
 * Usage: tsx scripts/stories/coverage.ts [report|check]
 */
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

const DIR = "packages/ui/src/components";

/** Props that mean the same state through a controlled and an uncontrolled
 *  spelling. Showing either one shows the state, so they count as one. */
const FAMILIES: string[][] = [
  ["checked", "defaultChecked"],
  ["open", "defaultOpen"],
];

/**
 * Native boolean attributes any component reaches through `...rest`.
 *
 * Chip never declared `disabled` and its stylesheet has styled
 * `button.uix-chip:disabled` since the component existed, so the state
 * was reachable, styled, and invisible to this gate — which only ever
 * read declared props.
 */
const PASS_THROUGH = ["disabled", "readonly"];

/** Booleans that describe a visual state worth seeing, not a config flag. */
const STATE_BOOLEANS = [
  "disabled",
  "loading",
  "indeterminate",
  "active",
  "checked",
  "defaultChecked",
  "invalid",
  "required",
  "open",
  "defaultOpen",
];

const EXCEPTIONS: Record<
  string,
  { props?: string[]; keyboard?: string; reason: string }
> = {
  AppShell: {
    props: ["navWidth"],
    reason:
      "A page has one shell. Photographing the three nav widths side by " +
      "side means three banner landmarks, three mains and three footers in " +
      "one document, which axe refuses under landmark-no-duplicate-banner " +
      "and which is right to refuse: duplicated landmarks are exactly the " +
      "defect this component exists to prevent, so a story demonstrating " +
      "the component would have to commit it. The widths are three values " +
      "of one custom property, asserted in the browser suite instead.",
  },
  Menu: {
    props: ["side", "align"],
    reason:
      "Placement is floating-ui's, recalculated against the viewport on " +
      "every render, and asserted geometrically in the browser suite. A " +
      "pixel baseline of a popup's position is brittle by construction — " +
      "it moves when the snapshot viewport moves — and it cost this " +
      "component a second and third photographed story, against the one " +
      "story per component the snapshot budget is built on.",
  },
  Popover: {
    props: ["side", "align"],
    reason: "The same, one component over.",
  },
  Tooltip: {
    keyboard:
      "The trigger is the caller's own element, so there is no focusable element of ours to drive.",
    reason: "Renders no element of its own; documented on the component.",
  },
  ProgressBar: {
    keyboard:
      "role=progressbar is not focusable; there is nothing for a keyboard to operate.",
    reason:
      "Output, not a control. Flagged only because it sits on a Base UI Root.",
  },
  Toaster: {
    props: ["position"],
    reason:
      "position is stack placement; both values are covered by separate stories but args live in a render wrapper.",
  },
};

interface Component {
  name: string;
  source: string;
  stories: string;
  hasStories: boolean;
  /** The component's own stylesheet, or "" when it has none. */
  css: string;
}

function load(): Component[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".tsx") && !f.includes(".stories."))
    .map((f) => {
      const name = basename(f, ".tsx");
      const storyFile = join(DIR, `${name}.stories.tsx`);
      let stories = "";
      let hasStories = false;
      try {
        stories = readFileSync(storyFile, "utf8");
        hasStories = true;
      } catch {
        hasStories = false;
      }
      let css = "";
      try {
        css = readFileSync(join(DIR, `${name}.css`), "utf8");
      } catch {
        css = "";
      }
      return {
        name,
        source: readFileSync(join(DIR, f), "utf8"),
        css,
        stories,
        hasStories,
      };
    });
}

/** Local `type X = "a" | "b"` aliases, so a prop typed by alias resolves. */
function aliases(source: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const hit of source.matchAll(
    /type\s+(\w+)\s*=\s*((?:"[^"]*"\s*\|\s*)+"[^"]*")\s*;/g,
  )) {
    out.set(
      hit[1]!,
      [...hit[2]!.matchAll(/"([^"]*)"/g)].map((m) => m[1]!),
    );
  }
  return out;
}

/** Union-typed props declared on the component's own props interface. */
function unionProps(source: string): Map<string, string[]> {
  const alias = aliases(source);
  const out = new Map<string, string[]>();
  const body = source.match(/interface \w*(?:Own)?Props[^{]*\{([\s\S]*?)\n\}/);
  if (!body) return out;
  for (const line of body[1]!.split("\n")) {
    const inline = line.match(
      /^\s*(\w+)\??:\s*((?:"[^"]*"\s*\|\s*)+"[^"]*")\s*;/,
    );
    if (inline) {
      out.set(
        inline[1]!,
        [...inline[2]!.matchAll(/"([^"]*)"/g)].map((m) => m[1]!),
      );
      continue;
    }
    const byAlias = line.match(/^\s*(\w+)\??:\s*(\w+)\s*;/);
    if (byAlias && alias.has(byAlias[2]!)) {
      out.set(byAlias[1]!, alias.get(byAlias[2]!)!);
    }
  }
  return out;
}

/** Values the component supplies itself, e.g. `size = "md"`. A defaulted
 *  value is on screen in any story that does not override it, so counting
 *  it as missing would demand a story that changes nothing. */
function defaults(source: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const hit of source.matchAll(/(\w+)\s*=\s*"([^"]+)"\s*,/g)) {
    out.set(hit[1]!, hit[2]!);
  }
  return out;
}

/**
 * The state booleans a component can be in.
 *
 * Two sources, because a declared prop is not the only way in. A
 * component whose props extend a native element's passes `disabled`
 * straight through `...rest` without declaring it — Chip does, and its
 * stylesheet has styled `button.uix-chip:disabled` all along, so the
 * state existed, mattered, and was invisible to this gate. The
 * stylesheet is the evidence: if a component's CSS bothers to style a
 * state, the catalogue owes a picture of it.
 */
function stateBooleans(source: string, css = ""): string[] {
  const body = source.match(/interface \w*(?:Own)?Props[^{]*\{([\s\S]*?)\n\}/);
  const declared = body
    ? STATE_BOOLEANS.filter((prop) =>
        new RegExp(`^\\s*${prop}\\??:\\s*boolean`, "m").test(body[1]!),
      )
    : [];
  // Only the states a native element can receive through `...rest`.
  // Deriving every state from the stylesheet over-reaches: RadioGroup's
  // CSS styles [data-checked] and Tabs' styles [data-active], but neither
  // takes a boolean for it — the state comes from `value`, and demanding
  // a `checked` prop in a story would be demanding a prop that does not
  // exist. `disabled` and `readonly` are different: they are HTML
  // attributes, any component spreading props onto a native element
  // accepts them whether or not it says so, and a stylesheet that styles
  // one is admitting the state is reachable.
  const styled = PASS_THROUGH.filter((prop) =>
    new RegExp(`:${prop}\\b|\\[data-${prop}\\]|\\[aria-${prop}`, "i").test(css),
  );
  return [...new Set([...declared, ...styled])];
}

/** Does the component render something a keyboard can reach? */
/**
 * Strip comments before deciding anything about a component.
 *
 * Without this, prose changed a measurement. The `renderAs` documentation
 * shows `renderAs={<a href="/pricing" />}` in a docstring, and this
 * function matched the `<a ` in it — so Badge, Panel and StatusPill were
 * reported as operable and owing a keyboard story, on the strength of a
 * comment. A gate that reads comments is measuring the wrong text.
 */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function isOperable(source: string): boolean {
  const body = code(source);
  return (
    /<(button|input|select|textarea)\b/.test(body) ||
    /tabIndex/.test(body) ||
    /Base\w+\.(Root|Trigger)/.test(body) ||
    /<a\s/.test(body) ||
    // A component that composes one of ours is operable too. Looking only
    // for the lowercase element missed Alert, whose dismiss control is a
    // <Button>, and Pagination, which is nothing but Buttons — so two
    // components with real keyboard surfaces were never asked for a
    // keyboard test.
    /<(Button|IconButton)\b/.test(body)
  );
}

/**
 * The bodies of the stories Chromatic photographs, concatenated.
 *
 * The project default in preview.tsx is disableSnapshot, so a story is
 * photographed only where it says otherwise.
 */
function photographed(text: string): string {
  const bodies: string[] = [];
  for (const hit of text.matchAll(
    /export const (\w+)[^=]*=\s*\{([\s\S]*?)(?=\nexport const |$)/g,
  )) {
    if (/disableSnapshot:\s*false/.test(hit[2]!)) bodies.push(hit[2]!);
  }
  let shot = bodies.join("\n");
  if (!shot) return shot;

  // A matrix usually maps over a list declared at module scope, so the
  // values it renders are not inside its own body. Without this, Button's
  // matrix — which renders all eighteen combinations — was reported as
  // photographing none of them.
  for (const hit of text.matchAll(
    /^(?:const|let)\s+(\w+)\s*(?::[^=]+)?=\s*(\[[\s\S]*?\])/gm,
  )) {
    if (new RegExp(`\\b${hit[1]!}\\b`).test(shot)) shot += `\n${hit[2]!}`;
  }
  return shot;
}

const results = load().map((component) => {
  const unions = unionProps(component.source);
  const booleans = stateBooleans(component.source, component.css ?? "");
  const exception = EXCEPTIONS[component.name];
  const text = component.stories;

  const componentDefaults = defaults(component.source);
  const hasPlainStory =
    /export const \w+: Story(?:Obj)?[^=]*=\s*\{\s*\}/.test(text) ||
    /export const \w+/.test(text);

  const missingValues: string[] = [];
  for (const [prop, values] of unions) {
    if (exception?.props?.includes(prop)) continue;
    for (const value of values) {
      // A value counts as rendered if the story file mentions it as a
      // string literal anywhere: args, a render wrapper or a map over it.
      if (new RegExp(`["'\`]${value}["'\`]`).test(text)) continue;
      // ...or if the component defaults to it and some story exists.
      if (componentDefaults.get(prop) === value && hasPlainStory) continue;
      missingValues.push(`${prop}="${value}"`);
    }
  }

  const shown = (prop: string) =>
    new RegExp(`\\b${prop}\\s*:\\s*true`).test(text) ||
    // `>` and `/` because a JSX boolean attribute is written
    // `<Menu.Item disabled>` — the old lookahead accepted it only in an
    // args object, so a state shown in a render() went unseen.
    new RegExp(`\\b${prop}\\b(?=[\\s,}>/])`).test(text);
  const missingBooleans = booleans.filter((prop) => {
    if (shown(prop)) return false;
    // A sibling spelling of the same state counts.
    const family = FAMILIES.find((f) => f.includes(prop));
    return !(family && family.some(shown));
  });

  // Rule 4: the same checks, but only against what Chromatic sees.
  const shot = photographed(text);
  const unphotographed: string[] = [];
  if (shot) {
    for (const [prop, values] of unions) {
      if (exception?.props?.includes(prop)) continue;
      for (const value of values) {
        if (new RegExp(`["'\`]${value}["'\`]`).test(shot)) continue;
        if (componentDefaults.get(prop) === value) continue;
        unphotographed.push(`${prop}="${value}"`);
      }
    }
    for (const prop of booleans) {
      if (new RegExp(`\\b${prop}\\b`).test(shot)) continue;
      const family = FAMILIES.find((f) => f.includes(prop));
      if (family?.some((sibling) => new RegExp(`\\b${sibling}\\b`).test(shot)))
        continue;
      unphotographed.push(prop);
    }
  }

  const hasAssertion = /\bexpect\(/.test(text);
  const keyboardNeeded = isOperable(component.source) && !exception?.keyboard;
  const hasKeyboard = /userEvent\.(keyboard|tab)\b|\.focus\(\)/.test(text);

  return {
    name: component.name,
    hasStories: component.hasStories,
    missingValues,
    missingBooleans,
    unphotographed,
    hasAssertion,
    keyboardNeeded,
    hasKeyboard,
  };
});

const mode = process.argv[2] ?? "report";

const problems = results.flatMap((r) => {
  const items: string[] = [];
  if (!r.hasStories) items.push(`${r.name}: no stories at all`);
  if (r.missingValues.length)
    items.push(
      `${r.name}: states never rendered — ${r.missingValues.join(", ")}`,
    );
  if (r.missingBooleans.length)
    items.push(
      `${r.name}: state booleans never shown — ${r.missingBooleans.join(", ")}`,
    );
  if (r.unphotographed.length)
    items.push(
      `${r.name}: never photographed — ${r.unphotographed.join(", ")}`,
    );
  if (r.hasStories && !r.hasAssertion)
    items.push(`${r.name}: no assertion in any story`);
  if (r.keyboardNeeded && !r.hasKeyboard)
    items.push(`${r.name}: operable but no story drives it from the keyboard`);
  return items;
});

if (mode === "report") {
  console.log("Story coverage\n");
  console.log(
    `  ${"component".padEnd(18)} ${"states".padEnd(8)} ${"assert".padEnd(7)} keyboard`,
  );
  for (const r of results) {
    const states =
      r.missingValues.length + r.missingBooleans.length === 0
        ? "ok"
        : `${r.missingValues.length + r.missingBooleans.length} gap`;
    const kbd = !r.keyboardNeeded ? "n/a" : r.hasKeyboard ? "ok" : "MISSING";
    console.log(
      `  ${r.name.padEnd(18)} ${states.padEnd(8)} ${(r.hasAssertion ? "ok" : "MISSING").padEnd(7)} ${kbd}`,
    );
  }
  console.log(`\n  ${problems.length} problem(s)`);
  for (const p of problems) console.log(`   - ${p}`);
  process.exit(0);
}

if (mode === "check") {
  if (problems.length) {
    console.error(`Story coverage failed — ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  - ${p}`);
    console.error(
      "\nEvery state a component can be in should be visible in Storybook, " +
        "or listed in EXCEPTIONS with a reason.",
    );
    process.exit(1);
  }
  console.log(`Story coverage passed — ${results.length} components.`);
  process.exit(0);
}

console.error(`unknown mode: ${mode} (expected report | check)`);
process.exit(2);
