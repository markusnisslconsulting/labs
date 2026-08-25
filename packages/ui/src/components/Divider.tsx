import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";
import "./Divider.css";

interface DividerOwnProps {
  orientation?: "horizontal" | "vertical";
  /** Accessible name when the divider groups content semantically. */
  label?: string;
}

/**
 * Accepts every attribute of `<div>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type DividerProps = DividerOwnProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof DividerOwnProps>;

/**
 * A rule between content groups.
 *
 * Accessibility: renders `role="separator"`; purely decorative by
 * default — pass a `label` only when the divider means something
 * (e.g. between two form sections a screen reader user navigates).
 */
export function Divider({
  orientation = "horizontal",
  label,
  className,
  ...rest
}: DividerProps) {
  return (
    <div
      className={cx(`uix-divider uix-divider--${orientation}`, className)}
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      {...rest}
    />
  );
}
