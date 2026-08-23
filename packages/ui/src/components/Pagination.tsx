import { useState } from "react";
import { Button } from "./Button";

export interface PaginationProps {
  pageCount: number;
  defaultPage?: number;
  onChange?: (page: number) => void;
}

/**
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

  /** Up to five page numbers, edges always visible. */
  const window: number[] = [];
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  for (let p = start; p <= Math.min(pageCount, start + 4); p += 1) {
    window.push(p);
  }

  return (
    <nav className="uix-pagination" aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ‹
      </Button>
      {start > 1 ? (
        <span className="uix-pagination-ellipsis" aria-hidden>
          …
        </span>
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
      {start + 4 < pageCount ? (
        <span className="uix-pagination-ellipsis" aria-hidden>
          …
        </span>
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
