import { useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cx } from "../cx";
import "./_field.css";
export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "prefix"
> {
  label: string;
  /** Supporting text under the field; wired via aria-describedby. */
  hint?: string;
  /** Validation message. Sets aria-invalid and links the same way. */
  error?: string;
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
  prefix,
  suffix,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cx("uix-field", className)}>
      <label className="uix-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="uix-field-row" data-invalid={error ? true : undefined}>
        {prefix ? (
          <span className="uix-field-adornment" aria-hidden>
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          className="uix-field-input"
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {suffix ? (
          <span className="uix-field-adornment" aria-hidden>
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="uix-field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="uix-field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
