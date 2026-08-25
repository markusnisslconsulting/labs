import type { ReactNode, ComponentPropsWithoutRef } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

import { cx } from "../cx";
import "./Alert.css";
type Severity = "info" | "success" | "warning" | "danger";

interface AlertOwnProps {
  severity: Severity;
  title?: string;
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
  Omit<ComponentPropsWithoutRef<"div">, keyof AlertOwnProps>;

const roleFor: Record<Severity, "status" | "alert"> = {
  info: "status",
  success: "status",
  warning: "alert",
  danger: "alert",
};

/**
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
  dismissLabel = "Dismiss",
  className,
  ...rest
}: AlertProps) {
  return (
    <div
      className={cx("uix-alert", className)}
      data-severity={severity}
      role={roleFor[severity]}
      aria-label={title}
      {...rest}
    >
      <div className="uix-alert-body">
        {title ? <strong className="uix-alert-title">{title}</strong> : null}
        {children}
      </div>
      {onDismiss ? (
        <Button
          variant="ghost"
          size="sm"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <X size={14} />
        </Button>
      ) : null}
    </div>
  );
}
