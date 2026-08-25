export interface SkeletonProps {
  /** Text-line placeholder by default; circle for avatars. */
  shape?: "line" | "circle" | "block";
  width?: string;
  height?: string;
}

/**
 * Loading placeholder.
 *
 * Accessibility: `aria-hidden` — the loading state belongs to the
 * region that is loading, not to a decoration; pair it with a
 * visually hidden or announced status where the wait matters.
 *
 * Performance: the shimmer is a `transform` keyframe on a
 * pseudo-element — compositor only, one layer.
 */
export function Skeleton({ shape = "line", width, height }: SkeletonProps) {
  return (
    <span
      className={`uix-skeleton uix-skeleton--${shape}`}
      style={{ width, height }}
      aria-hidden
    />
  );
}
