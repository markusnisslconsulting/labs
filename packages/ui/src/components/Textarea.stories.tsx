import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "./Form";
import { Textarea } from "./Textarea";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every state, in one frame.
 *
 * The resize handle in the bottom corner is deliberate. `resize: none` is
 * the most common line in a textarea's stylesheet and it takes away the one
 * control the platform gives somebody whose text does not fit the box — a
 * WCAG 1.4.4 problem dressed as a design decision. Vertical only, so it
 * cannot break the form's column.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: "26rem" }}>
      <Textarea label="Note" placeholder="Anything worth recording" />
      <Textarea
        label="Note"
        hint="Visible to the supplier."
        defaultValue={"Two lines, so the box\nstarts at its content."}
      />
      <Textarea
        label="Note"
        maxLength={120}
        showCount
        defaultValue="Counted."
      />
      <Textarea label="Note" required error="A note is required." />
      <Textarea label="Note" disabled defaultValue="Cannot be edited." />
    </div>
  ),
};

/**
 * The counter is silent until it matters.
 *
 * A live region beside a field being typed into is the hardest one to get
 * right: announce every keystroke and it reads the number over the letters.
 * So the visible count is always there and the announced one appears in the
 * last fifth, which is when it becomes information rather than noise.
 */
export const TheCounterIsQuietUntilItMatters: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => <Textarea label="Note" maxLength={20} showCount />,
  play: async ({ canvas }) => {
    const field = canvas.getByRole("textbox", { name: "Note" });
    const status = canvas.getByRole("status");

    await expect(status, "nothing to say yet").toBeEmptyDOMElement();

    await userEvent.type(field, "four");
    await expect(
      status,
      "16 of 20 left is not news, and saying so talks over the typing",
    ).toBeEmptyDOMElement();

    await userEvent.type(field, "teen chars ok");
    await expect(status).toHaveTextContent(/characters left|1 character left/);
  },
};

/**
 * Growing is opt-in, and it stops.
 *
 * A box that grows is right for a message somebody composes and wrong inside
 * a dense form, where it moves everything below it on every line — so it is
 * a decision the caller makes rather than a behaviour they discover. And it
 * is capped: a field that grows without limit pushes the submit button off
 * the screen at the moment somebody has finished filling it in.
 */
export const AutoGrowStops: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => <Textarea label="Message" autoGrow maxRows={4} rows={2} />,
  play: async ({ canvas }) => {
    const field = canvas.getByRole("textbox", { name: "Message" });
    const height = () => field.getBoundingClientRect().height;

    const start = height();
    await userEvent.type(field, "one{Enter}two{Enter}three");
    await expect(
      height(),
      "the box did not grow with the text",
    ).toBeGreaterThan(start);

    /* Past the cap, then further past it. Comparing two heights that are
       both beyond `maxRows` is the assertion that means something: a
       tolerance against one earlier measurement passes for a box that is
       still growing, just slowly. */
    await userEvent.type(field, "{Enter}four{Enter}five{Enter}six");
    const atCap = height();
    await userEvent.type(
      field,
      "{Enter}seven{Enter}eight{Enter}nine{Enter}ten",
    );
    await expect(
      height(),
      "the box kept growing past maxRows, so a long note pushes the form " +
        "off the screen",
    ).toBe(atCap);

    // And it scrolls instead, rather than hiding the overflow.
    await expect(field).toHaveStyle({ overflowY: "auto" });
  },
};

/**
 * Inside a form, an error reaches it by name.
 *
 * The same `Field` wiring as every other field component, which is the point
 * of there being one.
 */
export const InAForm: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <Form errors={{ note: "A note is required." }}>
      <Textarea name="note" label="Note" />
    </Form>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole("textbox", { name: "Note" });
    await expect(field).toHaveAttribute("aria-invalid", "true");
    const described = field.getAttribute("aria-describedby");
    await expect(described).toBeTruthy();
    await expect(document.getElementById(described!)).toHaveTextContent(
      /note is required/,
    );
  },
};

/**
 * Growing, beside a fixed one, so the difference is visible.
 *
 * The reason `autoGrow` is opt-in rather than the default: the box on the
 * right moves everything below it on every line, which is right for a
 * message somebody composes and wrong in a form they are filling in.
 */
export const GrowingAndFixed: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: "26rem" }}>
      <Textarea
        label="Fixed"
        rows={2}
        defaultValue={"One\nTwo\nThree\nFour — this one scrolls."}
      />
      <Textarea
        label="Growing"
        autoGrow
        rows={2}
        maxRows={6}
        defaultValue={"One\nTwo\nThree\nFour — this one grew."}
      />
    </div>
  ),
};

/**
 * Tab moves past it, and Enter stays inside it.
 *
 * The keyboard difference between this and every other field, and the one
 * people notice: Enter belongs to the textarea, so a textarea inside a form
 * must not submit on it. Tab is the way out — which is why taking the resize
 * handle away matters, since that is the other control a keyboard user has
 * over a box whose text does not fit.
 */
export const TabLeavesAndEnterDoesNot: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <Form>
      <Textarea name="note" label="Note" />
      <button type="submit">Save</button>
    </Form>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole("textbox", { name: "Note" });
    await userEvent.tab();
    await expect(field).toHaveFocus();

    await userEvent.keyboard("first{Enter}second");
    await expect(
      field,
      "Enter left the field, so a note cannot have two lines",
    ).toHaveFocus();
    await expect(field).toHaveValue("first\nsecond");

    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: "Save" }),
      "Tab is the way out of a textarea and it did not leave",
    ).toHaveFocus();
  },
};
