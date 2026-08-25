import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import { useId, type ReactNode } from "react";

export interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Footer slot, typically action buttons. */
  footer?: ReactNode;
}

/**
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
  onOpenChange,
  title,
  description,
  children,
  footer,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(next) => onOpenChange?.(Boolean(next))}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="uix-dialog-backdrop" />
        <BaseDialog.Popup className="uix-dialog">
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

export interface AlertDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * The confirm pattern: like Dialog, but `role="alertdialog"`, no
 * outside-close, and Escape still works — the decision is explicit.
 */
export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: AlertDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(next) => onOpenChange?.(Boolean(next))}
      modal
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="uix-dialog-backdrop" />
        <BaseDialog.Popup
          className="uix-dialog"
          role="alertdialog"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
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
