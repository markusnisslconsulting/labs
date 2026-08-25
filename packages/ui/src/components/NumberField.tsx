import { NumberField as BaseNumberField } from "@base-ui-components/react/number-field";

export interface NumberFieldProps {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number | null) => void;
}

/**
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
}: NumberFieldProps) {
  return (
    <div className="uix-field">
      <label className="uix-field-label">{label}</label>
      <BaseNumberField.Root
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
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
