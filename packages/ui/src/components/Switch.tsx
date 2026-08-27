"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { useId, useState } from "react";
import { Switch as BaseSwitch } from "@base-ui-components/react/switch";

import { cx } from "../cx";
import { useFieldMessages } from "./Field";
import { useStrings } from "../i18n";
import "./_field.css";
import "./Switch.css";
interface SwitchOwnProps {
  /** Visible label; rendered inside the control, so the whole row
      toggles natively. */
  /**
   * A node. The accessible name comes from aria-labelledby pointing at
   * the visible label, so this does not have to be flat text.
   */
  label: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  /**
   * The checked triple, matching value/defaultValue/onValueChange
   * elsewhere: checked, defaultChecked, onCheckedChange. It was
   * `onChange`, which read like the DOM event and was not — it received a
   * boolean. Six components expressed the same idea six ways.
   */
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Instruction under the control, linked with aria-describedby. */
  hint?: ReactNode;
  /** Validation message. Its presence makes the control invalid. */
  error?: ReactNode;
  /** Marks the control required, visibly and for assistive technology. */
  required?: boolean;
}

/**
 * Accepts every attribute of `<label>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type SwitchProps = SwitchOwnProps &
  Omit<ComponentPropsWithRef<"label">, keyof SwitchOwnProps>;

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
 *
 * ### Theming
 *
 * Override slots for this component. None is declared: each is
 * referenced with its semantic default inline, so a slot costs
 * nothing until something fills it. Set one on any ancestor.
 *
 * | Token | Default | Meaning |
 * | --- | --- | --- |
 * | `--uix-switch-thumb-bg` | `var(--uix-bg-raised)` | Switch knob |
 * | `--uix-switch-track-bg` | `var(--uix-bg-subtle)` | Switch track, off |
 * | `--uix-switch-track-on-bg` | `var(--uix-accent)` | Switch track, on |
 * | `--uix-switch-travel` | `1.3rem` | How far the knob travels; negated under dir=rtl |
 */
export function Switch({
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  hint,
  error,
  required,
  className,
  ...rest
}: SwitchProps) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(
    defaultChecked ?? false,
  );
  const isChecked = isControlled ? checked : internalChecked;
  const labelId = useId();
  const { describedBy, invalid, messages } = useFieldMessages(hint, error);
  const strings = useStrings();

  const row = (
    <label className={cx("uix-switch-row", className)} {...rest}>
      <BaseSwitch.Root
        className="uix-switch"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        checked={isChecked}
        onCheckedChange={(next) => {
          if (!isControlled) setInternalChecked(next);
          onCheckedChange?.(next);
        }}
        disabled={disabled}
        required={required}
      >
        <BaseSwitch.Thumb className="uix-switch-thumb" />
      </BaseSwitch.Root>
      <span className="uix-switch-label" id={labelId}>
        {label}
        {required ? (
          <>
            {" "}
            <span className="uix-field-required" aria-hidden>
              *
            </span>
            <span className="uix-visually-hidden">{strings.required}</span>
          </>
        ) : null}
      </span>
    </label>
  );

  if (!hint && !error) return row;

  return (
    <div className="uix-field">
      {row}
      {messages}
    </div>
  );
}
