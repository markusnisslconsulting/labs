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

interface ButtonOwnProps {
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
   * a button: `renderAs={<a href="/pricing" />}`.
   *
   * Same convention Base UI uses, so the library has one mental model
   * for polymorphism rather than an `as` prop here and a `render` prop
   * there. Without it, the only way to get a button-shaped link is to
   * copy the class names, and copied class names are how a design
   * system starts losing.
   */
  renderAs?: ReactElement<Record<string, unknown>>;
}

/**
 * Accepts every attribute of `<button>` in addition to the props above;
 * `className` merges with the component's own class.
 *
 * Written as an intersection rather than `interface … extends Omit<…>`,
 * which is what every other component uses. Button was the exception,
 * and its docs page died with "t.startsWith is not a function" while the
 * others rendered.
 */
export type ButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps>;

/**
 * **Use it for** anything that performs an action. **Reach for something else when** the control navigates: pass `renderAs={<a href="…" />}` so it stays a link.
 *
 * The one button of the design system.
 *
 * API: three coherent axes — `variant`, `tone`, `size` — every
 * combination themed by component tokens, plus `leading`/`trailing`
 * slots, a `loading` state that keeps the label readable, and `renderAs`
 * for the cases that are not a `<button>`.
 *
 * Accessibility: a native `<button>` by default; the focus ring is
 * `focus-visible` only. `loading` sets `aria-busy` and `aria-disabled`
 * rather than the native `disabled`, because a disabled button leaves
 * the tab order — a user tabbing a form would lose their place the
 * moment a button started loading.
 *
 * ### Theming
 *
 * Override slots for this component. None is declared: each is
 * referenced with its semantic default inline, so a slot costs
 * nothing until something fills it. Set one on any ancestor.
 *
 * | Token | Default | Meaning |
 * | --- | --- | --- |
 * | `--uix-button-accent-bg` | `var(--uix-accent)` | Solid button background, accent tone |
 * | `--uix-button-accent-fg` | `var(--uix-text-on-accent)` | Solid button label, accent tone |
 * | `--uix-button-ghost-fg` | `var(--uix-text-primary)` | Ghost button label |
 * | `--uix-button-ghost-hover-bg` | `var(--uix-bg-subtle)` | Ghost button hover surface |
 * | `--uix-button-neutral-bg` | `var(--uix-surface-inverse)` | Solid button background, neutral tone |
 * | `--uix-button-neutral-fg` | `var(--uix-text-on-inverse)` | Solid button label, neutral tone |
 * | `--uix-button-outline-bg` | `var(--uix-bg-surface)` | Outline button background |
 * | `--uix-button-outline-border` | `var(--uix-border-subtle)` | Outline button border, rest |
 * | `--uix-button-outline-border-strong` | `var(--uix-border-strong)` | Button outline border strong |
 * | `--uix-button-outline-fg` | `var(--uix-text-primary)` | Outline button label |
 * | `--uix-button-radius` | `var(--uix-radius-control)` | Button corner radius, md |
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
  renderAs,
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

  if (renderAs && isValidElement(renderAs)) {
    const own = renderAs.props;
    return cloneElement(renderAs, {
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
