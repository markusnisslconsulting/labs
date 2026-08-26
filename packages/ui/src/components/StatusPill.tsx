import type { ReactNode, ComponentPropsWithoutRef } from "react";

import { cx } from "../cx";
import "./StatusPill.css";
type Tone = "ok" | "warn" | "off";

interface StatusPillOwnProps {
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
 */
export function StatusPill({
  tone,
  children,
  className,
  ...rest
}: StatusPillProps) {
  return (
    <span className={cx("uix-pill", className)} data-tone={tone} {...rest}>
      {children}
    </span>
  );
}
