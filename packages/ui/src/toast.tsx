"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Toaster, type ToastItem } from "./components/Toaster";

/**
 * Notifications as a service, not as state a caller has to hold.
 *
 * `Toaster` took a `toasts` array and an `onDismiss`, which means every
 * consumer had to keep a list in state, mint unique ids, remove entries on
 * dismiss, and mount the Toaster somewhere sensible. Four pieces of
 * bookkeeping to say "the save worked", repeated in every application —
 * and a notification does not come from the component tree, it comes from
 * whatever just finished. That mismatch is why every real toast system
 * offers a function.
 *
 * The controlled API stays. Some screens genuinely own their
 * notifications — an inbox, a rules engine replaying its results — and for
 * those, passing the list is the honest shape. This is the other case.
 *
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * const toast = useToast();
 * toast.success("Reorder point saved");
 * toast.danger("Could not reach the supplier", { timeout: 0 });
 * ```
 */
export interface ToastOptions {
  description?: ReactNode;
  /**
   * Milliseconds before it disappears. `0` means it stays until dismissed,
   * which is the right default for an error: an error that vanishes on its
   * own is an error nobody read.
   */
  timeout?: number;
}

export interface ToastApi {
  info: (title: ReactNode, options?: ToastOptions) => string;
  success: (title: ReactNode, options?: ToastOptions) => string;
  warning: (title: ReactNode, options?: ToastOptions) => string;
  danger: (title: ReactNode, options?: ToastOptions) => string;
  /** Remove one by the id the show call returned. */
  dismiss: (id: string) => void;
  /** Remove everything, for a route change. */
  clear: () => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Defaults per severity: the two that report failure stay put. */
const DEFAULT_TIMEOUT: Record<ToastItem["severity"], number> = {
  info: 6000,
  success: 4000,
  warning: 0,
  danger: 0,
};

export function ToastProvider({
  children,
  position,
  max = 4,
}: {
  children: ReactNode;
  position?: "bottom-right" | "top-center";
  /**
   * How many are shown at once. Beyond this the oldest goes, because a
   * stack taller than the viewport hides the newest message behind the
   * ones the reader has already seen.
   */
  max?: number;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // Not Math.random or Date.now for the id: a counter cannot collide, and
  // two notifications raised in the same millisecond is exactly what a
  // failing batch does.
  const nextId = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (
      severity: ToastItem["severity"],
      title: ReactNode,
      options?: ToastOptions,
    ) => {
      nextId.current += 1;
      const id = `toast-${nextId.current}`;
      const toast: ToastItem = {
        id,
        severity,
        title,
        ...(options?.description === undefined
          ? {}
          : { description: options.description }),
        timeout: options?.timeout ?? DEFAULT_TIMEOUT[severity],
      };
      setToasts((current) => [...current, toast].slice(-max));
      return id;
    },
    [max],
  );

  const api = useMemo<ToastApi>(
    () => ({
      info: (title, options) => show("info", title, options),
      success: (title, options) => show("success", title, options),
      warning: (title, options) => show("warning", title, options),
      danger: (title, options) => show("danger", title, options),
      dismiss,
      clear: () => setToasts([]),
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} position={position} />
    </ToastContext.Provider>
  );
}

/**
 * The notification function.
 *
 * Throws rather than returning a no-op when there is no provider: a
 * silently swallowed notification is the failure mode where a save reports
 * success by saying nothing at all.
 */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error(
      "useToast was called outside a ToastProvider, so this notification " +
        "would go nowhere. Wrap the application in <ToastProvider>.",
    );
  }
  return api;
}
