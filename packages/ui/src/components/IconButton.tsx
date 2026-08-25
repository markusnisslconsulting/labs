import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "../cx";

import "./IconButton.css";
type Variant = "solid" | "outline" | "ghost";
type Size = "sm" | "md";

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  /**
   * The accessible name. Required and typed as a string: an icon
   * button without a text alternative is the classic a11y defect.
   */
  label: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
}

/**
 * An icon-only action.
 *
 * Accessibility: same native button as Button, but the accessible
 * name is a required prop — TypeScript rejects an icon without one,
 * so the failure mode never reaches production.
 */
export function IconButton({
  label,
  children,
  variant = "ghost",
  size = "md",
  className,
  ...rest
}: IconButtonProps) {
  const variantClass =
    variant === "solid"
      ? "uix-iconbutton--solid"
      : variant === "outline"
        ? "uix-iconbutton--outline"
        : "";
  return (
    <button
      type="button"
      className={cx("uix-iconbutton", variantClass, className)}
      data-size={size}
      aria-label={label}
      {...rest}
    >
      {children}
    </button>
  );
}
