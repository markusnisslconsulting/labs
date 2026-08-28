"use client";

import {
  createContext,
  useContext,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";

/**
 * What heading level the current position in the tree is at.
 *
 * The clearest case of a decision a component cannot make and a person used
 * to carry. `EmptyState` needs a heading. Whether that heading is an `h2` or
 * an `h4` depends on how deeply the caller nested it, which the component
 * has no way to know — so libraries do one of three things, and all three
 * are wrong on their own:
 *
 *   1. Hard-code a level. Every page that nests it differently now has a
 *      broken outline, and an outline is how a screen-reader user navigates
 *      a page they have never seen.
 *   2. Ask for the level as a prop. Correct, and it moves the problem to
 *      the caller, who is now the one who has to know the depth. It works
 *      while people write the pages, because a person looks at the screen
 *      they are building. It stops working when pages are generated one at
 *      a time by something with no view of the whole.
 *   3. Render a `div` with big text. The outline disappears entirely and
 *      nothing reports an error, because there is no rule that a page must
 *      have headings — only that the ones it has must be ordered.
 *
 * So the level comes from position instead. `Section` raises it for its
 * children; anything that renders a heading reads it. Nesting produces a
 * correct outline whether the nesting was written or generated, and neither
 * the component nor the caller has to know the depth.
 *
 * `EmptyState`'s `headingLevel` prop stays as it is, opt-in and explicit,
 * because an explicit answer must always beat an inferred one and because
 * whether that component has a heading at all is a question about the page.
 * A caller who wants it inferred passes `headingLevel={useHeadingLevel()}`.
 */
const HeadingLevelContext = createContext<1 | 2 | 3 | 4 | 5 | 6>(1);

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** The level at this point in the tree. `1` at the root. */
export function useHeadingLevel(): HeadingLevel {
  return useContext(HeadingLevelContext);
}

/**
 * Raise the level for a subtree.
 *
 * Clamped at 6, because HTML has no `h7` and the alternative to clamping is
 * an element the browser treats as unknown. A page nested seven deep has a
 * structural problem that a silent `h6` at least keeps navigable.
 */
export function HeadingLevelProvider({
  level,
  children,
}: {
  level: HeadingLevel;
  children: ReactNode;
}) {
  return (
    <HeadingLevelContext.Provider value={level}>
      {children}
    </HeadingLevelContext.Provider>
  );
}

export type HeadingProps = ComponentPropsWithRef<"h2"> & {
  /** Override the level from context. An explicit answer wins. */
  level?: HeadingLevel;
};

/**
 * A heading at the level this position implies.
 *
 * Use it anywhere a heading is needed and the depth is not knowable locally,
 * which in an application is nearly everywhere.
 */
export function Heading({ level, children, ...rest }: HeadingProps) {
  const fromContext = useHeadingLevel();
  const resolved = level ?? fromContext;
  const Tag = `h${resolved}` as "h1";
  return <Tag {...rest}>{children}</Tag>;
}

/** Next level down, clamped. Exported for components that nest their own. */
export function nextHeadingLevel(level: HeadingLevel): HeadingLevel {
  return (level < 6 ? level + 1 : 6) as HeadingLevel;
}
