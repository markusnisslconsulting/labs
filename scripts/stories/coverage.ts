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
      return {
        name,
        source: readFileSync(join(DIR, f), "utf8"),
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

function stateBooleans(source: string): string[] {
  const body = source.match(/interface \w*(?:Own)?Props[^{]*\{([\s\S]*?)\n\}/);
  if (!body) return [];
  return STATE_BOOLEANS.filter((prop) =>
    new RegExp(`^\\s*${prop}\\??:\\s*boolean`, "m").test(body[1]!),
  );
}

/** Does the component render something a keyboard can reach? */
function isOperable(source: string): boolean {
  return (
    /<(button|input|select|textarea)\b/.test(source) ||
    /tabIndex/.test(source) ||
    /Base\w+\.(Root|Trigger)/.test(source) ||
    /<a\s/.test(source)
  );
}

const results = load().map((component) => {
  const unions = unionProps(component.source);
  const booleans = stateBooleans(component.source);
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
    new RegExp(`\\b${prop}\\b(?=[\\s,}])`).test(text);
  const missingBooleans = booleans.filter((prop) => {
    if (shown(prop)) return false;
    // A sibling spelling of the same state counts.
    const family = FAMILIES.find((f) => f.includes(prop));
    return !(family && family.some(shown));
  });

  const hasAssertion = /\bexpect\(/.test(text);
  const keyboardNeeded = isOperable(component.source) && !exception?.keyboard;
  const hasKeyboard = /userEvent\.(keyboard|tab)\b|\.focus\(\)/.test(text);

  return {
    name: component.name,
    hasStories: component.hasStories,
    missingValues,
    missingBooleans,
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
