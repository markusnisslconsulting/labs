"use client";

import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { cxState } from "../cx";

import "./Dialog.css";
interface DialogOwnProps {
  /**
   * Controlled. Optional now: a dialog opened from its own trigger has no
   * reason to make the caller hold a boolean.
   */
  open?: boolean;
  /** The uncontrolled half of the triple, which was missing. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Footer slot, typically action buttons. */
  footer?: ReactNode;
}

/**
 * Extra props land on the popup — the dialog surface itself, since the
 * root renders no element of its own.
 */
export type DialogProps = DialogOwnProps &
  Omit<ComponentPropsWithoutRef<typeof BaseDialog.Popup>, keyof DialogOwnProps>;

/**
 * **Use it for** a task that must be finished or abandoned before anything else. **Reach for something else when** the content is supplementary (Popover), or it is a yes/no decision (AlertDialog).
 *
 * Modal dialog on Base UI's dialog root.
 *
 * Accessibility: Base UI traps focus, restores it to the trigger on
 * close, wires `aria-modal`, `aria-labelledby`/`aria-describedby`,
 * and closes on Escape. The backdrop click closes as well.
 *
 * Performance: the popup mounts only when open.
 */
export function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  ...rest
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next) => onOpenChange?.(Boolean(next))}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="uix-dialog-backdrop" />
        <BaseDialog.Popup
          className={cxState("uix-dialog", className)}
          {...rest}
        >
          <BaseDialog.Title className="uix-dialog-title" id={titleId}>
            {title}
          </BaseDialog.Title>
          {description ? (
            <BaseDialog.Description
              className="uix-dialog-description"
              id={descriptionId}
            >
              {description}
            </BaseDialog.Description>
          ) : null}
          {children ? <div className="uix-dialog-body">{children}</div> : null}
          {footer ? <div className="uix-dialog-footer">{footer}</div> : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

interface AlertDialogOwnProps {
  /**
   * Controlled. Optional now: a dialog opened from its own trigger has no
   * reason to make the caller hold a boolean.
   */
  open?: boolean;
  /** The uncontrolled half of the triple, which was missing. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

/** Extra props land on the popup, as with Dialog. */
export type AlertDialogProps = AlertDialogOwnProps &
  Omit<
    ComponentPropsWithoutRef<typeof BaseDialog.Popup>,
    keyof AlertDialogOwnProps
  >;

/**
 * The confirm pattern: like Dialog, but `role="alertdialog"`, no
 * outside-close, and Escape still works — the decision is explicit.
 */
export function AlertDialog({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  ...rest
}: AlertDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next) => onOpenChange?.(Boolean(next))}
      modal
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="uix-dialog-backdrop" />
        <BaseDialog.Popup
          className={cxState("uix-dialog", className)}
          role="alertdialog"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          {...rest}
        >
          <BaseDialog.Title className="uix-dialog-title" id={titleId}>
            {title}
          </BaseDialog.Title>
          {description ? (
            <BaseDialog.Description
              className="uix-dialog-description"
              id={descriptionId}
            >
              {description}
            </BaseDialog.Description>
          ) : null}
          {children ? <div className="uix-dialog-body">{children}</div> : null}
          {footer ? <div className="uix-dialog-footer">{footer}</div> : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
