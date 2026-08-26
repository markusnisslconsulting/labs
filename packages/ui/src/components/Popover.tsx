"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Popover as BasePopover } from "@base-ui-components/react/popover";

import { cxState } from "../cx";
import "./_positioner.css";
import "./Button.css";
import "./Popover.css";
interface PopoverOwnProps {
  /** Trigger label. */
  /** The trigger's content. A node, so it can carry an icon or a count. */
  trigger: ReactNode;
  title?: ReactNode;
  children: ReactNode;
}

/**
 * Extra props land on the trigger, the only part that sits in the page
 * layout; the popup is positioned in a portal.
 */
export type PopoverProps = PopoverOwnProps &
  Omit<
    ComponentPropsWithoutRef<typeof BasePopover.Trigger>,
    keyof PopoverOwnProps
  >;

/**
 * **Use it for** detail or a small form without blocking the page. **Reach for something else when** the task must be completed first (Dialog).
 *
 * A non-modal floating container (details, forms, filters) on Base
 * UI's popover: focus is trapped while open, Escape closes, the
 * trigger gets `aria-expanded`/`aria-haspopup`, and positioning flips
 * at viewport edges.
 *
 * Performance: the popup mounts lazily on first open.
 *
 * Accessibility: Base UI wires the trigger's `aria-haspopup` and
 * `aria-expanded`, moves focus into the popup, traps it while open,
 * closes on Escape and returns focus to the trigger. The popup is
 * labelled by its title when there is one. It is non-modal: the page
 * behind stays readable, which is the difference from Dialog.
 */
export function Popover({
  trigger,
  title,
  children,
  className,
  ...rest
}: PopoverProps) {
  return (
    <BasePopover.Root>
      <BasePopover.Trigger
        className={cxState("uix-button", className)}
        data-variant="outline"
        data-size="md"
        aria-haspopup="dialog"
        {...rest}
      >
        {trigger}
      </BasePopover.Trigger>
      <BasePopover.Portal>
        <BasePopover.Positioner
          className="uix-menu-positioner"
          sideOffset={6}
          align="end"
        >
          <BasePopover.Popup className="uix-popover">
            {title ? (
              <BasePopover.Title className="uix-popover-title">
                {title}
              </BasePopover.Title>
            ) : null}
            <BasePopover.Description className="uix-popover-body">
              {children}
            </BasePopover.Description>
            <div className="uix-popover-footer">
              <BasePopover.Close
                className="uix-button"
                data-variant="outline"
                data-size="sm"
              >
                Close
              </BasePopover.Close>
            </div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
