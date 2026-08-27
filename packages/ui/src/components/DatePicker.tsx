"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cx } from "../cx";
import { useStrings } from "../i18n";
import { Field } from "./Field";
import "./_field.css";
import "./DatePicker.css";

/**
 * A calendar date, as `YYYY-MM-DD`.
 *
 * A string and not a `Date`, and this is the single most important decision
 * in the component. A `Date` is an instant on a timeline with a timezone
 * attached; a calendar date is not. `new Date("2026-08-27")` is midnight UTC,
 * which is the 26th in Los Angeles — so a birthday entered in Berlin and
 * read in California is a day early, and the bug appears for some users and
 * not others, months after release. The string has no timezone to be wrong
 * about.
 */
export type IsoDate = string;

interface DatePickerOwnProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  hideLabel?: boolean;
  /** The form field name, so a `Form` can route an error here. */
  name?: string;
  /**
   * The chosen date, or the two ends when `range` is set.
   *
   * `null` for empty; a two-element array for a range, whose second element
   * is `null` while only the first end has been picked. That intermediate
   * state is not an accident of the API — it is what the reader is looking
   * at between two clicks, and a shape that could not express it would force
   * the caller to hold it instead.
   */
  value?: IsoDate | [IsoDate, IsoDate | null] | null;
  defaultValue?: IsoDate | [IsoDate, IsoDate | null] | null;
  onValueChange?: (next: IsoDate | [IsoDate, IsoDate | null] | null) => void;
  /** Pick two ends rather than one day. */
  range?: boolean;
  /**
   * Which locale the calendar is written in.
   *
   * Month and weekday names come from `Intl`, and so does the first day of
   * the week: `de-DE` starts on Monday and `en-US` on Sunday, and that is
   * real locale data rather than a guess this component could make. Defaults
   * to the runtime's own locale, because a component library has no business
   * knowing which locale an application is in — that is the same reasoning
   * as `useStrings`.
   */
  locale?: string;
  /** Nothing before this date can be picked. */
  min?: IsoDate;
  /** Nothing after this date can be picked. */
  max?: IsoDate;
  /** Refuse individual dates — holidays, days already booked. */
  disabledDate?: (date: IsoDate) => boolean;
  disabled?: boolean;
  placeholder?: string;
  /**
   * Whether the calendar is showing.
   *
   * The same triple every other popup here has — `Dialog`, `Menu`,
   * `Popover`, `Drawer` — because the reasons are the same: a tour needs to
   * open one to point at it, and a photographed story needs the open state
   * to exist without a click.
   */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Render one day's cell yourself.
   *
   * The ninth component here with this door, and the one where it earns the
   * most: a price per night, a dot for a booking, a holiday name. The cell's
   * state is handed over because a custom day almost always depends on it,
   * and recomputing "is this the selected day" in the caller is how the cell
   * and the highlight end up disagreeing.
   *
   * The date arrives as the same `YYYY-MM-DD` string the value uses, so a
   * caller never has to build a `Date` to look something up — which is the
   * bug `IsoDate` exists to avoid, and handing back a `Date` here would put
   * it straight back.
   *
   * Named `item` like every other render prop here, so learning it once
   * is learning it everywhere. It was `day` while nothing used it.
   */
  item?: (
    date: IsoDate,
    state: { selected: boolean; outside: boolean; refused: boolean },
  ) => ReactNode;
}

