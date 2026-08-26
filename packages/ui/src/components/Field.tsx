"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";

import { cx } from "../cx";
import { useStrings } from "../i18n";
import "./_field.css";

/**
 * **Use it for** building a control that needs a label, a hint, an error
 * and the aria wiring between them — a date picker, a currency input, an
 * uploader, anything not already in this library. **Reach for something
 * else when** the control exists here already: TextField, Select,
 * Combobox, NumberField and Slider are all Field underneath, and using
 * them means the wiring is already right.
 *
 * The label, the hint, the error and the wiring between them.
 *
 * Measured across the nine field components before this existed: all nine
 * took a `label`, two took a `hint`, **one** took an `error`, and none
 * took `required`. So a required Select that failed validation was not
 * expressible — not awkward, not verbose, not expressible — and a form
 * with a Select in it had to grow its own error paragraph beside the
 * component and wire `aria-describedby` by hand.
 *
 * TextField had all of it and kept it to itself. That is the shape of most
 * design-system inconsistency: not a wrong decision, a right decision made
 * once.
 *
 * What this owns, so no component re-derives it and no team forgets it:
 *
 *   - one `id`, shared by the label's `htmlFor` and the control;
 *   - `aria-describedby` pointing at whichever of hint and error exist,
 *     in that order, because a reader wants the instruction before the
 *     complaint;
 *   - `aria-invalid` when there is an error, which is the part hand-rolled
 *     versions forget — a red border is not a state;
 *   - the required marker, and its announcement, which is the other part
 *     they forget: an asterisk is not a word.
 *
 * Accessibility: this owns the four things a hand-rolled field forgets —
 * a label bound by `htmlFor` to a real `id`, `aria-describedby` covering
 * whichever of hint and error exist, `aria-invalid` whenever there is an
 * error, and the required state as a word rather than only an asterisk.
 * What the caller still owes: putting the id on the control it renders,
 * and writing an error message that says what to do rather than that
 * something is wrong.
 *
 * The children are a function rather than nodes because the control needs
 * the ids this component generated. Passing them down any other way means
 * the caller holds them, and the caller holding them is how they drift.
 */
export interface FieldRenderProps {
  id: string;
  /**
   * The label element's own id, for a control that must keep its own
   * `id` and name itself with `aria-labelledby`.
   */
  labelId: string;
  /** For `aria-describedby` on the control. Undefined when nothing describes it. */
  describedBy: string | undefined;
  /** For `aria-invalid`. Undefined rather than false, so it stays off the DOM. */
  invalid: true | undefined;
  required: boolean;
}

interface FieldOwnProps {
  label: ReactNode;
  /** Instruction, shown before the error. */
  hint?: ReactNode;
  /** Validation message. Its presence is what makes the field invalid. */
  error?: ReactNode;
  /**
   * Marks the field required, visibly and for assistive technology.
   *
   * Both, and that is the point: an asterisk alone is a convention a
   * reader has to know, so the word comes from the strings table and sits
   * in the label's accessible name.
   */
  required?: boolean;
  /** Render the label for assistive technology only. */
  hideLabel?: boolean;
  /**
   * Content at the end of the label row: a live value, a character
   * count, the word "optional".
   *
   * A slot rather than each field growing its own head row. Slider had
   * built one to show its value, which is why Slider was the field that
   * could not have a hint — its layout had diverged before anyone needed
   * one.
   */
  aside?: ReactNode;
  /**
   * How the control gets its accessible name.
   *
   * `"for"` (default) — the label's `htmlFor` points at the id Field
   * minted, which the control renders.
   *
   * `"aria"` — the control keeps whatever id its own library gave it and
   * names itself with `aria-labelledby={labelId}`. Base UI's NumberField
   * points the steppers' `aria-controls` at its input's generated id, so
   * overriding that id left two dangling references and axe failed both
   * steppers. A component whose library owns its id has to be allowed to
   * keep it.
   */
  nameBy?: "for" | "aria";
  children: (props: FieldRenderProps) => ReactNode;
}

export type FieldProps = FieldOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof FieldOwnProps>;

export function Field({
  label,
  hint,
  error,
  required = false,
  hideLabel,
  aside,
  nameBy = "for",
  className,
  children,
  ...rest
}: FieldProps) {
  const strings = useStrings();
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // Hint first: the instruction before the complaint.
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cx("uix-field", className)} {...rest}>
      <div className="uix-field-head">
        <label
          id={labelId}
          className={hideLabel ? "uix-visually-hidden" : "uix-field-label"}
          /* Omitted under nameBy="aria": a htmlFor pointing at an id
             nothing renders is a broken association, not a harmless one. */
          htmlFor={nameBy === "for" ? id : undefined}
        >
          {label}
          {required ? (
            <>
              {" "}
              <span className="uix-field-required" aria-hidden>
                *
              </span>
              <span className="uix-visually-hidden">{strings.required}</span>
            </>
          ) : null}
        </label>
        {aside ? <span className="uix-field-aside">{aside}</span> : null}
      </div>
      {children({
        id,
        labelId,
        describedBy,
        invalid: error ? true : undefined,
        required,
      })}
      {hint ? (
        <p className="uix-field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="uix-field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The hint and the error, for a control that is its own label.
 *
 * A checkbox, a switch and a radio group carry their label inside the
 * control, so Field's shape — label, then control, then messages — does
 * not fit them. That is why they had no hint and no error at all: the
 * layout did not have a slot, so nobody added the props.
 *
 * This is Field's message half, extracted rather than reimplemented. One
 * place derives `aria-describedby`, one place decides that hint comes
 * before error, one place decides that an error means `aria-invalid`.
 *
 * ```tsx
 * const { describedBy, invalid, messages } = useFieldMessages(hint, error);
 * return (
 *   <div>
 *     <BaseSwitch.Root aria-describedby={describedBy} aria-invalid={invalid} />
 *     {messages}
 *   </div>
 * );
 * ```
 */
export function useFieldMessages(hint?: ReactNode, error?: ReactNode) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return {
    describedBy:
      [hint ? hintId : null, error ? errorId : null]
        .filter(Boolean)
        .join(" ") || undefined,
    invalid: error ? (true as const) : undefined,
    messages: (
      <>
        {hint ? (
          <p className="uix-field-hint" id={hintId}>
            {hint}
          </p>
        ) : null}
        {error ? (
          <p className="uix-field-error" id={errorId}>
            {error}
          </p>
        ) : null}
      </>
    ),
  };
}
