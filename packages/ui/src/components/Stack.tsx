import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";

import { cx } from "../cx";
import { renderAsElement, type Renderable } from "../renderAs";
import "./Stack.css";

/** The gap scale, by name. Values come from the density-scaled tokens. */
export type StackGap = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface StackOwnProps {
  /**
   * Which axis the children run along, named logically.
   *
   * `block` stacks down the page and `inline` runs along the reading
   * direction, so a stack of buttons reverses in Arabic without anybody
   * writing a second rule. `row` and `column` would have been the familiar
   * names and the wrong ones: they are physical, and half this library's
   * RTL defects came from physical properties written by people who only
   * ever saw them left to right.
   */
  direction?: "block" | "inline";
  /**
   * The space between children, from the density-scaled scale. Defaults to
   * `md`.
   *
   * This is the whole reason the component exists. See the note on the
   * component below.
   *
   * Written lowercase deliberately, in this paragraph too. `api.spec.ts`
   * reads a capitalised spelling of that word as a claim about the key of
   * the same name and asks for a keyboard-map row, which is the right
   * thing for it to do. The alternative was to require key-ish context in
   * the same sentence, and measured against the library that rule stops
   * flagging Checkbox, Slider and Tooltip, all three of which really do
   * document a key. One false positive is worth less than three false
   * negatives, so the prose moves rather than the gate — including this
   * sentence, whose first draft named the key and tripped the gate again.
   */
  gap?: StackGap;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between";
  /** Wrap onto more lines when the children do not fit. */
  wrap?: boolean;
  /**
   * Render as a different element, keeping every style.
   * `renderAs={<ul />}` for a list, `renderAs={<main />}` for a landmark.
   */
  renderAs?: Renderable;
  children: ReactNode;
}

export type StackProps = StackOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof StackOwnProps>;

const ALIGN = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
} as const;

const JUSTIFY = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
} as const;

/**
 * **Use it for** the space between things. **Reach for something else when**
 * the children need to wrap into a grid of equal columns (`Columns`) or to
 * form a wrapping row of small items (`Cluster`).
 *
 * The layer above the component, and the reason it is a component at all:
 * **spacing belongs to the container, not to the thing being spaced.**
 *
 * A component that sets its own outer margin looks right in the screen it
 * was designed for and wrong in every other. Two of them next to each other
 * collapse, or do not, depending on which properties each chose. The margin
 * also has to know something the component cannot know — what it sits next
 * to — so it is a decision taken in the wrong place. Move it up one level
 * and the component becomes composable: it has an inside and no opinion
 * about its outside.
 *
 * That rule is enforced rather than documented. `packages/ui/test/tokens.spec.ts`
 * fails on an outer margin in any component stylesheet, because a rule
 * everybody agrees with and nothing checks is a rule that lasts until the
 * next hurry.
 *
 * ```tsx
 * <Stack gap="lg">
 *   <PageHeader title="Suppliers" />
 *   <DataTable columns={columns} rows={rows} />
 * </Stack>
 * ```
 *
 * Accessibility: a `div` with no role, so it adds nothing to the tree. Use
 * `renderAs` when the grouping is meaningful — `renderAs={<ul />}` for a
 * list, and then the children are `<li>`.
 */
export function Stack({
  direction = "block",
  gap = "md",
  align,
  justify,
  wrap,
  renderAs,
  children,
  className,
  style,
  ...rest
}: StackProps) {
  const layout = {
    "data-direction": direction,
    "data-gap": gap,
    style: {
      ...style,
      ...(align ? { alignItems: ALIGN[align] } : {}),
      ...(justify ? { justifyContent: JUSTIFY[justify] } : {}),
      ...(wrap ? { flexWrap: "wrap" } : {}),
    } as CSSProperties,
    ...rest,
  };

  return (
    renderAsElement(
      renderAs,
      "uix-stack",
      { ...layout, className },
      children,
    ) ?? (
      <div className={cx("uix-stack", className)} {...layout}>
        {children}
      </div>
    )
  );
}
