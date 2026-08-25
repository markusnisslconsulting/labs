export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  /** Accessible name when the divider groups content semantically. */
  label?: string;
}

/**
 * A rule between content groups.
 *
 * Accessibility: renders `role="separator"`; purely decorative by
 * default — pass a `label` only when the divider means something
 * (e.g. between two form sections a screen reader user navigates).
 */
export function Divider({ orientation = "horizontal", label }: DividerProps) {
  return (
    <div
      className={`uix-divider uix-divider--${orientation}`}
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
    />
  );
}
