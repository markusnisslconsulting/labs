import type { ComponentPropsWithRef } from "react";
import { cx } from "../cx";
import "./Skeleton.css";

interface SkeletonOwnProps {
  /** Text-line placeholder by default; circle for avatars. */
  shape?: "line" | "circle" | "block";
  width?: string;
  height?: string;
}

/**
 * Accepts every attribute of `<span>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type SkeletonProps = SkeletonOwnProps &
  Omit<ComponentPropsWithRef<"span">, keyof SkeletonOwnProps>;

/**
 * **Use it for** holding the shape of content that is about to arrive. **Reach for something else when** the wait has no known shape (Spinner).
 *
 * Loading placeholder.
 *
 * Accessibility: `aria-hidden` — the loading state belongs to the
 * region that is loading, not to a decoration; pair it with a
 * visually hidden or announced status where the wait matters.
 *
 * Performance: the shimmer is a `transform` keyframe on a
 * pseudo-element — compositor only, one layer.
 */
export function Skeleton({
  shape = "line",
  width,
  height,
  className,
  ...rest
}: SkeletonProps) {
  return (
    <span
      className={cx(`uix-skeleton uix-skeleton--${shape}`, className)}
      style={{ width, height }}
      aria-hidden
      {...rest}
    />
  );
}
