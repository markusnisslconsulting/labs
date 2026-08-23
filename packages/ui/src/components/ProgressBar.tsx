import { useId } from "react";

export interface ProgressBarProps {
  /** Accessible name; also rendered as visible text. */
  label: string;
  /** Omit for an indeterminate bar. */
  value?: number;
  max?: number;
}

/**
 * Progress with two honest modes.
 *
 * Accessibility: `role="progressbar"` carries `aria-valuenow/min/max`
 * when determinate; the indeterminate mode hides its numbers from
 * assistive technology (they would be noise) and announces only the
 * label.
 *
 * Performance: the fill animates `transform: scaleX` — compositor
 * only, no layout, no repaint per frame.
 */
export function ProgressBar({ label, value, max = 100 }: ProgressBarProps) {
  const id = useId();
  const indeterminate = value === undefined;

  return (
    <div className="uix-progress">
      <span className="uix-progress-label" id={id}>
        {label}
      </span>
      <div
        className={
          indeterminate
            ? "uix-progress-track indeterminate"
            : "uix-progress-track"
        }
        role="progressbar"
        aria-labelledby={id}
        aria-hidden={indeterminate ? true : undefined}
        {...(indeterminate
          ? {}
          : {
              "aria-valuenow": value,
              "aria-valuemin": 0,
              "aria-valuemax": max,
            })}
      >
        <span
          className="uix-progress-fill"
          style={
            indeterminate
              ? undefined
              : { transform: `scaleX(${(value ?? 0) / max})` }
          }
        />
      </div>
      {indeterminate ? (
        <span className="uix-visually-hidden">Loading</span>
      ) : null}
    </div>
  );
}
