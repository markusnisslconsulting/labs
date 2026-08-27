import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "./Form";
import { TagInput } from "./TagInput";

const meta = {
  title: "Components/TagInput",
  component: TagInput,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const RECIPIENTS = ["ada@example.com", "grace@example.com"];

/**
 * Every state, in one frame.
 *
 * Empty, filled, with a hint, at its limit, disabled, and holding an error.
 * The one to look at is "at its limit": the input is gone rather than
 * present and refusing, because a field that accepts a keystroke and then
 * discards the tag is a field that lies about what it did.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: "28rem" }}>
      <TagInput label="Recipients" placeholder="name@example.com" />
      <TagInput label="Recipients" defaultValue={RECIPIENTS} />
      <TagInput
        label="Labels"
        hint="Enter or comma adds one. Backspace on an empty field removes the last."
        defaultValue={["urgent", "eu-only", "needs-review"]}
      />
      <TagInput label="Recipients" defaultValue={RECIPIENTS} max={2} />
      <TagInput label="Recipients" required />
      <TagInput label="Recipients" defaultValue={RECIPIENTS} disabled />
      <TagInput
        label="Recipients"
        defaultValue={["not-an-address"]}
        error="One of these is not a valid address."
      />
    </div>
  ),
};

/**
 * The keyboard is the component.
 *
 * Enter and comma commit, and Backspace in an empty field removes the last
 * tag — the behaviour every mail client already taught people. Each of
 * those is a decision that can be lost silently, which is why all three are
 * asserted here rather than described in a docstring.
 */
export const TheKeyboardAddsAndRemoves: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: function Render() {
    const [tags, setTags] = useState<string[]>([]);
    return (
      <>
        <TagInput label="Recipients" value={tags} onValueChange={setTags} />
        <p data-testid="tags">{tags.join("|")}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    const field = canvas.getByRole("textbox", { name: "Recipients" });

    await userEvent.type(field, "ada@example.com{Enter}");
    await expect(canvas.getByTestId("tags")).toHaveTextContent(
      "ada@example.com",
    );

    // A comma commits too, because that is how people paste a list.
    await userEvent.type(field, "grace@example.com,");
    await expect(canvas.getByTestId("tags")).toHaveTextContent(
      "ada@example.com|grace@example.com",
    );

    /* Backspace on an empty field removes the last. Two presses: the first
       is on an empty field only because the comma cleared it. */
    await userEvent.type(field, "{Backspace}");
    await expect(canvas.getByTestId("tags")).toHaveTextContent(
      "ada@example.com",
    );

    // And typing then backspacing edits the draft rather than a tag.
    await userEvent.type(field, "x{Backspace}");
    await expect(
      canvas.getByTestId("tags"),
      "Backspace ate a tag while the draft was not empty",
    ).toHaveTextContent("ada@example.com");
  },
};

/**
 * Each remove button says which tag it removes, and removing announces.
 *
 * Two failures this pattern almost always has. A column of buttons all
 * called "Remove" is a column a screen reader reads as identical controls.
 * And pressing Backspace deletes something *elsewhere* on the screen, so a
 * reader whose focus is in the input gets no confirmation at all without a
 * live region.
 */
export const RemovingIsAnnouncedAndNamed: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => <TagInput label="Recipients" defaultValue={RECIPIENTS} />,
  play: async ({ canvas }) => {
    const remove = canvas.getByRole("button", {
      name: "Remove grace@example.com",
    });
    await expect(
      canvas.getByRole("button", { name: "Remove ada@example.com" }),
    ).toBeInTheDocument();

    /* The tags are a list, so a reader can count them. A row of chips
       built from divs is a row nobody can count. */
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2);

    await userEvent.click(remove);

    await expect(canvas.getByRole("status")).toHaveTextContent(
      "grace@example.com removed",
    );
    await expect(canvas.getAllByRole("listitem")).toHaveLength(1);

    /* And focus went back to the input. Removing the button that had focus
       otherwise drops the keyboard at the top of the document. */
    await expect(
      canvas.getByRole("textbox", { name: "Recipients" }),
    ).toHaveFocus();
  },
};

/**
 * A duplicate is dropped, and `normalise` decides what counts as one.
 *
 * Trimming and de-duplicating are properties of a tag set, so they are not
 * the caller's job. What *is* the caller's job is whether "EU " and "eu"
 * are the same tag, and whether a value that fails a check may be added at
 * all — a component that guessed either would be wrong for half its
 * callers.
 */
