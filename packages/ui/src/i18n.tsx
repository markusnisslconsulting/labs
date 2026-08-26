"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The strings the components say, in one place.
 *
 * Seven were compiled into the components: "Breadcrumb", "Pagination",
 * "Previous page", "Page 1", "Next page", "Dismiss", "Notifications".
 * Every one of them is read aloud by a screen reader, and none of them
 * could be changed by a product serving a second market. A design system
 * that ships English into an aria-label has decided its consumers are
 * English, which is a decision nobody made on purpose.
 *
 * Three rules this follows, in order of how often they are broken:
 *
 *   1. **Nothing is only a default.** Every entry is overridable per
 *      component through a prop and per application through this
 *      provider, so a team can fix one label without waiting for us.
 *   2. **Interpolation is a function, not a template.** `page(4)` rather
 *      than `"Page {n}"`, because word order is not universal and a
 *      translator needs to move the number.
 *   3. **No library ships its own translations.** We ship the keys and
 *      the English defaults. Which locale is in force, and where the
 *      other locales live, is the application's business — it already has
 *      a translation pipeline and we would only be a second one.
 */
export interface Strings {
  /** Accessible name of a breadcrumb trail's nav landmark. */
  breadcrumb: string;
  /** Accessible name of a pagination nav landmark. */
  pagination: string;
  previousPage: string;
  nextPage: string;
  /** A function, because "Page 4" does not put the number last in Hungarian. */
  page: (n: number) => string;
  /** Accessible name of the toast region. */
  notifications: string;
  /** The dismiss control on a toast or an alert. */
  dismiss: string;
  /** The status a spinner announces while it spins. */
  loading: string;
  /** The steppers on a number field. */
  increase: string;
  decrease: string;
  /** Announced when a field is required. */
  required: string;
}

export const defaultStrings: Strings = {
  breadcrumb: "Breadcrumb",
  pagination: "Pagination",
  previousPage: "Previous page",
  nextPage: "Next page",
  page: (n) => `Page ${n}`,
  notifications: "Notifications",
  dismiss: "Dismiss",
  loading: "Loading",
  increase: "Increase",
  decrease: "Decrease",
  required: "required",
};

const StringsContext = createContext<Strings>(defaultStrings);

/**
 * Supply a whole set of strings to everything below.
 *
 * Partial on purpose: an application translating four labels should not
 * have to restate the other seven, and adding a key here must not break
 * a consumer who translated the ones that existed.
 */
export function LabsStrings({
  strings,
  children,
}: {
  strings: Partial<Strings>;
  children: ReactNode;
}) {
  const merged = { ...defaultStrings, ...strings };
  return (
    <StringsContext.Provider value={merged}>{children}</StringsContext.Provider>
  );
}

/** Read the strings in force here. */
export function useStrings(): Strings {
  return useContext(StringsContext);
}
