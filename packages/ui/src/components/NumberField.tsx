import type { ComponentPropsWithoutRef } from "react";
import { NumberField as BaseNumberField } from "@base-ui-components/react/number-field";

import { cx } from "../cx";
import "./_field.css";
import "./NumberField.css";
interface NumberFieldOwnProps {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number | null) => void;
  /**
   * Declared here rather than inherited from the wrapper div, because
   * `rest` lands on the wrapper and a `disabled` that never reaches the
   * control is a field that looks unavailable and still accepts input.
   */
  disabled?: boolean;
}

/**
 * Accepts every attribute of `<div>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type NumberFieldProps = NumberFieldOwnProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof NumberFieldOwnProps>;

/**
 * **Use it for** a quantity where stepping by one is a normal move. **Reach for something else when** any text is valid (TextField).
 *
 * Numeric input with stepper buttons on Base UI's number field.
 *
 * Accessibility: Base UI renders a labelled-capable input with
 * `aria-valuenow`-style announcements, and the steppers are real
 * buttons with names ("Decrease"/"Increase" from the locale).
 *
 * Performance: native input editing; steppers are two buttons.
 */
export function NumberField({
  label,
  min,
  max,
  step = 1,
  defaultValue,
  value,
  onValueChange,
  disabled,
  className,
  ...rest
}: NumberFieldProps) {
  return (
    <div className={cx("uix-field", className)} {...rest}>
      <label className="uix-field-label">{label}</label>
      <BaseNumberField.Root
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(next) => onValueChange?.(next)}
      >
        <BaseNumberField.Group className="uix-numberfield">
          <BaseNumberField.Decrement className="uix-numberfield-step">
            −
          </BaseNumberField.Decrement>
          <BaseNumberField.Input
            className="uix-field-input"
            aria-label={label}
          />
          <BaseNumberField.Increment className="uix-numberfield-step">
            +
          </BaseNumberField.Increment>
        </BaseNumberField.Group>
      </BaseNumberField.Root>
    </div>
  );
}
