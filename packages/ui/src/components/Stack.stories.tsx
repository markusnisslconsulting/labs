import { expect } from "storybook/test";
import { NARROW } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Panel } from "./Panel";
import { Stack } from "./Stack";

const meta = {
  title: "Components/Stack",
  component: Stack,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every axis, gap and alignment in one frame. */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => (
    <Stack gap="xl">
      {(["none", "xs", "sm", "md", "lg", "xl", "2xl"] as const).map((gap) => (
        <Stack key={gap} direction="inline" gap={gap} align="center">
          <span
            style={{ inlineSize: "3rem", color: "var(--uix-text-secondary)" }}
          >
            {gap}
          </span>
          <Button size="sm">One</Button>
          <Button size="sm" variant="outline">
            Two
          </Button>
          <Button size="sm" variant="outline">
            Three
          </Button>
        </Stack>
      ))}

      {/* Every alignment, against children of different heights so the
          difference is visible rather than asserted. */}
      {(["start", "center", "end", "stretch", "baseline"] as const).map(
        (align) => (
          <Stack
            key={align}
            direction="inline"
            gap="sm"
            align={align}
            style={{ blockSize: "4rem", background: "var(--uix-bg-subtle)" }}
          >
            <span style={{ inlineSize: "4rem" }}>{align}</span>
            <Button size="sm">Short</Button>
            <Button size="lg">Tall</Button>
          </Stack>
        ),
      )}

      {(["start", "center", "end", "between"] as const).map((justify) => (
        <Stack
          key={justify}
          direction="inline"
          gap="sm"
          justify={justify}
          style={{ background: "var(--uix-bg-subtle)" }}
        >
          <span style={{ inlineSize: "4rem" }}>{justify}</span>
          <Button size="sm">One</Button>
          <Button size="sm">Two</Button>
        </Stack>
      ))}

      {/* Wrapping, which only shows in a box narrow enough to force it. */}
      <div style={{ inlineSize: "14rem" }}>
        <Stack direction="inline" gap="sm" wrap>
          <Button size="sm">One</Button>
          <Button size="sm">Two</Button>
          <Button size="sm">Three</Button>
          <Button size="sm">Four</Button>
        </Stack>
      </div>
    </Stack>
  ),
};

/**
 * The gap is the component's whole job, so it is asserted rather than shown.
 *
 * Read from the computed style, because the point is that the container
 * carries the space: a child with a margin would produce the same picture
 * and none of the composability.
 */
export const TheContainerCarriesTheSpace: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Stack gap="lg" data-testid="stack">
      <Panel label="One">First</Panel>
      <Panel label="Two">Second</Panel>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const stack = canvas.getByTestId("stack");
    const style = getComputedStyle(stack);
    await expect(style.display).toBe("flex");
    await expect(Number.parseFloat(style.rowGap)).toBeGreaterThan(0);
    /* And the children own nothing. A margin here is the defect the gate in
       tokens.spec.ts exists for; this is the runtime half of it. */
    for (const child of Array.from(stack.children)) {
      const kid = getComputedStyle(child);
      await expect(
        Number.parseFloat(kid.marginBlockStart) +
          Number.parseFloat(kid.marginBlockEnd),
        "a child inside a Stack is setting its own outer margin",
      ).toBe(0);
    }
  },
};

/**
 * `direction` is logical, so a row of controls reverses under RTL without a
 * second rule. Asserted by position rather than by the attribute.
 */
export const TheInlineAxisFollowsTheReadingDirection: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <div dir="rtl">
      <Stack direction="inline" gap="md" data-testid="rtl">
        <Button size="sm">First</Button>
        <Button size="sm">Second</Button>
      </Stack>
    </div>
  ),
  play: async ({ canvas }) => {
    const [first, second] = Array.from(
      canvas.getByTestId("rtl").children,
    ) as HTMLElement[];
    await expect(
      first!.getBoundingClientRect().left,
      "the first child is on the left under RTL, so the axis is physical",
    ).toBeGreaterThan(second!.getBoundingClientRect().left);
  },
};

/** Rendered as a list, when the grouping means something. */
export const RenderedAsAList: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Stack gap="sm" renderAs={<ul style={{ listStyle: "none", padding: 0 }} />}>
      <li>Northwind Textiles</li>
      <li>Adria Components</li>
      <li>Kestrel Metals</li>
    </Stack>
  ),
};
