"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cx } from "../cx";

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
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
  /** Render the label visibly instead of for assistive technology only. */
  showLabel?: boolean;
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
 * | `--uix-search-border` | `var(--uix-border-subtle)` | Search input border |
 *
 * Accessibility: an accessible name is required, not optional. `label`
 * renders a real `label` element, visually hidden by default because a
 * search field beside a magnifier rarely wants a visible one — hidden is
 * not absent. Before this the component took no label at all, so an
 * unnamed search box was the default and every caller had to remember
 * `aria-label`.
 */
export function SearchInput({
  label,
  showLabel,
  className,
  ...rest
}: SearchInputProps) {
  const id = useId();
  return (
    <>
      <label
        htmlFor={id}
        className={showLabel ? "uix-field-label" : "uix-visually-hidden"}
      >
        {label}
      </label>
      <input
        id={id}
        type="search"
        className={cx("uix-search", className)}
        {...rest}
      />
    </>
  );
}
