import { exampleHref } from "../../.storybook/examplePages";
import { expect, userEvent } from "storybook/test";
import { NARROW_AND_RTL } from "../../.storybook/modes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumb } from "./Breadcrumb";
import { StatusPill } from "./StatusPill";

const meta = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs", "stable"],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Trail: Story = {
  parameters: {
    chromatic: { disableSnapshot: false, modes: { ...NARROW_AND_RTL } },
  },
  args: {
    items: [
      {
        label: "Labs",
        href: exampleHref("labs", "components-breadcrumb--trail"),
      },
      {
        label: "Chat box",
        href: exampleHref("chat", "components-breadcrumb--trail"),
      },
      { label: "Undo machine" },
    ],
  },
};

/**
 * Reachable and operable from the keyboard. Interaction only, so it does
 * not snapshot: the frame after tabbing is a focus state, not the
 * component's resting appearance.
 */
export const KeyboardReachable: Story = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  args: Trail.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("link")[0]!;
    await expect(target).toHaveFocus();
  },
};

/** TrailBehaviour, asserted. Hidden: it renders the example above again. */
export const TrailBehaviour: Story = {
  tags: ["!dev"],
  args: Trail.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    // The current page is text, never a link to itself.
    await expect(canvas.getByText("Undo machine")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByRole("link", { name: "Chat box" })).toBeVisible();
  },
};

/**
 * A deep trail, because the shallow one answers nothing about the case
 * that goes wrong. Six levels is where a breadcrumb starts competing with
 * the page title for the first line, and where a narrow viewport has to
 * decide what to drop.
 *
 * The current page keeps its full label even when the ancestors are long:
 * it is the one crumb that says where the reader is.
 */
export const DeepTrail: Story = {
  args: {
    items: [
      {
        label: "Labs",
        href: exampleHref("labs", "components-breadcrumb--deep-trail"),
      },
      {
        label: "Design system",
        href: exampleHref("design", "components-breadcrumb--deep-trail"),
      },
      {
        label: "Components",
        href: exampleHref("components", "components-breadcrumb--deep-trail"),
      },
      {
        label: "Navigation",
        href: exampleHref("navigation", "components-breadcrumb--deep-trail"),
      },
      {
        label: "Breadcrumb",
        href: exampleHref("breadcrumb", "components-breadcrumb--deep-trail"),
      },
      { label: "Accessibility" },
    ],
  },
};

/** Composed, for a crumb that carries more than a word. */
export const ComposedTrail: Story = {
  args: { items: undefined },
  render: () => (
    <Breadcrumb label="Order trail">
      <Breadcrumb.Crumb
        href={exampleHref("ordering", "components-breadcrumb--composed-trail")}
      >
        Ordering desk
      </Breadcrumb.Crumb>
      <Breadcrumb.Crumb
        href={exampleHref("suppliers", "components-breadcrumb--composed-trail")}
      >
        Suppliers <StatusPill tone="warn">2 late</StatusPill>
      </Breadcrumb.Crumb>
      <Breadcrumb.Crumb current>Nordwind Logistik</Breadcrumb.Crumb>
    </Breadcrumb>
  ),
};
