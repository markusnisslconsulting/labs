"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
  type UIEvent,
} from "react";

import { cx } from "../cx";
import { useStrings } from "../i18n";
import "./DataTable.css";

/**
 * The sort a table is showing, or none.
 *
 * `null` rather than an optional key, because "unsorted" is a state a
 * caller has to be able to send back — a filter change that invalidates
 * the current order has to be expressible.
 */
export interface DataTableSort {
  key: string;
  direction: "ascending" | "descending";
}

/**
 * One column, as data.
 *
 * This is the whole difference from `Table`, which takes markup. A column
 * described as data can be sorted, measured, aligned and counted by the
 * component; a `<th>` a caller wrote can only be displayed.
 */
export interface DataColumn<Row> {
  /**
   * Stable identifier, and the sort key reported to `onSortChange`.
   *
   * Not the header text. A header is a node and can be translated; a sort
   * key travels to a server and must not change when a word does.
   */
  key: string;
  /** What the column is called. */
  header: ReactNode;
  /**
   * What the cell shows. Defaults to the row's own `key` property, read as
   * a string, which covers the flat-record case without ceremony.
   */
  cell?: (row: Row) => ReactNode;
  /**
   * How to order this column. **Its presence is what makes the column
   * sortable** — there is no separate `sortable` flag, because a column
   * marked sortable with no way to compare it is a control that does
   * nothing, and the type should make that unsayable.
   *
   * Ascending order. The component reverses it for descending rather than
   * asking for two functions.
   *
   * Omit it and pass `onSortChange` to sort on a server: the header still
   * becomes a button and still reports, and the component leaves the rows
   * in the order they arrived.
   */
  compare?: (a: Row, b: Row) => number;
  /**
   * A CSS width. Applied through a `<col>`, so the browser lays the table
   * out from the declared widths instead of measuring the content — which
   * is what stops columns jumping when the rows change.
   */
  width?: string;
  /**
   * A column of numbers. Aligns to the inline end and uses figures of one
   * width, so values line up under each other and can be compared down
   * the column.
   *
   * Marked, not guessed. "Looks like a number" is not something the
   * component can know, and a postcode is not a quantity.
   */
  numeric?: boolean;
}

interface DataTableOwnProps<Row> {
  /**
   * The table's accessible name. Required, unlike on `Table`.
   *
   * `Table` allows a caption-less table because its content is a caller's
   * markup and it cannot know whether a heading above it already names the
   * thing. This component owns a scroll region, a sort control per column
   * and possibly a selection column; every one of those announces itself
   * relative to a table, and an unnamed table makes all of them vaguer.
   */
  caption: ReactNode;
  columns: Array<DataColumn<Row>>;
  rows: Row[];
  /**
   * A stable identity per row. Used as the React key and as the selection
   * identity, so a selection survives sorting and paging.
   *
   * Required rather than defaulting to the array index, because an index
   * changes when the sort does — selecting row 3 and then sorting would
   * silently move the selection to a different record.
   */
  rowKey: (row: Row) => string;
  /**
   * What a row is called, for the accessible name of its selection
   * checkbox. Defaults to `rowKey`, which is honest and rarely helpful.
   */
  rowLabel?: (row: Row) => string;
  sort?: DataTableSort | null;
  defaultSort?: DataTableSort | null;
  onSortChange?: (next: DataTableSort | null) => void;
  /** Turn on the selection column. */
  selectable?: boolean;
  selected?: string[];
  defaultSelected?: string[];
  onSelectedChange?: (next: string[]) => void;
  /** Keep the header visible while the body scrolls. */
  stickyHeader?: boolean;
  /**
   * Row height in pixels. **Setting it turns on virtualisation**, and
   * nothing else does.
   *
   * Windowing needs to know how tall a row is before rendering it, so a
   * fixed height is not a limitation that could be lifted with more work:
   * it is the premise. Making it the switch means the constraint and the
   * feature cannot be separated by accident, and a caller cannot ask for
   * virtual rows and variable heights in the same breath.
   */
  rowHeight?: number;
  /** The scroll viewport's height. Only meaningful when virtualising. */
  height?: number;
  /** Shown instead of the body when there are no rows. */
  empty?: ReactNode;
}

