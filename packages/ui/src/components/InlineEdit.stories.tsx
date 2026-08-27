import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { InlineEdit } from "./InlineEdit";

const meta = {
  title: "Components/InlineEdit",
  component: InlineEdit,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof InlineEdit>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Both states and the empty case, in one frame.
 *
 * The reading state is a `<button>`, and that is the decision the component
 * exists for. A div with a click handler says nothing to a screen reader and
 * is not reachable with Tab; a flat text field says "type here" and then
 * swallows the arrow keys of anyone navigating past it.
 *
 * The two states are sized to occupy the same space, down to a transparent
 * border on the button matching the input's, so starting an edit does not
 * move the row and everything below it.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1rem", maxWidth: "22rem" }}>
      <InlineEdit
        label="Supplier name"
        value="Northwind Textiles"
        onValueChange={() => {}}
      />
      <InlineEdit
        label="Contact"
        value=""
        placeholder="No contact yet"
        onValueChange={() => {}}
      />
      <InlineEdit
        label="Contract number"
        value="EU-4417"
        onValueChange={() => {}}
        disabled
      />
    </div>
  ),
};

/**
 * Enter commits, Escape restores.
 *
 * Both directions, because either alone looks correct. A component that
 * commits on Escape has silently made every accidental keystroke permanent,
 * and a component that discards on Enter loses the work of anyone who
 * expects a form to behave like a form.
 */
export const EnterCommitsAndEscapeRestores: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", value: "", onValueChange: () => {} },
  render: function Render() {
    const [value, setValue] = useState("Northwind Textiles");
    return (
      <>
        <InlineEdit
          label="Supplier name"
          value={value}
          onValueChange={setValue}
        />
        <p data-testid="value">{value}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Edit Supplier name" }),
    );

    const field = canvas.getByRole("textbox", { name: "Supplier name" });
    await expect(
      field,
      "opening the editor left the keyboard on a button that no longer exists",
    ).toHaveFocus();

    await userEvent.keyboard("Adria Components{Enter}");
    await expect(canvas.getByTestId("value")).toHaveTextContent(
      "Adria Components",
    );
    await expect(
      canvas.getByRole("button", { name: "Edit Supplier name" }),
      "committing left focus nowhere",
    ).toHaveFocus();

    // And Escape puts back what was there.
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("Something else{Escape}");
    await expect(
      canvas.getByTestId("value"),
      "Escape committed, so every accidental keystroke is permanent",
    ).toHaveTextContent("Adria Components");
  },
};

/**
 * The switch between the two controls is announced.
 *
 * Replacing a button with a text field changes what the control *is*: focus
 * lands on a different role with a different name. A sighted reader sees a
 * box appear; a screen reader gets a new element under its cursor and no
 * word about why.
 */
export const TheSwitchIsAnnounced: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", value: "", onValueChange: () => {} },
  render: function Render() {
    const [value, setValue] = useState("Northwind Textiles");
    return (
      <InlineEdit
        label="Supplier name"
        value={value}
        onValueChange={setValue}
      />
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toBeEmptyDOMElement();

    await userEvent.click(
      canvas.getByRole("button", { name: "Edit Supplier name" }),
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Editing Supplier name",
    );

    await userEvent.keyboard("{Escape}");
    await expect(
      canvas.getByRole("status"),
      "abandoning an edit says nothing, so a reader cannot tell it happened",
    ).toHaveTextContent("Supplier name unchanged");
  },
};

/**
 * A refused change keeps the reader in the editor.
 *
 * The failure mode `validate` exists to prevent. Sending someone back to a
 * reading state that shows the old value, with the complaint rendered
 * somewhere else, is how people lose what they typed — and they usually do
 * not notice until they look for it later.
 */
