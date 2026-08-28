import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";

import { cx } from "../cx";
import { renderAsElement, type Renderable } from "../renderAs";
import "./Container.css";

interface ContainerOwnProps {
  /**
   * How wide the content may grow.
   *
   * `prose` is a reading measure in `ch`, so it tracks the font rather than
   * the viewport: text stays readable when someone doubles their font size,
   * which a `rem` maximum does not do. `app` is the widest a dense screen
   * should grow before a table starts needing a head turn. `full` opts out
   * and is there so opting out is visible at the call site rather than done
   * by not using the component.
   */
  width?: "prose" | "app" | "full";
  /** Drop the page gutter, for a container nested inside another. */
  flush?: boolean;
  renderAs?: Renderable;
  children: ReactNode;
}

export type ContainerProps = ContainerOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof ContainerOwnProps>;

/**
 * **Use it for** the one decision every page shares: how wide the content
 * gets and how far it stays from the edge. **Reach for something else when**
 * the element is inside a page that already has a container — nest `Stack`
 * and `Columns` instead, or pass `flush`.
 *
 * Two numbers, in one place. Without a container they are set per page, and
 * per page means differently: the pages drift apart by a few rem at a time
 * and nobody can point at the commit that did it. Both are override slots,
 * so a product can widen its app measure without editing this library.
 *
 * Theming:
 *
 * | Token | Default | Meaning |
 * | --- | --- | --- |
 * | `--uix-measure-app` | `80rem` | Widest a page's content grows |
 * | `--uix-measure-prose` | `68ch` | Reading width for running text |
 * | `--uix-page-gutter` | `var(--uix-gap-lg)` | The space between a page's content and the viewport edge |
 *
 * ```tsx
 * <Container width="app">
 *   <Stack gap="xl">{children}</Stack>
 * </Container>
 * ```
 *
 * Accessibility: a `div` with no role. `renderAs={<main />}` when this is
 * the page's main landmark and no `AppShell` is providing one.
 */
export function Container({
  width = "app",
  flush,
  renderAs,
  children,
  className,
  style,
  ...rest
}: ContainerProps) {
  const layout = {
    "data-width": width,
    "data-flush": flush || undefined,
    style: style as CSSProperties,
    ...rest,
  };
  return (
    renderAsElement(
      renderAs,
      "uix-container",
      { ...layout, className },
      children,
    ) ?? (
      <div className={cx("uix-container", className)} {...layout}>
        {children}
      </div>
    )
  );
}
