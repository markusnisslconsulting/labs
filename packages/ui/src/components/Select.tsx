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
 * **Use it for** one value from a short fixed list. **Reach for something
 * else when** someone would rather type than scan (`Combobox`), or when the
 * popup itself has to be yours — grouped rows, a second line per option, a
 * checkmark, anything drawn.
 *
 * Native `<select>` with a bound label and optional hint. The chevron is a
 * styled span (aria-hidden); the element stays a real select, so pickers,
 * keyboards and forms behave like the platform.
 *
 * **About the popup.** Where `appearance: base-select` is supported — Chrome
 * today — it is drawn by this system: our surface, our radius, our accent on
 * the highlighted row, one chevron rather than two. Everywhere else it is
 * the operating system's, exactly as before, because the whole block is
 * behind `@supports`. The element is a real `<select>` either way, which is
 * what keeps typeahead, form participation and the iOS wheel.
 *
 * **What is still not possible: making it the width of the field.** Measured
 * against Chromium 151, author sizing on `::picker(select)` is ignored —
 * `inline-size`, `min-inline-size` and every form of `anchor-size()` produce
 * byte-identical layout, while background and border apply. So a wide select
 * can still show a narrower menu, and no CSS here changes that.
 *
 * When the popup's geometry matters, `Combobox` renders its own listbox and
 * takes the field's width. It costs 6.04 KB against this component's 2.79 KB
 * and gives up the platform picker on mobile, which is the trade.
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
