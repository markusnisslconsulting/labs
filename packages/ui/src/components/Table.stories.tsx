import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "./Table";

const meta = {
  title: "Components/Table",
  component: Table,
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OrderingDesk: Story = {
  args: {
    caption: "SKUs with their current reorder points",
    children: (
      <>
        <thead>
          <tr>
            <th scope="col">SKU</th>
            <th scope="col">Reorder point</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>4711</td>
            <td>800 units</td>
          </tr>
          <tr>
            <td>4712</td>
            <td>350 units</td>
          </tr>
        </tbody>
      </>
    ),
  },
};
