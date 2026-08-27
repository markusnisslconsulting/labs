"use client";

import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import { Search } from "lucide-react";
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
import { useInertBackground } from "../useInertBackground";
import "./CommandPalette.css";

export interface Command {
  id: string;
  label: string;
  /** A group heading. Commands with the same section are shown together. */
  section?: string;
  /** Extra words to match on that are not in the label. */
  keywords?: string[];
  /** The shortcut this command also has, shown but not bound here. */
  shortcut?: string;
  disabled?: boolean;
}

interface CommandPaletteOwnProps {
  commands: Command[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (command: Command) => void;
  /**
   * What this palette searches. Required, and it is the dialog's name.
   *
   * "Commands" is the usual answer and not always the right one: a palette
   * over a project's files is searching files, and a reader who hears
   * "Commands" will type a verb.
   */
  label: string;
  placeholder?: string;
  /** Shown when nothing matches. */
  empty?: ReactNode;
  /**
   * Match a command against what has been typed.
   *
   * Defaults to a case-insensitive substring over the label, the keywords
   * and the section. Replaceable because ranking is the part every product
   * disagrees about — recency, frecency, fuzzy matching, an index on a
   * server — and a component that fixed it would be wrong for most of them.
   */
  filter?: (command: Command, query: string) => boolean;
  /** Render one row yourself. */
  item?: (command: Command) => ReactNode;
}

/**
 * **Use it for** reaching any action or place in an application by typing.
 * **Reach for something else when** the set is small and stable: that is a
 * `Menu`, and a palette over six commands is a search box in front of a list
 * nobody needed to search.
 *
 * ```tsx
 * <CommandPalette
 *   label="Commands"
 *   commands={commands}
 *   open={open}
 *   onOpenChange={setOpen}
 *   onSelect={run}
 * />
 * ```
 *
 * Accessibility: a `combobox` with `aria-expanded` and `aria-controls`, over
 * a `listbox` of `option`s, inside a modal dialog. Focus **stays in the text
 * field** the whole time and the highlighted row is reported with
 * `aria-activedescendant` — which is the whole reason this is not the tree
 * or toolbar pattern. Moving DOM focus onto each row as the arrows walk it
 * would take focus out of the input, and then typing another letter would go
 * nowhere.
 *
 * The result count is announced through a `role="status"` on a debounce-free
 * change of the *count*, not of the query: someone typing eight characters
 * gets one announcement per change in how many things match, rather than
 * eight.
 *
 * A disabled command is rendered and announced as disabled rather than
 * filtered out. A command that vanishes when it cannot be used is a command
 * the reader concludes does not exist.
 */
export type CommandPaletteProps = CommandPaletteOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof CommandPaletteOwnProps | "children">;

/** Case-insensitive substring over label, keywords and section. */
function defaultFilter(command: Command, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return [command.label, command.section, ...(command.keywords ?? [])]
    .filter(Boolean)
    .some((haystack) => haystack!.toLowerCase().includes(needle));
}

export function CommandPalette({
  commands,
  open,
  defaultOpen,
  onOpenChange,
  onSelect,
  label,
  placeholder,
  empty,
  filter = defaultFilter,
  item: renderItem,
  className,
  ...rest
}: CommandPaletteProps) {
  const strings = useStrings();
  const listId = useId();
  const optionId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [popup, setPopup] = useState<HTMLElement | null>(null);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const matches = useMemo(
    () => commands.filter((command) => filter(command, query)),
    [commands, query, filter],
  );

  /* Clamped rather than reset. Typing a letter that removes rows should
     leave the highlight on something; sending it back to the first row on
     every keystroke makes arrowing down and refining the query mutually
     exclusive. */
  const index = Math.min(active, Math.max(0, matches.length - 1));

  /**
   * The count, as the live region's whole content.
   *
   * No state and no effect: the sentence is a pure function of how many
   * commands match, so it changes exactly when the count does and not when
   * the query does. Typing eight characters that all match the same three
   * rows mutates nothing, and a region that does not change is a region
   * that does not talk over the letters being typed.
   *
   * The first version held it in state and set it from an effect that
   * compared the count to a ref. That is a cascading render for a value
   * with no memory, and the React compiler's lint said so — correctly, and
   * the fix was to delete the machinery rather than to silence it.
   */
  const said = strings.commandResults(matches.length);

  useInertBackground(Boolean(popup), popup);

  /* Focus the field when the popup arrives. Base UI puts focus on the popup
     itself, which is right for a dialog and wrong for this: the whole
     interaction is typing, and a palette that opens with focus on its own
     container makes the first keystroke go nowhere. Keyed on the popup
     element rather than on `open`, so it runs once the input exists. */
  useEffect(() => {
    if (popup) input.current?.focus();
  }, [popup]);

  const choose = useCallback(
    (command: Command) => {
      if (command.disabled) return;
      onSelect?.(command);
      onOpenChange?.(false);
    },
    [onSelect, onOpenChange],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((current) => (current + 1) % Math.max(1, matches.length));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(
          (current) =>
            (current - 1 + Math.max(1, matches.length)) %
            Math.max(1, matches.length),
        );
      } else if (event.key === "Home") {
        event.preventDefault();
        setActive(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setActive(Math.max(0, matches.length - 1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const command = matches[index];
        if (command) choose(command);
      }
    },
    [matches, index, choose],
  );

  /** Section headings, in the order their first command appears. */
  const sections = useMemo(() => {
    const seen = new Map<string | undefined, Command[]>();
    for (const command of matches) {
      const key = command.section;
      const group = seen.get(key);
      if (group) group.push(command);
      else seen.set(key, [command]);
    }
    return [...seen.entries()];
  }, [matches]);

  let position = -1;

  /* eslint-disable jsx-a11y/interactive-supports-focus --
     The rule wants an element with `role="option"` to be focusable, and
     here it must not be. This is the combobox-over-listbox pattern: focus
     stays in the text field for the whole life of the palette and the
     current row is reported with `aria-activedescendant`. A focusable
     option would mean the arrows move DOM focus out of the input, and then
     the next letter typed goes nowhere — which is the one property
     `browser/keyboard.spec.ts` break-verifies. Scoped as a pair rather
     than per line because ESLint does not read a directive written among
     JSX attributes. */
  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next) => {
        onOpenChange?.(Boolean(next));
        if (next) {
          /* A palette that remembers the last query is a palette that
             shows yesterday's results to somebody who just opened it. */
          setQuery("");
          setActive(0);
        }
      }}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="uix-palette-backdrop" />
        <BaseDialog.Popup
          ref={setPopup}
          className={cx("uix-palette", className)}
          aria-modal
          aria-label={label}
          {...rest}
        >
          <div className="uix-palette-search">
            <Search size={16} aria-hidden className="uix-palette-icon" />
            <input
              ref={input}
              type="text"
              className="uix-palette-input"
              /* A combobox over a listbox, and focus never leaves here.
                 Moving DOM focus onto each row as the arrows walk it would
                 take focus out of the input, and the next letter typed
                 would go nowhere. */
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                matches[index] ? `${optionId}-${index}` : undefined
              }
              aria-label={label}
              placeholder={placeholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>

          {/* The listbox is always rendered, empty or not. Replacing it with
              a message left `aria-controls` pointing at nothing while the
              combobox still claimed `aria-expanded="true"` — axe rejected
              it as an invalid attribute value, correctly: a combobox that
              controls a missing element is describing a popup that is not
              there. An empty listbox is valid and is what this actually
              is. */}
          <div className="uix-palette-list" id={listId} role="listbox">
            {matches.length
              ? sections.map(([section, group]) => (
                  <div
                    key={section ?? "__none"}
                    role="group"
                    aria-label={section}
                    className="uix-palette-section"
                  >
                    {section ? (
                      <div className="uix-palette-heading" aria-hidden>
                        {section}
                      </div>
                    ) : null}
                    {group.map((command) => {
                      position += 1;
                      const here = position;
                      return (
                        <div
                          key={command.id}
                          id={`${optionId}-${here}`}
                          role="option"
                          className="uix-palette-option"
                          aria-selected={here === index}
                          aria-disabled={command.disabled || undefined}
                          data-active={here === index || undefined}
                          data-disabled={command.disabled || undefined}
                          /* Pointer only: the keyboard drives this through the
                           input's own handler, so a row needs no listener
                           and no tab stop of its own. */
                          onMouseDown={(event) => {
                            /* Before the click, so focus never leaves the
                             input on the way. */
                            event.preventDefault();
                            choose(command);
                          }}
                          onMouseEnter={() => setActive(here)}
                        >
                          {renderItem ? (
                            renderItem(command)
                          ) : (
                            <>
                              <span className="uix-palette-label">
                                {command.label}
                              </span>
                              {command.shortcut ? (
                                <kbd className="uix-palette-shortcut">
                                  {command.shortcut}
                                </kbd>
                              ) : null}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              : null}
          </div>
          {matches.length ? null : (
            <div className="uix-palette-empty">{empty}</div>
          )}

          <div role="status" className="uix-visually-hidden">
            {said}
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
/* eslint-enable jsx-a11y/interactive-supports-focus */
