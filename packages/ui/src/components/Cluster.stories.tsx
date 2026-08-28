import { expect } from "storybook/test";
import { NARROW } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chip } from "./Chip";
import { Cluster } from "./Cluster";
import { Stack } from "./Stack";

const meta = {
  title: "Components/Cluster",
  component: Cluster,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Cluster>;

export default meta;
type Story = StoryObj<typeof meta>;

const REGIONS = [
  "European Union",
  "United Kingdom",
  "United States",
  "Switzerland",
  "Norway",
  "Japan",
  "Australia",
];

export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => (
    <Stack gap="xl">
      {(["xs", "sm", "md", "lg"] as const).map((gap) => (
        <Cluster key={gap} gap={gap}>
          {REGIONS.map((r) => (
            <Chip key={r}>{r}</Chip>
          ))}
        </Cluster>
      ))}

      {(["start", "center", "end", "baseline"] as const).map((align) => (
        <Cluster
          key={align}
          gap="sm"
          align={align}
          style={{ blockSize: "3rem", background: "var(--uix-bg-subtle)" }}
        >
          <span style={{ inlineSize: "5rem" }}>{align}</span>
          <Chip>Small</Chip>
          <Chip>A taller chip</Chip>
        </Cluster>
      ))}

      {(["start", "center", "end", "between"] as const).map((justify) => (
        <Cluster
          key={justify}
          gap="sm"
          justify={justify}
          style={{ background: "var(--uix-bg-subtle)" }}
        >
          <span style={{ inlineSize: "5rem" }}>{justify}</span>
          <Chip>One</Chip>
          <Chip>Two</Chip>
        </Cluster>
      ))}
    </Stack>
  ),
};

/**
 * The gap applies between wrapped lines too.
 *
 * The defect this prevents: a row built from `margin-inline-end` has no
 * space between its lines, and nobody sees it until the row wraps on
 * somebody else's screen.
 */
export const TheGapAppliesBetweenLines: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <div style={{ inlineSize: "16rem" }}>
      <Cluster gap="md" data-testid="wrapped">
        {REGIONS.map((r) => (
          <Chip key={r}>{r}</Chip>
        ))}
      </Cluster>
    </div>
  ),
  play: async ({ canvas }) => {
    const node = canvas.getByTestId("wrapped");
    const style = getComputedStyle(node);
    await expect(Number.parseFloat(style.rowGap)).toBeGreaterThan(0);
    await expect(style.rowGap).toBe(style.columnGap);
    /* And it really did wrap, or the assertion above is about nothing. */
    const tops = new Set(
      Array.from(node.children).map((child) =>
        Math.round(child.getBoundingClientRect().top),
      ),
    );
    await expect(
      tops.size,
      "the chips did not wrap, so this story does not test wrapping",
    ).toBeGreaterThan(1);
  },
};

/** Filters above a result set, which is where this shape earns its keep. */
export const FiltersAboveResults: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Stack gap="md">
      <Cluster gap="sm">
        {REGIONS.slice(0, 5).map((r) => (
          <Chip key={r}>{r}</Chip>
        ))}
      </Cluster>
      <p>Forty-one suppliers.</p>
    </Stack>
  ),
};
