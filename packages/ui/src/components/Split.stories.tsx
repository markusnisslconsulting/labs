import { expect } from "storybook/test";
import { NARROW } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Panel } from "./Panel";
import { Split } from "./Split";
import { Stack } from "./Stack";

const meta = {
  title: "Components/Split",
  component: Split,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Split>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Named per instance. Four panels labelled "Filters" in one frame are four
   landmarks with one name, which axe refuses under landmark-unique and a
   reader experiences as four identical entries in the landmark list. Caught
   by the accessibility check on this story's first run. */
const side = (what: string) => (
  <Panel label={`Filters · ${what}`}>Region, size, status.</Panel>
);
const main = (what: string) => (
  <Panel label={`Results · ${what}`}>Forty-one suppliers.</Panel>
);

export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => (
    <Stack gap="2xl">
      <Split side={side("default")}>{main("default")}</Split>
      <Split side={side("side last")} sidePosition="end">
        {main("side last")}
      </Split>
      <Split side={side("narrow side")} sideWidth="sm">
        {main("narrow side")}
      </Split>
      <Split side={side("wide side")} sideWidth="lg">
        {main("wide side")}
      </Split>
    </Stack>
  ),
};

/**
 * Reading order and visual order stay together.
 *
 * `sidePosition="end"` puts the side last in the DOM rather than reordering
 * with CSS, so what a reader hears matches what a sighted reader sees, and
 * the stacked order matches both. Reordering visually is WCAG 1.3.2 and the
 * most common defect in a hand-built two-column layout.
 */
export const TheVisualOrderIsTheReadingOrder: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { side: null, children: null },
  render: () => (
    <div style={{ inlineSize: "60rem" }}>
      <Split side={side("order")} sidePosition="end" data-testid="split">
        {main("order")}
      </Split>
    </div>
  ),
  play: async ({ canvas }) => {
    const [first, second] = Array.from(
      canvas.getByTestId("split").children,
    ) as HTMLElement[];
    /* DOM order: main first, side second. */
    await expect(first!.className).toContain("uix-split-main");
    await expect(second!.className).toContain("uix-split-side");
    /* And on screen, the same way round. */
    await expect(second!.getBoundingClientRect().left).toBeGreaterThan(
      first!.getBoundingClientRect().left,
    );
  },
};

/**
 * It stacks inside a narrow box, in the same viewport where it does not.
 *
 * The reason there is no media query: a drawer 420px wide is narrow, and the
 * window it sits in is not.
 */
export const ItCollapsesOnItsContainer: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { side: null, children: null },
  render: () => (
    <Stack gap="lg">
      <div style={{ inlineSize: "26rem" }} data-testid="narrow">
        <Split side={side("narrow box")} sideWidth="sm">
          {main("narrow box")}
        </Split>
      </div>
      <div style={{ inlineSize: "70rem" }} data-testid="wide">
        <Split side={side("wide box")} sideWidth="sm">
          {main("wide box")}
        </Split>
      </div>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const rowsIn = (testId: string) => {
      const split = canvas.getByTestId(testId).firstElementChild!;
      const tops = Array.from(split.children).map((child) =>
        Math.round(child.getBoundingClientRect().top),
      );
      return new Set(tops).size;
    };
    await expect(
      rowsIn("narrow"),
      "the narrow box did not stack, so the collapse is not container-driven",
    ).toBe(2);
    await expect(rowsIn("wide"), "the wide box stacked").toBe(1);
  },
};

/** Filters beside results, the shape most list screens have. */
export const FiltersBesideResults: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { side: null, children: null },
  render: () => (
    <Split side={side("page")} sideWidth="sm">
      {main("page")}
    </Split>
  ),
};
