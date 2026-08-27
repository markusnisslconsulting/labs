import type { ComponentPropsWithRef, ReactNode } from "react";

import { cx } from "../cx";
import "./EmptyState.css";

interface EmptyStateOwnProps {
  /**
   * What is not here, as a heading.
   *
   * Required, and the wording is the whole component. "No results" states
   * the obvious; "No supplier matches this filter" says which of the two
   * empty states this is — nothing exists yet, or nothing matched — and
   * those want different next steps.
   */
  title: ReactNode;
  /** Why, or what to do about it. */
  description?: ReactNode;
  /**
   * The one thing to do next.
   *
   * A node rather than a label and a handler, because the right control
   * differs: a button that opens a form, a link to an import page, a
   * button that clears the filter. A component that took `onAction` would
   * have to guess which.
   */
  action?: ReactNode;
  /**
   * A picture, hidden from assistive technology.
   *
   * Decorative by construction: an empty state's meaning is in its title,
   * and an illustration that needed describing would be saying something
   * the title should have said.
   */
  illustration?: ReactNode;
  /**
   * The heading level, when this sits inside a page that has headings.
   *
   * Defaults to none: the title renders as a `<p>` with the region labelled
   * by it. An empty state inside a table cell or a card is not a section of
   * the document, and a stray `<h2>` in the middle of a heading outline is
   * a worse defect than a missing one — it makes the outline unreadable for
   * anyone navigating by headings. Pass a level where the empty state
   * really does replace a section.
   */
  headingLevel?: 2 | 3 | 4;
  /**
   * Anything else, below the action.
   *
   * The four props above are prop slots: small content whose placement and
   * styling this component owns. `children` is the way out of that fixed
   * arrangement — a link to the documentation, a hint about permissions, a
   * second action nobody wants styled like the first. Without it the only
   * empty states expressible are the ones imagined here.
   */
  children?: ReactNode;
}

/**
 * **Use it for** the place where a list, table or search result would be,
 * when there is nothing to show. **Reach for something else when** the
 * emptiness is an error or a failure — `Alert` says something went wrong,
 * this says nothing is here yet.
 *
 * ```tsx
 * <EmptyState
 *   title="No supplier matches this filter"
 *   description="Try a shorter name, or clear the region filter."
 *   action={<Button onClick={clear}>Clear filters</Button>}
 * />
 * ```
 *
 * It slots into `DataTable`'s `empty` prop, which is the case it was
 * written for.
 *
 * Accessibility: a `role="status"` region, polite. Status rather than plain
 * markup because this text usually appears as the *result of something the
 * reader did* — a search, a filter — and a result that renders silently
 * leaves a screen reader user waiting.
 *
 * Deliberately **without** a name of its own. An `aria-labelledby` pointing
 * at the title was the first attempt and it was wrong: a live region is
 * announced by its content, so a name equal to that content makes a reader
 * that announces both say the title twice. The region's content is the
 * announcement, and the title is the first thing in it.
 *
 * The heading is opt-in. See `headingLevel`: a component that guessed
 * `<h2>` would corrupt the heading outline of every page that put an empty
 * state inside a card.
 */
export type EmptyStateProps = EmptyStateOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof EmptyStateOwnProps>;

export function EmptyState({
  title,
  description,
  action,
  illustration,
  headingLevel,
  children,
  className,
  ...rest
}: EmptyStateProps) {
  const Heading = headingLevel ? (`h${headingLevel}` as const) : "p";

  return (
    <div
      className={cx("uix-empty", className)}
      role="status"
      /* Polite: this is the answer to something the reader did, not an
         interruption of something else. */
      aria-live="polite"
      {...rest}
    >
      {illustration ? (
        <div className="uix-empty-illustration" aria-hidden>
          {illustration}
        </div>
      ) : null}
      <Heading className="uix-empty-title">{title}</Heading>
      {description ? (
        <p className="uix-empty-description">{description}</p>
      ) : null}
      {action ? <div className="uix-empty-action">{action}</div> : null}
      {children}
    </div>
  );
}
