"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Field } from "./Field";
import "./_field.css";
import "./Select.css";
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<
  ComponentPropsWithRef<"select">,
  "id" | "children"
> {
  /** A node: a field label can carry a hint or a required marker. */
  label: ReactNode;
  /**
   * The convenience form. A shorthand over `Select.Option` and
   * `Select.Group`, which is what a list that needs option groups needs —
   * and a flat array cannot say.
   */
  options?: SelectOption[];
  hint?: ReactNode;
  /** Validation message. Its presence makes the field invalid. */
  error?: ReactNode;
  /** Marks the field required, visibly and for assistive technology. */
  required?: boolean;
  /** Render the label for assistive technology only. */
  hideLabel?: boolean;
  children?: ReactNode;
}

export type SelectOptionProps = ComponentPropsWithRef<"option">;
export type SelectGroupProps = ComponentPropsWithRef<"optgroup">;

/**
 * **Use it for** one value from a short fixed list. **Reach for something
 * else when** someone would rather type than scan (`Combobox`), or when the
 * popup itself has to be yours — grouped rows, a second line per option, a
 * checkmark, anything drawn.
 *
 * Native `<select>` with a bound label and optional hint. The chevron is a
 * styled span (aria-hidden); the element stays a real select, so pickers,
 * keyboards and forms behave like the platform.
 *
 * **About the popup.** Where `appearance: base-select` is supported — Chrome
 * today — it is drawn by this system: our surface, our radius, our accent on
 * the highlighted row, one chevron rather than two. Everywhere else it is
 * the operating system's, exactly as before, because the whole block is
 * behind `@supports`. The element is a real `<select>` either way, which is
 * what keeps typeahead, form participation and the iOS wheel.
 *
 * **The popup is the width of the field.** It took three wrong answers to
 * get there, and the wrong answers are the useful part.
 *
 * The popup anchors to the `<select>`. The box a reader sees is the
 * `.uix-field-row` around it, and the select used to sit inside that row's
 * padding, sharing it with the chevron — so a 384px field held a 334px
 * select and a 332px popup. Every measurement I took compared the popup to
 * the select, found them equal to the pixel, and reported the menu as
 * correct while it was 52px narrower than the field. A measurement against
 * the wrong reference reads exactly like the thing being right, and it is
 * more convincing than no measurement at all.
 *
 * The fix is that the select now spans its row: the horizontal padding moved
 * from the row to the select, and the chevron overlays the control's end
 * instead of taking space beside it. The anchor is the field, so the popup is
 * the field.
 *
 * The first version of this paragraph also said author sizing on
 * `::picker(select)` was ignored in Chromium 151. It is not; that came from
 * reading `getComputedStyle` on the pseudo-element, which reports
 * `inline-size: auto` for a width it is applying. What genuinely does not
 * resolve there is `anchor-size()`, and percentages resolve against the
 * initial containing block — `min-inline-size: 100%` measured 837px on a
 * 334px field. So the width still cannot be *derived* from the anchor. It no
 * longer needs to be.
 *
 * The checkmark sits at the end of a row rather than in front of it, for the
 * same reason: leading, it opened a column the options had and the field did
 * not, so the chosen value moved sideways when the menu opened.
 *
 * When the popup's geometry matters, `Combobox` renders its own listbox and
 * takes the field's width. It costs 6.04 KB against this component's 2.79 KB
 * and gives up the platform picker on mobile, which is the trade.
 *
 * Accessibility: a native `select`, so the picker, the typeahead, the
 * keyboard and the form participation are the platform's. The chevron is
 * `aria-hidden` decoration over the real control rather than a
 * replacement for it, and the hint is linked with `aria-describedby`
 * rather than left floating near the field.
 */
export function Select({
  name,
  label,
  options,
  hint,
  error,
  required,
  hideLabel,
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={className}
    >
      {({ control, invalid }) => (
        <div className="uix-field-row" data-invalid={invalid}>
          <select {...control} className="uix-field-input uix-select" {...rest}>
            {children ??
              (options ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
          <span className="uix-field-affordance" aria-hidden>
            <ChevronDown size={16} />
          </span>
        </div>
      )}
    </Field>
  );
}

/* A native select may contain only options and option groups, so these
   two parts are the whole composable surface — and they are the surface a
   flat `options` array could not express. Text in an option cannot be a
   node; that is the platform's rule, not ours. */

Select.Option = function SelectOptionPart(props: SelectOptionProps) {
  return <option {...props} />;
};

Select.Group = function SelectGroupPart(props: SelectGroupProps) {
  return <optgroup {...props} />;
};