export const NormaliseDecidesWhatIsADuplicate: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: function Render() {
    const [tags, setTags] = useState<string[]>([]);
    return (
      <>
        <TagInput
          label="Labels"
          value={tags}
          onValueChange={setTags}
          normalise={(raw) => (raw.startsWith("#") ? null : raw.toLowerCase())}
        />
        <p data-testid="tags">{tags.join("|")}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    const field = canvas.getByRole("textbox", { name: "Labels" });

    await userEvent.type(field, "  Urgent  {Enter}");
    await expect(
      canvas.getByTestId("tags"),
      "trimmed and lowercased: trimming is ours, the case rule is the caller's",
    ).toHaveTextContent("urgent");

    await userEvent.type(field, "URGENT{Enter}");
    await expect(
      canvas.getByTestId("tags"),
      "the same tag under the caller's rule was added twice",
    ).toHaveTextContent(/^urgent$/);

    await userEvent.type(field, "#refused{Enter}");
    await expect(
      canvas.getByTestId("tags"),
      "normalise returned null and the tag was added anyway",
    ).toHaveTextContent(/^urgent$/);
  },
};

/**
 * Inside a form, an error reaches it by name and Enter still submits.
 *
 * Two things that have to coexist. Enter with a draft means "add this tag",
 * so the form must not submit; Enter with the field empty is a submit, which
 * is what people expect from the last field of a form.
 */
export const InAForm: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: function Render() {
    const [submits, setSubmits] = useState(0);
    return (
      <Form
        errors={{ recipients: "At least one recipient is required." }}
        onSubmit={() => setSubmits((n) => n + 1)}
      >
        <TagInput name="recipients" label="Recipients" />
        <p data-testid="submits">{submits}</p>
      </Form>
    );
  },
  play: async ({ canvas }) => {
    const field = canvas.getByRole("textbox", { name: "Recipients" });
    await expect(field).toHaveAttribute("aria-invalid", "true");

    const described = field.getAttribute("aria-describedby");
    await expect(described).toBeTruthy();
    await expect(document.getElementById(described!)).toHaveTextContent(
      /At least one recipient/,
    );

    // A draft means "add this", not "submit".
    await userEvent.type(field, "ada@example.com{Enter}");
    await expect(
      canvas.getByTestId("submits"),
      "Enter submitted the form while a tag was half-entered",
    ).toHaveTextContent("0");

    // Empty, Enter is the form's again.
    await userEvent.type(field, "{Enter}");
    await expect(canvas.getByTestId("submits")).toHaveTextContent("1");
  },
};

/**
 * Tags rendered by the caller.
 *
 * The door out of `string[]`, and the third component here to need one —
 * `AvatarGroup` has `person`, `Stepper` has `marker`. A tag is a string
 * because that is what gets submitted; what it looks like is a different
 * question, and a coloured dot or a link to the label's definition cannot
 * be said in a string.
 *
 * The remove button stays this component's to draw. Its accessible name is
 * the reason to reach for `TagInput` rather than a row of chips, so handing
 * it to a caller would hand away the one thing being bought.
 */
export const TagsRenderedByTheCaller: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <TagInput
      label="Labels"
      defaultValue={["urgent", "eu-only", "needs-review"]}
      tag={(value) => (
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: "0.3em" }}
        >
          <span
            aria-hidden
            style={{
              inlineSize: "0.5em",
              blockSize: "0.5em",
              borderRadius: "var(--uix-radius-pill)",
              background:
                value === "urgent"
                  ? "var(--uix-status-danger)"
                  : "var(--uix-status-ok)",
            }}
          />
          {value}
        </span>
      )}
    />
  ),
  play: async ({ canvas }) => {
    /* Asserted, because a story that demonstrates a prop and never reads
       the result documents an intention. The `Stepper` marker story passed
       for a while against a prop wired to nothing. */
    await expect(canvas.getByText("urgent")).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Remove urgent" }),
      "the remove button's name must survive a custom tag body",
    ).toBeInTheDocument();
  },
};

/**
 * Tab reaches every remove button, then the field.
 *
 * The failing this pattern usually has: tags that can only be removed with
 * a mouse. Each remove control is a real `<button>` in the list, so Tab
 * walks them in the order they are drawn and lands in the input last — and
 * Backspace from there is the shortcut for people who would rather not.
 */
export const TabReachesEveryRemoveButton: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => <TagInput label="Recipients" defaultValue={RECIPIENTS} />,
  play: async ({ canvas }) => {
    for (const address of RECIPIENTS) {
      await userEvent.tab();
      await expect(
        canvas.getByRole("button", { name: `Remove ${address}` }),
        "a tag can only be removed with a mouse",
      ).toHaveFocus();
    }

    await userEvent.tab();
    await expect(
      canvas.getByRole("textbox", { name: "Recipients" }),
      "the field is the last stop, after the tags it holds",
    ).toHaveFocus();
  },
};
