"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";

import { cx } from "../cx";
import { Field } from "./Field";
import "./_field.css";
import "./Slider.css";
interface SliderOwnProps {
  /** A node, now that the accessible name comes from a real `<label>`. */
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
  onValueChange?: (value: number) => void;
  /** Show the live value next to the label. */
  showValue?: boolean;
  /**
   * Declared here rather than inherited from the div, because `rest`
   * lands on the wrapper and a `disabled` that never reaches the input
   * is a control that looks unavailable and still moves.
   */
  disabled?: boolean;
}

/**
 * Accepts every attribute of `<div>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type SliderProps = SliderOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof SliderOwnProps>;

/**
 * **Use it for** a value where the approximate position matters more than the number. **Reach for something else when** the exact number matters (NumberField).
 *
 * Native range input.
 *
 * Accessibility: `input[type=range]` is a fully accessible slider —
 * arrows, PageUp/Down, Home/End and screen reader announcements come
 * from the platform. `accent-color` themes it with one token.
 *
 * Note: a Base UI slider was evaluated and deferred (rc error #62 in
 * test environments); adoption revisits at 1.0.
 */
export function Slider({
  label,
  hint,
  error,
  required,
  hideLabel,
  min = 0,
  max = 100,
  step = 1,
  defaultValue,
  value,
  onValueChange,
  showValue = true,
  disabled,
  className,
  ...rest
}: SliderProps) {
  const isControlled = value !== undefined;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      /* The live value goes in Field's aside rather than in a head row of
         Slider's own. That private head row is why Slider was the only
         field with no hint and no error: its layout had already diverged
         from every other field before anyone asked it for one. */
      aside={showValue ? (isControlled ? value : (defaultValue ?? min)) : null}
      className={cx("uix-slider", className)}
      data-disabled={disabled || undefined}
      {...rest}
    >
      {({ id, describedBy, invalid, required: isRequired }) => (
        <input
          id={id}
          type="range"
          className="uix-range"
          disabled={disabled}
          required={isRequired || undefined}
          min={min}
          max={max}
          step={step}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          {...(isControlled ? { value } : { defaultValue })}
          onChange={(event) => onValueChange?.(Number(event.target.value))}
        />
      )}
    </Field>
  );
}
