import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field } from "./Field";

const meta = {
  title: "Components/Field",
  component: Field,
  tags: ["autodocs", "stable"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The wiring, around a control this library does not ship.
 *
 * Field exists because the nine field components had nine answers to one
 * question. Measured before it: all nine took a `label`, two took a
 * `hint`, one took an `error`, and none took `required` — so a required
 * Select that failed validation was not expressible, and a team that
 * needed one wrote the paragraph themselves and wired
 * `aria-describedby` by hand.
 *
 * Use it directly for a control that is not in the library: a colour
 * picker, an uploader, a masked input. The render prop hands over the id
 * Field minted, the `aria-describedby` it assembled, and whether the
 * field is invalid.
 */
export const AroundACustomControl: Story = {
  parameters: {
    /* Not photographed. The matrix already photographs every state; this is the worked
     example, which is documentation rather than a baseline. */
    chromatic: { disableSnapshot: true },
  },
  args: {
    label: "Delivery window",
    hint: "Local time at the receiving warehouse.",
    children: () => null,
  },
  render: (args) => (
    <Field {...args}>
      {({ id, describedBy, invalid }) => (
        <div className="uix-field-row" data-invalid={invalid}>
          <input
            id={id}
            type="time"
            className="uix-field-input"
            defaultValue="08:30"
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        </div>
      )}
    </Field>
  ),
};

/**
 * Every state Field can be in, in one frame.
 *
 * The required row is the one worth looking at: the asterisk is
 * `aria-hidden` and the word beside it is not, so a screen reader says
 * "required" rather than "star" — and the word comes from the strings
 * table, so a German product gets "erforderlich" without a fork.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem", maxWidth: "22rem" }}>
      {[
        { label: "Rest" },
        { label: "With hint", hint: "One line of guidance." },
        { label: "With error", error: "That value is not accepted." },
        { label: "Required", required: true },
        {
          label: "Required, hinted and failing",
          required: true,
          hint: "One line of guidance.",
          error: "That value is not accepted.",
        },
        { label: "With an aside", aside: "0 / 40" },
        { label: "Label hidden from view", hideLabel: true },
      ].map((props) => (
        <Field key={String(props.label)} {...props}>
          {({ id, describedBy, invalid }) => (
            <div className="uix-field-row" data-invalid={invalid}>
              <input
                id={id}
                className="uix-field-input"
                aria-describedby={describedBy}
                aria-invalid={invalid}
              />
            </div>
          )}
        </Field>
      ))}
    </div>
  ),
};

/**
 * The wiring, asserted. Hidden from the sidebar: it renders the example
 * above again.
 *
 * This is the assertion that would have caught the whole problem. It does
 * not check that a hint renders — it checks that the control points at
 * it, which is the part every hand-rolled field got wrong.
 */
export const Wiring: StoryObj = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <Field
      label="Delivery window"
      hint="Local time at the receiving warehouse."
      error="That warehouse is closed then."
      required
    >
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          className="uix-field-input"
          aria-describedby={describedBy}
          aria-invalid={invalid}
        />
      )}
    </Field>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: /Delivery window/ });

    // Invalid, because there is an error. A red border is not a state.
    await expect(input).toHaveAttribute("aria-invalid", "true");

    // Described by both messages, hint first: the instruction before the
    // complaint.
    const described = input.getAttribute("aria-describedby")!.split(" ");
    await expect(described).toHaveLength(2);
    await expect(document.getElementById(described[0]!)).toHaveTextContent(
      /Local time/,
    );
    await expect(document.getElementById(described[1]!)).toHaveTextContent(
      /closed then/,
    );

    // Required as a word, not only as an asterisk.
    await expect(
      canvas.getByRole("textbox", { name: /required/ }),
    ).toBeInTheDocument();
  },
};
