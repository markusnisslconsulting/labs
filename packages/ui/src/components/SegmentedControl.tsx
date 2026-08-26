"use client";

import type { ReactNode, ComponentPropsWithRef } from "react";

import { useState } from "react";

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
  /** The uncontrolled half of the triple, which was simply missing. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}

export type SegmentedOptionProps = ComponentPropsWithRef<"button"> & {
  /** Whether this option is the selected one. */
  selected?: boolean;
};

/**
 * Accepts every attribute of `<div>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type SegmentedControlProps = SegmentedControlOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof SegmentedControlOwnProps>;

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
  defaultValue,
  onValueChange,
  className,
  children,
  ...rest
}: SegmentedControlProps) {
  // Controlled when `value` is given, uncontrolled otherwise. It used to
  // be controlled-only, so every caller had to hold the state even when
  // nothing else needed it.
  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const selected = isControlled ? value : uncontrolled;

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
            selected={selected === option.value}
            disabled={option.disabled}
            onClick={() => {
              if (!isControlled) setUncontrolled(option.value);
              onValueChange?.(option.value);
            }}
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
