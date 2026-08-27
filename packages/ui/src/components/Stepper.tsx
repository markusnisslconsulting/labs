"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";

import { cx } from "../cx";
import "./Stepper.css";

export interface StepperStep {
  /** Stable identifier, reported to `onStepChange`. */
  id: string;
  label: ReactNode;
  /** A short line under the label: what this step is for, or what failed. */
  hint?: ReactNode;
  /**
   * This step cannot be reached yet.
   *
   * Only meaningful when the steps are navigable. A step nobody can click
   * is not disabled, it is simply ahead.
   */
  disabled?: boolean;
}

interface StepperOwnProps {
  steps: StepperStep[];
  /** Which step the person is on, by index. */
  current: number;
  /**
   * What the sequence is called. Required.
   *
   * A stepper is a list of numbers and words until something says what it
   * is a sequence *of*. "Onboarding" or "Checkout" is the difference
   * between "step 2 of 4" and "step 2 of 4 of what".
   */
  label: string;
  /**
   * Make completed steps navigable.
   *
   * Off by default, and the asymmetry is the point: going back to a step
   * you finished is safe, and jumping ahead to one you have not reached
   * usually is not, because a later step depends on an earlier answer. Pass
   * this and the completed steps become buttons; the steps ahead never do.
   */
  onStepChange?: (index: number, step: StepperStep) => void;
  /**
   * Lay it out down the page rather than across it.
   *
   * `"vertical"` is what a narrow viewport wants, and what a stepper with
   * hints wants at any width — five labels with a line of explanation each
   * do not fit across a row without truncating, and a truncated step label
   * is a step nobody can identify.
   */
  orientation?: "horizontal" | "vertical";
  /**
   * A step that failed, by index.
   *
   * Separate from `current`, because they are usually the same step and
   * sometimes not: a server rejecting step 2 while the reader is on step 3
   * has to mark 2 and leave the reader where they are.
   */
  errorAt?: number;
  /**
   * Render the circle yourself.
   *
   * The one part a list of steps cannot express. `label` and `hint` are
   * already nodes, so a caller controls the words; the marker is fixed at a
   * number, a tick or an exclamation mark, and a step whose marker should
   * be an icon, an avatar or a percentage has no way to say so.
   *
   * Receives the step's resolved state, because the marker usually depends
   * on it — and recomputing "am I done" in the caller is how the circle and
   * the label end up disagreeing.
   */
  marker?: (entry: StepperStep, state: StepperState) => ReactNode;
}

/** A step's resolved state, which is derived rather than passed. */
export type StepperState = "completed" | "current" | "failed" | "ahead";

/**
 * **Use it for** a task split into a fixed sequence where the reader needs
 * to know how far along they are and what is left. **Reach for something
 * else when** the sections can be done in any order — that is `Tabs`, and
 * numbering them implies a dependency that does not exist.
 *
 * ```tsx
 * <Stepper
 *   label="Onboarding"
 *   current={1}
 *   onStepChange={setStep}
 *   steps={[
 *     { id: "account", label: "Account" },
 *     { id: "company", label: "Company", hint: "VAT number and address" },
 *     { id: "review", label: "Review" },
 *   ]}
 * />
 * ```
 *
 * Accessibility: an ordered list inside a `nav` named by `label`, and the
 * current step carries `aria-current="step"`. That combination is what lets
 * a screen reader answer "where am I" — the visual position in a row of
 * circles answers it for nobody else.
 *
 * The state of each step is in text as well as in colour, in a visually
 * hidden span: "completed", "current", "failed". A stepper that says where
 * you are only by filling a circle fails 1.4.1, and the check mark inside a
 * completed circle is decorative, so it cannot carry the meaning either.
 *
 * Steps ahead are never navigable, whatever `onStepChange` is passed. Going
 * back to a finished step is safe; jumping forward past one usually is not,
 * because a later step depends on an earlier answer — and a control that
 * looks available and then refuses is worse than one that is plainly not
 * there yet.
 */
export type StepperProps = StepperOwnProps &
  Omit<ComponentPropsWithRef<"nav">, keyof StepperOwnProps | "children">;

export function Stepper({
  steps,
  current,
  label,
  onStepChange,
  orientation = "horizontal",
  errorAt,
  marker,
  className,
  ...rest
}: StepperProps) {
  return (
    <nav
      className={cx("uix-stepper", className)}
      data-orientation={orientation}
      aria-label={label}
      {...rest}
    >
      <ol className="uix-stepper-list">
        {steps.map((step, index) => {
          const failed = errorAt === index;
          const state: StepperState = failed
            ? "failed"
            : index < current
              ? "completed"
              : index === current
                ? "current"
                : "ahead";

          /* Backwards only, and never onto a disabled step. A step ahead
             is not disabled — it is simply not reached — so it gets no
             control at all rather than a dimmed one. */
          const navigable =
            Boolean(onStepChange) && index < current && !step.disabled;

          const body = (
            <>
              <span className="uix-stepper-marker" aria-hidden>
                {marker
                  ? marker(step, state)
                  : state === "completed"
                    ? "✓"
                    : state === "failed"
                      ? "!"
                      : index + 1}
              </span>
              <span className="uix-stepper-text">
                <span className="uix-stepper-label">
                  {step.label}
                  {/* The state as text, not only as a colour and a shape.
                      Colour alone is 1.4.1, and the mark in the circle is
                      aria-hidden, so it cannot carry it either. */}
                  {state === "ahead" ? null : (
                    <span className="uix-visually-hidden">{` (${state})`}</span>
                  )}
                </span>
                {step.hint ? (
                  <span className="uix-stepper-hint">{step.hint}</span>
                ) : null}
              </span>
            </>
          );

          return (
            <li
              key={step.id}
              className="uix-stepper-step"
              data-state={state}
              data-disabled={step.disabled || undefined}
              /* On the list item rather than on the control: the step is
                 current whether or not it happens to be a button. */
              aria-current={state === "current" ? "step" : undefined}
            >
              {navigable ? (
                <button
                  type="button"
                  className="uix-stepper-control"
                  onClick={() => onStepChange?.(index, step)}
                >
                  {body}
                </button>
              ) : (
                <span className="uix-stepper-control">{body}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
