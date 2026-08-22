import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "confirm-mini" | "danger-mini";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight. The mini variants live inside table rows. */
  variant?: Variant;
}

const modifier: Record<Variant, string> = {
  primary: "",
  ghost: " uix-button--ghost",
  "confirm-mini": " uix-button--confirm-mini",
  "danger-mini": " uix-button--danger-mini",
};

/**
 * The one button of the design system.
 *
 * Accessibility: renders a native `<button>`, so keyboard activation
 * and screen reader semantics come for free; the focus ring is
 * `focus-visible` only; a visible `children` label is required, so
 * the accessible name can never be empty.
 */
export function Button({
  variant = "primary",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={`uix-button${modifier[variant]}`} {...rest}>
      {children}
    </button>
  );
}
