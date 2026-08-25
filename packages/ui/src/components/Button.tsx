import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { cx } from "../cx";
import { Spinner } from "./Spinner";

import "./Button.css";

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
   * Shows an inline spinner, sets `aria-busy` and refuses activation.
   * The label stays visible and readable.
   */
  loading?: boolean;
  /**
   * Render as a different element, keeping every Button style and
   * behaviour. The case this exists for is a link that has to look like
   * a button: `render={<a href="/pricing" />}`.
   *
   * Same convention Base UI uses, so the library has one mental model
   * for polymorphism rather than an `as` prop here and a `render` prop
   * there. Without it, the only way to get a button-shaped link is to
   * copy the class names, and copied class names are how a design
   * system starts losing.
   */
  render?: ReactElement<Record<string, unknown>>;
}

/**
 * The one button of the design system.
 *
 * API: three coherent axes — `variant`, `tone`, `size` — every
 * combination themed by component tokens, plus `leading`/`trailing`
 * slots, a `loading` state that keeps the label readable, and `render`
 * for the cases that are not a `<button>`.
 *
 * Accessibility: a native `<button>` by default; the focus ring is
 * `focus-visible` only. `loading` sets `aria-busy` and `aria-disabled`
 * rather than the native `disabled`, because a disabled button leaves
 * the tab order — a user tabbing a form would lose their place the
 * moment a button started loading.
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
  className,
  onClick,
  render,
  ...rest
}: ButtonProps) {
  const busy = loading && !disabled;

  const content = (
    <>
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
    </>
  );

  const presentation = {
    "data-variant": variant,
    "data-tone": tone,
    "data-size": size,
    "aria-busy": loading || undefined,
    "aria-disabled": busy || undefined,
  } as const;

  if (render && isValidElement(render)) {
    const own = render.props;
    return cloneElement(render, {
      ...rest,
      ...presentation,
      ...own,
      // The rendered element's own class survives; ours is added to it,
      // so neither side silently wins.
      className: cx(
        "uix-button",
        className,
        own["className"] as string | undefined,
      ),
      onClick: busy
        ? (event: MouseEvent<HTMLElement>) => event.preventDefault()
        : ((own["onClick"] as ButtonProps["onClick"]) ?? onClick),
      children: content,
    });
  }

  return (
    <button
      type="button"
      className={cx("uix-button", className)}
      {...presentation}
      disabled={disabled}
      onClick={
        busy
          ? (event: MouseEvent<HTMLButtonElement>) => event.preventDefault()
          : onClick
      }
      {...rest}
    >
      {content}
    </button>
  );
}
