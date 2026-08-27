"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Field } from "./Field";
import "./_field.css";
interface ComboboxOwnProps {
  /**
   * The form field name.
   *
   * Declared because this component's rest props land on the Field
   * wrapper rather than on the input, so a `name` arriving through them
   * would sit on a div. Field also uses it to find this field's error
   * inside a Form.
   */
  name?: string;
  /** A node: it goes into a real <label> element, which carries the
   * accessible name, so it does not have to be flat text. */
  label: ReactNode;
  hint?: ReactNode;
  /** Validation message. Its presence makes the field invalid. */
  error?: ReactNode;
  /** Marks the field required, visibly and for assistive technology. */
  required?: boolean;
  /** Render the label for assistive technology only. */
  hideLabel?: boolean;
  /**
   * The convenience form. A shorthand over `Combobox.Option`, which a
   * grouped or async list needs.
   */
  options?: string[];
  value?: string | null;
  /** The uncontrolled half of the triple, which was missing. */
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  children?: ReactNode;
  /**
   * Declared here rather than inherited from the wrapper div, because
   * `rest` lands on the wrapper and a `disabled` that never reaches the
   * control is a field that looks unavailable and still accepts input.
   */
  disabled?: boolean;
}

/**
 * Accepts every attribute of `<div>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type ComboboxProps = ComboboxOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof ComboboxOwnProps>;

/**
 * **Use it for** choosing one value from a list too long to scan. **Reach for something else when** the list is short and fixed (Select).
 *
 * Filterable single-select on native primitives: an input bound to a
 * `datalist` via `list`/`id`.
 *
 * Accessibility: the platform combobox — typeahead, arrow selection
 * and screen reader announcements come from the browser.
 *
 * Note: a Base UI combobox was evaluated and deferred (rc error #62
 * in test environments); adoption revisits at 1.0.
 */
export function Combobox({
  name,
  label,
  options,
  hint,
  error,
  required,
  hideLabel,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  className,
  children,
  ...rest
}: ComboboxProps) {
  // The uncontrolled value doubles as the query, which is what an
  // uncontrolled combobox means: what is typed is what is chosen until
  // something else says otherwise.
  const [query, setQuery] = useState(defaultValue ?? "");

  const matches = (options ?? []).filter((option) =>
    option.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={className}
      {...rest}
    >
      {({ control, invalid, id }) => (
        <div className="uix-field-row" data-invalid={invalid}>
          <input
            {...control}
            className="uix-field-input"
            type="text"
            disabled={disabled}
            list={`${id}-options`}
            placeholder={placeholder}
            value={value ?? query}
            onChange={(event) => {
              setQuery(event.target.value);
              onValueChange?.(event.target.value);
            }}
          />
          <span className="uix-field-affordance" aria-hidden>
            <ChevronDown size={16} />
          </span>
          <datalist id={`${id}-options`}>
            {children ??
              matches.map((option) => <option key={option} value={option} />)}
          </datalist>
        </div>
      )}
    </Field>
  );
}

/* The datalist's only legal child. Composable so a caller can build the
   list from somewhere other than a string array — an async fetch, a
   grouped source — without leaving the component. */
Combobox.Option = function ComboboxOptionPart(
  props: ComponentPropsWithRef<"option">,
) {
  return <option {...props} />;
};
