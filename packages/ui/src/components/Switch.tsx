import { Switch as BaseSwitch } from "@base-ui-components/react/switch";

export interface SwitchProps {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * A switch on a Base UI headless root, following Base UI's suggested
 * structure: `Root` IS the track (pill) and carries `data-checked`,
 * the `Thumb` is the absolutely positioned knob moved via transform —
 * compositor only. The label sits beside the track in a wrapping
 * label, so clicking the text toggles too.
 *
 * Accessibility: Base UI renders `role="switch"` with a literal
 * `aria-checked`; the track is decorative.
 */
export function Switch({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled,
}: SwitchProps) {
  return (
    <label className="uix-switch-row">
      <BaseSwitch.Root
        aria-label={label}
        className="uix-switch"
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={(next) => onChange?.(Boolean(next))}
        disabled={disabled}
      >
        <BaseSwitch.Thumb className="uix-switch-thumb" />
      </BaseSwitch.Root>
      <span className="uix-switch-label">{label}</span>
    </label>
  );
}
