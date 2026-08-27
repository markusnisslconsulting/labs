import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { DataTable, type DataColumn } from "./DataTable";

const meta = {
  title: "Components/DataTable",
  component: DataTable,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof DataTable>;

export default meta;

interface Supplier {
  id: string;
  name: string;
  region: string;
  units: number;
}

const SUPPLIERS: Supplier[] = [
  {
    id: "s1",
    name: "Northwind Textiles",
    region: "European Union",
    units: 1200,
  },
  { id: "s2", name: "Adria Components", region: "European Union", units: 800 },
  { id: "s3", name: "Kestrel Metals", region: "United Kingdom", units: 4310 },
  { id: "s4", name: "Vale Packaging", region: "Switzerland", units: 95 },
];

const COLUMNS: Array<DataColumn<Supplier>> = [
  {
    key: "name",
    header: "Supplier",
    compare: (a, b) => a.name.localeCompare(b.name),
  },
  { key: "region", header: "Region" },
  {
    key: "units",
    header: "Units",
    numeric: true,
    compare: (a, b) => a.units - b.units,
    width: "7rem",
  },
];

/** A great many rows, generated so the count is the point. */
const MANY: Supplier[] = Array.from({ length: 10_000 }, (_, index) => ({
  id: `r${index}`,
  name: `Supplier ${index + 1}`,
  region: index % 2 ? "European Union" : "United Kingdom",
  units: (index * 37) % 5000,
}));

/**
 * Every state the table has, in one frame.
 *
 * Plain, sorted, selected, sticky, and empty. The sortable columns show
 * their arrow in both states, because a header that changes width when the
 * sort lands on it is the same defect as a column that jumps when the rows
 * change — `table-layout: fixed` and a drawn-both-ways arrow are what stop
 * each of those.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "2.5rem" }}>
      <DataTable
        caption="Suppliers"
        columns={COLUMNS}
        rows={SUPPLIERS}
        rowKey={(row) => row.id}
      />
      <DataTable
        caption="Suppliers, sorted by units"
        columns={COLUMNS}
        rows={SUPPLIERS}
        rowKey={(row) => row.id}
        defaultSort={{ key: "units", direction: "descending" }}
      />
      <DataTable
        caption="Suppliers, two selected"
        columns={COLUMNS}
        rows={SUPPLIERS}
        rowKey={(row) => row.id}
        rowLabel={(row) => row.name}
        selectable
        defaultSelected={["s1", "s3"]}
      />
      <DataTable
        caption="Nothing to show"
        columns={COLUMNS}
        rows={[]}
        rowKey={(row) => row.id}
        empty="No supplier matches this filter."
      />
    </div>
  ),
};

/**
 * Ten thousand rows, and a bounded number of them in the DOM.
 *
 * Setting `rowHeight` is what turns virtualisation on, and it is the only
 * switch: windowing has to know a row's height before rendering it, so a
 * fixed height is the premise rather than a limitation to lift later.
 *
 * The sticky header is on, because the two together are where a naive
 * implementation breaks — a header positioned inside a transformed or
 * absolutely placed body stops sticking, which is why the rows are offset
 * with spacer rows instead.
 */
export const TenThousandRows: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <DataTable
      caption="Ten thousand suppliers"
      columns={COLUMNS}
      rows={MANY}
      rowKey={(row) => row.id}
      rowHeight={40}
      height={360}
      stickyHeader
    />
  ),
};

/**
 * Sorting is reported to a screen reader, not only drawn.
 *
 * `aria-sort` on the header cell is the whole of that claim — the arrow is
 * for the eye and announces nothing at all. Three presses walk the states,
 * and the third clears the sort: a two-state toggle would leave no way
 * back to the order the rows arrived in, which for a table fed by a query
 * is the meaningful one.
 */
export const SortingSaysSoOutLoud: StoryObj = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <DataTable
      caption="Suppliers"
      columns={COLUMNS}
      rows={SUPPLIERS}
      rowKey={(row) => row.id}
    />
  ),
  play: async ({ canvas }) => {
    const header = canvas.getByRole("columnheader", { name: /Supplier/ });
    const button = canvas.getByRole("button", { name: /Supplier/ });

    await expect(
      header,
      "a sortable column starts at none, not absent — absent means " +
        "unsortable, and a reader cannot tell the two apart otherwise",
    ).toHaveAttribute("aria-sort", "none");

    await userEvent.click(button);
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    let cells = canvas.getAllByRole("cell");
    await expect(cells[0]).toHaveTextContent("Adria Components");

    await userEvent.click(button);
    await expect(header).toHaveAttribute("aria-sort", "descending");
    cells = canvas.getAllByRole("cell");
    await expect(cells[0]).toHaveTextContent("Vale Packaging");

    await userEvent.click(button);
    await expect(
      header,
      "the third press has to clear the sort, or the original order is gone",
    ).toHaveAttribute("aria-sort", "none");
    cells = canvas.getAllByRole("cell");
    await expect(cells[0]).toHaveTextContent("Northwind Textiles");
  },
};

