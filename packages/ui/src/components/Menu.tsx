"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { Menu as BaseMenu } from "@base-ui-components/react/menu";
import { ChevronDown } from "lucide-react";

import { cxState } from "../cx";

import "./_positioner.css";
import "./Button.css";
import "./Menu.css";

export interface MenuItemDescriptor {
  id: string;
  /** A node: an item is often a word and an icon, or a word and a hint. */
  label: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface MenuOwnProps {
  /**
   * The trigger's content. A node, so the button can carry an icon or a
   * count; the chevron is added for you.
   */
  label?: ReactNode;
  /**
   * The convenience form: a list of items. A shorthand over `Menu.Item`
   * and never the only way in — an item with a keyboard hint beside it,
   * or a separator between groups, needs the parts.
   */
  items?: MenuItemDescriptor[];
  children?: ReactNode;
}

/**
 * Extra props land on the trigger, the only part of a menu that sits in
 * the page layout; the popup is positioned in a portal.
 */
export type MenuProps = MenuOwnProps &
  Omit<ComponentPropsWithRef<typeof BaseMenu.Trigger>, keyof MenuOwnProps>;

export type MenuItemProps = ComponentPropsWithRef<typeof BaseMenu.Item> & {
  /** Marks a destructive action. */
  danger?: boolean;
};
export type MenuSeparatorProps = ComponentPropsWithRef<
  typeof BaseMenu.Separator
>;
export type MenuGroupProps = ComponentPropsWithRef<typeof BaseMenu.Group>;
export type MenuGroupLabelProps = ComponentPropsWithRef<
  typeof BaseMenu.GroupLabel
>;

/**
 * **Use it for** a list of actions triggered from one control. **Reach for something else when** the items pick a value rather than act (Select).
 *
 * Dropdown menu on Base UI's menu root, composable.
 *
 * API: pass `items` for the common case, or compose `Menu.Item`,
 * `Menu.Separator`, `Menu.Group` and `Menu.GroupLabel` when the menu has
 * structure. Every part takes the attributes of the element it renders.
 *
 * Accessibility: Base UI renders the full menu pattern — trigger with
 * `aria-haspopup`/`aria-expanded`, roving focus, Arrow/Home/End/
 * Escape, and typeahead. Items announce `menuitem` within a labelled
 * menu.
 *
 * Performance: the popup mounts lazily on first open.
 *
 * ```tsx
 * <Menu label="Row actions">
 *   <Menu.Group>
 *     <Menu.GroupLabel>Edit</Menu.GroupLabel>
 *     <Menu.Item onClick={rename}>Rename</Menu.Item>
 *   </Menu.Group>
 *   <Menu.Separator />
 *   <Menu.Item danger onClick={remove}>Delete</Menu.Item>
 * </Menu>
 * ```
 */
export function Menu({
  label,
  items,
  className,
  children,
  ...rest
}: MenuProps) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        className={cxState("uix-button", className)}
        data-variant="outline"
        data-size="md"
        aria-haspopup="menu"
        {...rest}
      >
        {label}
        <ChevronDown size={16} aria-hidden />
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          className="uix-menu-positioner"
          sideOffset={6}
          align="end"
        >
          <BaseMenu.Popup className="uix-menu">
            {children ??
              (items ?? []).map((item) => (
                <MenuItem
                  key={item.id}
                  danger={item.danger}
                  disabled={item.disabled}
                  onClick={item.onSelect}
                >
                  {item.label}
                </MenuItem>
              ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

function MenuItem({ className, danger, ...rest }: MenuItemProps) {
  return (
    <BaseMenu.Item
      className={cxState("uix-menu-item", className)}
      data-danger={danger || undefined}
      {...rest}
    />
  );
}

function MenuSeparator({ className, ...rest }: MenuSeparatorProps) {
  return (
    <BaseMenu.Separator
      className={cxState("uix-menu-separator", className)}
      {...rest}
    />
  );
}

function MenuGroup({ className, ...rest }: MenuGroupProps) {
  return (
    <BaseMenu.Group
      className={cxState("uix-menu-group", className)}
      {...rest}
    />
  );
}

function MenuGroupLabel({ className, ...rest }: MenuGroupLabelProps) {
  return (
    <BaseMenu.GroupLabel
      className={cxState("uix-menu-group-label", className)}
      {...rest}
    />
  );
}

Menu.Item = MenuItem;
Menu.Separator = MenuSeparator;
Menu.Group = MenuGroup;
Menu.GroupLabel = MenuGroupLabel;
