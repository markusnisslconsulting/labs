export interface SpinnerProps {
  /** Announced via role="status"; changes re-announce politely. */
  label?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Waiting indicator.
 *
 * Accessibility: `role="status"` with a visually hidden label, so
 * screen readers announce the wait without seeing a shape.
 *
 * Performance: pure `transform: rotate` keyframes — compositor only,
 * constant cost regardless of page complexity.
 */
export function Spinner({ label = "Loading", size = "md" }: SpinnerProps) {
  return (
    <span className="uix-spinner" data-size={size} role="status">
      <span className="uix-visually-hidden">{label}</span>
      <span className="uix-spinner-wheel" aria-hidden />
    </span>
  );
}
