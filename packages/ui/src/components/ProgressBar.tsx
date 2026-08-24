import { Progress as BaseProgress } from "@base-ui-components/react/progress";

export interface ProgressBarProps {
  /** Accessible name; also rendered as visible text. */
  label: string;
  /** Omit for an indeterminate bar. */
  value?: number;
  max?: number;
}

/**
 * Progress on Base UI's progress root.
 *
 * Accessibility: Base UI renders `role="progressbar"` with
 * `aria-valuenow/min/max`; in the indeterminate mode it drops the
 * numbers (they would be noise) — the label is what gets announced.
 *
 * Performance: the fill animates its width over a small track;
 * the indeterminate mode runs a transform keyframe — compositor only.
 */
export function ProgressBar({ label, value, max = 100 }: ProgressBarProps) {
  const indeterminate = value === undefined;

  return (
    <BaseProgress.Root
      className="uix-progress"
      value={indeterminate ? null : value}
      max={max}
    >
      <BaseProgress.Label className="uix-progress-label">
        {label}
      </BaseProgress.Label>
      <BaseProgress.Track
        className={
          indeterminate
            ? "uix-progress-track indeterminate"
            : "uix-progress-track"
        }
      >
        <BaseProgress.Indicator className="uix-progress-fill" />
      </BaseProgress.Track>
      {indeterminate ? (
        <span className="uix-visually-hidden">Loading</span>
      ) : null}
    </BaseProgress.Root>
  );
}
