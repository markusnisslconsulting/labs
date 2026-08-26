import type { ComponentPropsWithoutRef } from "react";
import { useId } from "react";

import { cx } from "../cx";
import "./_field.css";
import "./Slider.css";
interface SliderOwnProps {
  label: string;
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
  Omit<ComponentPropsWithoutRef<"div">, keyof SliderOwnProps>;

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
  const id = useId();

  return (
    <div
      className={cx("uix-slider", className)}
      data-disabled={disabled || undefined}
      {...rest}
    >
      <div className="uix-slider-head">
        <label className="uix-field-label" htmlFor={id}>
          {label}
        </label>
        {showValue ? (
          <span className="uix-slider-value">
            {isControlled ? value : (defaultValue ?? min)}
          </span>
        ) : null}
      </div>
      <input
        id={id}
        type="range"
        className="uix-range"
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        {...(isControlled ? { value } : { defaultValue })}
        onChange={(event) => onValueChange?.(Number(event.target.value))}
        aria-label={label}
      />
    </div>
  );
}
