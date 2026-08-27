"use client";

import {
  useCallback,
  useRef,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cx } from "../cx";
import "./Toolbar.css";

interface ToolbarOwnProps {
  /**
   * What this set of controls is for. Required.
   *
   * A toolbar with no name is announced as "toolbar" and nothing else, and
   * a page with two of them then has two identical landmarks. "Table
   * actions" or "Text formatting" is the difference between finding the
   * right one and cycling through both.
   */
  label: string;
  children: ReactNode;
  orientation?: "horizontal" | "vertical";
}

/**
 * **Use it for** a row of controls that act on the same thing — the
 * actions above a table, the formatting controls over an editor. **Reach
 * for something else when** the controls are unrelated: a `div` with a gap
 * is the right amount of structure for two buttons that happen to sit near
 * each other, and a toolbar makes a promise about the keyboard that then
 * has to be kept.
 *
 * ```tsx
 * <Toolbar label="Table actions">
 *   <Button>Export</Button>
 *   <SplitButton label="Save" menuLabel="More save options" items={…} />
 *   <Toolbar.Separator />
 *   <IconButton label="Settings" icon={<Cog />} />
 * </Toolbar>
 * ```
 *
 * Accessibility: `role="toolbar"` with a name, and **one tab stop for the
 * whole group**. That second part is the entire reason to reach for this
 * instead of a `div`. Eight buttons in a row are eight tab stops on the way
 * to the content below them; a toolbar is one, and the arrow keys move
 * between the controls inside it. That is what WAI-ARIA's toolbar pattern
 * is for, and it is the thing a styled `div` cannot give you.
 *
 * The roving tabindex is computed from the DOM rather than from a list the
 * caller maintains: children are arbitrary, a `SplitButton` contributes two
 * controls, and a disabled control has to be skipped. Anything derived from
 * a prop would disagree with what is on screen the first time a control is
 * conditionally rendered.
 *
 * Home and End go to the first and last enabled control. Arrow keys wrap,
 * because a toolbar is a closed set and stopping at the end just means
 * pressing the other arrow six times.
 */
export type ToolbarProps = ToolbarOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof ToolbarOwnProps>;

/** Focusable descendants, in DOM order, skipping the disabled ones. */
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Toolbar({
  label,
  children,
  orientation = "horizontal",
  className,
  ...rest
}: ToolbarProps) {
  const root = useRef<HTMLDivElement>(null);

  /**
   * The controls, read from the DOM at the moment of the key press.
   *
   * Not from a prop and not memoised. A toolbar's children are arbitrary —
   * one `SplitButton` is two controls, a conditional control appears and
   * disappears, and a disabled one has to drop out of the ring. Any list
   * built ahead of time is a list that disagrees with the screen, and the
   * disagreement shows up as an arrow key that moves focus nowhere.
   */
  const controls = useCallback(
    () =>
      Array.from(
        root.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter((node) => node.getAttribute("aria-hidden") !== "true"),
    [],
  );

  /**
   * One tab stop for the group.
   *
   * Every control is `tabindex="-1"` except the one that would receive
   * focus, and that assignment is done here rather than in each child
   * because the children are the caller's and this component cannot ask
   * them to cooperate. Run on focus rather than on mount: a control added
   * later has to join the ring, and there is no render of ours to hang it
   * on.
   */
  const rove = useCallback(
    (active: HTMLElement | null) => {
      const all = controls();
      const target = active && all.includes(active) ? active : all[0];
      for (const node of all) {
        node.tabIndex = node === target ? 0 : -1;
      }
    },
    [controls],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const all = controls();
      if (!all.length) return;

      const forward = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
      const back = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";

      /* Only these five, and nothing else is intercepted. A toolbar that
         swallowed other keys would break the controls inside it — a text
         input in a toolbar still needs its own arrows. */
      let next: HTMLElement | undefined;
      const here = all.indexOf(document.activeElement as HTMLElement);
      if (event.key === forward) {
        next = all[(here + 1 + all.length) % all.length];
      } else if (event.key === back) {
        next = all[(here - 1 + all.length) % all.length];
      } else if (event.key === "Home") {
        next = all[0];
      } else if (event.key === "End") {
        next = all[all.length - 1];
      } else {
        return;
      }

      event.preventDefault();
      if (next) {
        rove(next);
        next.focus();
      }
    },
    [controls, orientation, rove],
  );

  return (
    <div
      ref={root}
      className={cx("uix-toolbar", className)}
      data-orientation={orientation}
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation === "vertical" ? "vertical" : undefined}
      onKeyDown={onKeyDown}
      /* Capturing, so the ring is set before the browser decides where a
         click or a Tab lands. `onFocus` on the container fires for focus
         moving into any descendant, which is exactly the moment the group
         needs one stop and the rest none. */
      onFocus={(event) => rove(event.target as HTMLElement)}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * A rule between two groups of controls.
 *
 * `aria-hidden` and no role: a separator inside a toolbar is a visual
 * grouping, and announcing it as a separator interrupts a reader walking
 * the controls without telling them anything they can act on. It is also
 * skipped by the roving ring, because it is not a control.
 */
function ToolbarSeparator({
  className,
  ...rest
}: ComponentPropsWithRef<"span">) {
  return (
    <span
      className={cx("uix-toolbar-separator", className)}
      aria-hidden
      {...rest}
    />
  );
}

/**
 * A group of related controls inside the toolbar.
 *
 * Layout only, and deliberately not a nested `role="group"`: nesting groups
 * inside a toolbar makes a reader announce a level for every visual cluster,
 * and the clusters are for the eye.
 */
function ToolbarGroup({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("uix-toolbar-group", className)} {...rest} />;
}

Toolbar.Separator = ToolbarSeparator;
Toolbar.Group = ToolbarGroup;
