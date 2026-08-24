import { Checkbox as BaseCheckbox } from "@base-ui-components/react/checkbox";

export interface CheckboxProps {
  /** Visible label; clicking it toggles, as native checkboxes do. */
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Tri-state support: aria-checked="mixed" plus a dash. */
  indeterminate?: boolean;
}

/**
 * Checkbox on a Base UI headless root.
 *
 * Accessibility: Base UI renders the checkbox semantics (role,
 * `aria-checked` including "mixed" for the indeterminate case), keeps
 * the element focusable and wires Space. The visible box is
 * decorative.
 *
 * Performance: state flips one data attribute on the root — the box
 * is pure CSS on the sibling selector, no effect runs.
 */
export function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled,
  indeterminate,
}: CheckboxProps) {
  return (
    <label className="uix-check">
      <BaseCheckbox.Root
        aria-label={label}
        className="uix-check-input"
        checked={checked}
        defaultChecked={defaultChecked}
        indeterminate={indeterminate}
        onCheckedChange={(next) => onChange?.(Boolean(next))}
        disabled={disabled}
      />
      <span className="uix-check-box" aria-hidden />
      <span className="uix-check-label" aria-hidden>
        {label}
      </span>
    </label>
  );
}
