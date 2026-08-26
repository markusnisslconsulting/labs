import type { ComponentPropsWithRef } from "react";

import { cx } from "../cx";
import "./Card.css";

export type CardProps = ComponentPropsWithRef<"article">;
export type CardSlotProps = ComponentPropsWithRef<"div">;
/**
 * **Use it for** a summary that links somewhere else. **Reach for something else when** the surface is a section of this page (Panel).
 *
 * Generic surface with compound slots.
 *
 * Pattern: compound components rendering in place — NOT
 * children-type-filtering (`child.type === Title`), which breaks when
 * a slot gets wrapped, and breaks across duplicate package copies
 * where the type is a different function reference.
 *
 * Accessibility: `article` with an optional labelled header. Every
 * slot forwards its attributes, so `aria-label`, `id` and `role` can
 * be set where they belong instead of being unreachable.
 */
export function Card({ children, className, ...rest }: CardProps) {
  return (
    <article className={cx("uix-card", className)} {...rest}>
      {children}
    </article>
  );
}

function HeaderBase({ children, className, ...rest }: CardSlotProps) {
  return (
    <div className={cx("uix-card-header", className)} {...rest}>
      {children}
    </div>
  );
}

function BodyBase({ children, className, ...rest }: CardSlotProps) {
  return (
    <div className={cx("uix-card-body", className)} {...rest}>
      {children}
    </div>
  );
}

function FooterBase({ children, className, ...rest }: CardSlotProps) {
  return (
    <div className={cx("uix-card-footer", className)} {...rest}>
      {children}
    </div>
  );
}

Card.Header = HeaderBase;
Card.Body = BodyBase;
Card.Footer = FooterBase;
