"use client";

import { Menu as BaseMenu } from "@base-ui-components/react/menu";
import { ChevronDown } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { cx, cxState } from "../cx";
import { Button } from "./Button";
import { Menu, type MenuItemDescriptor } from "./Menu";

import "./_positioner.css";
import "./Button.css";
import "./Menu.css";
import "./SplitButton.css";

interface SplitButtonOwnProps {
  /** The default action's label. A node, so it can carry an icon. */
  label: ReactNode;
  /** What the primary half does. */
  onAction?: () => void;
  /**
   * The alternatives, behind the arrow.
   *
   * The shorthand form, like `Menu`'s. `children` takes `Menu.Item` and
   * friends when an item needs more than a label — a keyboard hint beside
   * it, a separator between groups.
   */
  items?: MenuItemDescriptor[];
  children?: ReactNode;
  /**
   * What the arrow half is called, for assistive technology.
   *
   * Required, and this is the prop that makes the component worth having as
   * a component. The arrow is an icon-only button, so its accessible name
   * has to come from somewhere — and "More" is useless on a page with three
   * split buttons. "More save options" identifies which one.
   */
  menuLabel: string;
  variant?: "solid" | "outline";
  tone?: "accent" | "neutral";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
}

/**
 * **Use it for** one action people take most of the time, with variants
 * behind it — Save, with Save and close, Save as draft. **Reach for
 * something else when** no option is the obvious default: that is a `Menu`,
 * and pretending one of a set of equals is the default makes the others
 * hard to find.
 *
 * ```tsx
 * <SplitButton
 *   label="Save"
 *   onAction={save}
 *   menuLabel="More save options"
 *   items={[
 *     { id: "close", label: "Save and close", onSelect: saveAndClose },
 *     { id: "draft", label: "Save as draft", onSelect: saveDraft },
 *   ]}
 * />
 * ```
 *
 * Accessibility: two buttons, not one button with two click regions. The
 * primary half is a plain `<button>`; the arrow is a menu trigger with
 * `aria-haspopup="menu"` and its own accessible name from `menuLabel`. A
 * single button that opened a menu when clicked on the right would be one
 * control announcing one name and doing two things, and a keyboard could
 * only ever reach one of them.
 *
 * The arrow is `aria-hidden`, because the name is on the button. An icon
 * that is both the label and announced separately says everything twice.
 *
 * Theming: it borrows `Button`'s slots, because a split button that did not
 * match the buttons beside it would be the defect. The seam between the
 * halves is the only thing this stylesheet adds.
 */
export type SplitButtonProps = SplitButtonOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof SplitButtonOwnProps>;

export function SplitButton({
  label,
  onAction,
  items,
  children,
  menuLabel,
  variant = "solid",
  tone = "accent",
  size = "md",
  disabled,
  loading,
  className,
  ...rest
}: SplitButtonProps) {
  return (
    <div
      className={cx("uix-splitbutton", className)}
      /* A group, so a reader announces the two halves as belonging
         together rather than as two unrelated buttons that happen to
         touch. Named by the primary action, which is the whole point of
         the pair. */
      role="group"
      {...rest}
    >
      <Button
        className="uix-splitbutton-action"
        variant={variant}
        tone={tone}
        size={size}
        disabled={disabled}
        loading={loading}
        onClick={onAction}
      >
        {label}
      </Button>
      <BaseMenu.Root>
        <BaseMenu.Trigger
          className={cxState("uix-button", "uix-splitbutton-more")}
          data-variant={variant}
          data-tone={tone}
          data-size={size}
          aria-haspopup="menu"
          aria-label={menuLabel}
          disabled={disabled || loading}
        >
          <ChevronDown size={16} aria-hidden />
        </BaseMenu.Trigger>
        <BaseMenu.Portal>
          <BaseMenu.Positioner
            className="uix-menu-positioner"
            sideOffset={6}
            align="end"
          >
            <BaseMenu.Popup className="uix-menu">
              {/* `Menu.Item`, not a second copy of it. The item's styling
                  and its danger state have one definition, so a change to
                  how a menu item looks reaches both components. */}
              {children ??
                (items ?? []).map((item) => (
                  <Menu.Item
                    key={item.id}
                    danger={item.danger}
                    disabled={item.disabled}
                    onClick={item.onSelect}
                  >
                    {item.label}
                  </Menu.Item>
                ))}
            </BaseMenu.Popup>
          </BaseMenu.Positioner>
        </BaseMenu.Portal>
      </BaseMenu.Root>
    </div>
  );
}

/**
 * The menu parts, for the cases the `items` shorthand cannot express.
 *
 * They are `Menu`'s parts, re-exported rather than re-implemented: one
 * definition of how a menu item looks and behaves, and a caller does not
 * have to know that a split button's popup happens to be a `Menu`. An item
 * with a keyboard hint beside it, or a separator between two groups, needs
 * these; a list of labels does not.
 */
SplitButton.Item = Menu.Item;
SplitButton.Separator = Menu.Separator;
SplitButton.Group = Menu.Group;
