import type { ComponentPropsWithRef, CSSProperties } from "react";

import { cx } from "../cx";
import "./Card.css";

export type CardProps = ComponentPropsWithRef<"article">;
export type CardSlotProps = ComponentPropsWithRef<"div">;

export interface CardMediaProps extends ComponentPropsWithRef<"div"> {
  /**
   * The box the image is fitted into, as a CSS `aspect-ratio`.
   *
   * Defaults to `16 / 9`, and the default is the point of the slot. Cards
   * are laid out in grids, and a grid of cards whose images keep their own
   * intrinsic ratios has a ragged row of headers: every card starts its
   * title at a different height. Fixing the box and cropping to it is the
   * only way the titles line up.
   *
   * Cropping is a real cost, paid here rather than hidden: a portrait
   * photograph in a 16/9 box loses its top and bottom. Pass the ratio the
   * pictures actually have when they all have one, and set
   * `object-position` on the image when the subject is not centred.
   */
  ratio?: number | string;
}
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
 *
 * Theming:
 *
 * | Token | Default | Meaning |
 * | --- | --- | --- |
 * | `--uix-card-media-ratio` | `16 / 9` | Box a card's banner image is cropped to |
 *
 * The ratio is a slot as well as a prop because a brand usually wants one
 * answer for every card, and setting it per card is how a grid of cards
 * ends up with its titles out of line. `Card.Media`'s `ratio` prop writes
 * this same property inline, so the prop wins where both are set.
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

/**
 * A banner image, edge to edge.
 *
 * Sizes the box, not the picture: the child image is stretched to fill and
 * cropped, so the caller's job is the `alt` text and nothing else. That is
 * the one thing this cannot do for them — whether a card's photograph is
 * information or decoration is a question about the page, and an empty
 * `alt` on a meaningful image is as wrong as a described decorative one.
 *
 * Put it first for a header image or last for a footer image. It carries no
 * divider of its own: the header below already draws one, and above a
 * bottom-placed media the footer draws it.
 */
function MediaBase({
  children,
  className,
  ratio,
  style,
  ...rest
}: CardMediaProps) {
  return (
    <div
      className={cx("uix-card-media", className)}
      style={
        {
          ...style,
          "--uix-card-media-ratio": ratio ?? "16 / 9",
        } as CSSProperties
      }
      {...rest}
    >
      {children}
    </div>
  );
}

Card.Media = MediaBase;
Card.Header = HeaderBase;
Card.Body = BodyBase;
Card.Footer = FooterBase;
