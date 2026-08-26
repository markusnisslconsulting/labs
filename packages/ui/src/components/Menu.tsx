"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Menu as BaseMenu } from "@base-ui-components/react/menu";

import { cxState } from "../cx";

import "./_positioner.css";
import "./Button.css";
import "./Menu.css";
export interface MenuItem {
  id: string;
  label: string;
  onSelect?: () => void;
  danger?: boolean;
}

interface MenuOwnProps {
  /** Trigger label. */
  label: string;
  items: MenuItem[];
}

/**
 * Extra props land on the trigger, the only part of a menu that sits in
 * the page layout; the popup is positioned in a portal.
 */
export type MenuProps = MenuOwnProps &
  Omit<ComponentPropsWithoutRef<typeof BaseMenu.Trigger>, keyof MenuOwnProps>;

/**
 * **Use it for** a list of actions triggered from one control. **Reach for something else when** the items pick a value rather than act (Select).
 *
 * Dropdown menu on Base UI's menu root.
 *
 * Accessibility: Base UI renders the full menu pattern — trigger with
 * `aria-haspopup`/`aria-expanded`, roving focus, Arrow/Home/End/
 * Escape, and typeahead. Items announce `menuitem` within a labelled
 * menu.
 *
 * Performance: the popup mounts lazily on first open.
 */
export function Menu({ label, items, className, ...rest }: MenuProps) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        className={cxState("uix-button", className)}
        data-variant="outline"
        data-size="md"
        aria-haspopup="menu"
        {...rest}
      >
        {label} ▾
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          className="uix-menu-positioner"
          sideOffset={6}
          align="end"
        >
          <BaseMenu.Popup className="uix-menu">
            {items.map((item) => (
              <BaseMenu.Item
                key={item.id}
                className="uix-menu-item"
                data-danger={item.danger || undefined}
                onClick={item.onSelect}
              >
                {item.label}
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
