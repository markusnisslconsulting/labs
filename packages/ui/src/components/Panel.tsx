import type { ReactNode, ComponentPropsWithoutRef } from "react";

import { cx } from "../cx";
import "./Panel.css";
export interface PanelHeaderProps {
  /** Typically a title plus optional actions. */
  children: ReactNode;
}

export interface PanelBodyProps {
  children: ReactNode;
}

interface PanelOwnProps {
  /** Uppercase kicker; also the section's accessible name. */
  label?: string;
  /** Compose richer headers with <PanelHeader>/<PanelBody>. */
  children: ReactNode;
}

/**
 * Accepts every attribute of `<section>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type PanelProps = PanelOwnProps &
  Omit<ComponentPropsWithoutRef<"section">, keyof PanelOwnProps>;

function PanelHeaderBase({ children }: PanelHeaderProps) {
  return <div className="uix-panel-header">{children}</div>;
}

function PanelBodyBase({ children }: PanelBodyProps) {
  return <div className="uix-panel-body">{children}</div>;
}

/**
 * **Use it for** a titled region of this page. **Reach for something else when** the surface summarises something that lives elsewhere (Card).
 *
 * The bordered demo surface.
 *
 * Accessibility: `label` names the section (aria-label). For richer
 * content, compose PanelHeader/PanelBody and label the header
 * heading instead — pass `labelledBy` then.
 *
 * Slots: `Panel.Header` and `Panel.Body` map to styled subcomponents,
 * the way enterprise systems expose anatomy without extra props.
 */
export function Panel({ label, children, className, ...rest }: PanelProps) {
  return (
    <section
      className={cx("uix-panel", className)}
      aria-label={label}
      {...rest}
    >
      {label ? <p className="uix-panel-label">{label}</p> : null}
      {children}
    </section>
  );
}

Panel.Header = PanelHeaderBase;
Panel.Body = PanelBodyBase;
