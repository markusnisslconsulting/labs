"use client";

import { Pencil } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cx } from "../cx";
import { useStrings } from "../i18n";
import "./InlineEdit.css";

interface InlineEditOwnProps {
  /**
   * What is being edited. Required, and it is a real label rather than a
   * placeholder.
   *
   * The whole difficulty of this pattern is that the reading state shows a
   * value with no visible label — the surrounding row supplies the context
   * for anyone who can see it. A screen reader gets no row, so the control
   * has to carry the name itself.
   */
  label: string;
  /**
   * Controlled. Pair it with `onValueChange`.
   *
   * Optional, because an inline edit that owns its own value is a real case
   * — a title above a page that saves through the same callback it renders
   * from has no reason to make the caller hold a string.
   */
  value?: string;
  /** The uncontrolled half of the triple. */
  defaultValue?: string;
  onValueChange?: (next: string) => void;
  /** Shown in the reading state when the value is empty. */
  placeholder?: string;
  disabled?: boolean;
  /**
   * Render the reading state yourself.
   *
   * A value is a string because that is what gets saved; how it reads is a
   * separate question — a currency, a date, a name with a status dot beside
   * it. The same door `AvatarGroup`, `Stepper` and `TagInput` have.
   */
  display?: (value: string) => ReactNode;
  /**
   * Validate before leaving edit mode.
   *
   * Return a message to refuse the change and stay in edit, or nothing to
   * accept it. Refusing has to keep the reader where they are: sending them
   * back to a reading state that shows the old value, with an error
   * somewhere else, is how people lose what they typed.
   */
  validate?: (next: string) => string | undefined;
}

/**
 * **Use it for** one value in a dense layout that is usually read and
 * occasionally changed — a name in a table row, a title above a page.
 * **Reach for something else when** several values change together: that is
 * a `Form`, and a row of independent inline edits saves each one separately
 * with no way to cancel the set.
 *
 * ```tsx
 * <InlineEdit label="Supplier name" value={name} onValueChange={rename} />
 * ```
 *
 * Accessibility: the reading state is a **button**, not a div with a click
 * handler and not a text field styled to look flat. A button says "this does
 * something" to a screen reader and is reachable with Tab; a flat input says
 * "type here" and then swallows the arrow keys of anyone navigating past it.
 *
 * The switch to editing is announced through a `role="status"`, because
 * replacing a button with a text field is a change of what the control *is*
 * — focus lands on something with a different role and a different name, and
 * without a word for it a reader has to work out what happened.
 *
 * Escape cancels and restores the original value; Enter commits. Both are
 * asserted, because a component that commits on Escape has silently made
 * every accidental keystroke permanent.
 */
export type InlineEditProps = InlineEditOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof InlineEditOwnProps | "children">;

export function InlineEdit({
  label,
  value,
  defaultValue = "",
  onValueChange,
  placeholder,
  disabled,
  display,
  validate,
  className,
  ...rest
}: InlineEditProps) {
  const strings = useStrings();
  const errorId = useId();
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const [editing, setEditing] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const [draft, setDraft] = useState(current);
  const [error, setError] = useState<string | undefined>();
  const [announcement, setAnnouncement] = useState("");

  /* Focus follows the mode change. Without this, opening the editor leaves
     the keyboard on a button that no longer exists and the reader is back
     at the top of the document. */
  useEffect(() => {
    if (editing) input.current?.select();
    else if (announcement) trigger.current?.focus();
    // `announcement` guards the first render: nothing has happened yet.
  }, [editing, announcement]);

  const open = useCallback(() => {
    setDraft(current);
    setError(undefined);
    setEditing(true);
    setAnnouncement(strings.editing(label));
  }, [current, label, strings]);

  const cancel = useCallback(() => {
    setEditing(false);
    setError(undefined);
    setAnnouncement(strings.editCancelled(label));
  }, [label, strings]);

  const commit = useCallback(() => {
    const failed = validate?.(draft);
    if (failed) {
      /* Stay in edit. Sending someone back to a reading state showing the
         old value, with the complaint somewhere else, is how they lose
         what they typed. */
      setError(failed);
      return;
    }
    setEditing(false);
    setError(undefined);
    if (draft !== current) {
      if (value === undefined) setInternal(draft);
      onValueChange?.(draft);
    }
    setAnnouncement(strings.editSaved(label));
  }, [draft, current, value, validate, onValueChange, label, strings]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commit();
      } else if (event.key === "Escape") {
        /* Stopped as well as prevented: an inline edit inside a dialog
           must not close the dialog because somebody abandoned a field. */
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }
    },
    [commit, cancel],
  );

  return (
    <div className={cx("uix-inlineedit", className)} {...rest}>
      {editing ? (
        <>
          <input
            ref={input}
            type="text"
            className="uix-inlineedit-input"
            aria-label={label}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            value={draft}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            /* Committed on blur, because clicking away from a field you
               have filled in means you are done with it. Escape is the way
               to leave without saving, and it is announced. */
            onBlur={commit}
          />
          {error ? (
            <p className="uix-inlineedit-error" id={errorId}>
              {error}
            </p>
          ) : null}
        </>
      ) : (
        <button
          ref={trigger}
          type="button"
          className="uix-inlineedit-trigger"
          /* The name carries what it does *and* what it edits. "Supplier
             name" alone would announce as a value; "Edit supplier name"
             says it is a control and which one. */
          aria-label={strings.editValue(label)}
          disabled={disabled}
          onClick={open}
        >
          <span
            className="uix-inlineedit-value"
            data-empty={!current || undefined}
          >
            {current ? (display ? display(current) : current) : placeholder}
          </span>
          <Pencil size={14} className="uix-inlineedit-pencil" aria-hidden />
        </button>
      )}

      <div role="status" className="uix-visually-hidden">
        {announcement}
      </div>
    </div>
  );
}
