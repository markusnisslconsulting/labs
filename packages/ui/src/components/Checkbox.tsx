"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Checkbox as BaseCheckbox } from "@base-ui-components/react/checkbox";

import { cxState } from "../cx";
import "./Checkbox.css";
interface CheckboxOwnProps {
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
 * Accepts every prop of Base UI's BaseCheckbox.Root in addition to those below;
 * `className` merges with the component's own class and the rest land
 * on the root element.
 */
export type CheckboxProps = CheckboxOwnProps &
  Omit<
    ComponentPropsWithoutRef<typeof BaseCheckbox.Root>,
    keyof CheckboxOwnProps
  >;

/**
 * **Use it for** independent options, each on or off. **Reach for something else when** the options are mutually exclusive (RadioGroup), or the change applies immediately (Switch).
 *
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
  className,
  ...rest
}: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      className={cxState("uix-checkbox", className)}
      checked={checked}
      defaultChecked={defaultChecked}
      indeterminate={indeterminate}
      onCheckedChange={(next) => onChange?.(Boolean(next))}
      disabled={disabled}
      {...rest}
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
