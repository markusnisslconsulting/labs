import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "solid" | "outline" | "ghost";
type Tone = "accent" | "neutral";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  children: ReactNode;
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  /** Icon/content before the label. */
  leading?: ReactNode;
  /** Icon/content after the label. */
  trailing?: ReactNode;
  /**
   * Shows an inline spinner, sets `aria-busy` and blocks interaction.
   * The label stays visible and readable.
   */
  loading?: boolean;
}

/**
 * The one button of the design system.
 *
 * API: three coherent axes — `variant`, `tone`, `size` — every
 * combination themed by component tokens, plus `leading`/`trailing`
 * slots and a `loading` state that keeps the label readable.
 *
 * Accessibility: native `<button>`; focus ring is `focus-visible`
 * only; `loading` sets `aria-busy` and disables interaction while
 * keeping the accessible name.
 */
export function Button({
  variant = "solid",
  tone = "accent",
  size = "md",
  leading,
  trailing,
  loading = false,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className="uix-button"
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="uix-button-spinner" aria-hidden>
          <Spinner size="sm" label="" />
        </span>
      ) : leading ? (
        <span className="uix-button-leading" aria-hidden>
          {leading}
        </span>
      ) : null}
      {children}
      {trailing && !loading ? (
        <span className="uix-button-trailing" aria-hidden>
          {trailing}
        </span>
      ) : null}
    </button>
  );
}
