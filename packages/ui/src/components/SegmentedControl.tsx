import type { ReactNode, ComponentPropsWithoutRef } from "react";

import { cx } from "../cx";
import "./SegmentedControl.css";
export interface SegmentedOption {
  value: string;
  label: ReactNode;
}

interface SegmentedControlOwnProps {
  label: string;
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}

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
  ...rest
}: SegmentedControlProps) {
  return (
    <div
      className={cx("uix-segmented", className)}
      role="group"
      aria-label={label}
      {...rest}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="uix-segment"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
