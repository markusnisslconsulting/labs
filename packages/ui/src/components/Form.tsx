"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithRef,
  type FormEvent,
  type ReactNode,
} from "react";

import { cx } from "../cx";
import { useStrings } from "../i18n";
import "./Form.css";

/**
 * The context a field reads to find its own error.
 *
 * Registration lives in a ref rather than in state: a field mounting must
 * not re-render its siblings, and the summary reads the registry only
 * while rendering itself.
 */
interface Registration {
  /** The control's id, for the summary's link target. */
  id: string;
  /**
   * The summary's link text, which is the field's label when that label is
   * a plain string and the field's name otherwise.
   *
   * Called `linkText` rather than `label` on purpose. It is not a label —
   * a label can be a node, and this has to be a string because it goes
   * inside an anchor. Naming it `label` also tripped the rule that content
   * props must be nodes, correctly: a reader of that name would expect to
   * be able to pass one.
   */
  linkText: string;
}

interface FormContextValue {
  errors: Record<string, ReactNode>;
  busy: boolean;
  register: (name: string, entry: Registration) => void;
  /**
   * The registered fields, in mount order, so the summary reads in the
   * order the form is laid out rather than in whatever order the errors
   * object happens to have.
   *
   * State rather than a ref, and that was not the first design. A ref is
   * cheaper — a field mounting would not re-render its siblings — but the
   * summary has to read the registry while it renders, and reading a ref
   * during render is unsafe under concurrent rendering: the value can
   * belong to a different pass. The React compiler's lint said so, and it
   * was right.
   *
   * The cost is one batched re-render when a form mounts. `register` is
   * idempotent, so a field re-rendering does not cause another.
   */
  fields: Array<{ name: string } & Registration>;
}

const FormContext = createContext<FormContextValue | null>(null);

/**
 * The form around this field, or null.
 *
 * Null rather than a throw, because a field outside a form is the ordinary
 * case and not a mistake — unlike `useToast`, where a notification with
 * nowhere to go is a message silently lost.
 */
export function useFormContext(): FormContextValue | null {
  return useContext(FormContext);
}

/**
 * Whether the summary should render, deliberately a second context.
 *
 * It changes when somebody presses the button, while the error set does
 * not. Putting it in the main context would re-render every field on
 * submit, which is the cost this component exists to avoid.
 *
 * It used to carry a ref for the form to focus. That meant reading a ref
 * out of context during render, which the React compiler's lint refuses
 * and is right to: under concurrent rendering the value can belong to a
 * different pass. The submit handler finds the summary in the DOM
 * instead — an event handler is where a DOM read belongs.
 */
const SummarySlot = createContext<{ show: boolean; settled: boolean } | null>(
  null,
);

interface FormOwnProps {
  /**
   * Errors by field name — the shape a server returns them in.
   *
   * Controlled: the form displays, it does not validate. What counts as
   * invalid is the caller's rule, and a component library guessing at it
   * is how a design system ends up owning business logic.
   */
  errors?: Record<string, ReactNode>;
  /** Submitting. Disables the actions without moving focus. */
  busy?: boolean;
  /**
   * When the summary appears and takes focus.
   *
   * `"submit"` by default, because validating earlier tells someone their
   * half-typed address is wrong. `"always"` is for a form rendered with
   * server errors already in hand.
   */
  summaryOn?: "submit" | "always";
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}

