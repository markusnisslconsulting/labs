"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { X } from "lucide-react";

import { cx } from "../cx";
import { useStrings } from "../i18n";
import { Field } from "./Field";
import "./TagInput.css";

interface TagInputOwnProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  hideLabel?: boolean;
  /** The form field name, so a `Form` can route an error here. */
  name?: string;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /**
   * Reject or rewrite a tag before it is added.
   *
   * Return a string to add it, or `null` to refuse. Trimming and dropping
   * an empty entry happen first and are not the caller's job; what is the
   * caller's job is whether "EU " and "eu" are the same tag, and whether an
   * address that fails a check may be added at all.
   */
  normalise?: (raw: string) => string | null;
  /**
   * How many tags are allowed. The input disappears at the limit rather
   * than accepting a tag and dropping it.
   */
  max?: number;
  /**
   * Render a tag's contents yourself.
   *
   * The door out of `string[]`, and the third component here to need one —
   * `AvatarGroup` has `person`, `Stepper` has `marker`. A tag is a string
   * because that is what gets submitted; what it *looks* like is a different
   * question, and an avatar beside a recipient or a link to the label's
   * definition cannot be said in a string.
   *
   * The remove button is not the caller's to draw: its accessible name is
   * the reason this component exists rather than a row of chips, so it stays
   * here.
   */
  tag?: (value: string) => ReactNode;
}

/**
 * **Use it for** a set of short free-text values the reader builds up —
 * recipients, labels, filter terms. **Reach for something else when** the
 * values come from a known list: that is a multi-select, and free text
 * invites typos the list would have prevented.
 *
 * ```tsx
 * <TagInput
 *   label="Recipients"
 *   hint="Enter or comma adds one. Backspace on an empty field removes the last."
 *   onValueChange={setRecipients}
 * />
 * ```
 *
 * Accessibility: the tags are a list, the input is a field, and the two are
 * separate things a reader can walk. Each remove button carries the tag it
 * removes in its accessible name — a column of buttons all called "Remove"
 * is a column a screen reader reads as identical controls, which is the
 * usual failing of this pattern.
 *
 * Removing a tag announces the change through a `role="status"`, because
 * pressing Backspace deletes something *elsewhere* on the screen and a
 * reader whose focus is in the input would otherwise get no confirmation
 * that anything happened.
 *
 * The keyboard is the component. Enter and comma commit; Backspace in an
 * empty field removes the last tag, which is the behaviour people already
 * expect from every mail client; each tag's remove button is a real button
 * and therefore reachable with Tab rather than only with a mouse.
 */
export type TagInputProps = TagInputOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof TagInputOwnProps | "children">;

export function TagInput({
  label,
  hint,
  error,
  required,
  hideLabel,
  name,
  value,
  defaultValue = [],
  onValueChange,
  placeholder,
  disabled,
  normalise,
  max,
  tag: renderTag,
  className,
  ...rest
}: TagInputProps) {
  const strings = useStrings();
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);

  const [internal, setInternal] = useState<string[]>(defaultValue);
  const tags = value ?? internal;

  const [draft, setDraft] = useState("");
  /**
   * What just happened, for a screen reader.
   *
   * Removing a tag changes something the reader is not focused on, so
   * without this the only feedback is visual. Set to a sentence rather than
   * to the tag list, so re-adding the same tag announces again.
   */
  const [announcement, setAnnouncement] = useState("");

  const commit = useCallback(
    (next: string[], said: string) => {
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
      setAnnouncement(said);
    },
    [value, onValueChange],
  );

  const add = useCallback(
    (raw: string) => {
      /* Trimmed and de-duplicated here, because those are properties of a
         tag set rather than decisions a caller should have to make. What
         counts as the same tag — case, punctuation — is `normalise`. */
      const trimmed = raw.trim();
      if (!trimmed) return;
      const resolved = normalise ? normalise(trimmed) : trimmed;
      if (resolved === null || resolved === "") return;
      if (tags.includes(resolved)) {
        setDraft("");
        return;
      }
      if (max !== undefined && tags.length >= max) return;
      commit([...tags, resolved], strings.tagAdded(resolved));
      setDraft("");
    },
    [tags, normalise, max, commit, strings],
  );

  const remove = useCallback(
    (tag: string) => {
      commit(
        tags.filter((entry) => entry !== tag),
        strings.tagRemoved(tag),
      );
    },
    [tags, commit, strings],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" || event.key === ",") {
        /* Enter must not submit the surrounding form while there is a
           draft: someone typing a third recipient and pressing Enter means
           "add this one". With the field empty, Enter is left alone so a
           form still submits from here. */
        if (!draft.trim()) return;
        event.preventDefault();
        add(draft);
        return;
      }
      if (event.key === "Backspace" && !draft && tags.length) {
        event.preventDefault();
        remove(tags[tags.length - 1]!);
      }
    },
    [draft, tags, add, remove],
  );

  const atLimit = max !== undefined && tags.length >= max;

  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={cx("uix-taginput-field", className)}
      /* `aria` rather than `for`: the label names the whole control, and a
         `htmlFor` pointing at the text input would say the label belongs to
         the draft field rather than to the set of tags. */
      nameBy="aria"
    >
      {({ control, invalid }) => (
        <div className="uix-taginput" data-invalid={invalid} {...rest}>
          {/* A list, because that is what it is. A row of chips built from
              divs is a row a reader cannot count. */}
          <ul className="uix-taginput-tags" id={listId}>
            {tags.map((tag) => (
              <li key={tag} className="uix-taginput-tag">
                <span className="uix-taginput-text">
                  {renderTag ? renderTag(tag) : tag}
                </span>
                <button
                  type="button"
                  className="uix-taginput-remove"
                  /* The tag is in the name. A column of buttons all called
                     "Remove" is a column a reader hears as identical
                     controls. */
                  aria-label={strings.removeTag(tag)}
                  disabled={disabled}
                  onClick={() => {
                    remove(tag);
                    /* Focus back to the input. Removing the button that
                       had focus otherwise drops the keyboard at the top of
                       the document. */
                    input.current?.focus();
                  }}
                >
                  <X size={12} aria-hidden />
                </button>
              </li>
            ))}
          </ul>

          {atLimit ? null : (
            <input
              {...control}
              ref={input}
              type="text"
              className="uix-taginput-input"
              value={draft}
              placeholder={placeholder}
              disabled={disabled}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              /* Committed on blur as well. A half-typed tag left behind
                 when someone clicks Save is a value they believe they
                 entered. */
              onBlur={() => add(draft)}
            />
          )}

          <div role="status" className="uix-visually-hidden">
            {announcement}
          </div>
        </div>
      )}
    </Field>
  );
}
