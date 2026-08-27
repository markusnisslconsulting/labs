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
  "AvatarGroup.tsx":
    "label names the group; a row of overlapping faces is one thing to a " +
    "reader and not five, and without a name it is five names with nothing " +
    "said about what they have in common",
  "Breadcrumb.tsx": "label names the nav",
  "Pagination.tsx": "label names the nav landmark, per instance",
  "Divider.tsx": "label names the separator",
  "IconButton.tsx": "label is the button's only name",
  "NumberField.tsx": "label is the input's aria-label",
  "Panel.tsx": "label names the region",
  "SegmentedControl.tsx": "label names the group",
  "Slider.tsx": "label is the slider's aria-label",
  "Tabs.tsx": "label names the tablist",
  "Dialog.tsx": "title is announced as the dialog's name",
  "Drawer.tsx":
    "title is announced as the panel's name, for the same reason as Dialog",
  "Stepper.tsx": "label names the nav that holds the sequence",
  "Toolbar.tsx":
    "label names the toolbar; two unnamed ones are two identical landmarks",
  "Spinner.tsx": "label is the live region's text; a spinner has no other name",
  "Select.tsx":
    "SelectOption.label is an <option>'s text, and HTML forbids markup " +
    "inside one — the platform's rule, not ours. The field's own label is " +
    "a node.",
};

/**
 * Text between tags that is not a message to a reader.
 *
 * Kept short and specific on purpose: every addition is a decision that
 * some English will ship, so it has to be a word that is not English —
 * a type name in a docstring's shape, a unit that is the same everywhere.
 */
const ALLOWED_TEXT = new Set<string>([]);

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

/**
 * Whether a component lets the caller decide what is *inside* each item.
 *
 * A per-item render function returning a node — `cell?: (row: Row) =>
 * ReactNode` — is composition in the sense both rules below care about.
 * What they protect against is a fixed arrangement: a prop that can only
 * describe the shape its author imagined, so that a tab with a count in it
 * means not using Tabs. Compound parts plus children is one cure and the
 * common one; handing the caller a function that returns a node is
 * another, and for a table it is the better fit, because a table's items
 * are rows and a row is not something a caller writes markup for.
 *
 * Measured before it was added: of the nine components with a list-shaped
 * prop, eight have parts and children and none has a render prop, and
 * `DataTable` is the only one the other way round. So this widens the rule
 * for exactly one component and lets nothing else through.
 */
const RENDERS_ITS_ITEMS = /\w+\??:\s*\((\w+)[^)]*\)\s*=>\s*ReactNode/;

