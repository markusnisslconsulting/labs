import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";
import "./Badge.css";

interface BadgeOwnProps {
  tone?: "accent" | "neutral" | "danger" | "success";
  children: string;
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
  ...rest
}: BadgeProps) {
  return (
    <span className={cx("uix-badge", className)} data-tone={tone} {...rest}>
      {children}
    </span>
  );
}
