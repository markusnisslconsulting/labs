import type { ComponentPropsWithoutRef } from "react";
import { useId, useState } from "react";

import { cx } from "../cx";
import "./_field.css";
interface ComboboxOwnProps {
  label: string;
  options: string[];
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
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
  className,
  ...rest
}: ComboboxProps) {
  const id = useId();
  const [query, setQuery] = useState("");

  const matches = options.filter((option) =>
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
          list={`${id}-options`}
          placeholder={placeholder}
          value={value ?? query}
          onChange={(event) => {
            setQuery(event.target.value);
            onValueChange?.(event.target.value);
          }}
        />
        <datalist id={`${id}-options`}>
          {matches.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
