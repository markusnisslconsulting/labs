import type { ReactNode } from "react";

export interface SegmentedOption {
  value: string;
  label: ReactNode;
}

export interface SegmentedControlProps {
  label: string;
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}

/**
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
}: SegmentedControlProps) {
  return (
    <div className="uix-segmented" role="group" aria-label={label}>
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
