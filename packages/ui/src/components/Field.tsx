"use client";

import {
  useEffect,
  useId,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";

import { cx } from "../cx";
import { useFormContext } from "./Form";
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
  /**
   * Spread this onto the control. Everything the wiring needs, at once.
   *
   * It used to hand over `id`, `describedBy`, `invalid` and `required` as
   * four separate values, and a caller had to remember to put each one
   * somewhere. Field's own worked example forgot `required`: the asterisk
   * rendered, the control was not programmatically required, and a screen
   * reader was told nothing — which is the exact failure the required
   * marker exists to prevent, in the file that documents it.
   *
   * Four values a caller assembles is four chances to miss one. One object
   * to spread is none. The nine field components in this library all
   * passed the four correctly; the point is that a tenth, written by
   * somebody else, cannot get it wrong by omission.
   */
  control: {
    id?: string;
    name?: string;
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: true;
    required?: true;
  };
  /**
   * Whether the field is invalid, for the wrapper that draws the border.
   *
   * Separate from `control` because it goes on the row, not on the input:
   * `data-invalid` is how the row knows to turn red, and the row is not
   * the thing a reader queries.
   */
  invalid: true | undefined;
  /**
   * The control's id, for relating *other* elements to it.
   *
   * Combobox needs it to point a `<datalist>` at its input; a component
   * with its own `aria-controls` target needs it too. It is not a
   * substitute for spreading `control` — that is where the id goes on the
   * control itself, along with everything else.
   */
  id: string;
  /**
   * The label element's id, for a control whose library owns its own `id`
   * — Base UI's NumberField points `aria-controls` at it. Under
   * `nameBy="aria"` this is already in `control` as `aria-labelledby`;
   * it is exposed here for a control that needs it somewhere else too.
   */
  labelId: string;
}

