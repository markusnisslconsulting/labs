import type { InputHTMLAttributes } from "react";

import { cx } from "../cx";

export type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

import "./SearchInput.css";
/**
 * **Use it for** filtering or querying a collection. **Reach for something else when** it is an ordinary labelled field (TextField).
 *
 * A search field that announces itself: pass an `aria-label` (or pair
 * with a visible label) so the purpose is never inferred from the
 * placeholder alone.
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
 */
export function SearchInput({ className, ...rest }: SearchInputProps) {
  return (
    <input type="search" className={cx("uix-search", className)} {...rest} />
  );
}
