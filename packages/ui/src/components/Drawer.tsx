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

import "./Drawer.css";

interface DrawerOwnProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Which edge it comes from.
   *
   * `"inline-end"` by default, which is the right-hand side in a
   * left-to-right reading direction and the left in Arabic or Hebrew.
   * Logical rather than `"left"`/`"right"` because a details panel belongs
   * on the side the reading ends on, and that is not a fixed edge of the
   * screen. `"block-end"` is the sheet that comes up from the bottom, which
   * is what a narrow viewport usually wants.
   */
  side?: "inline-start" | "inline-end" | "block-end";
  /**
   * Whether the page behind is inert while this is open.
   *
   * A drawer is the case where the answer is genuinely sometimes no. A
   * filter panel beside a list is meant to be used *with* the list, and
   * making the list inert defeats it; a details panel that has to be
   * finished or dismissed is modal like a dialog.
   *
   * `"trap-focus"` keeps the keyboard inside without making the rest
   * inert. Not the default, because a non-modal panel that traps focus is
   * the worst of the three: it looks dismissible and cannot be tabbed out
   * of.
   */
  modal?: boolean | "trap-focus";
  title: string;
  description?: string;
  children?: ReactNode;
  /** Footer slot, typically action buttons. */
  footer?: ReactNode;
  /**
   * How wide, or how tall for `block-end`. Any CSS length.
   *
   * Defaults to a readable measure rather than a fraction of the viewport.
   * A drawer at `40vw` is a comfortable panel on a laptop and a 600px-wide
   * column of two-word lines on a wide monitor, and line length is the
   * thing that decides whether a panel is readable.
   */
  size?: string;
}

/**
 * **Use it for** a panel of detail or controls beside the thing it belongs
 * to — filters for a list, the record behind a row, a form that keeps its
 * context visible. **Reach for something else when** the task must be
 * finished or abandoned before anything else: that is `Dialog`, and it
 * should cover the page rather than sit beside it.
 *
 * ```tsx
 * <Drawer title="Filters" modal={false} open={open} onOpenChange={setOpen}>
 *   <Form>…</Form>
 * </Drawer>
 * ```
 *
 * Accessibility: the modal half is this library's rather than Base UI's,
 * for the reason recorded on `Dialog` — measured against Base UI
 * `1.0.0-rc.0` the popup had `role="dialog"` and nothing else, so
 * `aria-modal` and `inert` on every sibling branch are wired here and
 * `browser/focus.spec.ts` holds them down.
 *
 * `modal` matters more here than on a dialog, because a drawer has a real
 * non-modal use. A filter panel beside a list is meant to be used *with*
 * the list; making the list inert defeats the panel's whole purpose. The
 * three values are the three honest answers, and the default is modal
 * because a panel that silently leaves the page operable while looking
 * like it does not is the surprise.
 *
 * Performance: the popup mounts only when open.
 */
export type DrawerProps = DrawerOwnProps &
  Omit<ComponentPropsWithRef<typeof BaseDialog.Popup>, keyof DrawerOwnProps>;

export function Drawer({
  open,
  defaultOpen,
  onOpenChange,
  side = "inline-end",
  modal = true,
  title,
  description,
  children,
  footer,
  size,
  className,
  ...rest
}: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [popup, setPopup] = useState<HTMLElement | null>(null);

  /* Base UI's `modal` did nothing in this rc, so both halves of "modal"
     are wired here: aria-modal on the popup, inert on everything else. */
  useInertBackground(modal === true && Boolean(popup), popup);

  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      modal={modal}
      onOpenChange={(next) => onOpenChange?.(Boolean(next))}
    >
      <BaseDialog.Portal>
        {/* No backdrop when not modal. A scrim over a page that is still
            operable tells the reader the opposite of the truth, and it
            swallows the clicks it looks like it is inviting. */}
        {modal === true ? (
          <BaseDialog.Backdrop className="uix-drawer-backdrop" />
        ) : null}
        <BaseDialog.Popup
          ref={setPopup}
          className={cxState("uix-drawer", className)}
          data-side={side}
          aria-modal={modal === true ? true : undefined}
          style={
            size
              ? ({
                  "--uix-drawer-size": size,
                } as React.CSSProperties)
              : undefined
          }
          {...rest}
        >
          <BaseDialog.Title className="uix-drawer-title" id={titleId}>
            {title}
          </BaseDialog.Title>
          {description ? (
            <BaseDialog.Description
              className="uix-drawer-description"
              id={descriptionId}
            >
              {description}
            </BaseDialog.Description>
          ) : null}
          {children ? <div className="uix-drawer-body">{children}</div> : null}
          {footer ? <div className="uix-drawer-footer">{footer}</div> : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
