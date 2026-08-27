"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { NumberField as BaseNumberField } from "@base-ui-components/react/number-field";
import { Minus, Plus } from "lucide-react";

import { Field } from "./Field";
import { useStrings } from "../i18n";
import "./_field.css";
import "./NumberField.css";
interface NumberFieldOwnProps {
  /**
   * A node, now that a real `<label>` carries the accessible name. It was
   * `string` because the name came from `aria-label`, and an aria-label
   * can only be a string — so the one field where a label might carry a
   * unit or a tooltip was the one field that forbade it. That is what a
   * workaround does to an API.
   */
  label: ReactNode;
  hint?: ReactNode;
  /** Validation message. Its presence makes the field invalid. */
  error?: ReactNode;
  /** Marks the field required, visibly and for assistive technology. */
  required?: boolean;
  /** Render the label for assistive technology only. */
  hideLabel?: boolean;
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
  Omit<ComponentPropsWithRef<"div">, keyof NumberFieldOwnProps>;

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
  hint,
  error,
  required,
  hideLabel,
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
  const strings = useStrings();

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={className}
      nameBy="aria"
      {...rest}
    >
      {({ control, invalid }) => (
        <BaseNumberField.Root
          value={value}
          defaultValue={defaultValue}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onValueChange={(next) => onValueChange?.(next)}
        >
          <BaseNumberField.Group
            className="uix-numberfield"
            data-invalid={invalid}
          >
            <BaseNumberField.Decrement
              className="uix-numberfield-step"
              aria-label={strings.decrease}
            >
              <Minus size={16} />
            </BaseNumberField.Decrement>
            {/* Named by the visible <label> rather than by a copy of it in
                an aria-label. It used to carry aria-label={label}: a second
                copy of the same words, and — since label is a node — one
                React stringified to "[object Object]" for any label with
                markup in it.
                aria-labelledby rather than an id from Field, because Base
                UI points the steppers' aria-controls at this input's own
                generated id. Overriding it left both steppers referring to
                nothing, which axe reports and a screen reader acts on. */}
            <BaseNumberField.Input className="uix-field-input" {...control} />
            <BaseNumberField.Increment
              className="uix-numberfield-step"
              aria-label={strings.increase}
            >
              <Plus size={16} />
            </BaseNumberField.Increment>
          </BaseNumberField.Group>
        </BaseNumberField.Root>
      )}
    </Field>
  );
}
