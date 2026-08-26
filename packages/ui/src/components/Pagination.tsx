"use client";

import type { ComponentPropsWithRef } from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "./Button";

import { cx } from "../cx";
import { useStrings } from "../i18n";
import "./Pagination.css";
interface PaginationOwnProps {
  pageCount: number;
  /**
   * The controlled page. It was missing entirely: Pagination had
   * `defaultPage` and `onChange` and no way to be driven, so a page
   * number held in a URL could not be pushed back into the control.
   */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /**
   * The landmark's accessible name, overriding the locale default.
   *
   * Needed because two paginations on one page is normal — above and
   * below a long table — and two navigation landmarks with the same name
   * is an accessibility failure (axe's landmark-unique). The strings table
   * can only supply one name for the whole application, so the second
   * instance has to be able to say "Results, bottom".
   */
  label?: string;
}

/**
 * Accepts every attribute of `<nav>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type PaginationProps = PaginationOwnProps &
  Omit<ComponentPropsWithRef<"nav">, keyof PaginationOwnProps>;

/**
 * **Use it for** moving through pages a reader may want to return to. **Reach for something else when** the list is an endless feed (load more).
 *
 * Numeric pagination with a sliding window.
 *
 * Accessibility: one `nav` labelled "Pagination"; the current page is
 * a button with `aria-current="page"`; prev/next carry accessible
 * names that survive translation because they are plain text here.
 *
 * Performance: one component-level state, handlers created per render
 * of a small tree — interaction cost is a single list re-render.
 */
export function Pagination({
  pageCount,
  page: controlledPage,
  defaultPage = 1,
  onPageChange,
  label,
  className,
  ...rest
}: PaginationProps) {
  const labels = useStrings();
  const isControlled = controlledPage !== undefined;
  const [uncontrolled, setUncontrolled] = useState(Math.max(defaultPage, 1));

  // A page count below one is not a pagination. Clamping here rather than
  // asking every caller to, because the caller is usually passing
  // Math.ceil(matches / perPage) and matches is often zero.
  const total = Math.max(1, Math.floor(pageCount) || 1);
  const page = isControlled
    ? Math.min(Math.max(controlledPage, 1), total)
    : Math.min(uncontrolled, total);

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 1), total);
    if (clamped === page) return;
    if (!isControlled) setUncontrolled(clamped);
    onPageChange?.(clamped);
  };

  /*
   * One list, deduplicated by construction, with gaps marked.
   *
   * The previous version computed a sliding window and then decided
   * separately whether to prepend page 1 and append the last page. At
   * pageCount 1 both of those fired and it rendered page 1 twice: two
   * buttons with the same accessible name, both carrying
   * aria-current="page", and two React children with the same key. At
   * pageCount 0 it rendered a button labelled "Page 0".
   *
   * A single-page result set is not an edge case, it is what a filter
   * returns most afternoons.
   *
   * A Set cannot contain page 1 twice, so the bug is not expressible
   * here; the ellipsis is derived from the gaps afterwards rather than
   * decided in parallel with the window.
   */
  const shown = [
    ...new Set(
      [1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total),
    ),
  ].sort((a, b) => a - b);

  const slots: Array<number | "gap"> = [];
  shown.forEach((p, index) => {
    const previous = shown[index - 1];
    if (previous !== undefined && p - previous > 1) slots.push("gap");
    slots.push(p);
  });

  return (
    <nav
      className={cx("uix-pagination", className)}
      aria-label={label ?? labels.pagination}
      {...rest}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label={labels.previousPage}
      >
        <ChevronLeft size={16} aria-hidden />
      </Button>
      {slots.map((slot, index) =>
        slot === "gap" ? (
          <span
            key={`gap-${index}`}
            className="uix-pagination-ellipsis"
            aria-hidden
          >
            …
          </span>
        ) : slot === page ? (
          <Button
            key={slot}
            variant="solid"
            tone="neutral"
            size="sm"
            aria-current="page"
            aria-label={labels.page(slot)}
            className="uix-pagination-page"
          >
            {slot}
          </Button>
        ) : (
          <Button
            key={slot}
            variant="outline"
            size="sm"
            onClick={() => go(slot)}
            aria-label={labels.page(slot)}
            className="uix-pagination-page"
          >
            {slot}
          </Button>
        ),
      )}
      {/* Not aria-hidden: in the narrow form the numbered buttons are
          display:none and leave the accessibility tree with aria-current,
          so this sentence becomes the only statement of where you are. */}
      <span className="uix-pagination-summary">
        Page {page} of {total}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => go(page + 1)}
        disabled={page === total}
        aria-label={labels.nextPage}
      >
        <ChevronRight size={16} aria-hidden />
      </Button>
    </nav>
  );
}