/**
 * **Use it for** picking a day, or two ends of a span. **Reach for something
 * else when** the reader knows the date and there is nothing to browse: a
 * `TextField` with a pattern is faster to type into and far cheaper, and a
 * calendar adds nothing to "enter your date of birth".
 *
 * ```tsx
 * <DatePicker label="Delivery date" locale="de-DE" min="2026-08-27" />
 * ```
 *
 * Accessibility: **a text input with a calendar beside it**, not a calendar
 * alone. Typing is faster than clicking for anybody who already knows the
 * date, and for many people using assistive technology it is the only
 * practical route — a month grid is thirty-five stops to reach one day. The
 * input is the control; the calendar is the enhancement, the same way
 * `FileUpload`'s drop zone sits over a real file input.
 *
 * The grid is `role="grid"` with `gridcell` days and one tab stop: arrows
 * move by a day, PageUp and PageDown by a month, Home and End to the ends of
 * the week. Moving the focused day is what changes the month, so a reader
 * never has to find the paging buttons to keep going.
 *
 * The month is announced when it changes, through a `role="status"`. Paging a
 * calendar replaces every cell under the reader without moving focus out of
 * the grid, which is a change nothing else would report.
 *
 * Dates are `YYYY-MM-DD` strings. See `IsoDate`: a `Date` is an instant with
 * a timezone and a calendar date is not, which is the bug this avoids.
 */
export type DatePickerProps = DatePickerOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof DatePickerOwnProps | "children">;

/* ------------------------------------------------------------- arithmetic */

