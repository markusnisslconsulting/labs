import type { ReactNode, ComponentPropsWithoutRef } from "react";

import { cx } from "../cx";
import "./Chip.css";
interface ChipOwnProps {
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

/**
 * Accepts every attribute of `<span>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type ChipProps = ChipOwnProps &
  Omit<ComponentPropsWithoutRef<"span">, keyof ChipOwnProps>;

export function Chip({
  children,
  interactive,
  active,
  onSelect,
  className,
  ...rest
}: ChipProps) {
  if (!interactive) {
    return (
      <span className={cx("uix-chip", className)} {...rest}>
        {children}
      </span>
    );
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
