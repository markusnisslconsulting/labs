import type { ReactNode } from "react";

export interface CardProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Generic surface with optional header and footer slots. Sections
 * are plain regions of content; no interactive behaviour lives here.
 */
export function Card({ header, footer, children }: CardProps) {
  return (
    <article className="uix-card">
      {header ? <div className="uix-card-header">{header}</div> : null}
      <div className="uix-card-body">{children}</div>
      {footer ? <div className="uix-card-footer">{footer}</div> : null}
    </article>
  );
}
