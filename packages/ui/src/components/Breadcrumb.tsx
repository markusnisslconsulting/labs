import type { ComponentPropsWithoutRef } from "react";

import { cx } from "../cx";
import "./Breadcrumb.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbOwnProps {
  items: BreadcrumbItem[];
}

/**
 * Accepts every attribute of `<nav>` in addition to `items`;
 * `className` merges with the component's own class.
 */
export type BreadcrumbProps = BreadcrumbOwnProps &
  Omit<ComponentPropsWithoutRef<"nav">, keyof BreadcrumbOwnProps>;

/**
 * Breadcrumb trail. The last item is the current page:
 * `aria-current="page"`, rendered as text, not a link to itself.
 *
 * Accessibility: `nav` with a label, list semantics, separators
 * hidden from assistive technology.
 */
export function Breadcrumb({ items, className, ...rest }: BreadcrumbProps) {
  return (
    <nav
      className={cx("uix-breadcrumb", className)}
      aria-label="Breadcrumb"
      {...rest}
    >
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {isLast || !item.href ? (
                <span aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <a href={item.href}>{item.label}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
