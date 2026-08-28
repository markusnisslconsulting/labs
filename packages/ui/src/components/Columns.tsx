import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";

import { cx } from "../cx";
import { renderAsElement, type Renderable } from "../renderAs";
import type { StackGap } from "./Stack";
import "./Columns.css";

interface ColumnsOwnProps {
  /**
   * How narrow a column may get before the row drops one.
   *
   * Named rather than numeric, and that is the point: a number here is a
   * breakpoint by another name, and it is the value most often invented on
   * the spot. Three names cover the cases a dense application has — a tile,
   * a card, a panel — and every grid in the product then breaks at the same
   * widths whether a person or a generator wrote it.
   */
  min?: "sm" | "md" | "lg";
  /** Between columns and between rows. Defaults to `lg`. */
  gap?: StackGap;
  renderAs?: Renderable;
  children: ReactNode;
}

export type ColumnsProps = ColumnsOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof ColumnsOwnProps>;

/**
 * **Use it for** equal columns that reflow: card grids, tile lists, a row of
 * summary panels. **Reach for something else when** the two sides are not
 * equal and one of them is a sidebar (`Split`), or the children are a single
 * run that may wrap (`Cluster`).
 *
 * No media queries, and no breakpoints to agree on. `auto-fit` with a
 * minimum column width lets the browser decide how many fit, which removes
 * the decision rather than centralising it: there is no list of breakpoints
 * to keep in sync with the design, and a container 400px wide behaves the
 * same whether it is a phone or a narrow panel on a desktop.
 *
 * That last part is the reason to prefer it over a breakpoint grid in a
 * product full of panels and drawers. A media query asks how wide the
 * *window* is. Every layout question inside an application is about how wide
 * the *box* is, and those two answers stopped agreeing the moment anything
 * was put in a sidebar.
 *
 * Theming:
 *
 * | Token | Default | Meaning |
 * | --- | --- | --- |
 * | `--uix-columns-min` | `17rem` | Narrowest a Columns column gets before the row drops one |
 *
 * ```tsx
 * <Columns min="md" gap="lg">
 *   {suppliers.map((s) => <Card key={s.id}>{...}</Card>)}
 * </Columns>
 * ```
 *
 * Accessibility: a `div` with no role. `renderAs={<ul />}` when it is a list.
 */
export function Columns({
  min = "md",
  gap = "lg",
  renderAs,
  children,
  className,
  style,
  ...rest
}: ColumnsProps) {
  const layout = {
    "data-min": min,
    "data-gap": gap,
    style: style as CSSProperties,
    ...rest,
  };
  return (
    renderAsElement(
      renderAs,
      "uix-columns",
      { ...layout, className },
      children,
    ) ?? (
      <div className={cx("uix-columns", className)} {...layout}>
        {children}
      </div>
    )
  );
}
