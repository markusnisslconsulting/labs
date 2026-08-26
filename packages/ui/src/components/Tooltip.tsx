"use client";

import type { ReactNode } from "react";

import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import { useId, type ReactElement } from "react";

import "./Tooltip.css";
export interface TooltipProps {
  /** Plain text; the tooltip is not a container for rich content. */
  /** A node: a tooltip often needs a keyboard hint or emphasis. */
  content: ReactNode;
  /** The focusable trigger. It receives `aria-describedby` automatically. */
  children: ReactElement;
  placement?: "top" | "bottom";
  /** Mount the popup open (for tests and docs). */
  /** Controlled: a tooltip driven by something other than the pointer. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * **Use it for** naming an icon-only control, or a short hint. **Reach for something else when** the content is essential or interactive (put it in the page).
 *
 * A text hint on hover and keyboard focus, positioned by Base UI
 * (floating-ui): flips at viewport edges, so it never leaves the
 * window the way absolute CSS positioning did.
 *
 * Accessibility: Base UI announces the hint on hover and keyboard
 * focus (its own wiring), Escape closes, and positioning flips at
 * viewport edges (floating-ui) — the parts hand-rolling CSS gets
 * wrong.
 *
 * Performance: the popup mounts lazily on first interaction and
 * positioning runs on the transform level via floating-ui.
 *
 * API note: this is the one component that takes no `className` or
 * pass-through attributes, because it renders no element of its own —
 * the trigger IS the caller's element, handed to Base UI's `render`.
 * Style the trigger where you create it.
 */
export function Tooltip({
  content,
  children,
  placement = "top",
  open,
  defaultOpen,
  onOpenChange,
}: TooltipProps) {
  const id = useId();

  return (
    <BaseTooltip.Provider delay={0}>
      <BaseTooltip.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        <BaseTooltip.Trigger
          className="uix-tooltip"
          render={children as ReactElement<Record<string, unknown>>}
        />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner
            side={placement}
            sideOffset={6}
            className="uix-tooltip-positioner"
          >
            <BaseTooltip.Popup className="uix-tooltip-content" id={id}>
              {content}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}
