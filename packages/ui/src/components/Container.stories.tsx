import { expect } from "storybook/test";
import { NARROW } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Container } from "./Container";
import { Stack } from "./Stack";

const meta = {
  title: "Components/Container",
  component: Container,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

const Bar = ({ children }: { children: string }) => (
  <div
    style={{
      background: "var(--uix-bg-subtle)",
      border: "1px solid var(--uix-border-subtle)",
      padding: "0.75rem",
    }}
  >
    {children}
  </div>
);

export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => (
    <Stack gap="lg">
      <Container width="app">
        <Bar>app — the widest a dense screen should grow</Bar>
      </Container>
      <Container width="prose">
        <Bar>prose — a reading measure in ch, so it tracks the font</Bar>
      </Container>
      <Container width="full">
        <Bar>full — opting out, visibly</Bar>
      </Container>
      <Container width="app" flush>
        <Bar>flush — no gutter, for a container inside another</Bar>
      </Container>
    </Stack>
  ),
};

/**
 * The measure is in `ch`, so enlarging text does not narrow the line.
 *
 * Asserted because the alternative reads the same in review: a maximum in
 * `rem` scales with the root font size, which keeps the characters per line
 * constant and defeats the reason somebody enlarged the text.
 */
export const TheProseMeasureTracksTheFont: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Container width="prose" data-testid="prose">
      <p>Running text.</p>
    </Container>
  ),
  play: async ({ canvas }) => {
    const node = canvas.getByTestId("prose");
    const before = Number.parseFloat(getComputedStyle(node).maxInlineSize);
    const root = document.documentElement;
    const original = root.style.fontSize;
    root.style.fontSize = "32px";
    try {
      const after = Number.parseFloat(getComputedStyle(node).maxInlineSize);
      await expect(
        after,
        "the prose measure did not grow with the font, so it is not in ch",
      ).toBeGreaterThan(before * 1.5);
    } finally {
      root.style.fontSize = original;
    }
  },
};

/** Centring is the one margin a layout primitive owns. */
export const ItCentresItself: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <div style={{ inlineSize: "100%" }}>
      <Container width="prose" data-testid="centred">
        <p>Running text.</p>
      </Container>
    </div>
  ),
  play: async ({ canvas }) => {
    const style = getComputedStyle(canvas.getByTestId("centred"));
    await expect(style.marginInlineStart).toBe(style.marginInlineEnd);
  },
};

/** Running text at a reading measure, inside a page at app width. */
export const ProseInsideAPage: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Container width="app">
      <Container width="prose" flush>
        <p>
          A measure in characters rather than in rem, so the line length stays
          readable when somebody enlarges the text instead of holding the same
          number of characters and shrinking the type against the page.
        </p>
      </Container>
    </Container>
  ),
};
