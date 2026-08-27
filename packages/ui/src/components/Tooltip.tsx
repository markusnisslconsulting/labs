"use client";

import type { ReactNode } from "react";

import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import { useId, useState, type ReactElement } from "react";

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
 * Accessibility: the announcement is **ours**, not Base UI's, and the
 * distinction is the whole reason this paragraph got rewritten. This used
 * to say Base UI announced the hint "(its own wiring)". Measured against
 * `1.0.0-rc.0` in the open state, the trigger's attributes were
 * `type,class,data-variant,data-tone,data-size,id,data-popup-open` — no
 * `aria-describedby` — and the popup carried no role. A tooltip with
 * neither is a floating box: sighted users see it, a screen reader is
 * told nothing at all.
 *
 * So the component sets `role="tooltip"` on the popup and points the
 * trigger's `aria-describedby` at it, and only while it is open — a
 * permanent reference to an unmounted popup is a dangling id, which is
 * the violation NumberField's steppers had. Both halves are asserted in
 * `packages/ui/browser/keyboard.spec.ts`.
 *
 * Escape closes, and positioning flips at viewport edges (floating-ui) —
 * the parts hand-rolling CSS gets wrong.
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

  /* The open state, mirrored, so the description can be attached only
     while there is something to point at.
     `aria-describedby` on a permanently-set reference to an unmounted
     popup is a dangling id, which axe reports and a screen reader acts
     on — the same violation NumberField's steppers had. So it goes on
     when the popup is up and comes off when it is not. */
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(
    Boolean(defaultOpen),
  );
  const isOpen = isControlled ? Boolean(open) : uncontrolledOpen;

  return (
    <BaseTooltip.Provider delay={0}>
      <BaseTooltip.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(next) => {
          if (!isControlled) setUncontrolledOpen(Boolean(next));
          onOpenChange?.(Boolean(next));
        }}
      >
        <BaseTooltip.Trigger
          className="uix-tooltip"
          /* The wiring that makes a tooltip a tooltip, and it was
             missing. Measured against Base UI 1.0.0-rc.0 in the open
             state: the trigger's attributes were
             type,class,data-variant,data-tone,data-size,id,data-popup-open
             — no aria-describedby anywhere, and the popup carried no
             role. So the tooltip's text reached no screen reader at all,
             while the component's own docs said Base UI announced it.
             The id was already being minted and handed to the popup, and
             then never referenced by anything: half the wiring, which is
             how this kind of gap survives review. */
          aria-describedby={isOpen ? id : undefined}
          render={children as ReactElement<Record<string, unknown>>}
        />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner
            side={placement}
            sideOffset={6}
            className="uix-tooltip-positioner"
          >
            <BaseTooltip.Popup
              className="uix-tooltip-content"
              id={id}
              role="tooltip"
            >
              {content}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}