/**
 * **Use it for** a set of fields submitted together, where validation
 * comes back per field. **Reach for something else when** there is one
 * control and nothing to summarise — a search box is not a form.
 *
 * The layer above the field, which was the half of the form story that did
 * not exist. `Field` unified label, hint, error and the aria wiring across
 * nine components; nothing above it knew a form is a *set*. So every
 * consumer threaded errors into fields by hand, and the three things a
 * form owes a person had nowhere to live: a summary of what failed,
 * validation that waits until submit, and a busy state that stops a second
 * submission without stealing focus.
 *
 * ```tsx
 * <Form errors={{ email: "That address is already registered." }} onSubmit={save}>
 *   <Form.Summary />
 *   <TextField name="email" label="Email" />
 *   <Form.Actions>
 *     <Button type="submit">Save</Button>
 *   </Form.Actions>
 * </Form>
 * ```
 *
 * `type="submit"` is not decoration. `Button` defaults to `type="button"`,
 * on purpose — a button inside a form that submits because nobody said
 * otherwise is the older and worse footgun — so the one button that submits
 * has to say so. `Form` itself prevents the native submission unless an
 * `action` is set, because a form with nowhere to go reloads the page.
 *
 * The field is not told. `Field` reads this context, finds the error under
 * its own `name`, and wires `aria-invalid` and `aria-describedby` itself —
 * so a caller cannot route an error to the wrong field, or forget to route
 * it at all.
 *
 * Accessibility: the summary is a `role="alert"` region with a heading and
 * one link per failed field, each moving **focus** to the control rather
 * than only scrolling to it — the difference a keyboard user feels. On a
 * submit that produced errors, focus moves to the summary: WCAG 3.3.1 asks
 * for identification and 3.3.3 for a suggestion, and a summary nobody is
 * sent to satisfies neither. What the caller still owes is error text that
 * says what to do.
 *
 * Performance: one context for the errors and a second for the submit
 * flag, so pressing the button does not re-render the fields. Field
 * registration is a ref write, so mounting a field does not either.
 */
export type FormProps = FormOwnProps &
  Omit<ComponentPropsWithRef<"form">, keyof FormOwnProps>;

export function Form({
  errors = {},
  busy = false,
  summaryOn = "submit",
  onSubmit,
  className,
  children,
  ...rest
}: FormProps) {
  const [fields, setFields] = useState<Array<{ name: string } & Registration>>(
    [],
  );
  const [submitted, setSubmitted] = useState(false);

  /**
   * Whether the children have mounted and registered themselves.
   *
   * Without this the summary renders wrong once and right once. Fields
   * register in an effect, so on the first pass no error has an owner —
   * and the orphan branch, which exists for an error whose field the form
   * does not render, cannot tell "nobody has claimed this yet" from
   * "nobody ever will". So a form given server errors rendered
   * "1 field needs attention" with a plain list item, then re-rendered it
   * as a link.
   *
   * That subtree is `role="alert"`. Writing a live region twice is how a
   * screen reader ends up announcing the same thing twice, which is the
   * defect this library's own screen-reader checklist tells a tester to
   * listen for. One frame of wrong text on screen is the smaller half.
   *
   * A parent's mount effect runs after its children's, and React batches
   * the flush, so this and every registration land in the same re-render:
   * the summary renders nothing, then renders once, finished.
   *
   * The lint rule disabled below objects to a cascading render, and it is
   * right in general. `useDeferredValue(true, false)` is the API shaped
   * for this and was tried first. Measured against
   * `browser/announce.spec.ts`, writes to the summary's `role="alert"`:
   * **1 with this effect, 3 with `useDeferredValue`, 5 with neither.** Its
   * low-priority re-render commits at a different moment than the
   * registration flush, so it adds intermediate states rather than
   * removing them. One extra render on mount, in the provider only,
   * against two extra announcements of the same errors.
   */
  const [settled, setSettled] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
  useEffect(() => setSettled(true), []);

  const register = useCallback((name: string, entry: Registration) => {
    setFields((current) => {
      const existing = current.find((field) => field.name === name);
      if (existing?.id === entry.id && existing.linkText === entry.linkText) {
        return current;
      }
      const without = current.filter((field) => field.name !== name);
      return [...without, { name, ...entry }];
    });
  }, []);

  const value = useMemo<FormContextValue>(
    () => ({ errors, busy, register, fields }),
    [errors, busy, register, fields],
  );

  const failed = Object.keys(errors).length > 0;
  const slot = useMemo(
    () => ({
      show: failed && (summaryOn === "always" || submitted),
      settled,
    }),
    [failed, summaryOn, submitted, settled],
  );

  return (
    <FormContext.Provider value={value}>
      <form
        className={cx("uix-form", className)}
        /* The browser's own bubbles are not themeable, not translatable
           and appear one at a time. The summary is the replacement, so the
           native validation UI has to be off. */
        noValidate
        aria-busy={busy || undefined}
        onSubmit={(event) => {
          const element = event.currentTarget;
          /* A form with no `action` has nowhere to submit to, so the
             browser posts to the current URL and reloads the page —
             losing everything the person typed. Nobody wants that; a
             caller who forgets `preventDefault` has made a typo, not a
             choice. So the default is prevented here, and `action` is the
             opt back in: setting one means a server route exists and
             native submission is deliberate.

             This was found the way it should be. Every `Button` defaults
             to `type="button"`, so while the stories used bare buttons no
             form here could submit at all, and this path went unrun.
             Marking them `type="submit"` reloaded the test page and killed
             the browser. */
          if (!element.hasAttribute("action")) event.preventDefault();
          setSubmitted(true);
          onSubmit?.(event);
          /* On the next frame, because the summary renders as a result of
             this submit and is not in the DOM yet. A caller that sets
             errors synchronously gets them announced here; one that
             validates asynchronously re-renders later and `role="alert"`
             announces it then. */
          if (Object.keys(errors).length) {
            requestAnimationFrame(() => {
              element.querySelector<HTMLElement>(".uix-form-summary")?.focus();
            });
          }
        }}
        {...rest}
      >
        <SummarySlot.Provider value={slot}>{children}</SummarySlot.Provider>
      </form>
    </FormContext.Provider>
  );
}

