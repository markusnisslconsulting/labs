import type { ComponentPropsWithoutRef } from "react";
import { useState } from "react";
import { Button } from "./Button";

import { cx } from "../cx";
import "./Pagination.css";
interface PaginationOwnProps {
  pageCount: number;
  defaultPage?: number;
  onChange?: (page: number) => void;
}

/**
 * Accepts every attribute of `<nav>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type PaginationProps = PaginationOwnProps &
  Omit<ComponentPropsWithoutRef<"nav">, keyof PaginationOwnProps>;

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
  defaultPage = 1,
  onChange,
  className,
  ...rest
}: PaginationProps) {
  const [page, setPage] = useState(
    Math.min(Math.max(defaultPage, 1), pageCount),
  );

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 1), pageCount);
    if (clamped !== page) {
      setPage(clamped);
      onChange?.(clamped);
    }
  };

  /** Sliding window; erste und letzte Seite bleiben sichtbar. */
  const window: number[] = [];
  const start = Math.max(2, Math.min(page - 1, pageCount - 2));
  const end = Math.min(pageCount - 1, Math.max(page + 1, 3));
  for (let p = start; p <= end; p += 1) {
    window.push(p);
  }
  const showLeadingEllipsis = start > 2;
  const showTrailingEllipsis = end < pageCount - 1;

  return (
    <nav
      className={cx("uix-pagination", className)}
      aria-label="Pagination"
      {...rest}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ‹
      </Button>
      {window[0] !== 1 ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => go(1)}
            aria-label="Page 1"
          >
            1
          </Button>
          {showLeadingEllipsis ? (
            <span className="uix-pagination-ellipsis" aria-hidden>
              …
            </span>
          ) : null}
        </>
      ) : null}
      {window.map((p) =>
        p === page ? (
          <Button
            key={p}
            variant="solid"
            tone="neutral"
            size="sm"
            aria-current="page"
            aria-label={`Page ${p}`}
          >
            {p}
          </Button>
        ) : (
          <Button
            key={p}
            variant="outline"
            size="sm"
            onClick={() => go(p)}
            aria-label={`Page ${p}`}
          >
            {p}
          </Button>
        ),
      )}
      {showTrailingEllipsis ? (
        <span className="uix-pagination-ellipsis" aria-hidden>
          …
        </span>
      ) : null}
      {window.at(-1) !== pageCount ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(pageCount)}
          aria-label={`Page ${pageCount}`}
        >
          {pageCount}
        </Button>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        onClick={() => go(page + 1)}
        disabled={page === pageCount}
        aria-label="Next page"
      >
        ›
      </Button>
    </nav>
  );
}