export const RefusingKeepsTheDraft: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", value: "", onValueChange: () => {} },
  render: function Render() {
    const [value, setValue] = useState("Northwind Textiles");
    return (
      <>
        <InlineEdit
          label="Supplier name"
          value={value}
          onValueChange={setValue}
          validate={(next) =>
            next.trim() ? undefined : "A supplier needs a name."
          }
        />
        <p data-testid="value">{value}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Edit Supplier name" }),
    );

    await userEvent.clear(
      canvas.getByRole("textbox", { name: "Supplier name" }),
    );
    await userEvent.keyboard("{Enter}");

    const field = canvas.getByRole("textbox", { name: "Supplier name" });
    await expect(
      field,
      "a refused change dropped the reader back to the reading state",
    ).toBeInTheDocument();
    await expect(field).toHaveAttribute("aria-invalid", "true");

    const described = field.getAttribute("aria-describedby");
    await expect(described).toBeTruthy();
    await expect(document.getElementById(described!)).toHaveTextContent(
      "A supplier needs a name.",
    );

    await expect(canvas.getByTestId("value")).toHaveTextContent(
      "Northwind Textiles",
    );
  },
};

/**
 * The reading state rendered by the caller.
 *
 * The fourth component here with this door, after `AvatarGroup`, `Stepper`
 * and `TagInput`. A value is a string because that is what gets saved; how
 * it reads is a separate question — a currency, a date, a name with a status
 * beside it.
 */
export const DisplayRenderedByTheCaller: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", value: "", onValueChange: () => {} },
  render: () => (
    <InlineEdit
      label="Unit price"
      value="1250"
      onValueChange={() => {}}
      display={(value) =>
        new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "EUR",
        }).format(Number(value) / 100)
      }
    />
  ),
  play: async ({ canvas }) => {
    /* Asserted, and asserted *without* clicking. A reference story may
       check what it shows; the moment it interacts, the sidebar entry
       becomes a picture of the state after the interaction — which is what
       `test/stories.spec.ts` refuses and what made ten stories here show
       the same resting frame. The click half is the `!dev` story below. */
    await expect(
      canvas.getByRole("button", { name: "Edit Unit price" }),
    ).toHaveTextContent("€12.50");
  },
};

/**
 * The editor holds the raw value, not the formatted one.
 *
 * The other half of `display`, and the half that needs an interaction:
 * editing a currency symbol is not editing a price. A component that put
 * "€12.50" into the field would make the reader delete the formatting
 * before they could type.
 */
export const TheEditorHoldsTheRawValue: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", value: "", onValueChange: () => {} },
  render: () => (
    <InlineEdit
      label="Unit price"
      value="1250"
      onValueChange={() => {}}
      display={(value) =>
        new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "EUR",
        }).format(Number(value) / 100)
      }
    />
  ),
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Edit Unit price" }),
    );
    await expect(
      canvas.getByRole("textbox", { name: "Unit price" }),
      "the field holds the formatted value, so the reader has to delete it first",
    ).toHaveValue("1250");
  },
};

/**
 * Uncontrolled, which is the case that had no expression at first.
 *
 * `value` was required and `defaultValue` did not exist, so a title above a
 * page that saves through the same callback it renders from still had to
 * make its caller hold a string. The gate that asks for the full triple —
 * value, defaultValue, onValueChange — is the reason this exists.
 */
export const Uncontrolled: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => <InlineEdit label="Page title" defaultValue="Untitled" />,
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Edit Page title" }),
    );
    const field = canvas.getByRole("textbox", { name: "Page title" });
    /* The editor opens on the value it is showing, which is the assertion
       that failed first: the reading state was rendering the `value` prop
       rather than the resolved value, so an uncontrolled edit displayed
       nothing at all. The gate asking for the full value / defaultValue /
       onValueChange triple is what surfaced it. */
    await expect(field).toHaveValue("Untitled");

    await userEvent.clear(field);
    await userEvent.type(field, "Supplier report");
    await userEvent.keyboard("{Enter}");

    await expect(
      canvas.getByRole("button", { name: "Edit Page title" }),
      "the component did not keep its own value, so nothing was saved",
    ).toHaveTextContent("Supplier report");
  },
};
