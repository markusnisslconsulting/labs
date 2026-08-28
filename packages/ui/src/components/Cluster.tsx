import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";

import { cx } from "../cx";
import { renderAsElement, type Renderable } from "../renderAs";
import type { StackGap } from "./Stack";
import "./Cluster.css";

interface ClusterOwnProps {
  /** Between items, and between lines once they wrap. Defaults to `sm`. */
  gap?: StackGap;
  align?: "start" | "center" | "end" | "baseline";
  justify?: "start" | "center" | "end" | "between";
  renderAs?: Renderable;
  children: ReactNode;
}

export type ClusterProps = ClusterOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof ClusterOwnProps>;

const ALIGN = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  baseline: "baseline",
} as const;

const JUSTIFY = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
} as const;

/**
 * **Use it for** a row of small things that may wrap: filter chips, a set of
 * actions, tags, breadcrumb-like runs. **Reach for something else when** the
 * children are equal columns of content (`Columns`) or a single axis that
 * must not wrap (`Stack`).
 *
 * A `Stack` with `wrap` would do the same thing, and this exists anyway,
 * because the two carry different intent at the call site and the wrong one
 * is a bug that looks like a preference. A stack of form fields must not
 * silently become two columns when the viewport narrows; a row of chips must.
 * Naming the wrapping case separately is how a reader — or an agent reading
 * the registry — picks the one whose failure mode they want.
 *
 * The gap applies between lines as well as between items, which is the part
 * hand-written flex rows get wrong: `gap` sets both, a `margin-inline-end`
 * sets neither.
 *
 * ```tsx
 * <Cluster gap="sm">
 *   {regions.map((r) => <Chip key={r}>{r}</Chip>)}
 * </Cluster>
 * ```
 *
 * Accessibility: a `div` with no role. `renderAs={<ul />}` when the set is a
 * list rather than a row of controls.
 */
export function Cluster({
  gap = "sm",
  align = "center",
  justify,
  renderAs,
  children,
  className,
  style,
  ...rest
}: ClusterProps) {
  const layout = {
    "data-gap": gap,
    style: {
      ...style,
      alignItems: ALIGN[align],
      ...(justify ? { justifyContent: JUSTIFY[justify] } : {}),
    } as CSSProperties,
    ...rest,
  };
  return (
    renderAsElement(
      renderAs,
      "uix-cluster",
      { ...layout, className },
      children,
    ) ?? (
      <div className={cx("uix-cluster", className)} {...layout}>
        {children}
      </div>
    )
  );
}