describe("component API contract", () => {
  it("every component is composable, or says why it cannot be", () => {
    for (const [file, text] of source) {
      const name = file.replace(/\.tsx$/, "");
      const takesChildren =
        /children\??:\s*(React\.)?ReactNode/.test(text) ||
        // A render prop is composition too, and the stricter kind: Field
        // hands the caller the ids it minted, which is the only way the
        // control can be wired without the caller holding them.
        /children:\s*\(/.test(text) ||
        RENDERS_ITS_ITEMS.test(text);
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
      const arrayProp = /^\s+(items|options|tabs|pages|columns|rows)\??:/m.test(
        text,
      );
      if (!arrayProp) continue;
      const hasParts = new RegExp(`${name}\\.\\w+\\s*=`).test(text);
      const takesChildren = /children\??:\s*(React\.)?ReactNode/.test(text);
      expect(
        (hasParts && takesChildren) || RENDERS_ITS_ITEMS.test(text),
        `${file} has a list-shaped prop but neither compound parts and ` +
          `children to compose instead, nor a per-item render prop returning ` +
          `a node`,
      ).toBe(true);
    }
  });

  /**
   * The barrel exports every component the package ships.
   *
   * Added because three had quietly fallen out of it: `Dialog` — with
   * `AlertDialog` — and `Field`, with its `useFieldMessages`. Each was a
   * finished, documented component with stories and an inventory entry, and
   * `import { Dialog } from "@labs/ui"` did not compile while every other
   * component did.
   *
   * The subpath export saved it from being fatal: `@labs/ui/components/Dialog`
   * always worked, because the exports map is a wildcard. That is exactly
   * why nothing noticed. A wildcard cannot drift, so the gates aimed at
   * packaging all passed, and the barrel — which is a hand-maintained list —
   * was the one place with no check on it.
   *
   * Checked against the directory rather than a list, so a new component is
   * covered on the day it is written and not at the next audit.
   */
  it("the barrel exports every component", () => {
    const barrel = readFileSync("packages/ui/src/index.ts", "utf8");
    const missing = readdirSync(DIR)
      .filter(
        (file) =>
          file.endsWith(".tsx") &&
          !file.endsWith(".stories.tsx") &&
          !file.startsWith("_"),
      )
      .map((file) => file.replace(/\.tsx$/, ""))
      .filter((name) => !barrel.includes(`"./components/${name}"`));

    expect(
      missing,
      "these components are not importable from the package root. The " +
        "subpath export still reaches them, which is why this drifts " +
        "unnoticed — add them to src/index.ts",
    ).toEqual([]);
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

  it("no component compiles in a word a reader can see", () => {
    /*
     * The rule above only read attributes — aria-label, title,
     * placeholder — so it never looked at the half of the problem a
     * sighted reader also gets. Popover shipped a Close button whose
     * label was the English word Close, written between two tags, for as
     * long as the component existed. The gate ran green on it every time.
     *
     * Text between JSX tags, then: two or more letters, no interpolation.
     * The asterisk on a required field is not a word and is paired with
     * one from the table, which is why it is not caught here.
     */
    for (const [file, text] of source) {
      const words = [
        ...code(text).matchAll(/>\s*([A-Za-z][A-Za-z'’ ]{2,})\s*</g),
      ]
        .map((hit) => hit[1]!.trim())
        .filter((word) => !ALLOWED_TEXT.has(word));
      expect(
        words,
        `${file} renders the visible text ${words.join(", ")}. A reader in a ` +
          `second market cannot change it. Put it in Strings in ` +
          `src/i18n.tsx and read it through useStrings.`,
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

      // A component may build its root once and return it from more than
      // one branch: Checkbox renders the control alone, or wrapped with a
      // hint and an error under it. The wrapper is layout; the caller's
      // class belongs on the control, which is what `control` already
      // merged. So a branch that embeds such a variable counts as merged.
      const merged = new Set<string>();
      for (const [, name_, body_] of fn.matchAll(
        /const (\w+) = \(([\s\S]*?)\n  \);/g,
      )) {
        if (/cx\(|cxState\(|renderAsElement\(/.test(body_!)) merged.add(name_!);
      }

      /* The component's own returns, at the body's indentation. A
         `\s*` here also matched a `return (` inside a `.map()` callback,
         which is a different function and has no business merging the
         component's className — it failed `Stepper` for rendering a list
         item per step. Two spaces is the same assumption the `merged`
         scan above already makes. */
      const branches = [...fn.matchAll(/\n  return \(([\s\S]*?)\n  \);/g)];
      for (const [, branch] of branches) {
        if ([...merged].some((name_) => branch!.includes(`{${name_}}`)))
          continue;
        expect(
          // Forwarding to a component that merges counts: TextField hands
          // className to Field, which is the whole point of Field — the
          // field wrapper and its class exist in one place.
          /cx\(|cxState\(|renderAsElement\(|className=\{className\}/.test(
            branch!,
          ),
          `${file}: one return branch renders without merging className, so a ` +
            `caller's class is dropped on that path`,
        ).toBe(true);
      }
    }
  });
});

/**
 * The field family, measured.
 *
 * Before Field existed this was the audit:
 *
 *     field         label  hint  error  required
 *     TextField     y      y     y      .
 *     Select        y      y     .      .
 *     Combobox      y      .     .      .
 *     NumberField   y      .     .      .
 *     Slider        y      .     .      .
 *     SearchInput   y      .     .      .
 *     Checkbox      y      .     .      .
 *     RadioGroup    y      .     .      .
 *     Switch        y      .     .      .
 *
 * One field could show an error. Two could show a hint. None could say it
 * was required. A form with a required Select that failed validation was
 * not expressible — and nothing in the pipeline said so, because every
 * component was internally consistent. The inconsistency was between
 * them, which is the kind no per-component test can see.
 */
describe("the field family", () => {
  const FIELDS = [
    "TextField",
    "Select",
    "Combobox",
    "NumberField",
    "Slider",
    "SearchInput",
    "Checkbox",
    "RadioGroup",
    "Switch",
  ];

  it.each(FIELDS)("%s takes hint, error and required", (name) => {
    const text = readFileSync(join(DIR, `${name}.tsx`), "utf8");
    for (const prop of ["hint?:", "error?:", "required?:"]) {
      expect(text, `${name} cannot express ${prop.slice(0, -2)}`).toContain(
        prop,
      );
    }
  });

  /**
   * And derives the wiring in one place. Nine components each computing
   * their own `aria-describedby` is nine chances to forget the error id,
   * which is what TextField's neighbours all did.
   */
  it.each(FIELDS)("%s does not re-derive the aria wiring", (name) => {
    const text = code(readFileSync(join(DIR, `${name}.tsx`), "utf8"));
    expect(
      /useFieldMessages|<Field\b/.test(text),
      `${name} wires its own messages instead of using Field`,
    ).toBe(true);
    expect(
      text,
      `${name} builds its own describedBy string; Field owns that`,
    ).not.toMatch(/-hint`/);
  });

  /**
   * A required field conveys the state programmatically, not as a word.
   *
   * This rule used to demand the opposite: that each field append the
   * word "required" to its label, on the reasoning that an asterisk alone
   * is a convention a reader has to know. Half of that is right and the
   * conclusion was wrong. `required` on the control is a real programmatic
   * state and every screen reader announces it, so the word made a reader
   * say it twice — measured with Playwright's accessible-name
   * computation, the name came out "Required required".
   *
   * axe reports nothing about that: there is nothing invalid. It took
   * asking what the accessibility tree actually says, which is what
   * `browser/announce.spec.ts` now does.
   */
  it.each(FIELDS)("%s conveys required as a state, not a word", (name) => {
    const text = code(readFileSync(join(DIR, `${name}.tsx`), "utf8"));
    expect(
      text,
      `${name} appends the word "required" to its label, duplicating a ` +
        `state the control already carries`,
    ).not.toMatch(/visually-hidden[^>]*>\s*\{?strings\.required/);
    /* Two mechanisms, two shapes, and the rule has to know which.
       A component wrapped in <Field> receives one object and spreads it,
       so nothing can be missed by omission. A choice control — Checkbox,
       Switch, RadioGroup — is its own label, so Field's layout does not
       fit it; it takes the messages from useFieldMessages and puts the
       state on its own root. Demanding a spread from those three failed
       them for using the mechanism built for them. */
    const usesField = /<Field\b/.test(text);
    if (usesField) {
      expect(
        /\{\.\.\.control\}/.test(text),
        `${name} is wrapped in Field and assembles the wiring by hand ` +
          `instead of spreading its control props, so one of the four can ` +
          `be missed`,
      ).toBe(true);
    } else {
      expect(
        /required=\{|aria-required=\{/.test(text),
        `${name} marks required visually only; a reader needs the state on ` +
          `the control`,
      ).toBe(true);
    }
  });
});

/**
 * A keyboard claim needs a row in the map.
 *
 * Eleven components name a key in their documentation — Arrow, Home, End,
 * Escape, Enter, Space, PageUp, typeahead. Before the map existed, six key
 * presses were asserted in the whole repository, three of them written the
 * same afternoon for one slider. The rest was prose.
 *
 * Two defects came out of writing the map, and both were in the prose
 * rather than the behaviour, which is the point: Tabs said "Arrow/Home/End
 * per the ARIA pattern" without saying which of the pattern's two
 * activation variants, and Tooltip said Base UI announced its hint when
 * measurement showed nothing announced it at all.
 */
describe("the keyboard map", () => {
  const KEYS =
    /\b(Arrow(Up|Down|Left|Right)?|Home|End|Escape|PageUp|PageDown|typeahead)\b/;

  /**
   * Components whose claim cannot be exercised from a page, with the
   * reason. Kept short: each entry is a promise nothing checks.
   */
  const UNTESTABLE: Record<string, string> = {
    Select:
      "typeahead happens inside the operating system's own picker, which " +
      "the page cannot observe. The claim is that this is a native select, " +
      "and the reachability and focus tests cover that.",
    Combobox:
      "the datalist picker is browser chrome for the same reason. What is " +
      "ours — the input, its label and its filtering — is covered elsewhere.",
  };

  it("every component that claims a key has a row or a stated reason", () => {
    const map = readFileSync("packages/ui/src/keyboard.map.ts", "utf8");
    const missing: string[] = [];

    for (const [file, text] of source) {
      const name = file.replace(/\.tsx$/, "");
      const docs = (code(text).match(/\/\*\*[\s\S]*?\*\//g) ?? []).join("\n");
      // The docstrings are stripped by code(), so read them from the raw
      // text — a claim lives in prose by definition.
      const prose = (text.match(/\/\*\*[\s\S]*?\*\//g) ?? []).join("\n");
      void docs;
      if (!KEYS.test(prose)) continue;
      if (name in UNTESTABLE) continue;
      if (map.includes(`component: "${name}"`)) continue;
      missing.push(name);
    }

    expect(
      missing,
      `these components document a key and have no row in ` +
        `packages/ui/src/keyboard.map.ts. Add the row and its test, or ` +
        `add the component to UNTESTABLE with the reason a page cannot ` +
        `observe it.`,
    ).toEqual([]);
  });

  it("has no exemption for a component that now has a row", () => {
    // The other direction: an exemption left behind after the row landed
    // is a stale note pretending to be a decision.
    const map = readFileSync("packages/ui/src/keyboard.map.ts", "utf8");
    for (const name of Object.keys(UNTESTABLE)) {
      expect(
        map.includes(`component: "${name}"`),
        `${name} is exempted as untestable but now has a map row`,
      ).toBe(false);
    }
  });
});
