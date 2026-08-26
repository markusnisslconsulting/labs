"use client";

import type { ComponentPropsWithRef } from "react";
import { useId, type ChangeEvent, type ReactNode } from "react";

import { cx } from "../cx";
import { useFieldMessages } from "./Field";
import { useStrings } from "../i18n";
import "./_choice.css";
import "./_field.css";
import "./RadioGroup.css";
export interface RadioOption {
  value: string;
  /** A node: an option often needs a description under its label. */
  label: ReactNode;
  disabled?: boolean;
}

interface RadioGroupOwnProps {
  name: string;
  /** A node, because a group's legend can carry a hint or a link. */
  legend: ReactNode;
  /**
   * The convenience form. A shorthand over `RadioGroup.Option`, which is
   * what an option with a paragraph of explanation under it — the common
   * case for a shipping or plan choice — needs.
   */
  options?: RadioOption[];
  defaultValue?: string;
  value?: string;
  /** The value triple: value, defaultValue, onValueChange. */
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** Instruction under the group, linked with aria-describedby. */
  hint?: ReactNode;
  /** Validation message. Its presence makes the group invalid. */
  error?: ReactNode;
  /** Marks the group required, visibly and for assistive technology. */
  required?: boolean;
  children?: ReactNode;
}

export type RadioOptionProps = Omit<
  ComponentPropsWithRef<"input">,
  "type" | "children"
> & {
  /** The option's visible content. */
  children?: ReactNode;
};

/**
 * Accepts every attribute of `<fieldset>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type RadioGroupProps = RadioGroupOwnProps &
  Omit<ComponentPropsWithRef<"fieldset">, keyof RadioGroupOwnProps>;

/**
 * **Use it for** one choice from a small set, all of it visible. **Reach for something else when** there are more than about seven options (Select).
 *
 * Radio group as a `fieldset` with a real `legend` — the platform's
 * own grouping semantics. Arrow keys move between options natively.
 *
 * Accessibility: a real `fieldset` with a real `legend`, so the group's
 * name is announced once and each option inherits it. The platform gives
 * arrow-key navigation and the single-tab-stop behaviour for free, which
 * is why this is not a set of buttons with `aria-checked`.
 */
export function RadioGroup({
  name,
  legend,
  options,
  defaultValue,
  value,
  onValueChange,
  disabled,
  hint,
  error,
  required,
  className,
  children,
  ...rest
}: RadioGroupProps) {
  const isControlled = value !== undefined;
  const baseId = useId();
  const { describedBy, invalid, messages } = useFieldMessages(hint, error);
  const strings = useStrings();

  return (
    <fieldset
      className={cx("uix-radiogroup", className)}
      disabled={disabled}
      /* On the fieldset, not on each radio: the requirement and the
         validation message belong to the choice, not to any one option. */
      aria-describedby={describedBy}
      aria-invalid={invalid}
      aria-required={required || undefined}
      {...rest}
    >
      <legend className="uix-legend">
        {legend}
        {required ? (
          <>
            {" "}
            <span className="uix-field-required" aria-hidden>
              *
            </span>
            <span className="uix-visually-hidden">{strings.required}</span>
          </>
        ) : null}
      </legend>
      {children ??
        (options ?? []).map((option) => {
          const id = `${baseId}-${option.value}`;
          return (
            <RadioOptionPart
              key={option.value}
              id={id}
              name={name}
              value={option.value}
              {...(isControlled
                ? { checked: value === option.value }
                : { defaultChecked: defaultValue === option.value })}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onValueChange?.(event.target.value)
              }
              disabled={disabled || option.disabled}
            >
              {option.label}
            </RadioOptionPart>
          );
        })}
      {messages}
    </fieldset>
  );
}

/**
 * One radio and its label, as one target.
 *
 * The label wraps the input rather than pointing at it with `htmlFor`
 * alone, so the whole row is clickable — and the children are a node, so
 * an option can carry a paragraph of explanation, which is the case a
 * `label: string` list could not express at all.
 */
function RadioOptionPart({ className, children, ...rest }: RadioOptionProps) {
  return (
    <label className={cx("uix-check", className)}>
      <input type="radio" className="uix-radio-input" {...rest} />
      <span className="uix-radio-dot" aria-hidden />
      <span className="uix-check-label">{children}</span>
    </label>
  );
}

RadioGroup.Option = RadioOptionPart;
