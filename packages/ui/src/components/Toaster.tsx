"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";

import { cx } from "../cx";
import { useStrings } from "../i18n";
import "./Toaster.css";
type Severity = "info" | "success" | "warning" | "danger";

export interface ToastItem {
  id: string;
  severity: Severity;
  title: ReactNode;
  description?: ReactNode;
  /** Auto-dismiss after this many ms. Omit to require manual close. */
  timeout?: number;
}

interface ToasterOwnProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  /** Position of the stack. Default: bottom-right. */
  position?: "bottom-right" | "top-center";
}

/**
 * Accepts every attribute of `<div>` in addition to the props below;
 * `className` merges with the component's own class rather than
 * replacing it, and the rest land on the root element.
 */
export type ToasterProps = ToasterOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof ToasterOwnProps>;

const roleFor: Record<Severity, "status" | "alert"> = {
  info: "status",
  success: "status",
  warning: "alert",
  danger: "alert",
};

function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const labels = useStrings();
  return (
    <div
      className="uix-toast"
      data-severity={toast.severity}
      role={roleFor[toast.severity]}
    >
      <div className="uix-toast-body">
        <strong className="uix-toast-title">{toast.title}</strong>
        {toast.description ? (
          <div className="uix-toast-description">{toast.description}</div>
        ) : null}
      </div>
      <button
        type="button"
        className="uix-toast-close"
        aria-label={labels.dismiss}
        onClick={() => onDismiss(toast.id)}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}

/**
 * **Use it for** confirming something that already happened, without interrupting. **Reach for something else when** the reader must act on it (Dialog or Alert).
 *
 * The toast stack, fully controlled: the app owns the queue, the
 * Toaster renders it and reports dismissals (manual or via timeout).
 *
 * Accessibility: one region per severity role — success/info announce
 * politely, warning/danger assertively. The stack is a labelled
 * region, so screen reader users can revisit it.
 *
 * Performance: timeouts run per toast; a dismissed toast removes one
 * node. No polling, no animation loop.
 */
export function Toaster({
  toasts,
  onDismiss,
  position = "bottom-right",
  className,
  ...rest
}: ToasterProps) {
  const labels = useStrings();
  return (
    <div
      className={cx(
        `uix-toaster uix-toaster--${position.replace("-", "-")}`,
        className,
      )}
      /*
       * A labelled div is not a landmark. Without a role, the container
       * had an accessible name that nothing could navigate to: a screen
       * reader user could not jump to their notifications, and a test
       * could not find them either. `region` is the landmark for "a
       * named part of the page", and it needs the name it already had.
       */
      role="region"
      aria-label={labels.notifications}
      {...rest}
    >
      {toasts.map((toast) => (
        <ToastWithTimeout key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastWithTimeout({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  // Ein Timer pro Toast, einmalig: ohne Effect wuerde jedes Re-Render
  // den Timeout neu stellen und den Toast vorzeitig entfernen.
  useEffect(() => {
    if (!toast.timeout) return;
    const handle = window.setTimeout(() => onDismiss(toast.id), toast.timeout);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id, toast.timeout]);
  return <Toast toast={toast} onDismiss={onDismiss} />;
}
