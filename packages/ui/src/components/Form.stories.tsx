import { useState, type FormEvent } from "react";
import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { RadioGroup } from "./RadioGroup";
import { Form } from "./Form";
import { Select } from "./Select";
import { TextField } from "./TextField";

const meta = {
  title: "Components/Form",
  component: Form,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

const REGIONS = [
  { value: "eu", label: "European Union" },
  { value: "uk", label: "United Kingdom" },
];

/**
 * Every state a form has, in one frame.
 *
 * The rest state, a form holding server errors, and a form mid-submit.
 * The middle one is the reason this component exists: the errors are
 * passed once, by name, and no field is told about its own.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "2.5rem", maxWidth: "26rem" }}>
      <Form>
        <TextField name="email" label="Email" placeholder="jane@example.com" />
        <Select name="region" label="Supplier region" options={REGIONS} />
        <Form.Actions>
          <Button type="submit">Save</Button>
          <Button variant="ghost">Cancel</Button>
        </Form.Actions>
      </Form>

      <Form
        summaryOn="always"
        errors={{
          email: "That address is already registered.",
          region: "No contract covers that region.",
          contract: "The contract number on file has expired.",
        }}
      >
        <Form.Summary />
        <TextField name="email" label="Email" defaultValue="jane@example.com" />
        <Select name="region" label="Supplier region" options={REGIONS} />
        <Form.Actions>
          <Button type="submit">Save</Button>
        </Form.Actions>
      </Form>

      <Form busy>
        <TextField name="email" label="Email" defaultValue="jane@example.com" />
        <Form.Actions>
          <Button type="submit" loading>
            Saving
          </Button>
          <Button variant="ghost" disabled>
            Cancel
          </Button>
        </Form.Actions>
      </Form>
    </div>
  ),
};

/**
 * The third error in the matrix above has no field.
 *
 * `contract` is not rendered by that form, and the message still appears —
 * without a link, because there is nothing to link to. A server rejecting
 * a field the client does not show is a real case: a stale build, a
 * section behind a condition. Dropping the message produces a form that
 * refuses to submit and says nothing about why, which is the worst
 * failure a form has.
 */
export const AnErrorWithNoField: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    summaryOn: "always",
    errors: { contract: "The contract number on file has expired." },
    children: null,
  },
  render: (args) => (
    <Form {...args}>
      <Form.Summary />
      <TextField name="email" label="Email" />
      <Form.Actions>
        <Button type="submit">Save</Button>
      </Form.Actions>
    </Form>
  ),
};

/** Grouped fields, as a real fieldset with a legend. */
export const Grouped: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Form style={{ maxWidth: "26rem" }}>
      <Form.Group legend="Where it ships from">
        <TextField name="warehouse" label="Warehouse" />
        <Select name="region" label="Region" options={REGIONS} />
      </Form.Group>
      <Form.Group legend="Who to tell">
        <TextField name="contact" label="Contact" />
        <Checkbox name="notify" label="Send a confirmation email" />
      </Form.Group>
      <Form.Actions>
        <Button type="submit">Save</Button>
      </Form.Actions>
    </Form>
  ),
};

/**
 * The connection, asserted: errors arrive by name and reach the field.
 *
 * This is the whole claim of the component. A form is given a map of
 * errors, no field is told anything, and each field ends up invalid, its
 * message rendered, and `aria-describedby` pointing at it.
 *
 * The summary appears only after a submit, so the story submits — with
 * `summaryOn` left at its default, because "validating tells someone
 * their half-typed address is wrong" is a behaviour worth testing rather
 * than a sentence in a docstring.
 */
export const ErrorsReachTheirFields: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Form
      errors={{
        email: "That address is already registered.",
        region: "No contract covers that region.",
      }}
    >
      <Form.Summary />
      <TextField name="email" label="Email" />
      <Select name="region" label="Supplier region" options={REGIONS} />
      <Form.Actions>
        <Button type="submit">Save</Button>
      </Form.Actions>
    </Form>
  ),
  play: async ({ canvas }) => {
    const email = canvas.getByRole("textbox", { name: "Email" });
    const region = canvas.getByRole("combobox", { name: "Supplier region" });

    await expect(
      email,
      "the field was never told about its error; the form has to find it",
    ).toHaveAttribute("aria-invalid", "true");
    await expect(region).toHaveAttribute("aria-invalid", "true");

    // The message is rendered, and the control points at it.
    const described = email.getAttribute("aria-describedby");
    await expect(described).toBeTruthy();
    await expect(document.getElementById(described!)).toHaveTextContent(
      /already registered/,
    );

    // Nothing before the submit.
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    const summary = await canvas.findByRole("alert");
    await expect(summary).toHaveTextContent(/2 fields need attention/);
    await expect(
      summary,
      "the summary lists the fields in the form's order, by their labels",
    ).toHaveTextContent(/Email.*Supplier region/s);
  },
};

