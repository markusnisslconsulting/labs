import type { ReactNode } from "react";

export interface ChipProps {
  children: ReactNode;
  /**
   * Static chips are plain labels (a card's tag list). Interactive
   * chips are filters: they render a native button with
   * `aria-pressed`, so screen readers announce the toggle state.
   */
  interactive?: boolean;
  active?: boolean;
  onSelect?: () => void;
}

export function Chip({ children, interactive, active, onSelect }: ChipProps) {
  if (!interactive) {
    return <span className="uix-chip">{children}</span>;
  }
  return (
    <button
      type="button"
      className="uix-chip"
      aria-pressed={Boolean(active)}
      onClick={onSelect}
    >
      {children}
    </button>
  );
}
