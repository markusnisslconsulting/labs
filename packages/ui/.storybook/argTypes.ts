import type { ArgTypes } from "@storybook/react-vite";

/**
 * Props tables, grouped.
 *
 * Storybook infers types and TSDoc well enough that a props table
 * appears without any of this. What it cannot infer is which props are
 * the same kind of decision: `variant`, `tone` and `size` are the axes a
 * designer picks along, `disabled` and `loading` are states a product
 * drives, and `leading`/`trailing` are slots. Ungrouped, all eleven sit
 * in one alphabetical list and the reader has to rebuild that grouping
 * in their head every time.
 */
const AXES = [
  "variant",
  "tone",
  "size",
  "severity",
  "shape",
  "orientation",
  "position",
  "placement",
  "kind",
];
const STATES = [
  "disabled",
  "loading",
  "active",
  "checked",
  "defaultChecked",
  "indeterminate",
  "open",
  "defaultOpen",
  "error",
  "invalid",
  "value",
  "defaultValue",
];
const SLOTS = [
  "children",
  "leading",
  "trailing",
  "prefix",
  "suffix",
  "footer",
  "label",
  "title",
  "description",
  "content",
  "items",
  "options",
  "tabs",
  "toasts",
  "caption",
  "render",
];

/**
 * `render` must never be listed.
 *
 * Storybook treats `render` as a story annotation, so declaring it as an
 * argType makes the docs blocks call String.startsWith on a function and
 * the whole page dies with "t.startsWith is not a function". The prop is
 * still documented: docgen picks it up from the type, and the AsLink
 * story shows it in use.
 */
const RESERVED = ["render", "play", "loaders", "decorators", "parameters"];

function category(prop: string): string {
  if (AXES.includes(prop)) return "Appearance";
  if (STATES.includes(prop)) return "State";
  if (SLOTS.includes(prop)) return "Content";
  if (prop.startsWith("on")) return "Events";
  if (prop.startsWith("aria-") || prop === "role" || prop === "id")
    return "Accessibility";
  return "Other";
}

/** Group the props a component actually declares. */
export function grouped(...props: string[]): Partial<ArgTypes> {
  return Object.fromEntries(
    props
      .filter((prop) => !RESERVED.includes(prop))
      .map((prop) => [prop, { table: { category: category(prop) } }]),
  ) as Partial<ArgTypes>;
}
