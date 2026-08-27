"use client";

import { ChevronRight } from "lucide-react";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cx } from "../cx";
import "./Tree.css";

export interface TreeNode {
  /** Stable identity. Also the key reported to every callback. */
  id: string;
  label: ReactNode;
  children?: TreeNode[];
  disabled?: boolean;
}

interface TreeOwnProps {
  nodes: TreeNode[];
  /**
   * What the tree is. Required.
   *
   * A tree with no name is announced as "tree" and nothing else, and a page
   * with two of them has two identical structures. "Folders" or
   * "Organisation" is the difference between finding the right one and
   * walking both.
   */
  label: string;
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (next: string[]) => void;
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (next: string) => void;
  /** Render a node's label yourself. */
  node?: (entry: TreeNode, depth: number) => ReactNode;
}

/**
 * **Use it for** a hierarchy the reader navigates — folders, an
 * organisation, a category system. **Reach for something else when** the
 * nesting is one level deep: that is a list with headings, and a tree makes
 * a promise about the keyboard that then has to be kept.
 *
 * ```tsx
 * <Tree label="Folders" nodes={folders} onSelectedChange={open} />
 * ```
 *
 * Accessibility: `role="tree"` with `treeitem` children, and **one tab stop
 * for the whole tree**. Arrows do the work: down and up move through the
 * visible items, right opens a closed branch or steps into an open one, left
 * closes an open branch or steps out to the parent, Home and End go to the
 * ends. That is the WAI-ARIA tree pattern, and it is the reason to reach for
 * this instead of nested lists — a hundred-node tree is one tab stop rather
 * than a hundred.
 *
 * `aria-level`, `aria-setsize` and `aria-posinset` are set on every item.
 * They are what let a reader say "level 3, 2 of 7" — a nested `<ul>` conveys
 * that visually and, once the items are `treeitem`s rather than
 * `listitem`s, conveys nothing at all without them.
 *
 * The chevron is `aria-hidden` and is not a button. Its state is
 * `aria-expanded` on the item, which is what a reader announces; a nested
 * button inside a `treeitem` would be a second tab stop per branch and a
 * second thing to announce, for a state the item already carries.
 */
export type TreeProps = TreeOwnProps &
  Omit<ComponentPropsWithRef<"div">, keyof TreeOwnProps | "children">;

/** One row of the flattened tree: what the keyboard actually moves through. */
interface Row {
  node: TreeNode;
  depth: number;
  /** 1-based position among its siblings, and how many there are. */
  position: number;
  size: number;
  parent?: string;
  open: boolean;
  branch: boolean;
}

/**
 * The visible rows, in order, with their level and position.
 *
 * Flattened rather than walked recursively at each key press. Arrow-down
 * from the last child of a collapsed-sibling branch has to land on the next
 * *visible* row, which is a question about the flattened list and an awkward
 * one about the tree — and `aria-posinset` needs the sibling count, which is
 * known here and not at the leaf.
 */
function flatten(
  nodes: TreeNode[],
  open: Set<string>,
  depth = 1,
  parent?: string,
): Row[] {
  const rows: Row[] = [];
  nodes.forEach((node, index) => {
    const branch = Boolean(node.children?.length);
    const isOpen = branch && open.has(node.id);
    rows.push({
      node,
      depth,
      position: index + 1,
      size: nodes.length,
      parent,
      open: isOpen,
      branch,
    });
    if (isOpen) {
      rows.push(...flatten(node.children!, open, depth + 1, node.id));
    }
  });
  return rows;
}

