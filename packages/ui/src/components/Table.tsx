import type { ReactNode, ComponentPropsWithoutRef } from "react";

import { cx } from "../cx";
import "./Table.css";
interface TableOwnProps {
  caption?: ReactNode;
  children: ReactNode;
}

/**
 * Accepts every attribute of `<div>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type TableProps = TableOwnProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof TableOwnProps>;

/**
 * **Use it for** rows compared across the same columns. **Reach for something else when** each row is an object to open (a list of Cards).
 *
 * Semantic table with the system's surface styling. Markup stays
 * yours: `thead`/`tbody`/`th scope` decide accessibility, this
 * wrapper decides looks.
 *
 * Accessibility: markup stays yours — `thead`, `tbody` and `th scope` are
 * what make a table navigable, and no wrapper can supply them for you.
 * The caption is the table's accessible name and is visually hidden.
 *
 * The scroll container is focusable. `overflow-x: auto` creates a region
 * only a pointer can reach, so a keyboard-only user could not scroll a
 * wide table sideways at all — WCAG 2.1.1 in its plainest form. It has a
 * `tabindex`, a role and a visible focus ring.
 */
export function Table({ caption, children, className, ...rest }: TableProps) {
  return (
    /*
     * The scroll container is focusable, and that is not decoration.
     * `overflow-x: auto` creates a region only a pointer can reach: a
     * keyboard-only user could not scroll a wide table sideways at all,
     * which is WCAG 2.1.1 in the plainest form. tabindex="0" plus a name
     * makes it a real region — and the caption is the name, which is why
     * a table without one gets `role="group"` and no landmark rather than
     * an unnamed region for a screen reader to announce as nothing.
     */
    <div
      className={cx("uix-table-wrap", className)}
      tabIndex={0}
      role={caption ? "region" : "group"}
      aria-label={typeof caption === "string" ? caption : undefined}
      {...rest}
    >
      <table className="uix-table">
        {caption ? (
          <caption className="uix-visually-hidden">{caption}</caption>
        ) : null}
        {children}
      </table>
    </div>
  );
}
