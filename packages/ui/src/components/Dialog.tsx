"use client";

import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import {
  useId,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";

import { cxState } from "../cx";
import { useInertBackground } from "../useInertBackground";

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
  /**
   * Whether the page behind is inert while this is open.
   *
   * `true` is the default and the reason this prop exists: the component
   * never passed anything, Base UI's root was left on its own default, and
   * the result was a dialog with `role="dialog"`, no `aria-modal`, nothing
   * inert behind it and no focus trap — while this component's own
   * documentation claimed it wired `aria-modal`. A keyboard user could tab
   * straight out of the dialog into the page it was covering.
   *
   * `"trap-focus"` keeps focus inside without making the rest of the page
   * inert, which is what a non-blocking side panel wants.
   */
  modal?: boolean | "trap-focus";
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
  Omit<ComponentPropsWithRef<typeof BaseDialog.Popup>, keyof DialogOwnProps>;

/**
 * **Use it for** a task that must be finished or abandoned before anything else. **Reach for something else when** the content is supplementary (Popover), or it is a yes/no decision (AlertDialog).
 *
 * Modal dialog on Base UI's dialog root.
 *
 * Accessibility: Base UI restores focus to the trigger on close, wires
 * `aria-labelledby`/`aria-describedby`, and closes on Escape or a
 * backdrop click.
 *
 * The modal half is ours. Measured against `1.0.0-rc.0` the popup had
 * `role="dialog"` and nothing else: no `aria-modal`, nothing inert behind
 * it, no focus trap — so a keyboard user could tab out of the dialog into
 * the page it was covering and operate it. Passing Base UI's own `modal`
 * prop changed none of that, so this component sets `aria-modal` and
 * marks every branch outside the popup `inert` while it is open, and
 * `browser/focus.spec.ts` holds that down. This paragraph previously
 * claimed the behaviour as Base UI's, which is how an unimplemented
 * guarantee survives a review.
 *
 * Performance: the popup mounts only when open.
 */
export function Dialog({
  open,
  defaultOpen,
  modal = true,
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
  const [popup, setPopup] = useState<HTMLElement | null>(null);

  // Base UI's `modal` did nothing in this rc, so the two halves of "modal"
  // are wired here: aria-modal on the popup, and inert on everything else.
  useInertBackground(modal !== false && Boolean(popup), popup);

  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      modal={modal}
      onOpenChange={(next) => onOpenChange?.(Boolean(next))}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="uix-dialog-backdrop" />
        <BaseDialog.Popup
          ref={setPopup}
          className={cxState("uix-dialog", className)}
          aria-modal={modal === false ? undefined : true}
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
    ComponentPropsWithRef<typeof BaseDialog.Popup>,
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