/**
 * What failed, with a link into each field.
 *
 * Rendered where the caller puts it, which in practice is first: a summary
 * below the fields is a summary nobody reads. It renders nothing until
 * there is something to say.
 */
function FormSummary({
  className,
  ...rest
}: Omit<ComponentPropsWithRef<"div">, "children">) {
  const form = useFormContext();
  const slot = useContext(SummarySlot);
  const strings = useStrings();

  if (!form || !slot?.show) return null;

  const rows = form.fields
    .filter((field) => form.errors[field.name] !== undefined)
    .map((field) => ({ ...field, message: form.errors[field.name] }));

  /* Errors for names no field registered are still shown, without a link.
     A server rejecting a field the form does not render is a real case — a
     stale client, a section behind a condition — and dropping the message
     produces a form that refuses to submit and says nothing. */
  const registered = new Set(form.fields.map((field) => field.name));
  const orphans = slot.settled
    ? Object.keys(form.errors).filter((name) => !registered.has(name))
    : [];

  if (!rows.length && !orphans.length) return null;

  return (
    <div
      className={cx("uix-form-summary", className)}
      role="alert"
      tabIndex={-1}
      {...rest}
    >
      <strong className="uix-form-summary-title">
        {strings.errorSummary(rows.length + orphans.length)}
      </strong>
      <ul className="uix-form-summary-list">
        {rows.map(({ name, id, linkText, message }) => (
          <li key={name}>
            <a
              href={`#${id}`}
              onClick={(event) => {
                /* Focus, not only scroll. A plain anchor moves the
                   viewport and leaves the keyboard on the summary, so a
                   keyboard user arrives at the right place unable to
                   type. */
                event.preventDefault();
                document.getElementById(id)?.focus();
              }}
            >
              {linkText}
            </a>
            {": "}
            {message}
          </li>
        ))}
        {orphans.map((name) => (
          <li key={name}>{form.errors[name]}</li>
        ))}
      </ul>
    </div>
  );
}

/** The row of submit and cancel controls. */
function FormActions({
  className,
  children,
  ...rest
}: ComponentPropsWithRef<"div">) {
  const form = useFormContext();
  return (
    <div
      className={cx("uix-form-actions", className)}
      data-busy={form?.busy || undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * A group of related fields, as a real fieldset.
 *
 * `legend` rather than a heading: a screen reader announces a legend once
 * for the group and again with each control inside it, which is what a
 * shipping address wants and what a heading does not give.
 */
function FormGroup({
  legend,
  className,
  children,
  ...rest
}: { legend: ReactNode } & Omit<ComponentPropsWithRef<"fieldset">, "legend">) {
  return (
    <fieldset className={cx("uix-form-group", className)} {...rest}>
      <legend className="uix-legend">{legend}</legend>
      {children}
    </fieldset>
  );
}

Form.Summary = FormSummary;
Form.Actions = FormActions;
Form.Group = FormGroup;
