import type { ReactNode } from "react";

export interface PanelProps {
  /** The uppercase kicker above the content; also the section's
      accessible name via aria-label. */
  label: string;
  children: ReactNode;
}

/**
 * The bordered demo surface. One landmark per lab page section, named
 * by its label, so screen reader users can jump between live examples.
 */
export function Panel({ label, children }: PanelProps) {
  return (
    <section className="uix-panel" aria-label={label}>
      <p className="uix-panel-label">{label}</p>
      {children}
    </section>
  );
}
