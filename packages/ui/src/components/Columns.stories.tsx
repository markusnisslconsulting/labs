import { expect } from "storybook/test";
import { NARROW } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";
import { Columns } from "./Columns";
import { Stack } from "./Stack";

const meta = {
  title: "Components/Columns",
  component: Columns,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Columns>;

export default meta;
type Story = StoryObj<typeof meta>;

const SUPPLIERS = ["Northwind", "Adria", "Kestrel", "Vale", "Halden", "Orsted"];

const Tile = ({ name }: { name: string }) => (
  <Card>
    <Card.Header>{name}</Card.Header>
    <Card.Body>
      <p>Active contract.</p>
    </Card.Body>
  </Card>
);

export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => (
    <Stack gap="2xl">
      {(["sm", "md", "lg"] as const).map((min) => (
        <Columns key={min} min={min}>
          {SUPPLIERS.map((s) => (
            <Tile key={s} name={s} />
          ))}
        </Columns>
      ))}
    </Stack>
  ),
};

/**
 * The column count follows the container, not the viewport.
 *
 * The whole argument for `auto-fit` over breakpoints, and it is only worth
 * making if it holds: the same grid is put in two boxes of different widths
 * in one viewport, and has to answer differently in each. A media-query grid
 * cannot, because the window is the same width in both.
 */
export const TheContainerDecidesTheColumnCount: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Stack gap="lg">
      <div style={{ inlineSize: "20rem" }} data-testid="narrow-box">
        <Columns min="sm">
          {SUPPLIERS.map((s) => (
            <Tile key={s} name={s} />
          ))}
        </Columns>
      </div>
      <div style={{ inlineSize: "60rem" }} data-testid="wide-box">
        <Columns min="sm">
          {SUPPLIERS.map((s) => (
            <Tile key={s} name={s} />
          ))}
        </Columns>
      </div>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const columnsIn = (testId: string) => {
      const grid = canvas.getByTestId(testId).firstElementChild!;
      return getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    };
    const narrow = columnsIn("narrow-box");
    const wide = columnsIn("wide-box");
    await expect(
      wide,
      `both boxes resolved to ${wide} columns in one viewport, so the grid ` +
        `is answering a question about the window`,
    ).toBeGreaterThan(narrow);
  },
};

/** A single column still fits a container narrower than the minimum. */
export const ItDoesNotOverflowANarrowContainer: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <div style={{ inlineSize: "8rem" }} data-testid="tiny">
      <Columns min="lg">
        <Tile name="Northwind" />
      </Columns>
    </div>
  ),
  play: async ({ canvas }) => {
    const box = canvas.getByTestId("tiny");
    const grid = box.firstElementChild as HTMLElement;
    await expect(
      grid.getBoundingClientRect().width,
      "the grid is wider than its container, which is the classic auto-fit " +
        "defect that min(100%, …) exists to prevent",
    ).toBeLessThanOrEqual(box.getBoundingClientRect().width + 1);
  },
};

/** A grid of supplier cards, the case this exists for. */
export const AGridOfCards: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Columns min="md" gap="lg">
      {SUPPLIERS.map((s) => (
        <Tile key={s} name={s} />
      ))}
    </Columns>
  ),
};
