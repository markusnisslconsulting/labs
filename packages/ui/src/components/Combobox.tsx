import { useId, useState } from "react";

export interface ComboboxProps {
  label: string;
  options: string[];
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
}

/**
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
}: ComboboxProps) {
  const id = useId();
  const [query, setQuery] = useState("");

  const matches = options.filter((option) =>
    option.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="uix-field">
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
