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
 * A switch on a Base UI headless root.
 *
 * The component bridges uncontrolled use with its own state: Base
 * UI's internal checked state proved non-deterministic on first
 * render in static environments (SSR/prerender, headless runner),
 * so `aria-checked` and `data-checked` are driven from here.
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
