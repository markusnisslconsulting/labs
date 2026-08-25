import { Checkbox as BaseCheckbox } from "@base-ui-components/react/checkbox";

export interface CheckboxProps {
  /** Visible label; rendered inside the control, so the whole row
      toggles natively. */
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Tri-state support: aria-checked="mixed" plus a dash. */
  indeterminate?: boolean;
}

/**
 * Checkbox on a Base UI headless root, following Base UI's suggested
 * structure: `Root` carries the state attributes
 * (`data-checked`/`data-indeterminate`), the `Indicator` is the
 * visual box styled via descendant selectors, the label lives inside
 * so the whole row toggles natively.
 *
 * Accessibility: Base UI renders role/aria-checked (including
 * "mixed"), keeps the root focusable and handles Space.
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
    <BaseCheckbox.Root
      className="uix-checkbox"
      checked={checked}
      defaultChecked={defaultChecked}
      indeterminate={indeterminate}
      onCheckedChange={(next) => onChange?.(Boolean(next))}
      disabled={disabled}
    >
      <BaseCheckbox.Indicator keepMounted className="uix-checkbox-indicator">
        <svg viewBox="0 0 12 12" aria-hidden>
          <path className="uix-checkbox-check" d="M2 6.5 4.8 9 10 3.5" />
          <path className="uix-checkbox-dash" d="M2 6h8" />
        </svg>
      </BaseCheckbox.Indicator>
      <span className="uix-checkbox-label">{label}</span>
    </BaseCheckbox.Root>
  );
}