/**
 * **Use it for** a set of records compared across the same columns, where
 * the reader sorts, selects or scrolls through more of them than fit.
 * **Reach for something else when** the markup is the point and there is
 * nothing to sort — `Table` styles a table you wrote and stays out of the
 * way.
 *
 * ```tsx
 * <DataTable
 *   caption="Suppliers"
 *   rows={suppliers}
 *   rowKey={(row) => row.id}
 *   rowLabel={(row) => row.name}
 *   selectable
 *   columns={[
 *     { key: "name", header: "Name", compare: (a, b) => a.name.localeCompare(b.name) },
 *     { key: "units", header: "Units", numeric: true, compare: (a, b) => a.units - b.units },
 *   ]}
 * />
 * ```
 *
 * Accessibility: the header cells carry `aria-sort`, which is how a screen
 * reader says a column is ordered and in which direction — the arrow is
 * for the eye and announces nothing. Each sortable header is a real
 * `<button>` inside its `<th>`, so it is reachable and operable with the
 * keys the platform already gives a button. The scroll viewport is
 * focusable with a name, because `overflow` makes a region only a pointer
 * can reach.
 *
 * When virtualising, the table reports `aria-rowcount` for the whole set
 * and each rendered row its true `aria-rowindex`, so a reader says "row
 * 4,312 of 50,000" rather than "row 12 of 24". Without those two
 * attributes a virtualised table lies about its size to everyone who
 * cannot see the scrollbar, which is why they are not optional here.
 */
export type DataTableProps<Row> = DataTableOwnProps<Row> &
  Omit<ComponentPropsWithRef<"div">, keyof DataTableOwnProps<Row> | "children">;

/** How many rows to render outside the viewport, above and below. */
const OVERSCAN = 4;

