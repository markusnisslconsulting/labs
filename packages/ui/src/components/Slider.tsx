import { useId } from "react";

export interface SliderProps {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  /** Show the live value next to the label. */
  showValue?: boolean;
}

/**
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
}: SliderProps) {
  const isControlled = value !== undefined;
  const id = useId();

  return (
    <div className="uix-slider">
      <div className="uix-slider-head">
        <label className="uix-field-label" htmlFor={id}>
          {label}
        </label>
        {showValue ? (
          <span className="uix-slider-value">
            {isControlled ? value : defaultValue ?? min}
          </span>
        ) : null}
      </div>
      <input
        id={id}
        type="range"
        className="uix-range"
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

