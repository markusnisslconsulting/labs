import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tree, type TreeNode } from "./Tree";

const meta = {
  title: "Components/Tree",
  component: Tree,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

const FOLDERS: TreeNode[] = [
  {
    id: "eu",
    label: "European Union",
    children: [
      {
        id: "eu-textiles",
        label: "Textiles",
        children: [
          { id: "eu-textiles-north", label: "Northwind Textiles" },
          { id: "eu-textiles-adria", label: "Adria Components" },
        ],
      },
      { id: "eu-packaging", label: "Packaging" },
    ],
  },
  {
    id: "uk",
    label: "United Kingdom",
    children: [{ id: "uk-metals", label: "Kestrel Metals" }],
  },
  { id: "ch", label: "Switzerland", disabled: true },
];

/**
 * Collapsed, part-open, deep, and with an unreachable branch.
 *
 * The chevron is one glyph rotated rather than two icons, and it flips with
 * the reading direction — a closed chevron points the way the text runs. It
 * is always in the layout, so a leaf's label lines up with its siblings'
 * instead of sitting a chevron's width to the left.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "2rem", maxWidth: "22rem" }}>
      {/* The disabled node is spelled out here rather than left inside the
          shared constant, so the photographed frame says which states it is
          showing. `ui:story-coverage` asks for exactly that: a state whose
          only appearance is inside an imported array is a state the gate
          cannot see and a reviewer has to go looking for. */}
      <Tree
        label="Folders"
        nodes={[
          ...FOLDERS.slice(0, 2),
          { id: "ch", label: "Switzerland", disabled: true },
        ]}
      />
      <Tree
        label="Folders, part open"
        nodes={FOLDERS}
        defaultExpanded={["eu"]}
      />
      <Tree
        label="Folders, deep"
        nodes={FOLDERS}
        defaultExpanded={["eu", "eu-textiles"]}
        defaultSelected="eu-textiles-adria"
      />
    </div>
  ),
};

/**
 * One tab stop for the whole tree.
 *
 * The reason to reach for this instead of nested lists: a hundred-node tree
 * is one stop rather than a hundred. And the stop is the *selected* row when
 * there is one, so leaving the tree and coming back does not send a reader
 * to the top to walk down again.
 */
export const OneTabStopOnTheSelectedRow: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", nodes: [] },
  render: () => (
    <>
      <Tree
        label="Folders"
        nodes={FOLDERS}
        defaultExpanded={["eu", "eu-textiles"]}
        defaultSelected="eu-textiles-adria"
      />
      <button type="button">After the tree</button>
    </>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(
      canvas.getByRole("treeitem", { name: "Adria Components" }),
      "the tab stop is the first row, so returning to a tree loses the place",
    ).toHaveFocus();

    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: "After the tree" }),
      "Tab stopped inside the tree, so a hundred nodes are a hundred stops",
    ).toHaveFocus();
  },
};

/**
 * Level and position, which a flat list of treeitems cannot imply.
 *
 * A nested `<ul>` conveys depth visually, and once the items are
 * `treeitem`s rather than `listitem`s it conveys nothing at all without
 * these three attributes. They are what let a reader say "level 3, 2 of 7".
 */
export const LevelAndPositionAreStated: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", nodes: [] },
  render: () => (
    <Tree
      label="Folders"
      nodes={FOLDERS}
      defaultExpanded={["eu", "eu-textiles"]}
    />
  ),
  play: async ({ canvas }) => {
    const eu = canvas.getByRole("treeitem", { name: "European Union" });
    await expect(eu).toHaveAttribute("aria-level", "1");
    await expect(eu).toHaveAttribute("aria-posinset", "1");
    await expect(eu).toHaveAttribute("aria-setsize", "3");
    await expect(eu).toHaveAttribute("aria-expanded", "true");

    const adria = canvas.getByRole("treeitem", { name: "Adria Components" });
    await expect(adria).toHaveAttribute("aria-level", "3");
    await expect(adria).toHaveAttribute("aria-posinset", "2");
    await expect(adria).toHaveAttribute("aria-setsize", "2");
    await expect(
      adria,
      "a leaf must not claim an expanded state it does not have",
    ).not.toHaveAttribute("aria-expanded");

    // A collapsed branch says so rather than saying nothing.
    const uk = canvas.getByRole("treeitem", { name: "United Kingdom" });
    await expect(uk).toHaveAttribute("aria-expanded", "false");
  },
};

/**
 * A disabled node is announced as disabled, not simply skipped.
 *
 * The arrows still reach it, which is deliberate: a row the keyboard jumps
 * over is a row whose existence a reader cannot discover, and "Switzerland,
 * dimmed" tells them why there is nothing to open.
 */
export const DisabledIsReachableAndSaysSo: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", nodes: [] },
  render: function Render() {
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <>
        <Tree
          label="Folders"
          nodes={FOLDERS}
          selected={selected}
          onSelectedChange={setSelected}
        />
        <p data-testid="selected">{selected ?? "none"}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    const ch = canvas.getByRole("treeitem", { name: "Switzerland" });
    await expect(ch).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(ch);
    await expect(
      canvas.getByTestId("selected"),
      "a disabled node was selectable",
    ).toHaveTextContent("none");
  },
};

/**
 * Labels rendered by the caller.
 *
 * The sixth component here with this door. A `TreeNode` is data because that
 * is what a caller has; a badge with a count, an icon per folder type, or a
 * name greyed by permission is a separate question — and the depth is handed
 * back, because a row's treatment usually depends on its level.
 */
export const LabelsRenderedByTheCaller: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", nodes: [] },
  render: () => (
    <Tree
      label="Folders"
      nodes={FOLDERS}
      defaultExpanded={["eu"]}
      node={(entry, depth) => (
        <span style={{ display: "inline-flex", gap: "0.4rem" }}>
          {entry.label}
          <span style={{ color: "var(--uix-text-caption)" }}>L{depth}</span>
        </span>
      )}
    />
  ),
  play: async ({ canvas }) => {
    /* Asserted, because a story that demonstrates a prop and never reads
       the result documents an intention. */
    await expect(
      canvas.getByRole("treeitem", { name: /Textiles L2/ }),
      "the depth handed to the render prop is the item's own level",
    ).toBeInTheDocument();
  },
};
