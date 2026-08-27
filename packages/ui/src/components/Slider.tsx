"use client";

import { useState } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { cx } from "../cx";
import { Field } from "./Field";
import "./_field.css";
import "./Slider.css";
interface SliderOwnProps {
  /**
   * The form field name.
   *
   * Declared rather than inherited: this component's rest props land on a
   * wrapper, not on the control, so a `name` arriving through them would
   * end up on a div. It also has to reach Field, which uses it to find
   * this field's error inside a Form.
   */
  name?: string;
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
  name,
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
  /* The uncontrolled half of the triple, which was missing.
   *
   * Slider was the one stateful component here that held nothing: it put
   * `defaultValue` on the input, let the DOM own the value from then on,
   * and reported changes through `onValueChange`. The number beside the
   * label was `defaultValue ?? min` — a constant. Measured by dragging
   * one: the input's value went 20 to 25 and the number next to it stayed
   * at 20, so the slider showed a reading that had stopped being true.
   *
   * Every story in the catalogue is uncontrolled, so every slider in the
   * documentation showed a frozen number, and the component's own
   * `showValue` default is `true`. Chip, Switch and Combobox all hold
   * their uncontrolled value for exactly this reason; this is the one
   * that did not. */
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? min);
  const current = isControlled ? value : uncontrolled;

  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      /* The live value goes in Field's aside rather than in a head row of
         Slider's own. That private head row is why Slider was the only
         field with no hint and no error: its layout had already diverged
         from every other field before anyone asked it for one. */
      aside={showValue ? current : null}
      className={cx("uix-slider", className)}
      data-disabled={disabled || undefined}
      {...rest}
    >
      {({ control }) => (
        <input
          {...control}
          type="range"
          className="uix-range"
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (!isControlled) setUncontrolled(next);
            onValueChange?.(next);
          }}
        />
      )}
    </Field>
  );
}
