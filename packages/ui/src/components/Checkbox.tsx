import { useEffect, useId, useRef, type ChangeEvent } from "react";

export interface CheckboxProps {
  /** Visible label; clicking it toggles, as native checkboxes do. */
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Tri-state support: the box shows a dash until told otherwise. */
  indeterminate?: boolean;
}

/**
 * Checkbox over a native input — the platform handles keyboard
 * (Space), form semantics and screen reader announcements.
 *
 * Performance: state changes toggle one class on the box span; no
 * effect runs for the checked case, only indeterminate syncs an
 * imperative DOM property that React cannot express.
 */
export function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled,
  indeterminate,
}: CheckboxProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = checked !== undefined;

  useEffect(() => {
    if (inputRef.current) {
      // The one property that is DOM-only in HTML.
      inputRef.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
  };

  return (
    <label className="uix-check">
      <input
        ref={inputRef}
        id={id}
        type="checkbox"
        data-indeterminate={indeterminate ? "" : undefined}
        className="uix-check-input"
        {...(isControlled ? { checked } : { defaultChecked })}
        onChange={handleChange}
        disabled={disabled}
      />
      <span className="uix-check-box" aria-hidden />
      <span className="uix-check-label">{label}</span>
    </label>
  );
}
