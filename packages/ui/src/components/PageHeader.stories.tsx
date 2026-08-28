import { expect } from "storybook/test";
import { NARROW } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumb } from "./Breadcrumb";
import { Button } from "./Button";
import { PageHeader } from "./PageHeader";
import { Section } from "./Section";
import { Stack } from "./Stack";
import { StatusPill } from "./StatusPill";

const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => (
    <Stack gap="2xl">
      <PageHeader title="Suppliers" />
      <PageHeader
        title="Suppliers"
        description="Every supplier with an active contract."
      />
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[{ label: "Operations", href: "#" }, { label: "Suppliers" }]}
          />
        }
        title="Northwind Textiles"
        description="Contract NW-4417, renewed in March."
        meta={<StatusPill tone="ok">Active</StatusPill>}
        actions={
          <>
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button size="sm">Edit</Button>
          </>
        }
      />
      <PageHeader
        title="A page title long enough that the actions cannot sit beside it on a narrow screen"
        actions={<Button size="sm">Act</Button>}
      />
    </Stack>
  ),
};

/**
 * The title is the page's h1, from position.
 *
 * Nothing passes a level. Inside a section it drops, which is what makes the
 * component reusable in a detail pane as well as at the top of a page.
 */
export const TheTitleTakesItsLevelFromPosition: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { title: "" },
  render: () => (
    <Stack gap="lg">
      <PageHeader title="At the top" />
      <Section title="A region">
        <PageHeader title="Inside a section" />
      </Section>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText("At the top").tagName).toBe("H1");
    await expect(canvas.getByText("A region").tagName).toBe("H2");
    await expect(
      canvas.getByText("Inside a section").tagName,
      "the header inside a section rendered at the page level, so the page " +
        "has two h1 elements",
    ).toBe("H2");
  },
};

/**
 * Actions wrap rather than squeezing the title.
 *
 * A title is the one string on a page nobody wants truncated, so the row
 * wraps and the actions take their own line.
 */
export const ActionsWrapRatherThanCrushingTheTitle: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { title: "" },
  render: () => (
    <div style={{ inlineSize: "22rem" }}>
      <PageHeader
        title="A page title long enough to need the whole line for itself"
        actions={<Button size="sm">Act</Button>}
        data-testid="header"
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const header = canvas.getByTestId("header");
    const title = canvas.getByText(
      "A page title long enough to need the whole line for itself",
    );
    const action = canvas.getByRole("button", { name: "Act" });
    await expect(
      action.getBoundingClientRect().top,
      "the action is on the title's line in a 22rem box, so the title is " +
        "being squeezed",
    ).toBeGreaterThan(title.getBoundingClientRect().bottom - 2);
    await expect(header).toBeVisible();
  },
};

/** A detail page: trail, name, state, and the controls that act on it. */
export const ADetailPage: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { title: "" },
  render: () => (
    <PageHeader
      breadcrumb={
        <Breadcrumb
          items={[
            { label: "Operations", href: "#" },
            { label: "Suppliers", href: "#" },
            { label: "Northwind Textiles" },
          ]}
        />
      }
      title="Northwind Textiles"
      description="Contract NW-4417, renewed in March."
      meta={<StatusPill tone="ok">Active</StatusPill>}
      actions={<Button size="sm">Edit</Button>}
    />
  ),
};
