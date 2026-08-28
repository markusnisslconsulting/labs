import type { ComponentPropsWithRef, ReactNode } from "react";

import { cx } from "../cx";
import {
  Heading,
  HeadingLevelProvider,
  nextHeadingLevel,
  useHeadingLevel,
} from "../heading";
import type { StackGap } from "./Stack";
import "./Section.css";

interface SectionOwnProps {
  /** The section's heading. Its level comes from how deeply it sits. */
  title?: ReactNode;
  /** A line under the heading, for what the section is. */
  description?: ReactNode;
  /** Controls that belong to this section, shown beside the heading. */
  actions?: ReactNode;
  /** Between the header and the content. Defaults to `lg`. */
  gap?: StackGap;
  children: ReactNode;
}

export type SectionProps = SectionOwnProps &
  Omit<ComponentPropsWithRef<"section">, keyof SectionOwnProps>;

/**
 * **Use it for** a titled region of a page. **Reach for something else when**
 * the region is a surface with a border (`Panel`), a summary that links away
 * (`Card`), or has no heading at all, where a `Stack` is the whole answer.
 *
 * The reason it exists is the heading. A section's heading level is a
 * property of where the section sits, and nothing local knows that: nest
 * this inside another and its heading drops a level on its own, so the
 * page's outline is correct by construction rather than by the author
 * remembering. See `src/heading.tsx` for why the two usual answers, a
 * hard-coded level and a `level` prop, both stop working once pages are
 * generated one at a time.
 *
 * It also names the section for assistive technology. A `section` with an
 * accessible name is a landmark a reader can jump to; a `section` without
 * one is a `div` that took up a tag. The heading provides the name through
 * `aria-labelledby`, so the two cannot drift apart.
 *
 * ```tsx
 * <Section title="Delivery windows" description="Per supplier, per region.">
 *   <DataTable columns={columns} rows={rows} />
 * </Section>
 * ```
 *
 * Accessibility: a `section`, which is a `region` landmark once it has an
 * accessible name and a generic container until then. The name comes from
 * the heading through `aria-labelledby`, so the two cannot drift apart —
 * which needs an `id` on the section, and without one the landmark is
 * skipped rather than left unnamed. What the caller still owes: an `id` when
 * the region is worth jumping to, and a `title` that reads as a destination
 * rather than as a label.
 */
export function Section({
  title,
  description,
  actions,
  gap = "lg",
  children,
  className,
  id,
  ...rest
}: SectionProps) {
  /* The context is the level of the heading that *labels the region we are
     in*, not the next free number. A `PageHeader` renders that label — the
     page's h1. A section is a sub-region of it, so its own title is one
     below, and everything inside the section is one below that.

     Read the other way round it produced two h1 elements on any page with a
     PageHeader and a Section, which is how the first version of this shipped
     and what the story below caught. */
  const region = useHeadingLevel();
  const own = nextHeadingLevel(region);
  const headingId = id ? `${id}-title` : undefined;

  return (
    <section
      className={cx("uix-section", className)}
      data-gap={gap}
      id={id}
      aria-labelledby={title && headingId ? headingId : undefined}
      {...rest}
    >
      {title || description || actions ? (
        <div className="uix-section-header">
          <div className="uix-section-headings">
            {title ? (
              <Heading level={own} id={headingId} className="uix-section-title">
                {title}
              </Heading>
            ) : null}
            {description ? (
              <p className="uix-section-description">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="uix-section-actions">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {/* Everything inside is one level deeper, including another Section. */}
      <HeadingLevelProvider level={own}>{children}</HeadingLevelProvider>
    </section>
  );
}
