"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Field } from "./Field";
import "./_field.css";
import "./Select.css";
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<
  ComponentPropsWithRef<"select">,
  "id" | "children"
> {
  /** A node: a field label can carry a hint or a required marker. */
  label: ReactNode;
  /**
   * The convenience form. A shorthand over `Select.Option` and
   * `Select.Group`, which is what a list that needs option groups needs —
   * and a flat array cannot say.
   */
  options?: SelectOption[];
  hint?: ReactNode;
  /** Validation message. Its presence makes the field invalid. */
  error?: ReactNode;
  /** Marks the field required, visibly and for assistive technology. */
  required?: boolean;
  /** Render the label for assistive technology only. */
  hideLabel?: boolean;
  children?: ReactNode;
}

export type SelectOptionProps = ComponentPropsWithRef<"option">;
export type SelectGroupProps = ComponentPropsWithRef<"optgroup">;

/**
 * **Use it for** one value from a short fixed list. **Reach for something else when** the list is long enough that someone would rather type (Combobox).
 *
 * Native `<select>` with a bound label and optional hint. The chevron
 * is a styled span (aria-hidden) — the element stays a real select,
 * so pickers, keyboards and forms behave like the platform.
 *
 * Accessibility: a native `select`, so the picker, the typeahead, the
 * keyboard and the form participation are the platform's. The chevron is
 * `aria-hidden` decoration over the real control rather than a
 * replacement for it, and the hint is linked with `aria-describedby`
 * rather than left floating near the field.
 */
export function Select({
  name,
  label,
  options,
  hint,
  error,
  required,
  hideLabel,
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={className}
    >
      {({ control, invalid }) => (
        <div className="uix-field-row" data-invalid={invalid}>
          <select {...control} className="uix-field-input uix-select" {...rest}>
            {children ??
              (options ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
          <span className="uix-field-affordance" aria-hidden>
            <ChevronDown size={16} />
          </span>
        </div>
      )}
    </Field>
  );
}

/* A native select may contain only options and option groups, so these
   two parts are the whole composable surface — and they are the surface a
   flat `options` array could not express. Text in an option cannot be a
   node; that is the platform's rule, not ours. */

Select.Option = function SelectOptionPart(props: SelectOptionProps) {
  return <option {...props} />;
};

Select.Group = function SelectGroupPart(props: SelectGroupProps) {
  return <optgroup {...props} />;
};
