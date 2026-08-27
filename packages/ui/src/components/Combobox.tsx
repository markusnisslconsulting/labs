"use client";

import { Check, ChevronDown, X } from "lucide-react";
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
import "./Combobox.css";

export interface ComboboxOption {
  value: string;
  /** What to show. Defaults to the value, which is right for a plain list. */
  label?: ReactNode;
  /** A group heading. Options sharing one are shown together, in order. */
  section?: string;
  disabled?: boolean;
}

interface ComboboxOwnProps {
  /**
   * The form field name.
   *
   * Declared because this component's rest props land on the wrapper rather
   * than on the input, so a `name` arriving through them would sit on a div.
   * `Field` also uses it to find this field's error inside a `Form`.
   */
  name?: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  hideLabel?: boolean;
  /**
   * The options, as strings or as descriptors.
   *
   * Strings for the common case; descriptors when an option needs a
   * different label from its value, a group heading, or to be shown and
   * refused.
   */
  options?: Array<ComboboxOption | string>;
  /**
   * The chosen value, or values when `multiple` is set.
   *
   * One prop with a union rather than two components, and the trade-off is
   * deliberate: a caller who sets `multiple` handles an array, and everyone
   * else never sees one. Two components would double the surface for a
   * difference of one flag, and a single always-array API would make the
   * common case carry the uncommon one's shape.
   */
  value?: string | string[] | null;
  defaultValue?: string | string[] | null;
  onValueChange?: (next: string | string[] | null) => void;
  /** Allow more than one. `value` is then an array. */
  multiple?: boolean;
  /**
   * Called as the reader types, for a list that comes from a server.
   *
   * Its presence turns local filtering **off**: a component that both asked
   * for results and then filtered them would hide rows a server deliberately
   * returned, and the reader would have no way to tell which was happening.
   */
  onQueryChange?: (query: string) => void;
  /** Results are on their way. Announced, not just spun. */
  loading?: boolean;
  /**
   * Which options match what has been typed.
   *
   * Defaults to a case-insensitive substring over the label text, the value
   * and the section. Ignored entirely when `onQueryChange` is given.
   */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /**
   * Render one option yourself.
   *
   * Named `item` like every other render prop here, so learning it once
   * is learning it everywhere. It was `option` while nothing used it.
   */
  item?: (entry: ComboboxOption, state: { selected: boolean }) => ReactNode;
  placeholder?: string;
  disabled?: boolean;
  /** Shown when nothing matches. */
  empty?: ReactNode;
}

/**
 * **Use it for** choosing from a list too long to scan, where the list may
 * come from a server, hold more than one answer, or need rows that are not
 * just text. **Reach for something else when** the list is short and fixed:
 * that is `Select`, and it costs a fraction of this and comes with the
 * operating system's own picker.
 *
 * ```tsx
 * <Combobox
 *   label="Supplier"
 *   options={suppliers}
 *   onQueryChange={search}
 *   loading={searching}
 * />
 * ```
 *
 * Accessibility: a `combobox` with `aria-expanded` and `aria-controls` over
 * a `listbox` of `option`s, and **focus stays in the text field** while
 * `aria-activedescendant` reports the highlighted row. That is the same
 * pattern as `CommandPalette`, on purpose — the two are the same shape of
 * problem, and a library where two components solve it differently is a
 * library where one of them is wrong.
 *
 * The keyboard: ArrowDown and ArrowUp open the list and then move the
 * highlight, wrapping at both ends; Home and End go to the first and last
 * option; Enter takes the highlighted one; Escape closes the list and is
 * stopped from travelling further, so a combobox inside a dialog does not
 * close the dialog because somebody dismissed a list of options.
 *
 * Announced: how many options match, when that count changes. Not announced:
 * each keystroke, because a live region that fires per character talks over
 * the letters being typed.
 *
 * A disabled option is shown and announced as disabled rather than filtered
 * out. An option that vanishes when it cannot be chosen is one the reader
 * concludes does not exist, and then asks support about.
 *
 * What this replaced: an `<input list>` over a `datalist`, which was the
 * operating system's own picker. That was honest and very small, and it
 * could not express async options, multiple selection or custom rows — the
 * three reasons this component exists. `Select` still covers the case the
 * `datalist` version was good at.
 */
export type ComboboxProps = ComboboxOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof ComboboxOwnProps | "children">;

