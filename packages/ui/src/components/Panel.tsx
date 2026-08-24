import type { ReactNode } from "react";

export interface PanelHeaderProps {
  /** Typically a title plus optional actions. */
  children: ReactNode;
}

export interface PanelBodyProps {
  children: ReactNode;
}

export interface PanelProps {
  /** Uppercase kicker; also the section's accessible name. */
  label?: string;
  /** Compose richer headers with <PanelHeader>/<PanelBody>. */
  children: ReactNode;
}

function PanelHeaderBase({ children }: PanelHeaderProps) {
  return <div className="uix-panel-header">{children}</div>;
}

function PanelBodyBase({ children }: PanelBodyProps) {
  return <div className="uix-panel-body">{children}</div>;
}

/**
 * The bordered demo surface.
 *
 * Accessibility: `label` names the section (aria-label). For richer
 * content, compose PanelHeader/PanelBody and label the header
 * heading instead — pass `labelledBy` then.
 *
 * Slots: `Panel.Header` and `Panel.Body` map to styled subcomponents,
 * the way enterprise systems expose anatomy without extra props.
 */
export function Panel({ label, children }: PanelProps) {
  return (
    <section className="uix-panel" aria-label={label}>
      {label ? <p className="uix-panel-label">{label}</p> : null}
      {children}
    </section>
  );
}

Panel.Header = PanelHeaderBase;
Panel.Body = PanelBodyBase;
