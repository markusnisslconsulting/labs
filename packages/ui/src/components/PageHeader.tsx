import type { ComponentPropsWithRef, ReactNode } from "react";

import { cx } from "../cx";
import { Heading } from "../heading";
import "./PageHeader.css";

interface PageHeaderOwnProps {
  /** The page's name. Rendered as the heading at this position. */
  title: ReactNode;
  /** One line saying what the page is for. */
  description?: ReactNode;
  /** Where a `Breadcrumb` goes, above the title. */
  breadcrumb?: ReactNode;
  /** The page's primary controls, beside the title on a wide screen. */
  actions?: ReactNode;
  /** Status beside the title: a `StatusPill`, a `Badge`, a count. */
  meta?: ReactNode;
}

export type PageHeaderProps = PageHeaderOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof PageHeaderOwnProps>;

/**
 * **Use it for** the top of a page: name, one line of context, the controls
 * that act on the whole page. **Reach for something else when** the region
 * is inside the page rather than the top of it (`Section`).
 *
 * The most repeated shape in an enterprise application and the one most
 * often rebuilt per screen, which is how a product ends up with the title
 * and the actions in a different relationship on every page. The slots here
 * are not a style decision: they are the list of things a page top is
 * allowed to contain, so a generated page has somewhere to put each one
 * instead of inventing an arrangement.
 *
 * ```tsx
 * <PageHeader
 *   breadcrumb={<Breadcrumb items={trail} />}
 *   title="Suppliers"
 *   description="Every supplier with an active contract."
 *   meta={<StatusPill status="ok">Synced</StatusPill>}
 *   actions={<Button>Add supplier</Button>}
 * />
 * ```
 *
 * Accessibility: a `div`, and the heading carries the meaning. The first
 * version used a `header` element, on the reasoning that `header` is a
 * `banner` landmark only outside `main`, `section`, `article`, `aside` and
 * `nav` — which is true, and which makes the element's meaning a property of
 * where somebody put it. axe caught it immediately: four of these in one
 * frame are four banner landmarks, and a page with an `AppShell` header plus
 * one of these has two.
 *
 * That is this component failing the rule the layer exists for. A component
 * whose semantics depend on its parent is not composable, and the fix is not
 * to document the correct parent. `AppShell` owns the banner; this owns the
 * heading, whose level comes from position, so it is an `h1` on a page and an
 * `h2` inside a section without anyone passing a number.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  meta,
  className,
  ...rest
}: PageHeaderProps) {
  return (
    <div className={cx("uix-pageheader", className)} {...rest}>
      {breadcrumb ? (
        <div className="uix-pageheader-breadcrumb">{breadcrumb}</div>
      ) : null}
      <div className="uix-pageheader-row">
        <div className="uix-pageheader-headings">
          <div className="uix-pageheader-titleline">
            <Heading className="uix-pageheader-title">{title}</Heading>
            {meta ? <div className="uix-pageheader-meta">{meta}</div> : null}
          </div>
          {description ? (
            <p className="uix-pageheader-description">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="uix-pageheader-actions">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
