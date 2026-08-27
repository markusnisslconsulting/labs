"use client";

import { Upload, X } from "lucide-react";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type DragEvent,
  type ReactNode,
} from "react";

import { cx } from "../cx";
import { useStrings } from "../i18n";
import { Field } from "./Field";
import "./FileUpload.css";

/** One chosen file, and how far along it is. */
export interface UploadItem {
  /** Stable identity, so progress can be reported per file. */
  id: string;
  name: string;
  /** Bytes. Rendered in the reader's own locale. */
  size?: number;
  /** 0 to 100. Absent means "not started" rather than "zero per cent". */
  progress?: number;
  /**
   * What went wrong with this file.
   *
   * A node rather than a string, because the useful version of an upload
   * error usually has something in it: a size limit next to a link to the
   * limits page, a supported-formats list. The rule that content props are
   * nodes applies to a row of a list as much as to a prop.
   */
  error?: ReactNode;
}

interface FileUploadOwnProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  hideLabel?: boolean;
  /** The form field name, so a `Form` can route an error here. */
  name?: string;
  /** What the file picker accepts, in the `accept` attribute's own syntax. */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /**
   * The files chosen so far, with their progress.
   *
   * Controlled, and deliberately so: uploading is the caller's — it needs a
   * URL, a token, a retry policy and somewhere to put the result. What this
   * component owns is choosing files and showing what became of them.
   */
  items?: UploadItem[];
  onFilesSelected?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  /** Render one row of the list yourself. */
  item?: (entry: UploadItem) => ReactNode;
}

/**
 * **Use it for** choosing files to send somewhere, with the result of each
 * one visible. **Reach for something else when** nothing is uploaded — a
 * plain `<input type="file">` inside a `Field` is the right amount of
 * machinery for a form that submits its files with everything else.
 *
 * ```tsx
 * <FileUpload
 *   label="Contract"
 *   accept="application/pdf"
 *   items={items}
 *   onFilesSelected={send}
 *   onRemove={cancel}
 * />
 * ```
 *
 * Accessibility: the drop zone is a **label wrapping a real
 * `<input type="file">`**, not a div with a drop handler. That is the whole
 * design. A div can be dropped on and cannot be reached, focused, or
 * activated from a keyboard, and there is no way to add those three back
 * that a browser has not already done better. Drag and drop is the
 * enhancement; the input is the control.
 *
 * Progress is a `<progress>` element with its own accessible name per file,
 * because "68 per cent" means nothing when three files are in flight. Each
 * remove button names its file for the same reason.
 *
 * What is announced, and what is not: the arrival of files and the removal
 * of one go through a `role="status"`, because both change a list the reader
 * may not be looking at. Progress does **not** — a live region that fires on
 * every percentage point is a reader that cannot be used at all, and the
 * `<progress>` element is there to be inspected on demand instead.
 */
export type FileUploadProps = FileUploadOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof FileUploadOwnProps | "children">;

/** Bytes, in the reader's own locale, at the unit a person would say. */
function bytes(size: number, locale?: string): string {
  const units = ["B", "kB", "MB", "GB"];
  let value = size;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: value < 10 && unit > 0 ? 1 : 0,
  }).format(value)} ${units[unit]}`;
}

export function FileUpload({
  label,
  hint,
  error,
  required,
  hideLabel,
  name,
  accept,
  multiple,
  disabled,
  items = [],
  onFilesSelected,
  onRemove,
  item: renderItem,
  className,
  ...rest
}: FileUploadProps) {
  const strings = useStrings();
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const [over, setOver] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const take = useCallback(
    (files: File[]) => {
      if (!files.length) return;
      onFilesSelected?.(files);
      setAnnouncement(strings.filesAdded(files.length));
    },
    [onFilesSelected, strings],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setOver(false);
      if (disabled) return;
      take(Array.from(event.dataTransfer.files));
    },
    [disabled, take],
  );

  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={cx("uix-fileupload-field", className)}
      /* `aria`, because the visible label names the whole control while the
         `htmlFor` target would be the file input inside the drop zone. */
      nameBy="aria"
    >
      {({ control, invalid }) => (
        <div className="uix-fileupload" data-invalid={invalid} {...rest}>
          {/* A label wrapping the input, not a div with a drop handler.
              The label is what makes the whole zone clickable, the input is
              what makes it reachable and operable from a keyboard, and drag
              and drop is added on top of both rather than instead of them. */}
          <label
            className="uix-fileupload-zone"
            data-over={over || undefined}
            data-disabled={disabled || undefined}
            onDragOver={(event) => {
              event.preventDefault();
              if (!disabled) setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
          >
            <input
              {...control}
              ref={input}
              type="file"
              className="uix-visually-hidden"
              accept={accept}
              multiple={multiple}
              disabled={disabled}
              onChange={(event) => {
                take(Array.from(event.target.files ?? []));
                /* Cleared, so choosing the same file twice fires again.
                   A file input keeps its value, and re-selecting a file
                   after a failed upload is the commonest retry there is. */
                event.target.value = "";
              }}
            />
            <Upload size={20} aria-hidden className="uix-fileupload-icon" />
            <span className="uix-fileupload-prompt">{strings.dropFiles}</span>
          </label>

          {items.length ? (
            <ul className="uix-fileupload-list" id={listId}>
              {items.map((entry) => (
                <li key={entry.id} className="uix-fileupload-item">
                  {renderItem ? (
                    renderItem(entry)
                  ) : (
                    <>
                      <span className="uix-fileupload-name">{entry.name}</span>
                      {entry.size === undefined ? null : (
                        <span className="uix-fileupload-size">
                          {bytes(entry.size)}
                        </span>
                      )}
                      {entry.progress === undefined ? null : (
                        <progress
                          className="uix-fileupload-progress"
                          max={100}
                          value={entry.progress}
                          /* Named per file: "68 per cent" says nothing
                             when three are in flight. */
                          aria-label={strings.uploadProgress(entry.name)}
                        />
                      )}
                      {entry.error ? (
                        <span className="uix-fileupload-error">
                          {entry.error}
                        </span>
                      ) : null}
                    </>
                  )}
                  {onRemove ? (
                    <button
                      type="button"
                      className="uix-fileupload-remove"
                      aria-label={strings.removeFile(entry.name)}
                      disabled={disabled}
                      onClick={() => {
                        onRemove(entry.id);
                        setAnnouncement(strings.fileRemoved(entry.name));
                      }}
                    >
                      <X size={14} aria-hidden />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Arrival and removal, not progress. A live region that fires on
              every percentage point is a reader nobody can use. */}
          <div role="status" className="uix-visually-hidden">
            {announcement}
          </div>
        </div>
      )}
    </Field>
  );
}
