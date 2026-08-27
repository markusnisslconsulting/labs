"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The context a field reads to find its own error, in a module of its own.
 *
 * Split out of `Form.tsx`, and the reason is a number. `Field` needs one
 * hook from it, but importing that hook from `Form.tsx` pulls in the whole
 * module — `Form.Summary`, its use of the string table, and `Form.css`. So
 * a page rendering one `TextField` downloaded the error-summary machinery
 * it will never show. Measured by `scripts/component-size.mjs`, which is
 * the gate that caught it: every one of the nine field components grew by
 * about 2.4 KB gzip, roughly doubling the smallest of them.
 *
 * A leading underscore, like the shared stylesheets, so the packaging step
 * treats it as shared rather than as a component entry.
 */
export interface Registration {
  /** The control's id, for the summary's link target. */
  id: string;
  /**
   * The summary's link text, which is the field's label when that label is
   * a plain string and the field's name otherwise.
   *
   * Called `linkText` rather than `label` on purpose. It is not a label — a
   * label can be a node, and this has to be a string because it goes inside
   * an anchor. Naming it `label` also tripped the rule that content props
   * must be nodes, correctly: a reader of that name would expect to be able
   * to pass one.
   */
  linkText: string;
}

export interface FormContextValue {
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
   */
  fields: Array<{ name: string } & Registration>;
}

export const FormContext = createContext<FormContextValue | null>(null);

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
