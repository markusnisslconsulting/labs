import type { ReactNode } from "react";

/**
 * Generic surface with compound slots.
 *
 * Pattern: compound components rendering in place — NOT
 * children-type-filtering (`child.type === Title`), which breaks when
 * a slot gets wrapped, and breaks across duplicate package copies
 * where the type is a different function reference.
 *
 * Accessibility: `article` with optional labelled header; pass
 * `aria-label` via the header's heading when the card stands alone.
 */
export function Card({ children }: { children: ReactNode }) {
  return <article className="uix-card">{children}</article>;
}

function HeaderBase({ children }: { children: ReactNode }) {
  return <div className="uix-card-header">{children}</div>;
}

function BodyBase({ children }: { children: ReactNode }) {
  return <div className="uix-card-body">{children}</div>;
}

function FooterBase({ children }: { children: ReactNode }) {
  return <div className="uix-card-footer">{children}</div>;
}

Card.Header = HeaderBase;
Card.Body = BodyBase;
Card.Footer = FooterBase;
