"use client";

import { useEffect } from "react";

/**
 * Make everything behind a modal inert while it is open.
 *
 * This exists because the guarantee was claimed and not delivered.
 * Dialog's own documentation said it wired `aria-modal`; measured, the
 * popup had `role="dialog"`, no `aria-modal`, nothing inert behind it, and
 * no focus trap — a keyboard user could tab out of the dialog into the
 * page it was covering and operate it. Passing Base UI's `modal` prop
 * explicitly changed nothing in `1.0.0-rc.0`, so the behaviour is
 * implemented here rather than waited for.
 *
 * `inert` is the right primitive and not a substitute for a focus trap:
 * it removes a subtree from the tab order, from the accessibility tree
 * and from pointer events in one attribute, which is exactly the set of
 * things a modal has to take away. A trap that only moves focus back
 * still leaves the background readable to a screen reader and clickable
 * by a mouse.
 *
 * What it marks: every child of `<body>` except the one containing the
 * popup. Portalled popups are body children themselves, so the rule is
 * "everything but the branch I am in" rather than a list of app roots —
 * a list is a thing that goes out of date with the host.
 */
export function useInertBackground(active: boolean, popup: Element | null) {
  useEffect(() => {
    if (!active) return;

    const body = document.body;
    const marked: Element[] = [];

    for (const child of Array.from(body.children)) {
      if (popup && child.contains(popup)) continue;
      // Never fight another modal that got here first.
      if (child.hasAttribute("inert")) continue;
      child.setAttribute("inert", "");
      marked.push(child);
    }

    return () => {
      for (const child of marked) child.removeAttribute("inert");
    };
  }, [active, popup]);
}
