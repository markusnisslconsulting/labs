import { expect } from "storybook/test";
import { NARROW } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";
import { Container } from "./Container";
import { PageHeader } from "./PageHeader";
import { Section } from "./Section";
import { Stack } from "./Stack";

const meta = {
  title: "Components/AppShell",
  component: AppShell,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const NAV = (
  <Stack
    gap="xs"
    renderAs={<ul style={{ listStyle: "none", margin: 0, padding: "1rem" }} />}
  >
    <li>Suppliers</li>
    <li>Contracts</li>
    <li>Deliveries</li>
  </Stack>
);

export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => (
    <AppShell
      header={
        <div style={{ padding: "0.75rem 1rem" }}>Nordwind Operations</div>
      }
      nav={NAV}
      navLabel="Sections"
      footer={<div style={{ padding: "0.75rem 1rem" }}>v2.14.0</div>}
    >
      <Container>
        <Stack gap="xl" style={{ paddingBlock: "1.5rem" }}>
          <PageHeader
            title="Suppliers"
            description="Every supplier with an active contract."
          />
          <Section title="Delivery windows">
            <p>Content.</p>
          </Section>
          <Section title="Contacts">
            <p>Two named contacts.</p>
          </Section>
        </Stack>
      </Container>
    </AppShell>
  ),
};

/**
 * Four landmarks, once each, from real elements.
 *
 * The check that matters, because the failure mode is silent: four `div`s
 * with classes look identical on screen and remove the only way a reader who
 * cannot see the layout moves around the page.
 */
export const TheLandmarksAreReal: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <AppShell
      header={<p>Header</p>}
      nav={NAV}
      navLabel="Sections"
      footer={<p>Footer</p>}
    >
      <p>Page</p>
    </AppShell>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("banner")).toBeVisible();
    await expect(
      canvas.getByRole("navigation", { name: "Sections" }),
    ).toBeVisible();
    await expect(canvas.getByRole("main")).toBeVisible();
    await expect(canvas.getByRole("contentinfo")).toBeVisible();
    /* Once each. Two mains is the state a page assembled from copied
       fragments arrives in, and it is not an error anybody sees. */
    await expect(canvas.getAllByRole("main")).toHaveLength(1);
    await expect(canvas.getAllByRole("banner")).toHaveLength(1);
  },
};

/** A page inside the shell starts at level one. */
export const ThePageStartsAtLevelOne: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <AppShell header={<p>Header</p>}>
      <PageHeader title="Suppliers" />
      <Section title="Windows">
        <p>Content.</p>
      </Section>
    </AppShell>
  ),
  play: async ({ canvas }) => {
    /* One h1 for the page, and the section below it is an h2. Both come
       from position: nothing here passes a level. */
    await expect(canvas.getByText("Suppliers").tagName).toBe("H1");
    await expect(canvas.getByText("Windows").tagName).toBe("H2");
  },
};

/** Without navigation there is no empty landmark left behind. */
export const NoNavigationMeansNoNavLandmark: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <AppShell header={<p>Header</p>}>
      <p>Page</p>
    </AppShell>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("navigation")).toBeNull();
  },
};

/** The shape an application page actually has. */
export const AnApplicationPage: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <AppShell
      header={
        <div style={{ padding: "0.75rem 1rem" }}>Nordwind Operations</div>
      }
      nav={NAV}
      navLabel="Sections"
      navWidth="sm"
    >
      <Container>
        <Stack gap="xl" style={{ paddingBlock: "1.5rem" }}>
          <PageHeader
            title="Northwind Textiles"
            description="Contract NW-4417, renewed in March."
          />
          <Section title="Delivery windows">
            <p>Weekly, Tuesday and Friday.</p>
          </Section>
          <Section title="Contacts">
            <p>Two named contacts.</p>
          </Section>
        </Stack>
      </Container>
    </AppShell>
  ),
};