/**
 * A link in the summary moves focus, not only the viewport.
 *
 * The difference a keyboard user feels. An anchor to `#id` scrolls and
 * leaves focus on the summary, so somebody arrives at the right field
 * unable to type into it.
 */
export const SummaryLinksMoveFocus: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Form summaryOn="always" errors={{ email: "That address is not valid." }}>
      <Form.Summary />
      <TextField name="email" label="Email" />
      <Form.Actions>
        <Button type="submit">Save</Button>
      </Form.Actions>
    </Form>
  ),
  play: async ({ canvas }) => {
    const summary = canvas.getByRole("alert");
    await userEvent.click(canvas.getByRole("link", { name: "Email" }));
    await expect(
      canvas.getByRole("textbox", { name: "Email" }),
      "the link scrolled to the field and left focus on the summary",
    ).toHaveFocus();
    await expect(summary).toBeVisible();
  },
};

/**
 * A field's own error prop wins over the form's.
 *
 * A caller passing one directly has a reason — a client-side rule the
 * server does not know about — and a form quietly overriding it would be
 * the surprise.
 */
export const AFieldsOwnErrorWins: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Form errors={{ email: "The server does not like this." }}>
      <TextField
        name="email"
        label="Email"
        error="This does not look like an address."
      />
    </Form>
  ),
  play: async ({ canvas }) => {
    const email = canvas.getByRole("textbox", { name: "Email" });
    const described = email.getAttribute("aria-describedby")!;
    await expect(document.getElementById(described)).toHaveTextContent(
      /does not look like an address/,
    );
  },
};

/**
 * A form still submits, and busy stops the second attempt.
 *
 * `noValidate` is set, so the browser's own bubbles never appear — they
 * are not themeable, not translatable, and show one at a time. The
 * summary is their replacement, so a submit has to reach the caller.
 */
export const SubmitReachesTheCaller: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: function Render() {
    const [count, setCount] = useState(0);
    return (
      <Form
        /* No `event.preventDefault()`, deliberately. `Form` does it,
           because there is no `action` — and if it did not, this story
           would reload the test page instead of failing, which is exactly
           what happened when the buttons first became real submits. */
        onSubmit={() => setCount((value) => value + 1)}
      >
        <TextField name="email" label="Email" required />
        <Form.Actions>
          <Button type="submit">Save</Button>
        </Form.Actions>
        <p data-testid="count">submitted {count}</p>
      </Form>
    );
  },
  play: async ({ canvas }) => {
    // Required and empty: the browser would block this without noValidate.
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(canvas.getByTestId("count")).toHaveTextContent("submitted 1");
  },
};

/**
 * A checkbox is a field too, and the summary says its label.
 *
 * The case that motivated wiring `name` through the three controls that
 * carry their own label: "You must accept the terms" is a form error
 * attached to a checkbox, and until this test existed those three were the
 * only fields in the library that could not receive one. The hook had the
 * parameter and nothing passed it.
 *
 * Two things are asserted that the shape makes easy to get wrong. The
 * message renders at all — all three wrapped their messages in a check on
 * their *own* error prop, so a form-supplied one produced no wrapper and
 * no text. And the summary link reads the label rather than the field
 * name, because "notify" is not what the form says on screen.
 */
