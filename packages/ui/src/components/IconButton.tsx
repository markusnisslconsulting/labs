"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "../cx";
import { renderAsElement, type Renderable } from "../renderAs";

import "./IconButton.css";
type Variant = "solid" | "outline" | "ghost";
type Size = "sm" | "md";

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  /**
   * Render as a different element, keeping every style and behaviour.
   * `renderAs={<a href="/pricing" />}` — the same convention Base UI
   * uses, so the library has one mental model for polymorphism.
   */
  renderAs?: Renderable;

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
 * **Use it for** an action whose icon is unambiguous, where space is tight. **Reach for something else when** the action is primary, or the icon needs explaining (Button with a leading icon).
 *
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
  renderAs,
  ...rest
}: IconButtonProps) {
  const variantClass =
    variant === "solid"
      ? "uix-iconbutton--solid"
      : variant === "outline"
        ? "uix-iconbutton--outline"
        : "";
  const props = {
    ...rest,
    className: cx(variantClass, className),
    "data-size": size,
    "aria-label": label,
  };
  return (
    renderAsElement(renderAs, "uix-iconbutton", props, children) ?? (
      <button
        type="button"
        className={cx("uix-iconbutton", variantClass, className)}
        data-size={size}
        aria-label={label}
        {...rest}
      >
        {children}
      </button>
    )
  );
}
