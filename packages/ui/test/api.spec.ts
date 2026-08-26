/**
 * The component API contract.
 *
 * Measured before this existed: of thirty-four components, ten accepted
 * children, two had compound parts, one was polymorphic, eight could only
 * be driven by an array of items, and fifteen were closed entirely — no
 * children, no parts, no array. Fifty-five props were typed `string`
 * where a node belongs, `Badge` among them, so a badge could not contain
 * an icon.
 *
 * None of that is visible in a review of one component. It is only
 * visible as a count, which is why it is a test: a contract that lives in
 * a document is a contract until the first hurry.
 *
 * Each rule below carries an exemption list, and every entry states why.
 * An exemption is a decision in the repository; a silence is not.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DIR = "packages/ui/src/components";

const files = readdirSync(DIR).filter(
  (file) => file.endsWith(".tsx") && !file.includes(".stories."),
);

const source = new Map(
  files.map((file) => [file, readFileSync(join(DIR, file), "utf8")]),
);

/**
 * The component's own props block, not an item descriptor's.
 *
 * `SelectOption` also has a `value`, indented the same way, so scanning
 * the whole file reported Select as a stateful component missing two
 * thirds of its triple. The props a caller passes to the component are
 * the only ones this contract is about.
 */
/**
 * The code, without the comments.
 *
 * The second time prose changed a measurement. The story-coverage gate
 * read `<a href />` out of a docstring and concluded three components
 * were operable; this one read `aria-label="Orders"` out of a usage
 * example in Tabs' TSDoc and called it a hardcoded string. A gate that
 * reads comments is measuring the wrong text.
 */
