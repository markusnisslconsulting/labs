import { expect } from "storybook/test";
import { NARROW } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Section } from "./Section";
import { Stack } from "./Stack";

const meta = {
  title: "Components/Section",
  component: Section,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => (
    <Stack gap="2xl">
      <Section title="Heading only">
        <p>Content.</p>
      </Section>
      <Section
        title="Heading and description"
        description="One line saying what the section is for."
      >
        <p>Content.</p>
      </Section>
      <Section
        title="With actions"
        description="Controls that belong to this region."
        actions={<Button size="sm">Add</Button>}
      >
        <p>Content.</p>
      </Section>
      <Section title="Nested">
        <p>The section below is one level deeper.</p>
        <Section title="A nested region">
          <p>Its heading dropped a level without anybody passing one.</p>
        </Section>
      </Section>
    </Stack>
  ),
};

/**
 * The outline is correct by nesting, not by remembering.
 *
 * This is the component's whole reason for existing, so it is measured
 * rather than shown: the tags themselves are read back, three levels deep.
 */
export const HeadingLevelsComeFromPosition: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { title: "", children: null },
  render: () => (
    <Section title="Top" data-testid="outline">
      <Section title="Middle">
        <Section title="Deep">
          <p>Three deep.</p>
        </Section>
      </Section>
    </Section>
  ),
  play: async ({ canvas }) => {
    const levels = ["Top", "Middle", "Deep"].map(
      (text) => canvas.getByText(text).tagName,
    );
    await expect(
      levels,
      "a nested section repeated its parent's level, so the page outline " +
        "skips or repeats and a reader cannot navigate it",
    ).toEqual(["H2", "H3", "H4"]);
  },
};

/**
 * An explicit level still wins.
 *
 * Inference is a default, never a policy: a caller who knows the depth has
 * to be able to say so, or the component is unusable in the one case the
 * context is wrong.
 */
export const AnExplicitLevelWins: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { title: "", children: null },
  render: () => (
    <Section title="Inferred">
      <h3 data-testid="explicit">Written by hand</h3>
    </Section>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Inferred").tagName).toBe("H2");
    await expect(canvas.getByTestId("explicit").tagName).toBe("H3");
  },
};

/** A titled section is a landmark, named by its own heading. */
export const ATitledSectionIsALandmark: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { title: "", children: null },
  render: () => (
    <Section id="windows" title="Delivery windows">
      <p>Content.</p>
    </Section>
  ),
  play: async ({ canvas }) => {
    /* `region` is what a named section exposes. Unnamed it is generic and
       absent from the landmark list, which is the state a hand-written
       `<section className="...">` is always in. */
    await expect(
      canvas.getByRole("region", { name: "Delivery windows" }),
    ).toBeVisible();
  },
};

/** Two levels of region, with the outline that follows from them. */
export const NestedRegions: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { title: "", children: null },
  render: () => (
    <Section
      title="Contract"
      description="Everything agreed with this supplier."
    >
      <Section title="Delivery windows">
        <p>Weekly, Tuesday and Friday.</p>
      </Section>
      <Section title="Penalties">
        <p>Two per cent per late day, capped at ten.</p>
      </Section>
    </Section>
  ),
};
