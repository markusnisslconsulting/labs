import { cloneElement, useId, type ReactElement } from "react";

export interface TooltipProps {
  /** Plain text; the tooltip is not a container for rich content. */
  content: string;
  /** The focusable trigger. It receives `aria-describedby` automatically. */
  children: ReactElement;
  placement?: "top" | "bottom";
}

/**
 * A text hint that appears on hover and on keyboard focus.
 *
 * Accessibility: the trigger is cloned with `aria-describedby` pointing
 * at the tooltip (`role="tooltip"`), and the wrapper uses
 * `:focus-within`, so keyboard users get the same hint as mouse users.
 *
 * Performance: visibility is pure CSS (opacity), zero JavaScript in
 * the interaction path.
 */
export function Tooltip({
  content,
  children,
  placement = "top",
}: TooltipProps) {
  const id = useId();

  return (
    <span className="uix-tooltip" data-placement={placement}>
      {cloneElement(children, { "aria-describedby": id } as Record<
        string,
        unknown
      >)}
      <span role="tooltip" id={id} className="uix-tooltip-content">
        {content}
      </span>
    </span>
  );
}