export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  rowLabel,
  sort,
  defaultSort = null,
  onSortChange,
  selectable = false,
  selected,
  defaultSelected = [],
  onSelectedChange,
  stickyHeader = false,
  rowHeight,
  height,
  empty,
  className,
  ...rest
}: DataTableProps<Row>) {
  const strings = useStrings();

  const [internalSort, setInternalSort] = useState<DataTableSort | null>(
    defaultSort,
  );
  const activeSort = sort !== undefined ? sort : internalSort;

  const [internalSelected, setInternalSelected] =
    useState<string[]>(defaultSelected);
  const activeSelected = selected ?? internalSelected;
  const selectedSet = useMemo(() => new Set(activeSelected), [activeSelected]);

  /* Sorted here only when the column says how. A column with no
     `compare` and an `onSortChange` is a server-sorted column: the header
     reports the request and the rows arrive already ordered, so reordering
     them locally would fight the answer. */
  const ordered = useMemo(() => {
    if (!activeSort) return rows;
    const column = columns.find((entry) => entry.key === activeSort.key);
    if (!column?.compare) return rows;
    const compare = column.compare;
    const sign = activeSort.direction === "ascending" ? 1 : -1;
    return [...rows].sort((a, b) => sign * compare(a, b));
  }, [rows, columns, activeSort]);

  const applySort = useCallback(
    (key: string) => {
      const next: DataTableSort | null =
        activeSort?.key !== key
          ? { key, direction: "ascending" }
          : activeSort.direction === "ascending"
            ? { key, direction: "descending" }
            : /* Third press clears it. A two-state toggle leaves no way
                 back to the order the data arrived in, which for a table
                 fed by a query is the meaningful one. */
              null;
      if (sort === undefined) setInternalSort(next);
      onSortChange?.(next);
    },
    [activeSort, sort, onSortChange],
  );

  const applySelected = useCallback(
    (next: string[]) => {
      if (selected === undefined) setInternalSelected(next);
      onSelectedChange?.(next);
    },
    [selected, onSelectedChange],
  );

  /* ------------------------------------------------------ virtualisation */

  const [scrollTop, setScrollTop] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const virtual = rowHeight !== undefined && height !== undefined;

  const window = useMemo(() => {
    if (!virtual) return { start: 0, end: ordered.length, before: 0, after: 0 };
    const visible = Math.ceil(height / rowHeight);
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
    const end = Math.min(ordered.length, start + visible + OVERSCAN * 2);
    return {
      start,
      end,
      before: start * rowHeight,
      after: (ordered.length - end) * rowHeight,
    };
  }, [virtual, height, rowHeight, scrollTop, ordered.length]);

  const onScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (virtual) setScrollTop(event.currentTarget.scrollTop);
    },
    [virtual],
  );

  const visibleRows = virtual
    ? ordered.slice(window.start, window.end)
    : ordered;

  /* ------------------------------------------------------------ selection */

  const allKeys = useMemo(() => ordered.map(rowKey), [ordered, rowKey]);
  const selectedHere = allKeys.filter((key) => selectedSet.has(key)).length;
  const allSelected = allKeys.length > 0 && selectedHere === allKeys.length;
  const someSelected = selectedHere > 0 && !allSelected;

  const columnCount = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cx("uix-datatable", className)} {...rest}>
      <div
        className="uix-datatable-viewport"
        data-sticky={stickyHeader || undefined}
        /* Focusable with a name, for the same reason as `Table`: overflow
           creates a region a pointer can scroll and a keyboard cannot
           reach at all. WCAG 2.1.1 in its plainest form. */
        tabIndex={0}
        role="region"
        aria-label={typeof caption === "string" ? caption : undefined}
        ref={viewport}
        onScroll={onScroll}
        style={virtual ? { height, overflowY: "auto" } : undefined}
      >
        <table
          className="uix-datatable-table"
          /* The truth about size, for everyone who cannot see the
             scrollbar. Without these a virtualised table announces the
             length of its window. */
          aria-rowcount={virtual ? ordered.length + 1 : undefined}
        >
          <caption className="uix-visually-hidden">{caption}</caption>
          <colgroup>
            {selectable ? <col style={{ width: "3rem" }} /> : null}
            {columns.map((column) => (
              <col key={column.key} style={{ width: column.width }} />
            ))}
          </colgroup>
          <thead>
            <tr aria-rowindex={virtual ? 1 : undefined}>
              {selectable ? (
                <th scope="col" className="uix-datatable-select">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(node) => {
                      /* Indeterminate is not an attribute, so it cannot be
                         set in JSX. A partially selected header checkbox
                         showing as unchecked tells a reader the opposite
                         of the truth. */
                      if (node) node.indeterminate = someSelected;
                    }}
                    aria-label={strings.selectAllRows}
                    onChange={(event) =>
                      applySelected(event.target.checked ? allKeys : [])
                    }
                  />
                </th>
              ) : null}
              {columns.map((column) => {
                const active = activeSort?.key === column.key;
                const sortable = Boolean(column.compare || onSortChange);
                return (
                  <th
                    key={column.key}
                    scope="col"
                    data-numeric={column.numeric || undefined}
                    /* The direction, for a screen reader. The arrow below
                       is for the eye and announces nothing. */
                    aria-sort={
                      !sortable
                        ? undefined
                        : active
                          ? activeSort.direction
                          : "none"
                    }
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className="uix-datatable-sort"
                        onClick={() => applySort(column.key)}
                      >
                        {column.header}
                        <span className="uix-datatable-arrow" aria-hidden>
                          {active
                            ? activeSort.direction === "ascending"
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ordered.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="uix-datatable-empty">
                  {empty}
                </td>
              </tr>
            ) : null}

            {/* Spacers, so the scrollbar reflects the whole set while only
                the window is in the DOM. Hidden from the accessibility
                tree, which is safe here for one specific reason: the
                counts a reader announces come from `aria-rowcount` and
                each row's `aria-rowindex`, not from counting `<tr>`
                elements. Without those two attributes, hiding rows would
                make the table understate its own size. */}
            {window.before > 0 ? (
              <tr aria-hidden style={{ height: window.before }}>
                <td colSpan={columnCount} />
              </tr>
            ) : null}

            {visibleRows.map((row, index) => {
              const key = rowKey(row);
              const isSelected = selectedSet.has(key);
              return (
                <tr
                  key={key}
                  data-selected={isSelected || undefined}
                  /* Its place in the whole set, not in the window. Plus
                     two: one-based, and the header occupies row 1. */
                  aria-rowindex={virtual ? window.start + index + 2 : undefined}
                >
                  {selectable ? (
                    <td className="uix-datatable-select">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        aria-label={strings.selectRow(
                          rowLabel ? rowLabel(row) : key,
                        )}
                        onChange={(event) =>
                          applySelected(
                            event.target.checked
                              ? [...activeSelected, key]
                              : activeSelected.filter((entry) => entry !== key),
                          )
                        }
                      />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      data-numeric={column.numeric || undefined}
                    >
                      {column.cell
                        ? column.cell(row)
                        : String((row as Record<string, unknown>)[column.key])}
                    </td>
                  ))}
                </tr>
              );
            })}

            {window.after > 0 ? (
              <tr aria-hidden style={{ height: window.after }}>
                <td colSpan={columnCount} />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* The count, for a reader who cannot see the checkboxes at once.
          A `status` and not an `alert`: it is the answer to "how many did
          I pick", not an interruption. Rendered only while something is
          selected, so it says nothing on load. */}
      {selectable ? (
        <div role="status" className="uix-datatable-status">
          {selectedHere > 0 ? strings.rowsSelected(selectedHere) : null}
        </div>
      ) : null}
    </div>
  );
}
