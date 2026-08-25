import type { ReactNode, ComponentPropsWithoutRef } from "react";

import { cx } from "../cx";
import "./Table.css";
interface TableOwnProps {
  caption?: string;
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
 * Semantic table with the system's surface styling. Markup stays
 * yours: `thead`/`tbody`/`th scope` decide accessibility, this
 * wrapper decides looks.
 */
export function Table({ caption, children, className, ...rest }: TableProps) {
  return (
    <div className={cx("uix-table-wrap", className)} {...rest}>
      <table className="uix-table">
        {caption ? (
          <caption className="uix-visually-hidden">{caption}</caption>
        ) : null}
        {children}
      </table>
    </div>
  );
}
