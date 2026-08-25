/**
 * Join class names, dropping the falsy ones.
 *
 * Exists so every component can merge a caller's `className` with its
 * own instead of letting one replace the other — passing `className`
 * used to strip a component's styling entirely.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * The same merge for Base UI roots, whose `className` may be a function
 * of component state. Returns a function so that API survives: a caller
 * can still derive classes from `data-checked` and friends, and the
 * component's own class is always present.
 */
export function cxState<S>(
  own: string,
  incoming: string | ((state: S) => string | undefined) | undefined,
): (state: S) => string {
  return (state) =>
    cx(own, typeof incoming === "function" ? incoming(state) : incoming);
}