/** Strings and descriptors, as descriptors. */
function normalise(options: Array<ComboboxOption | string>): ComboboxOption[] {
  return options.map((entry) =>
    typeof entry === "string" ? { value: entry } : entry,
  );
}

/** Case-insensitive substring over the label text, the value and the section. */
function defaultFilter(option: ComboboxOption, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  const label = typeof option.label === "string" ? option.label : undefined;
  return [label, option.value, option.section]
    .filter(Boolean)
    .some((haystack) => haystack!.toLowerCase().includes(needle));
}

export function Combobox({
  name,
  label,
  hint,
  error,
  required,
  hideLabel,
  options = [],
  value,
  defaultValue = null,
  onValueChange,
  multiple = false,
  onQueryChange,
  loading = false,
  filter = defaultFilter,
  item: renderOption,
  placeholder,
  disabled,
  empty,
  className,
  ...rest
}: ComboboxProps) {
  const strings = useStrings();
  const listId = useId();
  const optionId = useId();
  const root = useRef<HTMLDivElement>(null);

  const [internal, setInternal] = useState<string | string[] | null>(
    defaultValue,
  );
  const current = value !== undefined ? value : internal;

  /** The selection as a set, whichever shape it arrived in. */
  const chosen = useMemo(() => {
    if (current === null) return new Set<string>();
    return new Set(Array.isArray(current) ? current : [current]);
  }, [current]);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const all = useMemo(() => normalise(options), [options]);

  /* Filtered locally only when nobody else is doing it. A component that
     asked a server for results and then filtered them would hide rows the
     server deliberately returned, and the reader could not tell which of
     the two had happened. */
  const matches = useMemo(
    () => (onQueryChange ? all : all.filter((entry) => filter(entry, query))),
    [all, onQueryChange, filter, query],
  );

  const index = Math.min(active, Math.max(0, matches.length - 1));

  /**
   * The count, as the live region's whole content.
   *
   * A pure function of how many options match, so it changes exactly when
   * that number does and never merely because a letter was typed. The same
   * shape as `CommandPalette`, and for the same reason.
   */
  const said = open ? strings.optionResults(matches.length) : "";

  const commit = useCallback(
    (next: string | string[] | null) => {
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [value, onValueChange],
  );

  const choose = useCallback(
    (entry: ComboboxOption) => {
      if (entry.disabled) return;
      if (multiple) {
        const held = Array.isArray(current) ? current : [];
        commit(
          held.includes(entry.value)
            ? held.filter((held_) => held_ !== entry.value)
            : [...held, entry.value],
        );
        /* The field stays open and the query is cleared, because choosing a
           second value is the next thing somebody does. */
        setQuery("");
        if (onQueryChange) onQueryChange("");
        return;
      }
      commit(entry.value);
      setQuery("");
      setOpen(false);
    },
    [multiple, current, commit, onQueryChange],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        const step = event.key === "ArrowDown" ? 1 : -1;
        const size = Math.max(1, matches.length);
        setActive((at) => (at + step + size) % size);
      } else if (event.key === "Home" && open) {
        event.preventDefault();
        setActive(0);
      } else if (event.key === "End" && open) {
        event.preventDefault();
        setActive(Math.max(0, matches.length - 1));
      } else if (event.key === "Enter") {
        if (!open) return;
        const entry = matches[index];
        if (entry) {
          event.preventDefault();
          choose(entry);
        }
      } else if (event.key === "Escape") {
        if (!open) return;
        /* Stopped as well: a combobox inside a dialog must not close the
           dialog because somebody dismissed a list of options. */
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    },
    [open, matches, index, choose],
  );

  /* Close on a click outside. Not on blur: clicking an option blurs the
     input on the way, and closing there would cancel the click. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  /** Section headings, in the order their first option appears. */
  const sections = useMemo(() => {
    const grouped = new Map<string | undefined, ComboboxOption[]>();
    for (const entry of matches) {
      const group = grouped.get(entry.section);
      if (group) group.push(entry);
      else grouped.set(entry.section, [entry]);
    }
    return [...grouped.entries()];
  }, [matches]);

  let position = -1;

  /* eslint-disable jsx-a11y/interactive-supports-focus --
     An option in this pattern is deliberately not focusable. Focus stays in
     the text field for the whole interaction and the current row is reported
     with `aria-activedescendant`; a focusable option would mean the arrows
     move DOM focus out of the input, and the next letter typed would go
     nowhere.

     The same disable sits in `CommandPalette.tsx`, and that duplication is
     on purpose rather than overlooked. A config-wide allowance was tried
     first and the rule has no shape for it: its `tabbable` option makes
     roles *stricter* rather than exempting them, so turning it off for
     `option` means turning it off everywhere — and then a genuinely
     unreachable listbox somewhere else would pass. Two named exceptions
     beat one blanket one. */
  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={cx("uix-combobox-field", className)}
      /* `aria`, because the visible label names the whole control while a
         `htmlFor` would tie it to the text input alone — and with
         `multiple` the chosen values sit outside that input. */
      nameBy="aria"
    >
      {({ control, invalid }) => (
        <div
          className="uix-combobox"
          ref={root}
          data-invalid={invalid}
          {...rest}
        >
          <div className="uix-combobox-row">
            {/* The chosen values, when there is more than one to show. A
                list, so a reader can count them, and each remove control
                names its own value. */}
            {multiple && chosen.size ? (
              <ul className="uix-combobox-chosen">
                {[...chosen].map((held) => {
                  const entry = all.find((one) => one.value === held);
                  return (
                    <li key={held} className="uix-combobox-token">
                      <span>{entry?.label ?? held}</span>
                      <button
                        type="button"
                        className="uix-combobox-untoken"
                        aria-label={strings.removeValue(
                          typeof entry?.label === "string" ? entry.label : held,
                        )}
                        disabled={disabled}
                        onClick={() =>
                          commit([...chosen].filter((one) => one !== held))
                        }
                      >
                        <X size={12} aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <input
              {...control}
              type="text"
              className="uix-combobox-input"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                open && matches[index] ? `${optionId}-${index}` : undefined
              }
              placeholder={placeholder}
              disabled={disabled}
              value={
                /* In single mode the field shows the chosen value once the
                   list is closed, which is what makes it look like a value
                   rather than a search box that forgot. */
                query ||
                (!multiple && !open && typeof current === "string"
                  ? current
                  : "")
              }
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
                setOpen(true);
                onQueryChange?.(event.target.value);
              }}
              onKeyDown={onKeyDown}
              onFocus={() => setOpen(true)}
            />

            <span className="uix-combobox-affordance" aria-hidden>
              <ChevronDown size={16} />
            </span>
          </div>

          {/* Always in the DOM. Replacing it with a message when nothing
              matched left `aria-controls` pointing at nothing while the
              combobox still claimed to control it, which axe rejects as an
              invalid attribute value — the same bug CommandPalette had. */}
          <div
            className="uix-combobox-list"
            id={listId}
            role="listbox"
            aria-label={typeof label === "string" ? label : undefined}
            aria-multiselectable={multiple || undefined}
            data-open={open || undefined}
          >
            {sections.map(([section, group]) => (
              <div
                key={section ?? "__none"}
                role="group"
                aria-label={section}
                className="uix-combobox-section"
              >
                {section ? (
                  <div className="uix-combobox-heading" aria-hidden>
                    {section}
                  </div>
                ) : null}
                {group.map((entry) => {
                  position += 1;
                  const here = position;
                  const selected = chosen.has(entry.value);
                  return (
                    <div
                      key={entry.value}
                      id={`${optionId}-${here}`}
                      role="option"
                      className="uix-combobox-option"
                      aria-selected={selected}
                      aria-disabled={entry.disabled || undefined}
                      data-active={here === index || undefined}
                      data-disabled={entry.disabled || undefined}
                      onMouseDown={(event) => {
                        /* Before the click, so focus never leaves the input
                           on the way to choosing something. */
                        event.preventDefault();
                        choose(entry);
                      }}
                      onMouseEnter={() => setActive(here)}
                    >
                      {renderOption ? (
                        renderOption(entry, { selected })
                      ) : (
                        <>
                          <span className="uix-combobox-label">
                            {entry.label ?? entry.value}
                          </span>
                          {selected ? (
                            <Check
                              size={14}
                              aria-hidden
                              className="uix-combobox-check"
                            />
                          ) : null}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {open && !matches.length ? (
            <div className="uix-combobox-empty">
              {loading ? strings.loading : empty}
            </div>
          ) : null}

          <div role="status" className="uix-visually-hidden">
            {loading ? strings.loading : said}
          </div>
        </div>
      )}
    </Field>
  );
}
/* eslint-enable jsx-a11y/interactive-supports-focus */