interface FieldOwnProps {
  label: ReactNode;
  /** Instruction, shown before the error. */
  hint?: ReactNode;
  /** Validation message. Its presence is what makes the field invalid. */
  error?: ReactNode;
  /**
   * Marks the field required, visibly and programmatically.
   *
   * The asterisk is decoration — `aria-hidden` — and the state lives on
   * the control as `required`, which every screen reader announces
   * itself.
   *
   * This used to also append the word "required" to the label, on the
   * reasoning that an asterisk alone is a convention a reader has to
   * know. Half of that is right and the fix was wrong: the control was
   * already programmatically required, so a reader announced the state
   * twice. Measured with Playwright's accessible-name computation, the
   * name came out "Required required" and a real field would read "Order
   * number required, required, edit text".
   *
   * Which is a defect an aria snapshot shows in one line and axe does not
   * report at all — there is nothing invalid about it.
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
  /**
   * The control's form field name.
   *
   * Two jobs. It reaches the control, as it always did through the spread
   * props. And inside a `Form` it is how the field finds its own error:
   * the form holds errors by name, the field looks its own up, and neither
   * the caller nor the form has to thread a message into the right place.
   * A caller cannot route an error to the wrong field because a caller
   * does not route it at all.
   */
  name?: string;
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
  name,
  className,
  children,
  ...rest
}: FieldProps) {
  const form = useFormContext();
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  /* An explicit `error` prop wins over the form's. A caller who passes one
     directly has a reason — a client-side rule the server does not know
     about — and a form silently overriding it would be the surprise. */
  const resolvedError = error ?? (name && form ? form.errors[name] : undefined);

  /* Registered from an effect, into the form's state.
     The first version registered during render, into a ref, so the
     summary could read it in the same pass. That reads a ref during
     render, which is unsafe when React renders concurrently — the value
     can belong to a different pass — and the compiler's lint refused it.
     An effect costs one batched re-render of the form on mount, and the
     summary only appears after a submit, by which time every field has
     long registered. */
  const register = form?.register;
  const registeredLabel = typeof label === "string" ? label : name;
  useEffect(() => {
    if (name && register) {
      register(name, { id, linkText: registeredLabel ?? name });
    }
  }, [name, register, id, registeredLabel]);

  /* Hint first: the instruction before the complaint.

     `resolvedError`, not `error`. This line read `error` until a Form test
     caught it, and the failure it produced is the worst shape a field has:
     a form-supplied error rendered its message and set `aria-invalid`, and
     `aria-describedby` pointed at nothing. Visibly correct, silent to a
     screen reader, and no visual test can see it. Two things derived from
     two different spellings of the same truth is how that happens. */
  const describedBy =
    [hint ? hintId : null, resolvedError ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

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
            </>
          ) : null}
        </label>
        {aside ? <span className="uix-field-aside">{aside}</span> : null}
      </div>
      {children({
        control: {
          ...(nameBy === "for" ? { id } : { "aria-labelledby": labelId }),
          ...(describedBy ? { "aria-describedby": describedBy } : {}),
          ...(resolvedError ? { "aria-invalid": true as const } : {}),
          ...(name ? { name } : {}),
          ...(required ? { required: true as const } : {}),
        },
        invalid: resolvedError ? true : undefined,
        id,
        labelId,
      })}
      {hint ? (
        <p className="uix-field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {resolvedError ? (
        <p className="uix-field-error" id={errorId}>
          {resolvedError}
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
export function useFieldMessages({
  hint,
  error,
  /**
   * The control's form field name, for the same reason Field takes one.
   *
   * A checkbox, a switch and a radio group are their own label, so they do
   * not go through Field — but they are still fields in a form, and a
   * consent checkbox that a server rejects has to show the message and
   * appear in the summary like everything else. That is the canonical
   * case: "You must accept the terms" is a form error attached to a
   * checkbox, and until this was wired the three controls that carry
   * their own label were the three that could not receive one.
   */
  name,
  /**
   * What the summary's link should say, which is the control's own label.
   *
   * Without it the summary reads the field's `name` — so a person would
   * get "notify" where the form says "Send a confirmation email". Field
   * derives this from its `label` prop; these three have to pass it,
   * because their label lives inside the control.
   */
  linkText,
  /**
   * Where the summary's link should send focus, when that is not the
   * control this hook made an id for.
   *
   * A radio group needs it. The group is a fieldset, and a fieldset is not
   * focusable — so registering the element the hook named would produce a
   * link that scrolls and drops focus nowhere, which is the exact failure
   * `Form.Summary` moves focus to avoid. The group passes its first
   * option's id instead, because "you did not choose" is answered by
   * arriving at the first choice.
   */
  focusId,
}: {
  hint?: ReactNode;
  error?: ReactNode;
  name?: string;
  linkText?: string;
  focusId?: string;
}) {
  const form = useFormContext();
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const resolved = error ?? (name && form ? form.errors[name] : undefined);

  /* In an effect, not during render. The first version registered inline
     with a comment claiming the summary reads the registry while it
     renders, so an effect would be too late. That was true of the ref this
     used to be and false of the state it became: calling it during render
     is a parent setState from a child's render pass, which React refuses.
     The summary shows on submit, a frame after mount, so an effect is in
     time — and the registration is idempotent, so it settles in one pass. */
  const register = form?.register;
  const target = focusId ?? id;
  useEffect(() => {
    if (name && register) {
      register(name, { id: target, linkText: linkText ?? name });
    }
  }, [name, register, target, linkText]);

  return {
    describedBy:
      [hint ? hintId : null, resolved ? errorId : null]
        .filter(Boolean)
        .join(" ") || undefined,
    invalid: resolved ? (true as const) : undefined,
    /**
     * The error actually in force, own prop or form's.
     *
     * Returned because callers branch on it. All three wrapped their
     * messages in `if (!hint && !error)` using their own prop, which meant
     * a form-supplied error rendered no wrapper and no message at all —
     * the same mistake as Field's `describedBy`, in three more places.
     */
    error: resolved,
    /** The id to put on the control, so the summary's link can reach it. */
    id,
    messages: (
      <>
        {hint ? (
          <p className="uix-field-hint" id={hintId}>
            {hint}
          </p>
        ) : null}
        {resolved ? (
          <p className="uix-field-error" id={errorId}>
            {resolved}
          </p>
        ) : null}
      </>
    ),
  };
}
