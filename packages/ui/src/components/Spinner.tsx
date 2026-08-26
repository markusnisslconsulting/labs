import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";
import "./Spinner.css";

interface SpinnerOwnProps {
  /** Announced via role="status"; changes re-announce politely. */
  label?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Accepts every attribute of `<span>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type SpinnerProps = SpinnerOwnProps &
  Omit<ComponentPropsWithoutRef<"span">, keyof SpinnerOwnProps>;

/**
 * **Use it for** a short wait with no known duration. **Reach for something else when** the layout is already known (Skeleton), or progress is measurable (ProgressBar).
 *
 * Waiting indicator.
 *
 * Accessibility: `role="status"` with a visually hidden label, so
 * screen readers announce the wait without seeing a shape.
 *
 * Performance: pure `transform: rotate` keyframes — compositor only,
 * constant cost regardless of page complexity.
 */
export function Spinner({
  label = "Loading",
  size = "md",
  className,
  ...rest
}: SpinnerProps) {
  return (
    <span
      className={cx("uix-spinner", className)}
      data-size={size}
      role="status"
      {...rest}
    >
      <span className="uix-visually-hidden">{label}</span>
      <span className="uix-spinner-wheel" aria-hidden />
    </span>
  );
}
