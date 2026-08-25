import type { InputHTMLAttributes } from "react";

import { cx } from "../cx";

export type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

import "./SearchInput.css";
/**
 * A search field that announces itself: pass an `aria-label` (or pair
 * with a visible label) so the purpose is never inferred from the
 * placeholder alone.
 */
export function SearchInput({ className, ...rest }: SearchInputProps) {
  return (
    <input type="search" className={cx("uix-search", className)} {...rest} />
  );
}
