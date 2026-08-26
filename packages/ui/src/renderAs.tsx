import { cloneElement, isValidElement, type ReactElement } from "react";

import { cx } from "./cx";

/**
 * The polymorphism convention, in one place.
 *
 * The case it exists for is a control that has to be a different element:
 * a link that looks like a button, a card that is a whole clickable
 * region, a chip rendered as a label. Without it the only way to get one
 * is to copy the class names, and copied class names are how a design
 * system starts losing.
 *
 * `renderAs` takes the element to render — `renderAs={<a href="/x" />}` —
 * which is the convention Base UI uses. Matching it matters more than the
 * name does: a library with an `as` prop here and a `render` prop there
 * has two mental models and no reason for either.
 *
 * Button had this and nothing else did, so the convention existed once
 * and could not be relied on. The merge rules below were also Button's
 * alone, and they are the part worth keeping consistent:
 *
 *   - The caller's own props win over the ones we pass, because the
 *     caller wrote them second and more specifically.
 *   - `className` is merged, never replaced, in both directions: ours,
 *     the caller's on the component, and the element's own.
 *   - Children come from the component, so a Button's spinner and icon
 *     slots still work when it renders an anchor.
 */
export type Renderable = ReactElement<Record<string, unknown>>;

export function renderAsElement(
  element: Renderable | undefined,
  ownClass: string,
  props: Record<string, unknown>,
  children: React.ReactNode,
): ReactElement | null {
  if (!element || !isValidElement(element)) return null;

  const own = element.props as Record<string, unknown>;
  const { className, ...rest } = props;

  return cloneElement(element, {
    ...rest,
    ...own,
    className: cx(
      ownClass,
      className as string | undefined,
      own["className"] as string | undefined,
    ),
    children,
  });
}
