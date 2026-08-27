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
  /**
   * The heading of a form's error summary.
   *
   * A function because the count is in it and word order is not
   * universal, and because "1 field needs attention" and "3 fields need
   * attention" are different sentences in most languages — a template
   * with a placeholder cannot express that and a translator would have to
   * pick one.
   */
  errorSummary: (count: number) => string;
  /** The header checkbox that selects every row of a data table. */
  selectAllRows: string;
  /**
   * The checkbox on one row of a data table.
   *
   * A function, because the name has to say *which* row — a column of
   * checkboxes all called "Select row" is a column a screen reader reads
   * as identical controls.
   */
  selectRow: (row: string) => string;
  /**
   * How many rows are selected, as a live status.
   *
   * A function for the same reason as `errorSummary`: the count is in the
   * sentence, and one and many are different sentences in most languages.
   */
  rowsSelected: (count: number) => string;
  /**
   * The remove control on one tag of a `TagInput`.
   *
   * A function, because the name has to say *which* tag — a row of buttons
   * all called "Remove" is a row a screen reader reads as identical
   * controls, which is the usual failing of this pattern.
   */
  removeTag: (tag: string) => string;
  /**
   * What a live region says when a tag is added or removed.
   *
   * Both are needed because removing a tag changes something the reader is
   * not focused on: their keyboard is in the input, and without an
   * announcement the only feedback is visual.
   */
  tagAdded: (tag: string) => string;
  tagRemoved: (tag: string) => string;
  /**
   * The reading state of an `InlineEdit`, as a control.
   *
   * "Supplier name" alone announces as a value; "Edit supplier name" says
   * it is a control and which one. A function because the field's name goes
   * inside the sentence and word order is not universal.
   */
  editValue: (field: string) => string;
  /**
   * What a live region says when an inline edit opens, saves or is
   * abandoned.
   *
   * Replacing a button with a text field changes what the control *is*:
   * focus lands on a different role with a different name. Without a word
   * for it a reader has to work out what happened.
   */
  editing: (field: string) => string;
  editSaved: (field: string) => string;
  editCancelled: (field: string) => string;
  /** The prompt inside a `FileUpload` drop zone. */
  dropFiles: string;
  /**
   * The progress bar of one file, by name.
   *
   * "68 per cent" says nothing when three files are in flight, so the
   * accessible name has to carry which file it belongs to.
   */
  uploadProgress: (file: string) => string;
  /** The remove control on one chosen file. */
  removeFile: (file: string) => string;
  /**
   * What a live region says when files arrive or one is removed.
   *
   * Both change a list the reader may not be looking at. Progress does not
   * get one: a region that fires on every percentage point is a reader
   * nobody can use.
   */
  filesAdded: (count: number) => string;
  fileRemoved: (file: string) => string;
  /**
   * How many commands match, as a live status.
   *
   * Announced when the *count* changes rather than when the query does: a
   * region that fired per keystroke would talk over the letters being
   * typed. A function for the same reason as `errorSummary` — the number is
   * in the sentence.
   */
  commandResults: (count: number) => string;
  /**
   * How many options match, as a live status on a combobox.
   *
   * Separate from `commandResults` even though both count rows, because
   * "3 commands" and "3 options" are different sentences and a translator
   * needs both — a command is a thing you do and an option is a thing you
   * pick.
   */
  optionResults: (count: number) => string;
  /** The remove control on one chosen value of a multiple combobox. */
  removeValue: (value: string) => string;
  /** The control that opens a date picker's calendar. */
  openCalendar: string;
  /** The month paging controls. */
  previousMonth: string;
  nextMonth: string;
  /** The steppers on a number field. */
  increase: string;
  decrease: string;
  /**
   * @deprecated Nothing reads this any more, and nothing should.
   *
   * It existed so a field could append the word "required" to its label.
   * That duplicated a state the control already carries: `required` on the
   * control is programmatic and every screen reader announces it, so a
   * reader said "required" twice. Measured, the accessible name came out
   * "Required required".
   *
   * Kept for one release with this note rather than deleted, because a
   * consumer may be passing it and a silently ignored key is worse than a
   * documented dead one. Remove it after 2027-03-01.
   */
  required: string;
  /**
   * The close control on a popover or a dialog.
   *
   * Separate from `dismiss`: dismissing a toast throws the message away,
   * closing a popover leaves everything as it was. Two different promises
   * to the reader, and translators need to be able to tell them apart.
   */
  close: string;
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
  errorSummary: (count) =>
    count === 1 ? "1 field needs attention" : `${count} fields need attention`,
  openCalendar: "Open calendar",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  optionResults: (count) =>
    count === 0
      ? "No options match"
      : count === 1
        ? "1 option"
        : `${count} options`,
  removeValue: (value) => `Remove ${value}`,
  commandResults: (count) =>
    count === 0
      ? "No commands match"
      : count === 1
        ? "1 command"
        : `${count} commands`,
  dropFiles: "Drop files here, or choose them",
  uploadProgress: (file) => `Uploading ${file}`,
  removeFile: (file) => `Remove ${file}`,
  filesAdded: (count) =>
    count === 1 ? "1 file added" : `${count} files added`,
  fileRemoved: (file) => `${file} removed`,
  editValue: (field) => `Edit ${field}`,
  editing: (field) => `Editing ${field}`,
  editSaved: (field) => `${field} saved`,
  editCancelled: (field) => `${field} unchanged`,
  removeTag: (tag) => `Remove ${tag}`,
  tagAdded: (tag) => `${tag} added`,
  tagRemoved: (tag) => `${tag} removed`,
  selectAllRows: "Select all rows",
  selectRow: (row) => `Select ${row}`,
  rowsSelected: (count) =>
    count === 1 ? "1 row selected" : `${count} rows selected`,
  increase: "Increase",
  decrease: "Decrease",
  required: "required",
  close: "Close",
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
