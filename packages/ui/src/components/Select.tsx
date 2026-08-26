"use client";

import {
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";

import { cx } from "../cx";
import "./_field.css";
import "./Select.css";
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
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
  children?: ReactNode;
}

export type SelectOptionProps = ComponentPropsWithoutRef<"option">;
export type SelectGroupProps = ComponentPropsWithoutRef<"optgroup">;

/**
 * **Use it for** one value from a short fixed list. **Reach for something else when** the list is long enough that someone would rather type (Combobox).
 *
 * Native `<select>` with a bound label and optional hint. The chevron
 * is a styled span (aria-hidden) — the element stays a real select,
 * so pickers, keyboards and forms behave like the platform.
 */
export function Select({
  label,
  options,
  hint,
  className,
  children,
  ...rest
}: SelectProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className={cx("uix-field", className)}>
      <label className="uix-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="uix-field-row">
        <select
          id={id}
          className="uix-field-input uix-select"
          aria-describedby={hint ? hintId : undefined}
          {...rest}
        >
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
      {hint ? (
        <p className="uix-field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
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
