"use client";

import type { ReactNode, ComponentPropsWithRef } from "react";

import { cx } from "../cx";
import { Search } from "lucide-react";

import { Field } from "./Field";

export interface SearchInputProps extends Omit<
  ComponentPropsWithRef<"input">,
  "id"
> {
  /**
   * The field's accessible name, required.
   *
   * It renders a real `label` element, visually hidden unless
   * `showLabel`. Hidden is not absent: a screen reader reads it, the
   * click target grows to include it, and the field is named without a
   * visible one — which a search box beside a magnifier usually does not
   * want.
   *
   * It was optional, and the component's own documentation asked callers
   * to remember `aria-label`. Asking is not a contract; every caller who
   * forgot shipped an unnamed search box.
   */
  label: ReactNode;
  /**
   * Render the label for assistive technology only. Defaults to `true`:
   * a search box beside a magnifier usually does not want a visible one.
   *
   * Was `showLabel`, inverted, which made SearchInput the one field whose
   * label prop read the opposite way round from every other field's. The
   * old name still works and warns.
   */
  hideLabel?: boolean;
  /** @deprecated Use `hideLabel` — the inverse — for consistency with every other field. */
  showLabel?: boolean;
  hint?: ReactNode;
  /** Validation message. Its presence makes the field invalid. */
  error?: ReactNode;
  /** Marks the field required, visibly and for assistive technology. */
  required?: boolean;
}

import "./_field.css";
import "./SearchInput.css";
/**
 * **Use it for** filtering or querying a collection. **Reach for something else when** it is an ordinary labelled field (TextField).
 *
 * A search field that announces itself. The name is a required prop, so
 * the purpose can never be left to the placeholder — a placeholder is not
 * a label, and it disappears the moment someone types.
 *
 * ### Theming
 *
 * Override slots for this component. None is declared: each is
 * referenced with its semantic default inline, so a slot costs
 * nothing until something fills it. Set one on any ancestor.
 *
 * | Token | Default | Meaning |
 * | --- | --- | --- |
 * | `--uix-search-radius` | `var(--uix-radius-pill)` | Search field corner; the one thing search wants apart from every other field |
 *
 * Accessibility: an accessible name is required, not optional. `label`
 * renders a real `label` element, visually hidden by default because a
 * search field beside a magnifier rarely wants a visible one — hidden is
 * not absent. Before this the component took no label at all, so an
 * unnamed search box was the default and every caller had to remember
 * `aria-label`.
 */
export function SearchInput({
  name,
  label,
  hideLabel,
  showLabel,
  hint,
  error,
  required,
  className,
  ...rest
}: SearchInputProps) {
  // showLabel is the deprecated inverse. Explicit hideLabel wins; then the
  // old prop; then hidden, which is what a search box usually wants.
  const hidden = hideLabel ?? (showLabel === undefined ? true : !showLabel);

  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hidden}
      className={cx("uix-search-field", className)}
    >
      {({ control, invalid }) => (
        /* The same row every other field uses, with a pill radius. It used
           to put its own border, background and min-height on the input
           itself, which is why its text sat a pixel or two high: an input
           with a min-height and no padding leaves the engine to centre the
           value, and the engines do not agree. A row that is a flex
           container centres it the same way everywhere. */
        <div className="uix-field-row" data-invalid={invalid}>
          <span className="uix-field-adornment" aria-hidden>
            <Search size={16} />
          </span>
          <input
            {...control}
            type="search"
            className="uix-field-input"
            {...rest}
          />
        </div>
      )}
    </Field>
  );
}
