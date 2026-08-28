import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";

import { cx } from "../cx";
import type { StackGap } from "./Stack";
import "./Split.css";

interface SplitOwnProps {
  /** The narrow half: a filter panel, a detail rail, a table of contents. */
  side: ReactNode;
  /** Which edge the narrow half sits on, logically. Defaults to `start`. */
  sidePosition?: "start" | "end";
  /** How wide the narrow half wants to be. Defaults to `md`. */
  sideWidth?: "sm" | "md" | "lg";
  gap?: StackGap;
  /** The wide half. */
  children: ReactNode;
}

export type SplitProps = SplitOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof SplitOwnProps>;

/**
 * **Use it for** two halves that are not equal: a list beside a detail, a
 * filter rail beside results, content beside a table of contents. **Reach
 * for something else when** the halves are equal and reflow (`Columns`), or
 * the whole page's regions are the question (`AppShell`).
 *
 * It collapses on its own. The narrow half has a preferred width and the
 * wide half has a minimum, so when the two no longer fit the row wraps and
 * they stack — with no media query and therefore no viewport assumption.
 * Put this inside a drawer 420px wide and it stacks there too, which a
 * breakpoint version does not: the window is still wide, so the query still
 * says two columns, and the content is crushed.
 *
 * The stacking order when it wraps is DOM order, so `sidePosition="end"`
 * keeps the side visually last on a wide screen and *still* reads last to a
 * screen reader and last when stacked. Ordering it with CSS instead would
 * have put the reading order and the visual order out of step, which is
 * WCAG 1.3.2 and the most common thing a hand-built two-column layout gets
 * wrong.
 *
 * Theming:
 *
 * | Token | Default | Meaning |
 * | --- | --- | --- |
 * | `--uix-split-side` | `18rem` | Preferred width of a Split's narrow half |
 * | `--uix-split-main-min` | `24rem` | Width a Split's wide half needs before the two stack |
 *
 * ```tsx
 * <Split side={<FilterPanel />} sideWidth="sm" gap="xl">
 *   <DataTable columns={columns} rows={rows} />
 * </Split>
 * ```
 *
 * Accessibility: two `div`s and no roles. Give the side its own landmark
 * where it deserves one — `<Split side={<nav aria-label="Filters">…</nav>}>`.
 */
export function Split({
  side,
  sidePosition = "start",
  sideWidth = "md",
  gap = "xl",
  children,
  className,
  style,
  ...rest
}: SplitProps) {
  const wide = (
    <div className="uix-split-main" key="main">
      {children}
    </div>
  );
  const narrow = (
    <div className="uix-split-side" key="side">
      {side}
    </div>
  );
  return (
    <div
      className={cx("uix-split", className)}
      data-side={sidePosition}
      data-side-width={sideWidth}
      data-gap={gap}
      style={style as CSSProperties}
      {...rest}
    >
      {sidePosition === "start" ? [narrow, wide] : [wide, narrow]}
    </div>
  );
}
