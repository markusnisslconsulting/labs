import { useState } from "react";
import { useId } from "react";

export interface SwitchProps {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * A switch, built on a native checkbox with `role="switch"`.
 *
 * Accessibility: the platform announces "on/off" and handles Space;
 * the visible track is decorative (`aria-hidden`). An explicit
 * `aria-checked` attribute mirrors the state so tools reading the
 * literal attribute see the truth in both controlled and
 * uncontrolled use.
 *
 * Performance: the knob moves with a `transform` transition —
 * compositor only.
 */
export function Switch({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled,
}: SwitchProps) {
  const id = useId();
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(
    defaultChecked ?? false,
  );
  const isChecked = isControlled ? checked : internalChecked;

  return (
    <label className="uix-switch" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="uix-switch-input uix-visually-hidden"
        aria-checked={isChecked}
        {...(isControlled ? { checked } : {})}
        defaultChecked={isControlled ? undefined : defaultChecked}
        onChange={(event) => {
          if (!isControlled) setInternalChecked(event.target.checked);
          onChange?.(event.target.checked);
        }}
        disabled={disabled}
      />
      <span className="uix-switch-track" aria-hidden>
        <span className="uix-switch-knob" />
      </span>
      <span className="uix-switch-label">{label}</span>
    </label>
  );
}