export function Tree({
  nodes,
  label,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  node: renderNode,
  className,
  ...rest
}: TreeProps) {
  const root = useRef<HTMLDivElement>(null);

  const [internalOpen, setInternalOpen] = useState<string[]>(defaultExpanded);
  const openIds = expanded ?? internalOpen;
  const open = useMemo(() => new Set(openIds), [openIds]);

  const [internalSelected, setInternalSelected] = useState<string | null>(
    defaultSelected,
  );
  const activeId = selected !== undefined ? selected : internalSelected;

  const rows = useMemo(() => flatten(nodes, open), [nodes, open]);

  /**
   * Which row is the tab stop.
   *
   * The selected one if it is visible, otherwise the first. A tree whose tab
   * stop is always the first row makes a reader walk back down to where they
   * were every time they leave and return.
   */
  const stopIndex = Math.max(
    0,
    rows.findIndex((row) => row.node.id === activeId),
  );

  const setOpen = useCallback(
    (next: string[]) => {
      if (expanded === undefined) setInternalOpen(next);
      onExpandedChange?.(next);
    },
    [expanded, onExpandedChange],
  );

  const select = useCallback(
    (id: string) => {
      if (selected === undefined) setInternalSelected(id);
      onSelectedChange?.(id);
    },
    [selected, onSelectedChange],
  );

  const focusRow = useCallback((id: string) => {
    root.current
      ?.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(id)}"]`)
      ?.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const id = (event.target as HTMLElement).dataset["nodeId"];
      if (!id) return;
      const here = rows.findIndex((row) => row.node.id === id);
      if (here < 0) return;
      const row = rows[here]!;

      const move = (index: number) => {
        const next = rows[index];
        if (!next) return;
        event.preventDefault();
        focusRow(next.node.id);
      };

      switch (event.key) {
        case "ArrowDown":
          move(here + 1);
          return;
        case "ArrowUp":
          move(here - 1);
          return;
        case "Home":
          move(0);
          return;
        case "End":
          move(rows.length - 1);
          return;
        case "ArrowRight":
          /* Open, then step in. Two presses rather than one, which is the
             pattern's own rule: it keeps "open this" and "go into this"
             separable for someone exploring a structure. */
          event.preventDefault();
          if (row.branch && !row.open) setOpen([...openIds, row.node.id]);
          else if (row.open) move(here + 1);
          return;
        case "ArrowLeft":
          event.preventDefault();
          if (row.open)
            setOpen(openIds.filter((entry) => entry !== row.node.id));
          else if (row.parent) focusRow(row.parent);
          return;
        case "Enter":
        case " ":
          event.preventDefault();
          if (!row.node.disabled) select(row.node.id);
          return;
        default:
          return;
      }
    },
    [rows, openIds, setOpen, select, focusRow],
  );

  /* eslint-disable jsx-a11y/interactive-supports-focus, jsx-a11y/click-events-have-key-events --
     Two rules, both right in general and both wrong for this pattern, and a
     scoped pair rather than per-line directives because ESLint does not read
     a directive written among JSX attributes — the first attempt put them
     there and produced two unused-directive warnings beside the two errors
     it was meant to silence.

     `interactive-supports-focus` wants the element carrying `role="tree"` to
     be focusable. Making it so would break the one property this component
     exists for. The tree pattern has two valid shapes: focus on the
     container with `aria-activedescendant`, or a roving tabindex on the
     items. This is the second, so exactly one *item* is focusable at a time
     and the container must not be — a focusable container is a second tab
     stop, and "a hundred-node tree is one tab stop" is the point. Asserted
     in `Tree.stories.tsx`: Tab enters the tree once and leaves it once.

     `click-events-have-key-events` wants a keyboard listener beside each
     click handler. The listener is on the tree rather than on each row, and
     it has to be: every key it handles needs the flattened list of visible
     rows, which only the container knows. One handler for N rows instead of
     N handlers that each need the whole tree. The rule checks per element
     and cannot see delegation; the keys are covered by four rows of the
     keyboard map in `browser/keyboard.spec.ts`. */
  return (
    <div
      ref={root}
      className={cx("uix-tree", className)}
      role="tree"
      aria-label={label}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {rows.map((row, index) => (
        <div
          key={row.node.id}
          className="uix-tree-item"
          role="treeitem"
          data-node-id={row.node.id}
          data-selected={row.node.id === activeId || undefined}
          data-disabled={row.node.disabled || undefined}
          /* The three that make a flat list of treeitems navigable. A
             nested <ul> conveys depth and position visually and, once the
             items are treeitems rather than listitems, conveys nothing
             without these. */
          aria-level={row.depth}
          aria-setsize={row.size}
          aria-posinset={row.position}
          aria-expanded={row.branch ? row.open : undefined}
          aria-selected={row.node.id === activeId || undefined}
          aria-disabled={row.node.disabled || undefined}
          /* One tab stop for the tree, on the selected row when there is
             one. Otherwise a reader walks back down to where they were
             every time they leave and return. */
          tabIndex={index === stopIndex ? 0 : -1}
          style={{ "--uix-tree-depth": row.depth } as React.CSSProperties}
          onClick={() => {
            if (row.node.disabled) return;
            select(row.node.id);
            if (row.branch) {
              setOpen(
                row.open
                  ? openIds.filter((entry) => entry !== row.node.id)
                  : [...openIds, row.node.id],
              );
            }
          }}
        >
          <span
            className="uix-tree-chevron"
            data-open={row.open || undefined}
            data-branch={row.branch || undefined}
            aria-hidden
          >
            {row.branch ? <ChevronRight size={14} /> : null}
          </span>
          <span className="uix-tree-label">
            {renderNode ? renderNode(row.node, row.depth) : row.node.label}
          </span>
        </div>
      ))}
    </div>
  );
}
/* eslint-enable jsx-a11y/interactive-supports-focus, jsx-a11y/click-events-have-key-events */
