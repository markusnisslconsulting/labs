import { Switch as BaseSwitch } from "@base-ui-components/react/switch";

export interface SwitchProps {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * A switch on a Base UI headless root.
 *
 * Accessibility: Base UI renders `role="switch"` with a literal
 * `aria-checked` and handles Space; the visible track is decorative.
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
  return (
    <label className="uix-switch">
      <BaseSwitch.Root
        aria-label={label}
        className="uix-switch-input"
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={(next) => onChange?.(Boolean(next))}
        disabled={disabled}
      />
      <span className="uix-switch-track" aria-hidden>
        <span className="uix-switch-knob" />
      </span>
      <span className="uix-switch-label" aria-hidden>
        {label}
      </span>
    </label>
  );
}
