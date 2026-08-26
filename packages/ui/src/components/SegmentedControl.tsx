"use client";

import type { ReactNode, ComponentPropsWithoutRef } from "react";

import { cx } from "../cx";
import "./SegmentedControl.css";
export interface SegmentedOption {
  value: string;
  label: ReactNode;
  /** Renders the option present but not selectable. */
  disabled?: boolean;
}

interface SegmentedControlOwnProps {
  /** The group's accessible name. */
  label: string;
  /**
   * The convenience form. A shorthand over `SegmentedControl.Option`,
   * which is what an option carrying an icon and a count, or a divider
   * between two sets, needs.
   */
  options?: SegmentedOption[];
  value?: string;
  /** Kept as `onChange` for the shorthand; the parts take `onClick`. */
  onChange?: (value: string) => void;
  children?: ReactNode;
}

export type SegmentedOptionProps = ComponentPropsWithoutRef<"button"> & {
  /** Whether this option is the selected one. */
  selected?: boolean;
};

/**
 * Accepts every attribute of `<div>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type SegmentedControlProps = SegmentedControlOwnProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof SegmentedControlOwnProps>;

/**
 * **Use it for** switching between a few views of the same data. **Reach for something else when** the options are separate content sections (Tabs).
 *
 * Exclusive single choice, visible at a glance.
 *
 * Accessibility: `role="group"` with `aria-label`; each option is a
 * native button with `aria-pressed`, so state reaches assistive
 * technology without a hidden radio hack.
 *
 * Performance: one state, one re-render of the control.
 */
export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  className,
  children,
  ...rest
}: SegmentedControlProps) {
  return (
    <div
      className={cx("uix-segmented", className)}
      role="group"
      aria-label={label}
      {...rest}
    >
      {children ??
        (options ?? []).map((option) => (
          <Option
            key={option.value}
            selected={value === option.value}
            disabled={option.disabled}
            onClick={() => onChange?.(option.value)}
          >
            {option.label}
          </Option>
        ))}
    </div>
  );
}

/**
 * One option. A native button with `aria-pressed`, so the state reaches
 * assistive technology without a hidden radio hack.
 */
function Option({ selected, className, ...rest }: SegmentedOptionProps) {
  return (
    <button
      type="button"
      className={cx("uix-segment", className)}
      aria-pressed={selected}
      {...rest}
    />
  );
}

SegmentedControl.Option = Option;
