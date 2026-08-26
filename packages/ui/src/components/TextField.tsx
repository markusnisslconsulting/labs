"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";

import { Field } from "./Field";
import "./_field.css";
export interface TextFieldProps extends Omit<
  ComponentPropsWithRef<"input">,
  "id" | "prefix"
> {
  /** A node, so a label can carry a required marker or a hint link. */
  label: ReactNode;
  /** Supporting text under the field; wired via aria-describedby. */
  hint?: ReactNode;
  /** Validation message. Sets aria-invalid and links the same way. */
  error?: ReactNode;
  /** Marks the field required, visibly and for assistive technology. */
  required?: boolean;
  /** Render the label for assistive technology only. */
  hideLabel?: boolean;
  /** Slot before the input (e.g. a unit). */
  prefix?: ReactNode;
  /** Slot after the input (e.g. an icon). */
  suffix?: ReactNode;
}

/**
 * **Use it for** any single-line text entry. **Reach for something else when** the field queries a collection (SearchInput).
 *
 * Labelled text input with hint/error wiring.
 *
 * Accessibility: `label` is bound with `for`; hint and error are
 * linked through `aria-describedby`; an error also sets
 * `aria-invalid`, so the state reaches assistive technology without
 * relying on the red border.
 *
 * Performance: static markup, zero effects.
 *
 * ### Theming
 *
 * Override slots for this component. None is declared: each is
 * referenced with its semantic default inline, so a slot costs
 * nothing until something fills it. Set one on any ancestor.
 *
 * | Token | Default | Meaning |
 * | --- | --- | --- |
 * | `--uix-field-pad-y` | `0` | Extra vertical padding inside a field; height comes from --uix-control-md |
 * | `--uix-field-radius` | `var(--uix-radius-control)` | Field corner radius |
 */
export function TextField({
  label,
  hint,
  error,
  required,
  hideLabel,
  prefix,
  suffix,
  className,
  ...rest
}: TextFieldProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={className}
    >
      {({ id, describedBy, invalid, required: isRequired }) => (
        <div className="uix-field-row" data-invalid={invalid}>
          {prefix ? (
            <span className="uix-field-adornment" aria-hidden>
              {prefix}
            </span>
          ) : null}
          <input
            id={id}
            className="uix-field-input"
            aria-describedby={describedBy}
            aria-invalid={invalid}
            required={isRequired || undefined}
            {...rest}
          />
          {suffix ? (
            <span className="uix-field-adornment" aria-hidden>
              {suffix}
            </span>
          ) : null}
        </div>
      )}
    </Field>
  );
}
