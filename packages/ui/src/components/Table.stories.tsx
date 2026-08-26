import { expect, userEvent } from "storybook/test";
import { NARROW_AND_RTL } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "./Table";

const meta = {
  title: "Components/Table",
  component: Table,
  tags: ["autodocs", "beta"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OrderingDesk: Story = {
  parameters: {
    chromatic: { disableSnapshot: false, modes: { ...NARROW_AND_RTL } },
  },
  args: {
    caption: "SKUs with their current reorder points",
    children: (
      <>
        <thead>
          <tr>
            <th scope="col">SKU</th>
            <th scope="col" data-numeric>
              Reorder point
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>4711</td>
            <td data-numeric>800</td>
          </tr>
          <tr>
            <td>4712</td>
            <td data-numeric>1350</td>
          </tr>
          <tr>
            <td>4713</td>
            <td data-numeric>95</td>
          </tr>
        </tbody>
      </>
    ),
  },
  play: async ({ canvas }) => {
    // Assertion only, so this stays the reference state. The caption is
    // the table's accessible name, which is how a screen reader user
    // knows which table they have landed in; it is visually hidden, so
    // nothing on screen would reveal it if it broke.
    await expect(
      canvas.getByRole("table", { name: /reorder points/i }),
    ).toBeVisible();
  },
};

/**
 * More columns than the space allows.
 *
 * The component wraps the table in its own `overflow-x` container, so a
 * wide table scrolls inside itself instead of widening the page. This
 * story is the one that documents that, and it replaced a story called
 * CaptionNamesTheTable which rendered byte-for-byte the same table as
 * the one above and differed only in its assertion. Two identical
 * pictures under two names is worse than one picture: a reader compares
 * them and looks for the difference.
 */
export const WideColumns: Story = {
  args: {
    caption: "Suppliers by region and lead time",
    children: (
      <>
        <thead>
          <tr>
            <th scope="col">SKU</th>
            <th scope="col">Supplier</th>
            <th scope="col">Region</th>
            <th scope="col">Incoterm</th>
            <th scope="col">Contract</th>
            <th scope="col" data-numeric>
              Lead time
            </th>
            <th scope="col" data-numeric>
              Reorder point
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>4711</td>
            <td>Nordwind Logistik</td>
            <td>European Union</td>
            <td>DAP</td>
            <td>NW-2026-114</td>
            <td data-numeric>12 d</td>
            <td data-numeric>800</td>
          </tr>
          <tr>
            <td>4712</td>
            <td>Kanto Supply</td>
            <td>Japan</td>
            <td>FOB</td>
            <td>KS-2026-009</td>
            <td data-numeric>31 d</td>
            <td data-numeric>1350</td>
          </tr>
        </tbody>
      </>
    ),
  },
};

/**
 * The scroll container is reachable from the keyboard.
 *
 * `overflow-x: auto` creates a region only a pointer can reach, so a
 * keyboard-only user could not scroll a wide table sideways at all. The
 * wrapper has a tabindex, a role and a focus ring; this is the test that
 * says so.
 */
export const ScrollRegionIsReachable: Story = {
  args: WideColumns.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const region = canvas.getByRole("region", {
      name: /Suppliers by region/,
    });
    await expect(region).toHaveFocus();
  },
};
