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
  // The interactive branch is a <button>, so the span attributes in
  // ChipProps do not all apply; the ones that do are forwarded, and
  // className merges here as it does above. Before this it did neither,
  // which made the filter chip the one closed component left.
  return (
    <button
      type="button"
      className={cx("uix-chip", className)}
      aria-pressed={Boolean(active)}
      onClick={onSelect}
      {...(rest as ComponentPropsWithoutRef<"button">)}
    >
      {children}
    </button>
  );
}
