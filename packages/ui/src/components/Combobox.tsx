"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cx } from "../cx";
import "./_field.css";
interface ComboboxOwnProps {
  /** A node: it goes into a real <label> element, which carries the
   * accessible name, so it does not have to be flat text. */
  label: ReactNode;
  /**
   * The convenience form. A shorthand over `Combobox.Option`, which a
   * grouped or async list needs.
   */
  options?: string[];
  value?: string | null;
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
  Omit<ComponentPropsWithoutRef<"div">, keyof ComboboxOwnProps>;

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
  label,
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
  children,
  ...rest
}: ComboboxProps) {
  const id = useId();
  const [query, setQuery] = useState("");

  const matches = (options ?? []).filter((option) =>
    option.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className={cx("uix-field", className)} {...rest}>
      <label className="uix-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="uix-field-row">
        <input
          id={id}
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
    </div>
  );
}

/* The datalist's only legal child. Composable so a caller can build the
   list from somewhere other than a string array — an async fetch, a
   grouped source — without leaving the component. */
Combobox.Option = function ComboboxOptionPart(
  props: ComponentPropsWithoutRef<"option">,
) {
  return <option {...props} />;
};
