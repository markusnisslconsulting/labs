import type { ComponentPropsWithoutRef } from "react";
import { useId, useState } from "react";
import { Switch as BaseSwitch } from "@base-ui-components/react/switch";

import { cx } from "../cx";
import "./Switch.css";
interface SwitchOwnProps {
  /** Visible label; rendered inside the control, so the whole row
      toggles natively. */
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Accepts every attribute of `<label>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type SwitchProps = SwitchOwnProps &
  Omit<ComponentPropsWithoutRef<"label">, keyof SwitchOwnProps>;

/**
 * **Use it for** a setting that takes effect the moment it is flipped. **Reach for something else when** the choice is submitted with a form (Checkbox).
 *
 * A switch on a Base UI headless root.
 *
 * The component bridges uncontrolled use with its own state, so a
 * caller can pass `checked` or leave it alone and get the same
 * behaviour either way.
 *
 * A note against a previous version of this comment: it claimed Base
 * UI's internal state was non-deterministic on first render. That was
 * a misreading. A story whose play() clicked the label was toggling
 * itself before anyone looked, so the control appeared to start in the
 * wrong state. Verified in a browser: initial render is correct in both
 * modes.
 *
 * Accessibility: `role="switch"` with a literal `aria-checked`, named
 * by `aria-labelledby` pointing at the visible label. The wrapping
 * <label> makes the text clickable, but it does NOT name the control:
 * implicit label association only works for real form elements, not
 * for an ARIA role on a span, so without this the switch reaches
 * assistive technology unnamed.
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
  className,
  ...rest
}: SwitchProps) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(
    defaultChecked ?? false,
  );
  const isChecked = isControlled ? checked : internalChecked;
  const labelId = useId();

  return (
    <label className={cx("uix-switch-row", className)} {...rest}>
      <BaseSwitch.Root
        className="uix-switch"
        aria-labelledby={labelId}
        checked={isChecked}
        onCheckedChange={(next) => {
          if (!isControlled) setInternalChecked(next);
          onChange?.(next);
        }}
        disabled={disabled}
      >
        <BaseSwitch.Thumb className="uix-switch-thumb" />
      </BaseSwitch.Root>
      <span className="uix-switch-label" id={labelId}>
        {label}
      </span>
    </label>
  );
}
