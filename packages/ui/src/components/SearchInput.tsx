import type { InputHTMLAttributes } from "react";

export type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * A search field that announces itself: pass an `aria-label` (or pair
 * with a visible label) so the purpose is never inferred from the
 * placeholder alone.
 */
export function SearchInput({ ...rest }: SearchInputProps) {
  return <input type="search" className="uix-search" {...rest} />;
}
