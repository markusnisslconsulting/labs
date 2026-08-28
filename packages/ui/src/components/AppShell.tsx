import type { ComponentPropsWithRef, ReactNode } from "react";

import { cx } from "../cx";
import { HeadingLevelProvider } from "../heading";
import "./AppShell.css";

interface AppShellOwnProps {
  /** The banner: product name, global search, account. */
  header?: ReactNode;
  /** Primary navigation, beside the content on a wide screen. */
  nav?: ReactNode;
  /** What the navigation is called. Required whenever `nav` is given. */
  navLabel?: string;
  /** Site-wide footer: legal, version, support. */
  footer?: ReactNode;
  /** How wide the navigation wants to be. Defaults to `md`. */
  navWidth?: "sm" | "md" | "lg";
  /** The page. Becomes the `main` landmark. */
  children: ReactNode;
}

export type AppShellProps = AppShellOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof AppShellOwnProps>;

/**
 * **Use it for** the frame every page in an application sits in. **Reach for
 * something else when** the two regions are content rather than chrome
 * (`Split`), or the page has no frame at all.
 *
 * Landmarks, which is the part worth having a component for. A page needs a
 * banner, a navigation, a main and a footer, each exactly once, in that
 * relationship. Written by hand per page they come out as four `div`s with
 * classes, and nothing anywhere reports it: no test fails, no lint rule
 * fires, the page looks finished. What is lost is the ability to move
 * through the page without a mouse — a reader who cannot see the layout uses
 * the landmark list the way everybody else uses the layout.
 *
 * The `main` element is also the skip-link target and the thing a browser's
 * reader mode looks for, so getting it once per application is worth more
 * than getting it right on the pages somebody remembered.
 *
 * `navLabel` is required with `nav` for the same reason `AvatarGroup` needs
 * a label: two navigations in one page are two identical landmarks in the
 * list, and "Navigation, navigation" tells a reader nothing about which is
 * which.
 *
 * Theming:
 *
 * | Token | Default | Meaning |
 * | --- | --- | --- |
 * | `--uix-appshell-nav` | `15rem` | How wide an application's navigation rail sits |
 *
 * ```tsx
 * <AppShell
 *   header={<ProductBar />}
 *   nav={<SideNav />}
 *   navLabel="Sections"
 *   footer={<Legal />}
 * >
 *   <Container>{page}</Container>
 * </AppShell>
 * ```
 *
 * Accessibility: `header`, `nav`, `main` and `footer` as real elements, so
 * the landmarks come from the markup rather than from `role` attributes on
 * `div`s. Content inside `main` starts at heading level 1.
 */
export function AppShell({
  header,
  nav,
  navLabel,
  footer,
  navWidth = "md",
  children,
  className,
  ...rest
}: AppShellProps) {
  return (
    <div
      className={cx("uix-appshell", className)}
      data-nav-width={navWidth}
      {...rest}
    >
      {header ? (
        <header className="uix-appshell-header">{header}</header>
      ) : null}
      <div className="uix-appshell-body">
        {nav ? (
          <nav className="uix-appshell-nav" aria-label={navLabel}>
            {nav}
          </nav>
        ) : null}
        {/* A page's own heading is an h1, and everything a Section wraps
            goes deeper from there. */}
        <main className="uix-appshell-main">
          <HeadingLevelProvider level={1}>{children}</HeadingLevelProvider>
        </main>
      </div>
      {footer ? (
        <footer className="uix-appshell-footer">{footer}</footer>
      ) : null}
    </div>
  );
}
