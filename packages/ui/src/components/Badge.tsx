import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";
import { renderAsElement, type Renderable } from "../renderAs";
import "./Badge.css";

interface BadgeOwnProps {
  /**
   * Render as a different element, keeping every style and behaviour.
   * `renderAs={<a href="/pricing" />}` — the same convention Base UI
   * uses, so the library has one mental model for polymorphism rather
   * than an `as` prop here and a `render` prop there.
   */
  renderAs?: Renderable;

  tone?: "accent" | "neutral" | "danger" | "success";
  /**
   * A node, not a string. A badge with an icon beside its count was
   * unreachable while this was `string`, which is the whole shape of the
   * problem: the type decided what a badge could ever say.
   */
  children: ReactNode;
}

/**
 * Accepts every attribute of `<span>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type BadgeProps = BadgeOwnProps &
  Omit<ComponentPropsWithoutRef<"span">, keyof BadgeOwnProps>;

/**
 * **Use it for** labelling a state on a row or card. **Reach for something else when** the label performs an action (Button), or the state changes on its own (StatusPill).
 *
 * Usage: status labels on rows and cards; never for actions (use Button).
 *
 * A short status label. The text is the content — tone only colours
 * it, so screen readers and greyscale both work.
 */
export function Badge({
  tone = "neutral",
  children,
  className,
  renderAs,
  ...rest
}: BadgeProps) {
  const props = { ...rest, className, "data-tone": tone };
  return (
    renderAsElement(renderAs, "uix-badge", props, children) ?? (
      <span className={cx("uix-badge", className)} data-tone={tone} {...rest}>
        {children}
      </span>
    )
  );
}
