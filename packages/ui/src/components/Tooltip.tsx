import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import { useId, type ReactElement } from "react";

export interface TooltipProps {
  /** Plain text; the tooltip is not a container for rich content. */
  content: string;
  /** The focusable trigger. It receives `aria-describedby` automatically. */
  children: ReactElement;
  placement?: "top" | "bottom";
  /** Mount the popup open (for tests and docs). */
  defaultOpen?: boolean;
}

/**
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
 */
export function Tooltip({
  content,
  children,
  placement = "top",
  defaultOpen,
}: TooltipProps) {
  const id = useId();

  return (
    <BaseTooltip.Provider delay={0}>
      <BaseTooltip.Root defaultOpen={defaultOpen}>
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
