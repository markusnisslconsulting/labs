"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Progress as BaseProgress } from "@base-ui-components/react/progress";

import { cxState } from "../cx";
import "./ProgressBar.css";
interface ProgressBarOwnProps {
  /** Accessible name; also rendered as visible text. */
  label: string;
  /** Omit for an indeterminate bar. */
  value?: number;
  max?: number;
}

/**
 * Accepts every prop of Base UI's BaseProgress.Root in addition to those below;
 * `className` merges with the component's own class and the rest land
 * on the root element.
 */
export type ProgressBarProps = ProgressBarOwnProps &
  Omit<
    ComponentPropsWithoutRef<typeof BaseProgress.Root>,
    keyof ProgressBarOwnProps
  >;

/**
 * **Use it for** progress with a known proportion, or a named indeterminate wait. **Reach for something else when** the wait is short and local (Spinner).
 *
 * Progress on Base UI's progress root.
 *
 * Accessibility: Base UI renders `role="progressbar"` with
 * `aria-valuenow/min/max`; in the indeterminate mode it drops the
 * numbers (they would be noise) — the label is what gets announced.
 *
 * Performance: the fill animates its width over a small track;
 * the indeterminate mode runs a transform keyframe — compositor only.
 */
export function ProgressBar({
  label,
  value,
  max = 100,
  className,
  ...rest
}: ProgressBarProps) {
  const indeterminate = value === undefined;

  return (
    <BaseProgress.Root
      className={cxState("uix-progress", className)}
      value={indeterminate ? null : value}
      max={max}

      {...rest}
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