export const AChoiceControlIsAFieldToo: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Form
      summaryOn="always"
      errors={{
        terms: "You have to accept the terms to continue.",
        plan: "That plan is not available in your region.",
      }}
    >
      <Form.Summary />
      <Checkbox name="terms" label="I accept the terms" />
      <RadioGroup
        name="plan"
        legend="Plan"
        options={[
          { value: "team", label: "Team" },
          { value: "solo", label: "Solo" },
        ]}
      />
      <Form.Actions>
        <Button type="submit">Save</Button>
      </Form.Actions>
    </Form>
  ),
  play: async ({ canvas }) => {
    const box = canvas.getByRole("checkbox", { name: /accept the terms/ });
    await expect(box).toHaveAttribute("aria-invalid", "true");

    const described = box.getAttribute("aria-describedby");
    await expect(
      described,
      "the wrapper is skipped unless the resolved error is checked, not the prop",
    ).toBeTruthy();
    await expect(document.getElementById(described!)).toHaveTextContent(
      /accept the terms to continue/,
    );

    const summary = canvas.getByRole("alert");
    await expect(
      summary,
      "the link says the label, not the field name",
    ).toHaveTextContent(/I accept the terms/);
    await expect(summary).toHaveTextContent(/Plan/);

    /* The checkbox link reaches the checkbox. Worth asserting rather than
       assuming: Base UI puts the `id` on its hidden form input, not on the
       element that takes focus, and focus arrives at the control only
       because Base UI redirects it from that input. Measured, not
       inferred — and pinned here so an upgrade that drops the redirect
       fails in this file instead of quietly sending people nowhere. */
    await userEvent.click(
      canvas.getByRole("link", { name: "I accept the terms" }),
    );
    await expect(box).toHaveFocus();

    // A fieldset cannot take focus, so the group registers its first radio.
    await userEvent.click(canvas.getByRole("link", { name: "Plan" }));
    await expect(canvas.getByRole("radio", { name: "Team" })).toHaveFocus();
  },
};

/**
 * `action` opts back into the browser's own submission.
 *
 * The other half of the rule, and the half that is easy to leave untested
 * because testing it looks like it requires letting the page navigate. It
 * does not: the caller's handler runs after `Form`'s decision, so it can
 * read `defaultPrevented` to see what was decided and then prevent the
 * navigation itself.
 *
 * Both directions are asserted here, because a rule tested in one
 * direction is a rule that could be `preventDefault()` unconditionally and
 * still pass.
 */
export const ActionOptsBackIntoNativeSubmission: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: function Render() {
    const [seen, setSeen] = useState<Record<string, boolean>>({});
    const record = (key: string) => (event: FormEvent<HTMLFormElement>) => {
      setSeen((current) => ({ ...current, [key]: event.defaultPrevented }));
      // Whatever was decided, this story does not navigate.
      event.preventDefault();
    };
    return (
      <>
        <Form action="/save" onSubmit={record("withAction")}>
          <Form.Actions>
            <Button type="submit">With action</Button>
          </Form.Actions>
        </Form>
        <Form onSubmit={record("without")}>
          <Form.Actions>
            <Button type="submit">Without</Button>
          </Form.Actions>
        </Form>
        <p data-testid="seen">{JSON.stringify(seen)}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "With action" }));
    await userEvent.click(canvas.getByRole("button", { name: "Without" }));
    await expect(
      canvas.getByTestId("seen"),
      "an action means a server route exists, so the browser keeps its job",
    ).toHaveTextContent('{"withAction":false,"without":true}');
  },
};

/**
 * Tabbing reaches the fields in order, and skips what is not a control.
 *
 * The keyboard half that can be asserted with synthetic keys. Focus
 * movement under Tab is implemented by the test library, so it is honest
 * here; **implicit submission** — Enter inside a text field submitting the
 * form — is native browser behaviour that only a trusted key event
 * triggers, so it is asserted in `browser/keyboard.spec.ts` instead. A
 * story claiming to test it here would pass while the behaviour was
 * broken.
 *
 * The summary is the interesting assertion. It has `tabIndex={-1}` so a
 * submit can move focus to it, and `-1` must not put it in the tab order:
 * a person tabbing forward through a form should not have to pass a
 * paragraph they have already read.
 */
export const TabOrderFollowsTheForm: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: null },
  render: () => (
    <Form summaryOn="always" errors={{ email: "That address is not valid." }}>
      <Form.Summary />
      <TextField name="email" label="Email" />
      <Select name="region" label="Supplier region" options={REGIONS} />
      <Form.Actions>
        <Button type="submit">Save</Button>
        <Button variant="ghost">Cancel</Button>
      </Form.Actions>
    </Form>
  ),
  play: async ({ canvas }) => {
    const order = [
      canvas.getByRole("link", { name: "Email" }),
      canvas.getByRole("textbox", { name: "Email" }),
      canvas.getByRole("combobox", { name: "Supplier region" }),
      canvas.getByRole("button", { name: "Save" }),
      canvas.getByRole("button", { name: "Cancel" }),
    ];

    for (const element of order) {
      await userEvent.tab();
      await expect(element).toHaveFocus();
    }

    // And the summary container itself was never a stop on the way.
    await expect(
      canvas.getByRole("alert"),
      "tabIndex -1 makes it focusable by script, not by Tab",
    ).not.toHaveFocus();
  },
};
