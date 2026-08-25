import { useEffect } from "react";

type Severity = "info" | "success" | "warning" | "danger";

export interface ToastItem {
  id: string;
  severity: Severity;
  title: string;
  description?: string;
  /** Auto-dismiss after this many ms. Omit to require manual close. */
  timeout?: number;
}

export interface ToasterProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  /** Position of the stack. Default: bottom-right. */
  position?: "bottom-right" | "top-center";
}

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
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
      >
        ✕
      </button>
    </div>
  );
}

/**
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
}: ToasterProps) {
  return (
    <div
      className={`uix-toaster uix-toaster--${position.replace("-", "-")}`}
      aria-label="Notifications"
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
