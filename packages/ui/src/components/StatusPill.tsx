import type { ReactNode } from "react";

type Tone = "ok" | "warn" | "off";

export interface StatusPillProps {
  tone: Tone;
  /** The state in words. The dot is decorative; the text is the
      accessible content, so tone is never the only carrier. */
  children: ReactNode;
}

/**
 * A live state, one line. The coloured dot is `aria-hidden`; the word
 * next to it carries the meaning for assistive technology.
 */
export function StatusPill({ tone, children }: StatusPillProps) {
  return (
    <span className="uix-pill" data-tone={tone}>
      {children}
    </span>
  );
}
