import { useId, type ChangeEvent } from "react";

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  legend: string;
  options: RadioOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

/**
 * Radio group as a `fieldset` with a real `legend` — the platform's
 * own grouping semantics. Arrow keys move between options natively.
 */
export function RadioGroup({
  name,
  legend,
  options,
  defaultValue,
  value,
  onChange,
  disabled,
}: RadioGroupProps) {
  const isControlled = value !== undefined;
  const baseId = useId();

  return (
    <fieldset className="uix-radiogroup" disabled={disabled}>
      <legend className="uix-legend">{legend}</legend>
      {options.map((option) => {
        const id = `${baseId}-${option.value}`;
        return (
          <label key={option.value} className="uix-check" htmlFor={id}>
            <input
              id={id}
              type="radio"
              name={name}
              value={option.value}
              className="uix-radio-input"
              {...(isControlled
                ? { checked: value === option.value }
                : { defaultChecked: defaultValue === option.value })}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange?.(event.target.value)
              }
              disabled={disabled || option.disabled}
            />
            <span className="uix-radio-dot" aria-hidden />
            <span className="uix-check-label">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
