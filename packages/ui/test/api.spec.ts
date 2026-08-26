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

  it("every part merges the caller's className rather than replacing it", () => {
    // Passing className used to strip a component's own styling. The roots
    // were fixed long ago; the parts are new, and this is the rule they
    // have to inherit.
    for (const [file, text] of source) {
      const name = file.replace(/\.tsx$/, "");
      if (!new RegExp(`${name}\\.\\w+\\s*=`).test(text)) continue;
      // Every function that destructures className must pass it through cx.
      for (const hit of text.matchAll(
        /function (\w+)\(\{([^}]*)\}[^)]*\)\s*\{([\s\S]*?)\n\}/g,
      )) {
        const [, fnName, params, body] = hit;
        if (!/\bclassName\b/.test(params!)) continue;
        expect(
          /cx\(|cxState\(/.test(body!),
          `${file}: ${fnName} takes className and does not merge it through cx`,
        ).toBe(true);
      }
    }
  });
});
