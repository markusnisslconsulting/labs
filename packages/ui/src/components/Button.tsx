import type { ButtonHTMLAttributes } from "react";

type Variant = "solid" | "outline" | "ghost";
type Tone = "accent" | "neutral";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Fill strategy. All three are themed via component tokens. */
  variant?: Variant;
  /**
   * Fill colour family for the solid variant; outline and ghost use
   * text/border tokens, so the tone is recorded but does not change
   * their look.
   */
  tone?: Tone;
  /** sm for controls inside rows, md as default, lg for heroes. */
  size?: Size;
}

/**
 * The one button of the design system.
 *
 * The API is three coherent axes — `variant`, `tone`, `size` — every
 * combination of which is themed by component tokens. Emphasis never
 * comes from per-use-case variants.
 *
 * Accessibility: native `<button>`; focus ring is `focus-visible`
 * only; a visible `children` label is required, so the accessible
 * name can never be empty.
 */
export function Button({
  variant = "solid",
  tone = "accent",
  size = "md",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className="uix-button"
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      {...rest}
    >
      {children}
    </button>
  );
}
