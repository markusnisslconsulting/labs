import { Switch as BaseSwitch } from "@base-ui-components/react/switch";

export interface SwitchProps {
  /** Visible label; rendered inside the control, so the whole row
      toggles natively. */
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Switch on a Base UI headless root, following Base UI's suggested
 * structure: `Root` is the track and carries the state attributes
 * (`data-checked`), the `Thumb` is the knob moved via transform —
 * compositor only.
 *
 * Accessibility: Base UI renders `role="switch"` with a literal
 * `aria-checked`; the label lives inside, so the whole row toggles
 * natively and the accessible name is the label text.
 */
export function Switch({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled,
}: SwitchProps) {
  return (
    <BaseSwitch.Root
      className="uix-switch"
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(next) => onChange?.(Boolean(next))}
      disabled={disabled}
    >
      <BaseSwitch.Thumb className="uix-switch-thumb" />
      <span className="uix-switch-label">{label}</span>
    </BaseSwitch.Root>
  );
}