/** `YYYY-MM-DD` for a UTC-based date, which is how every date here is held. */
function iso(year: number, month: number, day: number): IsoDate {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/** Parse `YYYY-MM-DD` into its three numbers, or null. */
function parse(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  /* Round-tripped rather than range-checked. `2026-02-31` passes every
     bound and is not a date; building it and asking what came back is the
     only check that knows how long February is. */
  const probe = new Date(Date.UTC(y, m, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

/** Add days to an ISO date, in UTC so no local timezone can shift it. */
function shift(value: IsoDate, days: number): IsoDate {
  const parts = parse(value);
  if (!parts) return value;
  const at = new Date(Date.UTC(parts.y, parts.m, parts.d + days));
  return iso(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate());
}

/**
 * Add months, clamping the day to the target month's length.
 *
 * 31 January plus a month is 28 February, and the clamp is **sticky**: from
 * there another month forward is 28 March, not the 31st. The alternative is
 * to remember the day somebody originally wanted and restore it where the
 * month is long enough, and that is hidden state which surprises people in a
 * different way — pressing PageDown twice and PageUp twice would not return
 * you to where you started. A cursor that is only ever a date is the smaller
 * promise, and `browser/keyboard.spec.ts` pins it.
 */
function shiftMonth(value: IsoDate, months: number): IsoDate {
  const parts = parse(value);
  if (!parts) return value;
  const target = new Date(Date.UTC(parts.y, parts.m + months, 1));
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return iso(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    Math.min(parts.d, last),
  );
}

/**
 * The first day of the week for a locale, from `Intl`.
 *
 * Real data rather than a default: `de-DE` starts on Monday and `en-US` on
 * Sunday, and a component that picked one would be wrong in half the world.
 * `getWeekInfo` returns 1–7 with 7 for Sunday; `Date.getUTCDay` uses 0 for
 * Sunday, so the 7 becomes 0. Falls back to Monday, the ISO week start, when
 * the runtime has no week info.
 */
function firstWeekday(locale: string): number {
  try {
    const info = (
      new Intl.Locale(locale) as Intl.Locale & {
        getWeekInfo?: () => { firstDay: number };
      }
    ).getWeekInfo?.();
    if (info) return info.firstDay % 7;
  } catch {
    /* An unparseable locale tag is the caller's problem to see elsewhere;
       here it means "use the ISO week". */
  }
  return 1;
}

export function DatePicker({
  label,
  hint,
  error,
  required,
  hideLabel,
  name,
  value,
  defaultValue = null,
  onValueChange,
  range = false,
  locale,
  min,
  max,
  disabledDate,
  disabled,
  placeholder,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  item: renderDay,
  className,
  ...rest
}: DatePickerProps) {
  const strings = useStrings();
  const gridId = useId();
  const resolvedLocale =
    locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;

  const [internal, setInternal] = useState(defaultValue);
  const current = value !== undefined ? value : internal;

  const ends = useMemo<[IsoDate | null, IsoDate | null]>(() => {
    if (current === null) return [null, null];
    if (Array.isArray(current)) return [current[0], current[1]];
    return [current, null];
  }, [current]);

  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = useCallback(
    (next: boolean | ((was: boolean) => boolean)) => {
      const resolved = typeof next === "function" ? next(open) : next;
      if (openProp === undefined) setInternalOpen(resolved);
      onOpenChange?.(resolved);
    },
    [open, openProp, onOpenChange],
  );
  const [text, setText] = useState("");
  /** The day the grid's single tab stop is on. Not the same as the choice. */
  const [cursor, setCursor] = useState<IsoDate>(
    () =>
      ends[0] ?? iso(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
  );
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  const commit = useCallback(
    (next: IsoDate | [IsoDate, IsoDate | null] | null) => {
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [value, onValueChange],
  );

  const refused = useCallback(
    (date: IsoDate) =>
      (min !== undefined && date < min) ||
      (max !== undefined && date > max) ||
      Boolean(disabledDate?.(date)),
    /* String comparison is correct for `YYYY-MM-DD` and only for that
       format: it is fixed-width and most-significant-first, so
       lexicographic order is chronological order. */
    [min, max, disabledDate],
  );

  const choose = useCallback(
    (date: IsoDate) => {
      if (refused(date)) return;
      if (!range) {
        commit(date);
        setOpen(false);
        setText("");
        return;
      }
      const [from, to] = ends;
      if (!from || to || date < from) {
        /* Starting over: no first end yet, both ends already set, or a click
           before the start. The last case is the one people do by accident,
           and treating it as a new start is kinder than refusing it. */
        commit([date, null]);
        return;
      }
      commit([from, date]);
      setOpen(false);
    },
    [refused, range, ends, commit, setOpen],
  );

  /* Close on a click outside. Not on blur: clicking a day blurs the input on
     the way, and closing there would cancel the click. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, setOpen]);

  const cursorParts = parse(cursor) ?? { y: 2026, m: 0, d: 1 };
  /* Memoised on its two numbers, not built inline. A fresh `Date` every
     render is a new dependency every render, so the two memos below never
     memoised anything — the lint said so and it was right: this component
     re-derives a month name and forty-two cells on every keystroke in the
     text field otherwise. */
  const monthStart = useMemo(
    () => new Date(Date.UTC(cursorParts.y, cursorParts.m, 1)),
    [cursorParts.y, cursorParts.m],
  );
  const monthName = useMemo(
    () =>
      new Intl.DateTimeFormat(resolvedLocale, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(monthStart),
    [resolvedLocale, monthStart],
  );

  const weekStart = firstWeekday(resolvedLocale);

  /** The weekday headings, starting on the locale's own first day. */
  const weekdays = useMemo(() => {
    const format = new Intl.DateTimeFormat(resolvedLocale, {
      weekday: "short",
      timeZone: "UTC",
    });
    const long = new Intl.DateTimeFormat(resolvedLocale, {
      weekday: "long",
      timeZone: "UTC",
    });
    /* 2024-01-07 was a Sunday, so adding the index walks the week from
       Sunday and the offset rotates it to the locale's start. */
    return Array.from({ length: 7 }, (_, index) => {
      const at = new Date(Date.UTC(2024, 0, 7 + ((weekStart + index) % 7)));
      return { short: format.format(at), long: long.format(at) };
    });
  }, [resolvedLocale, weekStart]);

  /** Six weeks of days, so the grid never changes height between months. */
  const weeks = useMemo(() => {
    const lead = (monthStart.getUTCDay() - weekStart + 7) % 7;
    const first = new Date(Date.UTC(cursorParts.y, cursorParts.m, 1 - lead));
    return Array.from({ length: 6 }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => {
        const at = new Date(
          Date.UTC(
            first.getUTCFullYear(),
            first.getUTCMonth(),
            first.getUTCDate() + week * 7 + day,
          ),
        );
        return {
          date: iso(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()),
          outside: at.getUTCMonth() !== cursorParts.m,
          day: at.getUTCDate(),
        };
      }),
    );
  }, [monthStart, weekStart, cursorParts.y, cursorParts.m]);

  const onGridKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const moves: Record<string, number> = {
        ArrowRight: 1,
        ArrowLeft: -1,
        ArrowDown: 7,
        ArrowUp: -7,
      };
      if (event.key in moves) {
        event.preventDefault();
        setCursor((at) => shift(at, moves[event.key]!));
      } else if (event.key === "PageDown") {
        event.preventDefault();
        setCursor((at) => shiftMonth(at, event.shiftKey ? 12 : 1));
      } else if (event.key === "PageUp") {
        event.preventDefault();
        setCursor((at) => shiftMonth(at, event.shiftKey ? -12 : -1));
      } else if (event.key === "Home") {
        event.preventDefault();
        setCursor((at) => {
          const parts = parse(at);
          if (!parts) return at;
          const weekday = new Date(
            Date.UTC(parts.y, parts.m, parts.d),
          ).getUTCDay();
          return shift(at, -((weekday - weekStart + 7) % 7));
        });
      } else if (event.key === "End") {
        event.preventDefault();
        setCursor((at) => {
          const parts = parse(at);
          if (!parts) return at;
          const weekday = new Date(
            Date.UTC(parts.y, parts.m, parts.d),
          ).getUTCDay();
          return shift(at, 6 - ((weekday - weekStart + 7) % 7));
        });
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose(cursor);
      } else if (event.key === "Escape") {
        /* Stopped as well as prevented: a date picker inside a dialog must
           not close the dialog because somebody dismissed a calendar. */
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    },
    [weekStart, choose, cursor, setOpen],
  );

  /* Keep the keyboard on the cursor as it moves, including across a month
     boundary where the cell is a different element. */
  useEffect(() => {
    if (!open) return;
    grid.current
      ?.querySelector<HTMLElement>(`[data-date="${cursor}"]`)
      ?.focus();
  }, [open, cursor]);

  const selected = (date: IsoDate) => date === ends[0] || date === ends[1];
  const between = (date: IsoDate) =>
    Boolean(ends[0] && ends[1] && date > ends[0] && date < ends[1]);

  const display = range
    ? [ends[0], ends[1]].filter(Boolean).join(" – ")
    : (ends[0] ?? "");

  /* eslint-disable jsx-a11y/interactive-supports-focus, jsx-a11y/click-events-have-key-events --
     The same pair as `Tree.tsx`, for the same two reasons, and this is the
     fourth component to need the first of them — `Tree`, `CommandPalette`,
     `Combobox` and now this. They stay per file rather than moving to the
     config because the rule has no option that exempts a role: its
     `tabbable` list makes roles stricter, so switching it off for `grid`
     means switching it off for every component, and then a genuinely
     unreachable control would pass. Four named exceptions beat one blanket
     one.

     `interactive-supports-focus` wants the element carrying `role="grid"`
     focusable. It must not be: the grid has a roving tabindex on its cells,
     so exactly one *day* is focusable at a time. A focusable grid would be
     an extra tab stop in front of a control whose whole point is that
     reaching one day costs one stop rather than thirty-five.

     `click-events-have-key-events` wants a keyboard listener beside each
     cell's click handler. The listener is on the grid, because every key it
     handles is date arithmetic over the cursor and the locale's week start —
     forty-two cells cannot each hold that. The keys are covered in
     `browser/keyboard.spec.ts`. */
  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={cx("uix-datepicker-field", className)}
      /* `aria`, because the label names the whole control and the grid needs
         a name of its own that is not the input's. */
      nameBy="aria"
    >
      {({ control, invalid }) => (
        <div
          className="uix-datepicker"
          ref={root}
          data-invalid={invalid}
          {...rest}
        >
          <div className="uix-datepicker-row">
            <input
              {...control}
              type="text"
              className="uix-datepicker-input"
              inputMode="numeric"
              autoComplete="off"
              placeholder={placeholder ?? "YYYY-MM-DD"}
              disabled={disabled}
              value={text || display}
              onChange={(event) => {
                setText(event.target.value);
                const parsed = parse(event.target.value);
                if (parsed && !refused(event.target.value.trim())) {
                  const date = event.target.value.trim();
                  setCursor(date);
                  if (!range) commit(date);
                }
              }}
              onBlur={() => setText("")}
            />
            <button
              type="button"
              className="uix-datepicker-toggle"
              aria-label={strings.openCalendar}
              aria-expanded={open}
              aria-controls={gridId}
              disabled={disabled}
              onClick={() => setOpen((was) => !was)}
            >
              <CalendarDays size={16} aria-hidden />
            </button>
          </div>

          {/* Present whether open or not, so `aria-controls` always resolves;
              hidden with `display: none` so its cells leave the
              accessibility tree while it is closed. */}
          <div
            className="uix-datepicker-calendar"
            id={gridId}
            data-open={open || undefined}
          >
            <div className="uix-datepicker-header">
              <button
                type="button"
                className="uix-datepicker-page"
                aria-label={strings.previousMonth}
                onClick={() => setCursor((at) => shiftMonth(at, -1))}
              >
                <ChevronLeft size={16} aria-hidden />
              </button>
              {/* aria-hidden: the same words are the grid's accessible name,
                  and announcing them twice is what makes a calendar verbose. */}
              <div className="uix-datepicker-month" aria-hidden>
                {monthName}
              </div>
              <button
                type="button"
                className="uix-datepicker-page"
                aria-label={strings.nextMonth}
                onClick={() => setCursor((at) => shiftMonth(at, 1))}
              >
                <ChevronRight size={16} aria-hidden />
              </button>
            </div>

            <div
              className="uix-datepicker-grid"
              role="grid"
              aria-label={monthName}
              ref={grid}
              onKeyDown={onGridKeyDown}
            >
              <div className="uix-datepicker-week" role="row">
                {weekdays.map((weekday) => (
                  <div
                    key={weekday.long}
                    role="columnheader"
                    className="uix-datepicker-weekday"
                  >
                    {/* Short shown, long announced — "Mo" is unreadable
                        aloud and a full name in a seven-column grid is
                        unreadable on screen.

                        Two spans rather than an `aria-label`, which was the
                        first attempt: hiding the only text and naming the
                        cell left a header with no content, and axe rejects
                        that as `empty-table-header`. It is right to — a
                        column header whose text lives in an attribute is
                        invisible to anything reading the document rather
                        than the accessibility tree. */}
                    <span aria-hidden>{weekday.short}</span>
                    <span className="uix-visually-hidden">{weekday.long}</span>
                  </div>
                ))}
              </div>
              {weeks.map((week) => (
                <div
                  key={week[0]!.date}
                  className="uix-datepicker-week"
                  role="row"
                >
                  {week.map((cell) => (
                    <div
                      key={cell.date}
                      role="gridcell"
                      className="uix-datepicker-day"
                      data-date={cell.date}
                      data-outside={cell.outside || undefined}
                      data-selected={selected(cell.date) || undefined}
                      data-between={between(cell.date) || undefined}
                      data-refused={refused(cell.date) || undefined}
                      aria-selected={selected(cell.date)}
                      aria-disabled={refused(cell.date) || undefined}
                      /* One tab stop for the grid, on the cursor. Thirty-five
                         stops to reach one day is the reason this pattern
                         needs a roving tabindex. */
                      tabIndex={cell.date === cursor ? 0 : -1}
                      onClick={() => choose(cell.date)}
                    >
                      {renderDay
                        ? renderDay(cell.date, {
                            selected: selected(cell.date),
                            outside: cell.outside,
                            refused: refused(cell.date),
                          })
                        : cell.day}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* The month, when it changes. Paging replaces every cell under the
              reader without moving focus out of the grid. */}
          <div role="status" className="uix-visually-hidden">
            {open ? monthName : ""}
          </div>
        </div>
      )}
    </Field>
  );
}
/* eslint-enable jsx-a11y/interactive-supports-focus, jsx-a11y/click-events-have-key-events */
