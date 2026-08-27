"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";

import { cx } from "../cx";
import { useStrings } from "../i18n";
import { Field } from "./Field";
import "./_field.css";
import "./Textarea.css";

export interface TextareaProps extends Omit<
  ComponentPropsWithRef<"textarea">,
  "id"
> {
  /** A node, so a label can carry a required marker or a hint link. */
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  hideLabel?: boolean;
  /**
   * The form field name, so a `Form` can route an error here.
   *
   * Declared and threaded to `Field` rather than left to the rest props: a
   * `name` that reaches only the textarea puts the value in the submission
   * and leaves `Field` unable to find this field's error. Written without it
   * first, and the form story caught it.
   */
  name?: string;
  /**
   * Grow with the text instead of scrolling inside a fixed box.
   *
   * Off by default. A box that grows is right for a message somebody
   * composes and wrong inside a dense form, where it moves everything below
   * it on every line — so it is a decision the caller makes, not a
   * behaviour they discover.
   *
   * `rows` remains the starting height, and `maxRows` the point at which it
   * gives up and scrolls.
   */
  autoGrow?: boolean;
  /** How tall it may grow before it scrolls. Only with `autoGrow`. */
  maxRows?: number;
  /**
   * Show how much is left, and announce it as it runs out.
   *
   * Needs `maxLength`. Off by default because a counter on a field with a
   * generous limit is noise the reader has to read past every time.
   */
  showCount?: boolean;
}

/**
 * **Use it for** text longer than a line — a note, a message, a description.
 * **Reach for something else when** it is one line (`TextField`), or the
 * content has structure the reader expects to see rendered, which is an
 * editor and not a form field.
 *
 * ```tsx
 * <Textarea label="Note" autoGrow maxLength={500} showCount />
 * ```
 *
 * Accessibility: the same wiring as every other field, through `Field` — the
 * label with `for`, hint and error through `aria-describedby`, `aria-invalid`
 * on an error. The three things a textarea adds on top:
 *
 * `resize` is left to the browser. A `resize: none` is the most common line
 * in a textarea's stylesheet and it takes away the one control the platform
 * gives someone whose text does not fit — which is a WCAG 1.4.4 problem
 * dressed as a design decision.
 *
 * The character count is announced **politely and only near the limit**. A
 * live region that fires on every keystroke reads the count over the letters
 * being typed, so nothing is announced until the last fifth, and then only
 * when the number changes.
 *
 * `autoGrow` measures with `scrollHeight` and is capped by `maxRows`,
 * because a field that grows without limit pushes the submit button off the
 * screen — which is how a form becomes unusable at the exact moment somebody
 * has finished filling it in.
 */
export function Textarea({
  label,
  name,
  hint,
  error,
  required,
  hideLabel,
  autoGrow = false,
  maxRows = 12,
  showCount = false,
  maxLength,
  rows = 3,
  className,
  value,
  defaultValue,
  onChange,
  ...rest
}: TextareaProps) {
  const strings = useStrings();
  const area = useRef<HTMLTextAreaElement>(null);

  /**
   * The length, read from the element rather than held in state.
   *
   * A counter that mirrored the value in state would make this component
   * controlled-ish: a caller passing `defaultValue` and nothing else would
   * still have its keystrokes routed through a re-render here. Reading the
   * DOM on change costs nothing and keeps the component as uncontrolled as
   * the caller left it.
   */
  const [length, setLength] = useState(
    () => String(value ?? defaultValue ?? "").length,
  );

  const resize = useCallback(() => {
    const node = area.current;
    if (!node || !autoGrow) return;
    /* Reset first: without it the box only ever grows, because scrollHeight
       of an already-tall element is its own height. */
    node.style.height = "auto";

    /* The cap is `maxRows` lines *plus the box's own chrome*. Counting only
       the lines was wrong by exactly the padding and borders: `scrollHeight`
       includes them and `line * maxRows` does not, so a field capped at four
       rows kept growing past four. Measured at 99.19px against a 92px cap
       before this line existed.

       `offsetHeight - clientHeight` is the borders; `clientHeight` already
       carries the padding, so the padding is read separately. */
    const styles = getComputedStyle(node);
    const line = parseFloat(styles.lineHeight) || 20;
    const chrome =
      node.offsetHeight -
      node.clientHeight +
      parseFloat(styles.paddingBlockStart) +
      parseFloat(styles.paddingBlockEnd);
    const max = line * maxRows + chrome;

    node.style.height = `${Math.min(node.scrollHeight, max)}px`;
    node.style.overflowY = node.scrollHeight > max ? "auto" : "hidden";
  }, [autoGrow, maxRows]);

  /* On mount as well as on change, because a field rendered with a value
     already in it starts at the wrong height otherwise. */
  useEffect(resize, [resize, value]);

  const remaining = maxLength === undefined ? null : maxLength - length;
  /* Announced only near the limit. A region that fired per keystroke would
     read the count over the letters being typed. */
  const announce =
    remaining !== null && maxLength !== undefined && remaining <= maxLength / 5;

  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={className}
    >
      {({ control, invalid }) => (
        <div className="uix-textarea-wrap" data-invalid={invalid}>
          <textarea
            {...control}
            ref={area}
            className={cx("uix-field-input", "uix-textarea")}
            name={name}
            data-grow={autoGrow || undefined}
            rows={rows}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={(event) => {
              setLength(event.target.value.length);
              resize();
              onChange?.(event);
            }}
            {...rest}
          />
          {showCount && maxLength !== undefined ? (
            <>
              <div className="uix-textarea-count" aria-hidden>
                {strings.charactersLeft(remaining ?? 0)}
              </div>
              {/* The same sentence for a reader, and only near the limit. */}
              <div role="status" className="uix-visually-hidden">
                {announce ? strings.charactersLeft(remaining ?? 0) : ""}
              </div>
            </>
          ) : null}
        </div>
      )}
    </Field>
  );
}
