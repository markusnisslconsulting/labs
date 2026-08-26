import type { ReactNode, ComponentPropsWithoutRef } from "react";

import { cx } from "../cx";
import { renderAsElement, type Renderable } from "../renderAs";
import "./StatusPill.css";
type Tone = "ok" | "warn" | "off";

interface StatusPillOwnProps {
  /**
   * Render as a different element, keeping every style and behaviour.
   * `renderAs={<a href="/pricing" />}` — the same convention Base UI
   * uses, so the library has one mental model for polymorphism rather
   * than an `as` prop here and a `render` prop there.
   */
  renderAs?: Renderable;

  tone: Tone;
  /** The state in words. The dot is decorative; the text is the
      accessible content, so tone is never the only carrier. */
  children: ReactNode;
}

/**
 * Accepts every attribute of `<span>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type StatusPillProps = StatusPillOwnProps &
  Omit<ComponentPropsWithoutRef<"span">, keyof StatusPillOwnProps>;

/**
 * **Use it for** a live state that changes on its own. **Reach for something else when** the label is static (Badge).
 *
 * A live state, one line. The coloured dot is `aria-hidden`; the word
 * next to it carries the meaning for assistive technology.
 *
 * ### Theming
 *
 * Override slots for this component. None is declared: each is
 * referenced with its semantic default inline, so a slot costs
 * nothing until something fills it. Set one on any ancestor.
 *
 * | Token | Default | Meaning |
 * | --- | --- | --- |
 * | `--uix-pill-fg` | `var(--uix-text-primary)` | Status pill label |
 * | `--uix-pill-off` | `var(--uix-status-off)` | Status pill dot, off |
 * | `--uix-pill-ok` | `var(--uix-status-ok)` | Status pill dot, ok |
 * | `--uix-pill-warn` | `var(--uix-status-warn)` | Status pill dot, warn |
 *
 * Accessibility: the dot is `aria-hidden` and the words carry the state,
 * so the pill means the same thing to someone who cannot distinguish the
 * colours. This is the component that exists to make that rule concrete:
 * a coloured dot on its own is a state only some readers can read.
 */
export function StatusPill({
  tone,
  children,
  className,
  renderAs,
  ...rest
}: StatusPillProps) {
  const props = { ...rest, className, "data-tone": tone };
  return (
    renderAsElement(renderAs, "uix-pill", props, children) ?? (
      <span className={cx("uix-pill", className)} data-tone={tone} {...rest}>
        {children}
      </span>
    )
  );
}
