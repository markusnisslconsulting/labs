import type { ReactNode, ComponentPropsWithoutRef } from "react";

import { cx } from "../cx";
import { renderAsElement, type Renderable } from "../renderAs";
import "./Panel.css";
export interface PanelHeaderProps {
  /** Typically a title plus optional actions. */
  children: ReactNode;
}

export interface PanelBodyProps {
  children: ReactNode;
}

interface PanelOwnProps {
  /**
   * Render as a different element, keeping every style and behaviour.
   * `renderAs={<a href="/pricing" />}` — the same convention Base UI
   * uses, so the library has one mental model for polymorphism.
   */
  renderAs?: Renderable;

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
 *
 * ### Theming
 *
 * Override slots for this component. None is declared: each is
 * referenced with its semantic default inline, so a slot costs
 * nothing until something fills it. Set one on any ancestor.
 *
 * | Token | Default | Meaning |
 * | --- | --- | --- |
 * | `--uix-panel-accent` | `var(--uix-accent)` | Panel label dot |
 * | `--uix-panel-bg` | `var(--uix-bg-surface)` | Panel background |
 * | `--uix-panel-border` | `var(--uix-border-subtle)` | Panel border |
 * | `--uix-panel-pad-x` | `var(--uix-gap-xl)` | Panel horizontal padding, density-aware |
 * | `--uix-panel-pad-y` | `calc(var(--uix-gap-lg) + var(--uix-gap-xs))` | Panel vertical padding, density-aware |
 * | `--uix-panel-radius` | `var(--uix-radius-container)` | Panel corner radius |
 */
export function Panel({
  label,
  children,
  className,
  renderAs,
  ...rest
}: PanelProps) {
  const content = (
    <>
      {label ? <p className="uix-panel-label">{label}</p> : null}
      {children}
    </>
  );
  const props = { ...rest, className, "aria-label": label };

  return (
    renderAsElement(renderAs, "uix-panel", props, content) ?? (
      <section
        className={cx("uix-panel", className)}
        aria-label={label}
        {...rest}
      >
        {content}
      </section>
    )
  );
}

Panel.Header = PanelHeaderBase;
Panel.Body = PanelBodyBase;