function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function ownProps(text: string): string {
  const blocks = [
    ...text.matchAll(
      /(?:export )?interface \w*(?:Own)?Props[^{]*\{([\s\S]*?)\n\}/g,
    ),
  ]
    .filter((hit) => !/Item|Option|Descriptor/.test(hit[0].split("{")[0]!))
    .map((hit) => hit[1]!);
  return blocks.join("\n");
}

/**
 * Components that contain nothing, so there is nothing to compose. Each is
 * a fixed picture whose whole content is derived from its props.
 */
const SELF_CONTAINED: Record<string, string> = {
  "Avatar.tsx": "an image or initials derived from name",
  "Divider.tsx": "a rule",
  "ProgressBar.tsx": "a bar; the value is the content",
  "Skeleton.tsx": "a placeholder shape",
  "Spinner.tsx": "a spinner",
  "Switch.tsx": "a track, a knob and its label",
  "Checkbox.tsx": "a box and its label",
  "Slider.tsx": "a track and its label",
  "SearchInput.tsx": "a single input",
  "TextField.tsx": "one field; prefix and suffix are its slots",
  "NumberField.tsx": "one field and its two steppers",
  "Pagination.tsx": "derived entirely from pageCount and page",
  "Toaster.tsx": "renders the toasts it is given",
  "Tooltip.tsx": "wraps the caller's element; content is its slot",
};

/**
 * Props that stay `string` because they *are* an accessible name, and an
 * aria-label can only be a string. Where a component has a visible title
 * element instead, it is labelled by that element and the prop is a node
 * — Alert was changed that way rather than exempted.
 */
const ACCESSIBLE_NAME: Record<string, string> = {
  "Breadcrumb.tsx": "label names the nav",
  "Divider.tsx": "label names the separator",
  "IconButton.tsx": "label is the button's only name",
  "NumberField.tsx": "label is the input's aria-label",
  "Panel.tsx": "label names the region",
  "SegmentedControl.tsx": "label names the group",
  "Slider.tsx": "label is the slider's aria-label",
  "Tabs.tsx": "label names the tablist",
  "Dialog.tsx": "title is announced as the dialog's name",
  "Spinner.tsx": "label is the live region's text; a spinner has no other name",
  "Select.tsx":
    "SelectOption.label is an <option>'s text, and HTML forbids markup " +
    "inside one — the platform's rule, not ours. The field's own label is " +
    "a node.",
};

/** Prop names that describe content a caller may want to enrich. */
const SLOTS = [
  "label",
  "title",
  "hint",
  "error",
  "caption",
  "legend",
  "description",
  "content",
  "trigger",
  "body",
];

describe("component API contract", () => {
  it("every component is composable, or says why it cannot be", () => {
    for (const [file, text] of source) {
      const name = file.replace(/\.tsx$/, "");
      const takesChildren = /children\??:\s*(React\.)?ReactNode/.test(text);
      const hasParts = new RegExp(`${name}\\.\\w+\\s*=`).test(text);
      if (takesChildren || hasParts) continue;
      expect(
        SELF_CONTAINED[file],
        `${file} accepts neither children nor compound parts. Either open it ` +
          `up, or add it to SELF_CONTAINED with the reason it contains nothing.`,
      ).toBeDefined();
    }
  });

  it("no component is driven only by an array of items", () => {
    // The rule that mattered most. An items-shaped prop can only describe
    // the arrangement its author imagined: while Tabs took
    // `tabs: TabItem[]` with `label: string`, a tab with a count in it
    // meant not using Tabs. The array form is fine as a shorthand — it is
    // not fine as the only door.
    for (const [file, text] of source) {
      const name = file.replace(/\.tsx$/, "");
      const arrayProp = /^\s+(items|options|tabs|pages)\??:/m.test(text);
      if (!arrayProp) continue;
      const hasParts = new RegExp(`${name}\\.\\w+\\s*=`).test(text);
      const takesChildren = /children\??:\s*(React\.)?ReactNode/.test(text);
      expect(
        hasParts && takesChildren,
        `${file} has a list-shaped prop but no compound parts and children ` +
          `to compose instead`,
      ).toBe(true);
    }
  });

  it("a content prop is a node, not a string", () => {
    for (const [file, text] of source) {
      for (const slot of SLOTS) {
        const bare = new RegExp(`^\\s+${slot}\\??:\\s*string;`, "m");
        if (!bare.test(text)) continue;
        expect(
          ACCESSIBLE_NAME[file],
          `${file} types \`${slot}\` as string. Widen it to ReactNode, or ` +
            `add the file to ACCESSIBLE_NAME saying which accessible name it ` +
            `supplies — an aria-label cannot be a node.`,
        ).toBeDefined();
      }
    }
  });

  it("polymorphism has one implementation", () => {
    // The convention existed on Button alone, which is how a convention
    // ends up existing once. A second hand-rolled cloneElement is how the
    // merge rules drift: whose className wins, whose onClick, whether the
    // caller's props override ours.
    for (const [file, text] of source) {
      if (!/renderAs\?:/.test(text)) continue;
      expect(
        /renderAsElement\(/.test(text),
        `${file} declares renderAs but does not use the shared helper in ` +
          `src/renderAs.tsx`,
      ).toBe(true);
      expect(
        /cloneElement\(/.test(text),
        `${file} rolls its own cloneElement; the merge rules belong in one place`,
      ).toBe(false);
    }
  });

  it("a stateful prop comes as a complete triple", () => {
    /*
     * Six components expressed the same idea six ways: checked with
     * onChange, value with onChange, value with onValueChange and no
     * defaultValue, defaultPage with onChange and no controlled page,
     * open with onOpenChange and no defaultOpen. Every one is defensible
     * alone; together they mean a reader has to look up each component
     * before using it, which is the tax a design system exists to remove.
     *
     * The rule: a stateful prop X ships with defaultX and onXChange, so
     * every component can be driven or left to itself.
     */
    const STATEFUL = ["value", "checked", "open", "active", "page"];
    /*
     * Props that look stateful and are not: a reading the caller always
     * owns. A progress bar has nothing to default to and nothing to
     * change — it displays what it is told.
     */
    const READ_ONLY: Record<string, string> = {
      "ProgressBar.tsx": "value is a reading, not a state",
    };
    for (const [file, text] of source) {
      if (READ_ONLY[file]) continue;
      for (const prop of STATEFUL) {
        const capital = prop[0]!.toUpperCase() + prop.slice(1);
        const triple = [prop, `default${capital}`, `on${capital}Change`];
        // Any one of the three implies all three. Checking only forwards
        // from X missed Pagination, which had defaultPage and onChange and
        // no controlled page at all — so a page number held in a URL could
        // not be pushed back into the control. Required props were missed
        // too, because the pattern demanded the `?`.
        const props = ownProps(text);
        const declared = triple.filter((name) =>
          new RegExp(`^\\s+${name}\\??:`, "m").test(props),
        );
        if (declared.length === 0) continue;
        expect(
          declared,
          `${file} declares ${declared.join(", ")}. A stateful prop ships as ` +
            `${triple.join(" / ")} so a caller can drive it or leave it alone.`,
        ).toHaveLength(3);
      }
    }
  });

  it("no component compiles in a user-facing string", () => {
    /*
     * Seven were compiled in: "Breadcrumb", "Pagination", "Previous
     * page", "Page 1", "Next page", "Dismiss", "Notifications". Every one
     * is read aloud by a screen reader, and no product serving a second
     * market could change any of them. Shipping English inside an
     * aria-label decides that the consumers are English, which is a
     * decision nobody made on purpose.
     *
     * The defaults now live in src/i18n.tsx, overridable per component by
     * a prop and per application by the provider.
     */
    for (const [file, text] of source) {
      const literals = [
        ...code(text).matchAll(
          /(aria-label|title|placeholder)=["']([^"']{2,})["']/g,
        ),
      ].map((hit) => `${hit[1]}="${hit[2]}"`);
      expect(
        literals,
        `${file} hardcodes ${literals.join(", ")}. Add the string to Strings ` +
          `in src/i18n.tsx and read it through useStrings, so an application ` +
          `can translate it.`,
      ).toEqual([]);
    }
  });

  it("every string in the table has a default", () => {
    // A key without a default is a key that renders "undefined" the first
    // time a consumer forgets it.
    const table = readFileSync("packages/ui/src/i18n.tsx", "utf8");
    const keys = [
      ...table.matchAll(/^\s{2}(?:\/\*\*[\s\S]*?\*\/\s*)?(\w+)[:?]/gm),
    ];
    const declared = new Set(
      [...table.matchAll(/^\s{2}(\w+)\??:\s/gm)].map((hit) => hit[1]!),
    );
    const defaulted = new Set(
      [
        ...table
          .slice(table.indexOf("defaultStrings"))
          .matchAll(/^\s{2}(\w+):/gm),
      ].map((hit) => hit[1]!),
    );
    expect(keys.length).toBeGreaterThan(5);
    for (const key of declared) {
      expect(
        defaulted.has(key),
        `Strings.${key} has no entry in defaultStrings`,
      ).toBe(true);
    }
  });

  it("every component documents what it is for and how it behaves", () => {
    /*
     * Ten of the thirty-four had no accessibility section, and they were
     * the ones where it matters most: Table, Select, RadioGroup, Popover,
     * SearchInput. Writing the missing ten found four real defects — a
     * scroll container no keyboard could reach, an avatar whose two
     * branches announced different things, an avatar branch that dropped
     * the caller's className, and a search field that asked callers to
     * remember an aria-label instead of requiring a name.
     *
     * That is the argument for the gate. Writing the sentence is what
     * makes someone check whether it is true.
     */
    const REQUIRED = [
      ["**Use it for**", "when to reach for it, and when not to"],
      ["Accessibility:", "what it guarantees and what the caller still owes"],
    ] as const;
    for (const [file, text] of source) {
      for (const [marker, what] of REQUIRED) {
        expect(
          text.includes(marker),
          `${file} has no "${marker}" section — ${what}`,
        ).toBe(true);
      }
    }
  });

  it("every component accepts a ref", () => {
    /*
     * Not "refs happen to work" — they were *type-forbidden*. All
     * twenty-nine components typed their props with
     * `ComponentPropsWithoutRef`, and three went further and wrote
     * `Omit<…, "ref">` explicitly, so passing a ref to any component in
     * this library was a type error.
     *
     * That rules out most of what an application does with a component:
     * focus the first field on mount, scroll a field into view after a
     * validation error, measure a card to position something against it,
     * hand an input to a form library. None of it was possible, and
     * nothing said so.
     *
     * Foundations/Contract proves the refs actually land; this makes sure
     * the type keeps allowing them.
     */
    for (const [file, text] of source) {
      expect(
        /ComponentPropsWithoutRef/.test(text),
        `${file} types its props without a ref. Use ComponentPropsWithRef ` +
          `so a caller can focus, measure or scroll to this component.`,
      ).toBe(false);
      const stripped = /Omit<[^>]*["']ref["']/.exec(code(text));
      expect(
        stripped?.[0],
        `${file} removes ref from its props explicitly`,
      ).toBeUndefined();
    }
  });

  it("every branch of a component merges className", () => {
    /*
     * Passing className used to strip a component's own styling. The rule
     * was then written for compound parts only, which missed Avatar:
     * with `src` it merged, without `src` it rendered
     * `className="uix-avatar"` flat and dropped the caller's class and
     * every other prop. One component, two branches, two contracts, and
     * the accessibility differed between them too.
     *
     * So the unit is the branch, not the component. A first attempt
     * matched any literal `uix-*` class and flagged Menu's popup, which
     * is an internal element the caller does not address — the root there
     * is the trigger, and it merges. Naming the wrong thing is how a gate
     * gets switched off.
     */
    for (const [file, text] of source) {
      const name = file.replace(/\.tsx$/, "");
      const body = code(text);
      const start = body.search(
        new RegExp(`export function ${name}\\(|export const ${name} =`),
      );
      if (start === -1) continue;
      // Up to the next top-level declaration.
      const rest = body.slice(start);
      const end = rest.search(/\n(?:function|export|const) /);
      const fn = end === -1 ? rest : rest.slice(0, end);

      // Nothing to merge if the component does not *accept* a className.
      // Tooltip renders no element of its own — it wraps the caller's —
      // so its literal class sits on a trigger the caller never
      // addresses. Testing for the word anywhere in the function matched
      // `className="uix-tooltip"` and defeated the exemption; the
      // question is whether it is in the parameter list.
      const params = /\(\{([\s\S]*?)\}:/.exec(fn)?.[1] ?? "";
      if (!/^\s*className,?\s*$/m.test(params)) continue;

      const branches = [...fn.matchAll(/\n\s*return \(([\s\S]*?)\n\s*\);/g)];
      for (const [, branch] of branches) {
        expect(
          /cx\(|cxState\(|renderAsElement\(/.test(branch!),
          `${file}: one return branch renders without merging className, so a ` +
            `caller's class is dropped on that path`,
        ).toBe(true);
      }
    }
  });
});
