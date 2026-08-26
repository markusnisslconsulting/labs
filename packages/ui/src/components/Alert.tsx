"use client";

import type { ReactNode, ComponentPropsWithRef } from "react";
import { useId } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

import { cx } from "../cx";
import { useStrings } from "../i18n";
import "./Alert.css";
type Severity = "info" | "success" | "warning" | "danger";

interface AlertOwnProps {
  severity: Severity;
  title?: ReactNode;
  children: ReactNode;
  /** When provided, a dismiss button renders and calls this. */
  onDismiss?: () => void;
  dismissLabel?: string;
}

/**
 * Accepts every attribute of `<div>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type AlertProps = AlertOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof AlertOwnProps>;

const roleFor: Record<Severity, "status" | "alert"> = {
  info: "status",
  success: "status",
  warning: "alert",
  danger: "alert",
};

/**
 * **Use it for** feedback about what the user just did, next to the thing they did it to. **Reach for something else when** the message concerns the whole view (Banner).
 *
 * Inline feedback.
 *
 * Accessibility: `warning` and `danger` render `role="alert"`
 * (assertive — something needs attention now); `info` and `success`
 * render `role="status"` (polite). Severity is always repeated in
 * the title/text, never carried by colour alone.
 *
 * Performance: static markup; dismissing removes one node.
 */
export function Alert({
  severity,
  title,
  children,
  onDismiss,
  dismissLabel,
  className,
  ...rest
}: AlertProps) {
  const labels = useStrings();
  const titleId = useId();

  return (
    <div
      className={cx("uix-alert", className)}
      data-severity={severity}
      role={roleFor[severity]}
      /* Labelled by the visible title rather than by a copy of it in an
         aria-label. That was needed once `title` became a node — an
         aria-label can only be a string — and it is the better wiring
         anyway: an aria-label duplicating visible text is a second
         version of the same words that can drift out of step with it. */
      aria-labelledby={title ? titleId : undefined}
      {...rest}
    >
      <div className="uix-alert-body">
        {title ? (
          <strong className="uix-alert-title" id={titleId}>
            {title}
          </strong>
        ) : null}
        {children}
      </div>
      {onDismiss ? (
        <Button
          className="uix-alert-dismiss"
          variant="ghost"
          size="sm"
          aria-label={dismissLabel ?? labels.dismiss}
          onClick={onDismiss}
        >
          <X size={14} />
        </Button>
      ) : null}
    </div>
  );
}
