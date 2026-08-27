import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stepper, type StepperStep } from "./Stepper";

const meta = {
  title: "Components/Stepper",
  component: Stepper,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const STEPS: StepperStep[] = [
  { id: "account", label: "Account" },
  { id: "company", label: "Company", hint: "VAT number and address" },
  { id: "suppliers", label: "Suppliers" },
  { id: "review", label: "Review" },
];

/**
 * Every state and both orientations, in one frame.
 *
 * The states are what to look at, and each is a fill *and* a word. A
 * stepper that says where you are only by filling a circle fails WCAG
 * 1.4.1, and the mark inside a completed circle is `aria-hidden`, so it
 * cannot carry the meaning either — the word is in a visually hidden span.
 *
 * `errorAt` is separate from `current` because they are usually the same
 * step and sometimes not: a server rejecting step 2 while the reader is on
 * step 3 has to mark 2 and leave the reader where they are.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "2rem" }}>
      <Stepper label="Onboarding" current={0} steps={STEPS} />
      <Stepper label="Onboarding, midway" current={2} steps={STEPS} />
      <Stepper label="Onboarding, finished" current={4} steps={STEPS} />
      <Stepper
        label="Onboarding, with a rejected step"
        current={3}
        errorAt={1}
        steps={STEPS}
      />
      <Stepper
        label="Onboarding, vertical"
        orientation="vertical"
        current={2}
        steps={STEPS}
      />
      <Stepper
        label="Onboarding, a step not yet reachable"
        current={1}
        steps={[...STEPS.slice(0, 3), { ...STEPS[3]!, disabled: true }]}
      />
    </div>
  ),
};

/**
 * Where am I, answered in text.
 *
 * The visual position in a row of circles answers "where am I" for exactly
 * one kind of reader. `aria-current="step"` inside a named `nav` answers it
 * for the rest, and it is on the list item rather than on the control
 * because the step is current whether or not it happens to be a button.
 */
export const ItSaysWhereYouAre: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", current: 0, steps: [] },
  render: () => <Stepper label="Onboarding" current={2} steps={STEPS} />,
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("navigation", { name: "Onboarding" }),
      "a stepper is numbers and words until something says what sequence " +
        "it is",
    ).toBeInTheDocument();

    const items = canvas.getAllByRole("listitem");
    await expect(items).toHaveLength(4);
    await expect(items[2]).toHaveAttribute("aria-current", "step");
    for (const index of [0, 1, 3]) {
      await expect(items[index]).not.toHaveAttribute("aria-current");
    }

    /* And the state is readable, not only visible. Colour alone is 1.4.1,
       and the mark inside the circle is aria-hidden.

       Matched on the state word rather than on the whole string:
       `toHaveTextContent` reads the raw DOM, so the marker's digit is in
       there too and an anchored "^Review$" fails against "4Review" for a
       reason that has nothing to do with the claim. */
    await expect(items[0]).toHaveTextContent(/Account\s*\(completed\)/);
    await expect(items[2]).toHaveTextContent(/Suppliers\s*\(current\)/);
    await expect(
      items[3],
      "a step that is merely ahead has no state to announce",
    ).not.toHaveTextContent(/\((completed|current|failed)\)/);
  },
};

/**
 * Backwards is a button, forwards is not.
 *
 * The asymmetry is the whole navigation model. Returning to a step you
 * finished is safe; jumping past one is usually not, because a later step
 * depends on an earlier answer — and a control that looks available and
 * then refuses is worse than one that is plainly not there yet.
 */
export const OnlyFinishedStepsAreNavigable: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", current: 0, steps: [] },
  render: function Render() {
    const [current, setCurrent] = useState(2);
    return (
      <>
        <Stepper
          label="Onboarding"
          current={current}
          steps={STEPS}
          onStepChange={(index) => setCurrent(index)}
        />
        <p data-testid="at">{current}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    const buttons = canvas.getAllByRole("button");
    await expect(
      buttons,
      "only the two finished steps may be controls",
    ).toHaveLength(2);

    await expect(
      canvas.queryByRole("button", { name: /Review/ }),
      "a step ahead must not be a control at all, not even a disabled one",
    ).not.toBeInTheDocument();

    await userEvent.click(buttons[0]!);
    await expect(canvas.getByTestId("at")).toHaveTextContent("0");

    // Back at step 0, nothing is finished, so nothing is navigable.
    await expect(canvas.queryAllByRole("button")).toHaveLength(0);
  },
};

/**
 * Tab reaches the navigable steps and skips the rest.
 *
 * The keyboard consequence of the rule above, and the reason it is worth
 * having as a rule: a stepper that made every step a button would put four
 * tab stops in the page for two usable destinations.
 */
export const TabReachesOnlyWhatWorks: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", current: 0, steps: [] },
  render: () => (
    <Stepper
      label="Onboarding"
      current={3}
      steps={STEPS}
      onStepChange={() => {}}
    />
  ),
  play: async ({ canvas }) => {
    const stops = ["Account", "Company", "Suppliers"];
    for (const name of stops) {
      await userEvent.tab();
      await expect(
        canvas.getByRole("button", { name: new RegExp(name) }),
      ).toHaveFocus();
    }

    // Tabbing again leaves the stepper: the current step is not a stop.
    await userEvent.tab();
    await expect(
      canvas.queryByRole("button", { name: /Review/ }),
    ).not.toBeInTheDocument();
  },
};

/**
 * The circle rendered by the caller.
 *
 * The one part a list of steps cannot express. `label` and `hint` are
 * already nodes, so the words are the caller's; the marker is fixed at a
 * number, a tick or an exclamation mark, and a step whose marker should be
 * an icon or a percentage has no way to say so.
 *
 * It receives the resolved state, because the marker almost always depends
 * on it — and recomputing "am I done" in the caller is how the circle and
 * the label end up disagreeing about the same step.
 */
export const MarkersRenderedByTheCaller: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", current: 0, steps: [] },
  render: () => (
    <Stepper
      label="Import"
      current={2}
      errorAt={1}
      steps={[
        { id: "upload", label: "Upload", hint: "1,204 rows" },
        { id: "match", label: "Match columns", hint: "2 columns unmatched" },
        { id: "check", label: "Check", hint: "Running" },
        { id: "commit", label: "Commit" },
      ]}
      marker={(_step, state) =>
        state === "completed"
          ? "✓"
          : state === "failed"
            ? "!"
            : state === "current"
              ? "…"
              : "·"
      }
    />
  ),
  play: async ({ canvas }) => {
    /* Asserted, because this story passed while the prop was not wired at
       all: it renders and renders is all it did. A story that demonstrates
       a prop and never reads the result documents an intention. */
    const items = canvas.getAllByRole("listitem");
    await expect(items[2]).toHaveTextContent("…");
    await expect(
      items[3],
      "the default numbering is still showing, so the marker prop is ignored",
    ).not.toHaveTextContent("4");
  },
};