/**
 * A selection survives sorting, because it is keyed by the row.
 *
 * This is why `rowKey` is required instead of defaulting to the array
 * index. An index-keyed selection moves to a different record the moment
 * the order changes, silently, and the reader has no way to notice.
 */
export const SelectionSurvivesSorting: StoryObj = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  render: function Render() {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <>
        <DataTable
          caption="Suppliers"
          columns={COLUMNS}
          rows={SUPPLIERS}
          rowKey={(row) => row.id}
          rowLabel={(row) => row.name}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
        />
        <p data-testid="picked">{selected.join(",")}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Select Vale Packaging" }),
    );
    await expect(canvas.getByTestId("picked")).toHaveTextContent("s4");

    // The count reaches a reader who cannot see four checkboxes at once.
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "1 row selected",
    );

    await userEvent.click(canvas.getByRole("button", { name: /Units/ }));
    await expect(
      canvas.getByTestId("picked"),
      "sorting moved the selection, which means it is keyed by position",
    ).toHaveTextContent("s4");
    await expect(
      canvas.getByRole("checkbox", { name: "Select Vale Packaging" }),
    ).toBeChecked();
  },
};

/**
 * The header checkbox shows a partial selection as partial.
 *
 * `indeterminate` is not an attribute and cannot be set in JSX, so it is
 * the kind of state a component silently drops. A header checkbox that
 * renders unchecked while three of four rows are selected tells a reader
 * the opposite of the truth, and then unchecking it appears to do nothing.
 */
export const PartialSelectionLooksPartial: StoryObj = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <DataTable
      caption="Suppliers"
      columns={COLUMNS}
      rows={SUPPLIERS}
      rowKey={(row) => row.id}
      rowLabel={(row) => row.name}
      selectable
      defaultSelected={["s1"]}
    />
  ),
  play: async ({ canvas }) => {
    const all = canvas.getByRole("checkbox", { name: "Select all rows" });
    await expect(all).toBePartiallyChecked();

    await userEvent.click(all);
    await expect(all).toBeChecked();
    for (const row of SUPPLIERS) {
      await expect(
        canvas.getByRole("checkbox", { name: `Select ${row.name}` }),
      ).toBeChecked();
    }

    await userEvent.click(all);
    await expect(all).not.toBeChecked();
    await expect(all).not.toBePartiallyChecked();
  },
};

/**
 * Tab reaches every control in the table, in the order it is drawn.
 *
 * The keyboard half that synthetic keys can assert honestly. Focus
 * movement under Tab is the test library's own implementation, so it is
 *真 here; sorting with Enter, toggling with Space and scrolling with the
 * arrows are the platform's, and a browser only runs those for a trusted
 * event — they are in `browser/keyboard.spec.ts` for that reason.
 *
 * The order is the claim. Each sortable header is a button, so a keyboard
 * user reaches the sort before the rows; the selection column comes first
 * in each row because that is where it is drawn; and the scroll viewport
 * is a stop of its own, which is what makes a wide or tall table reachable
 * at all.
 */
export const TabReachesEveryControl: StoryObj = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <DataTable
      caption="Suppliers"
      columns={COLUMNS}
      rows={SUPPLIERS.slice(0, 2)}
      rowKey={(row) => row.id}
      rowLabel={(row) => row.name}
      selectable
    />
  ),
  play: async ({ canvas }) => {
    const order = [
      canvas.getByRole("region", { name: "Suppliers" }),
      canvas.getByRole("checkbox", { name: "Select all rows" }),
      canvas.getByRole("button", { name: /Supplier/ }),
      canvas.getByRole("button", { name: /Units/ }),
      canvas.getByRole("checkbox", { name: "Select Northwind Textiles" }),
      canvas.getByRole("checkbox", { name: "Select Adria Components" }),
    ];

    for (const element of order) {
      await userEvent.tab();
      await expect(element).toHaveFocus();
    }

    // The un-sortable column has no button, so it is not a stop.
    await expect(
      canvas.queryByRole("button", { name: /^Region/ }),
      "Region has no comparator and no onSortChange, so it must not be a " +
        "control that does nothing",
    ).not.toBeInTheDocument();
  },
};
