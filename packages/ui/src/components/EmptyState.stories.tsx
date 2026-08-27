import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Inbox } from "lucide-react";

import { Button } from "./Button";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "Components/EmptyState",
  component: EmptyState,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every shape it takes, in one frame.
 *
 * Title alone; title and description; the full form with an illustration
 * and an action; and one rendered as a real heading. The wording is the
 * component: "No results" states the obvious, while "No supplier matches
 * this filter" says which of the two empty states this is — nothing exists
 * yet, or nothing matched — and those want different next steps.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <EmptyState title="No suppliers yet" />
      <EmptyState
        title="No supplier matches this filter"
        description="Try a shorter name, or clear the region filter."
      />
      <EmptyState
        illustration={<Inbox size={40} strokeWidth={1.5} />}
        title="Nothing in the queue"
        description="Orders appear here as soon as a supplier confirms them. Nothing is waiting on you."
        action={<Button>Import orders</Button>}
      />
      <EmptyState
        headingLevel={2}
        title="This section is empty"
        description="Rendered as a real h2, for the case where the empty state replaces a section of the page."
      />
    </div>
  ),
};

/**
 * Inside a `DataTable`, which is what it was written for.
 *
 * The table's `empty` prop takes a node and spans every column, so an
 * empty state lands in the space the rows would have filled rather than in
 * one cell.
 */
export const InATable: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { title: "" },
  render: () => (
    <DataTable
      caption="Suppliers"
      rows={[]}
      rowKey={(row: { id: string }) => row.id}
      columns={[
        { key: "name", header: "Supplier" },
        { key: "region", header: "Region" },
      ]}
      empty={
        <EmptyState
          title="No supplier matches this filter"
          description="Try a shorter name, or clear the region filter."
          action={<Button variant="outline">Clear filters</Button>}
        />
      }
    />
  ),
};

/**
 * It announces itself, and the heading is opt-in.
 *
 * Two claims that are easy to get wrong in opposite directions. The text
 * usually appears *because of something the reader did* — a search, a
 * filter — so a result that renders silently leaves a screen reader user
 * waiting; hence `role="status"`, polite so it does not interrupt.
 *
 * And the title is a `<p>` unless asked otherwise. A component that
 * guessed `<h2>` would corrupt the heading outline of every page that put
 * an empty state inside a card, which is a worse defect than a missing
 * heading: it makes the outline unusable for anyone navigating by headings.
 */
export const ItAnnouncesItselfWithoutAHeading: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { title: "" },
  render: () => (
    <>
      <EmptyState title="Nothing here" description="Not a section." />
      <EmptyState headingLevel={3} title="A real section" />
    </>
  ),
  play: async ({ canvas }) => {
    const statuses = canvas.getAllByRole("status");
    await expect(statuses).toHaveLength(2);
    await expect(statuses[0]).toHaveAttribute("aria-live", "polite");

    /* The content is the announcement, and the title is the first thing
       in it. Asserted as content rather than as a name on purpose: an
       `aria-labelledby` pointing at the title would give the region a name
       equal to its own content, and a reader announcing both would say the
       title twice. */
    await expect(statuses[0]).toHaveTextContent("Nothing here");
    await expect(
      statuses[0],
      "a live region with a name equal to its content is announced twice",
    ).not.toHaveAttribute("aria-labelledby");

    await expect(
      canvas.queryByRole("heading", { name: "Nothing here" }),
      "the default must not put a heading in the document outline",
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("heading", { level: 3, name: "A real section" }),
    ).toBeInTheDocument();
  },
};
