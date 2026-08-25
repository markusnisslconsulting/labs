import type { ReactNode } from "react";
import { Popover as BasePopover } from "@base-ui-components/react/popover";

export interface PopoverProps {
  /** Trigger label. */
  trigger: string;
  title?: string;
  children: ReactNode;
}

/**
 * A non-modal floating container (details, forms, filters) on Base
 * UI's popover: focus is trapped while open, Escape closes, the
 * trigger gets `aria-expanded`/`aria-haspopup`, and positioning flips
 * at viewport edges.
 *
 * Performance: the popup mounts lazily on first open.
 */
export function Popover({ trigger, title, children }: PopoverProps) {
  return (
    <BasePopover.Root>
      <BasePopover.Trigger
        className="uix-button"
        data-variant="outline"
        data-size="md"
        aria-haspopup="dialog"
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
