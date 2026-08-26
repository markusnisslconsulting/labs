"use client";

import type { ReactNode, ComponentPropsWithoutRef } from "react";

import { cx } from "../cx";
import { renderAsElement, type Renderable } from "../renderAs";
import "./Chip.css";
interface ChipOwnProps {
  /**
   * Render as a different element, keeping every style and behaviour.
   * `renderAs={<a href="/pricing" />}` — the same convention Base UI
   * uses, so the library has one mental model for polymorphism.
   */
  renderAs?: Renderable;

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
 * **Use it for** a compact tag, or a filter that toggles. **Reach for something else when** the choice is one of a few fixed views (SegmentedControl).
 *
 * Accepts every attribute of `<span>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type ChipProps = ChipOwnProps &
  Omit<ComponentPropsWithoutRef<"span">, keyof ChipOwnProps>;

/**
 * **Use it for** a compact tag, or a filter that toggles. **Reach for
 * something else when** the choice is one of a few fixed views
 * (SegmentedControl).
 *
 * Static chips are plain labels; interactive chips render a native
 * button with `aria-pressed`, so the toggle state is announced.
 *
 * ### Theming
 *
 * Override slots for this component. None is declared: each is
 * referenced with its semantic default inline, so a slot costs
 * nothing until something fills it. Set one on any ancestor.
 *
 * | Token | Default | Meaning |
 * | --- | --- | --- |
 * | `--uix-chip-active-bg` | `var(--uix-surface-inverse)` | Active chip background |
 * | `--uix-chip-active-fg` | `var(--uix-text-on-inverse)` | Active chip label |
 * | `--uix-chip-bg` | `var(--uix-bg-subtle)` | Chip background |
 * | `--uix-chip-fg` | `var(--uix-text-secondary)` | Chip label |
 */
export function Chip({
  children,
  interactive,
  active,
  onSelect,
  className,
  renderAs,
  ...rest
}: ChipProps) {
  if (!interactive) {
    return (
      renderAsElement(
        renderAs,
        "uix-chip",
        { ...rest, className },
        children,
      ) ?? (
        <span className={cx("uix-chip", className)} {...rest}>
          {children}
        </span>
      )
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
