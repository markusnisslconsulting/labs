import type { ReactNode } from "react";

export interface TableProps {
  caption?: string;
  children: ReactNode;
}

/**
 * Semantic table with the system's surface styling. Markup stays
 * yours: `thead`/`tbody`/`th scope` decide accessibility, this
 * wrapper decides looks.
 */
export function Table({ caption, children }: TableProps) {
  return (
    <div className="uix-table-wrap">
      <table className="uix-table">
        {caption ? <caption className="uix-visually-hidden">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}
