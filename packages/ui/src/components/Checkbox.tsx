"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { Checkbox as BaseCheckbox } from "@base-ui-components/react/checkbox";

import { cxState } from "../cx";
import { useFieldMessages } from "./Field";
import "./_field.css";
import "./Checkbox.css";
interface CheckboxOwnProps {
  /** Visible label; rendered inside the control, so the whole row
      toggles natively. */
  /**
   * A node. Base UI wires the accessible name from the visible label
   * element, so this is free to be rich — a consent line with a link in
   * it is the common case and was not expressible.
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
  /** Tri-state support: aria-checked="mixed" plus a dash. */
  indeterminate?: boolean;
  /** Instruction under the control, linked with aria-describedby. */
  hint?: ReactNode;
  /** Validation message. Its presence makes the control invalid. */
  error?: ReactNode;
  /** Marks the control required, visibly and for assistive technology. */
  required?: boolean;
}

/**
 * Accepts every prop of Base UI's BaseCheckbox.Root in addition to those below;
 * `className` merges with the component's own class and the rest land
 * on the root element.
 */
export type CheckboxProps = CheckboxOwnProps &
  Omit<ComponentPropsWithRef<typeof BaseCheckbox.Root>, keyof CheckboxOwnProps>;

/**
 * **Use it for** independent options, each on or off. **Reach for something else when** the options are mutually exclusive (RadioGroup), or the change applies immediately (Switch).
 *
 * Checkbox on a Base UI headless root, following Base UI's suggested
 * structure: `Root` carries the state attributes
 * (`data-checked`/`data-indeterminate`), the `Indicator` is the
 * visual box styled via descendant selectors, the label lives inside
 * so the whole row toggles natively.
 *
 * Accessibility: Base UI renders role/aria-checked (including
 * "mixed"), keeps the root focusable and handles Space.
 */
export function Checkbox({
  name,
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  indeterminate,
  hint,
  error,
  required,
  className,
  ...rest
}: CheckboxProps) {
  const {
    describedBy,
    invalid,
    error: shown,
    id,
    messages,
  } = useFieldMessages({
    hint,
    error,
    name,
    /* The label, when it is a plain string. A summary link has to be text,
       and a checkbox label can be a node — a sentence with a link to the
       terms is the usual one. Falls back to the name inside the hook. */
    linkText: typeof label === "string" ? label : undefined,
  });

  const control = (
    <BaseCheckbox.Root
      /* Both, and not only because the summary links here: an id on the
         control is what makes it reachable at all. */
      id={id}
      name={name}
      className={cxState("uix-checkbox", className)}
      checked={checked}
      defaultChecked={defaultChecked}
      indeterminate={indeterminate}
      onCheckedChange={(next) => onCheckedChange?.(Boolean(next))}
      disabled={disabled}
      required={required}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      {...rest}
    >
      <BaseCheckbox.Indicator keepMounted className="uix-checkbox-indicator">
        <svg viewBox="0 0 12 12" aria-hidden>
          <path className="uix-checkbox-check" d="M2 6.5 4.8 9 10 3.5" />
          <path className="uix-checkbox-dash" d="M2 6h8" />
        </svg>
      </BaseCheckbox.Indicator>
      <span className="uix-checkbox-label">
        {label}
        {required ? (
          <>
            {" "}
            <span className="uix-field-required" aria-hidden>
              *
            </span>
          </>
        ) : null}
      </span>
    </BaseCheckbox.Root>
  );

  // No wrapper unless there is something to wrap: a bare checkbox in a
  // table cell should stay one element.
  if (!hint && !shown) return control;

  return (
    <div className="uix-field">
      {control}
      {messages}
    </div>
  );
}
