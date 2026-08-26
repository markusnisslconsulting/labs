import type { ComponentPropsWithRef, ReactNode } from "react";

import { cx } from "../cx";
import { useStrings } from "../i18n";
import "./Breadcrumb.css";

export interface BreadcrumbItem {
  /** A node: a crumb often carries an icon for its section. */
  label: ReactNode;
  href?: string;
}

interface BreadcrumbOwnProps {
  /**
   * The convenience form, and the one that also decides which crumb is
   * current: the last one. A shorthand over `Breadcrumb.Crumb`, which is
   * what a trail with a dropdown in the middle, or a truncated middle
   * section, needs.
   */
  items?: BreadcrumbItem[];
  /**
   * The trail's accessible name. Was the literal string "Breadcrumb",
   * compiled in, which no other locale can read.
   */
  label?: string;
  children?: ReactNode;
}

export type BreadcrumbCrumbProps = ComponentPropsWithRef<"li"> & {
  href?: string;
  /** Marks this crumb as the page the reader is on. */
  current?: boolean;
};

/**
 * Accepts every attribute of `<nav>` in addition to `items`;
 * `className` merges with the component's own class.
 */
export type BreadcrumbProps = BreadcrumbOwnProps &
  Omit<ComponentPropsWithRef<"nav">, keyof BreadcrumbOwnProps>;

/**
 * **Use it for** showing where a page sits in a hierarchy the reader can climb. **Reach for something else when** the levels are not a hierarchy (a back link).
 *
 * Breadcrumb trail. The last item is the current page:
 * `aria-current="page"`, rendered as text, not a link to itself.
 *
 * Accessibility: `nav` with a label, list semantics, separators
 * hidden from assistive technology.
 */
export function Breadcrumb({
  items,
  label,
  className,
  children,
  ...rest
}: BreadcrumbProps) {
  const labels = useStrings();
  return (
    <nav
      className={cx("uix-breadcrumb", className)}
      aria-label={label ?? labels.breadcrumb}
      {...rest}
    >
      <ol>
        {children ??
          (items ?? []).map((item, index) => (
            <Crumb
              key={index}
              href={item.href}
              current={index === (items ?? []).length - 1}
            >
              {item.label}
            </Crumb>
          ))}
      </ol>
    </nav>
  );
}

/**
 * One crumb. A link unless it is the current page, which is text with
 * `aria-current` — a page never links to itself.
 */
function Crumb({
  href,
  current,
  children,
  className,
  ...rest
}: BreadcrumbCrumbProps) {
  return (
    <li className={cx(className)} {...rest}>
      {current || !href ? (
        <span aria-current={current ? "page" : undefined}>{children}</span>
      ) : (
        <a href={href}>{children}</a>
      )}
    </li>
  );
}

Breadcrumb.Crumb = Crumb;
