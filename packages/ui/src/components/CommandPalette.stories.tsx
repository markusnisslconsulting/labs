import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./Button";
import { CommandPalette, type Command } from "./CommandPalette";

const meta = {
  title: "Components/CommandPalette",
  component: CommandPalette,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

const COMMANDS: Command[] = [
  { id: "new", label: "New supplier", section: "Create", shortcut: "⌘N" },
  { id: "import", label: "Import suppliers", section: "Create" },
  { id: "export", label: "Export as CSV", section: "Data", shortcut: "⌘E" },
  {
    id: "archive",
    label: "Archive selected",
    section: "Data",
    keywords: ["delete", "remove"],
  },
  {
    id: "settings",
    label: "Open settings",
    section: "Elsewhere",
    disabled: true,
  },
];

/**
 * Open, with sections and a shortcut column.
 *
 * The box is pinned near the top rather than vertically centred: a palette
 * is typed into, and one that grows from a fixed top does not move under the
 * cursor as results come and go. A centred box jumps on every keystroke.
 *
 * The disabled command is rendered rather than filtered out. A command that
 * vanishes when it cannot be used is a command the reader concludes does not
 * exist.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ minBlockSize: "24rem" }}>
      <p>The page behind, which is inert while the palette is open.</p>
      <Button>A control behind it</Button>
      {/* The disabled command is spelled out here rather than left inside
          the shared constant, so the photographed frame says which states
          it shows — `ui:story-coverage` asks for exactly that. */}
      <CommandPalette
        defaultOpen
        label="Commands"
        placeholder="Type a command"
        commands={[
          ...COMMANDS.slice(0, 4),
          {
            id: "settings",
            label: "Open settings",
            section: "Elsewhere",
            disabled: true,
          },
        ]}
        empty="No commands match."
      />
    </div>
  ),
};

/**
 * Focus stays in the field; the highlight moves with
 * `aria-activedescendant`.
 *
 * The reason this is not the tree or toolbar pattern. Moving DOM focus onto
 * each row as the arrows walk it would take focus out of the input, and the
 * next letter typed would go nowhere — so the rows are never focused and the
 * input reports which one is current.
 */
export const FocusStaysInTheField: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", commands: [] },
  render: () => (
    <CommandPalette defaultOpen label="Commands" commands={COMMANDS} />
  ),
  play: async () => {
    const body = within(document.body);
    const field = body.getByRole("combobox", { name: "Commands" });

    await expect(field).toHaveFocus();
    const first = field.getAttribute("aria-activedescendant");
    await expect(first).toBeTruthy();
    await expect(document.getElementById(first!)).toHaveTextContent(
      "New supplier",
    );

    await userEvent.keyboard("{ArrowDown}");
    await expect(
      field,
      "the arrows moved DOM focus, so the next letter typed goes nowhere",
    ).toHaveFocus();

    const second = field.getAttribute("aria-activedescendant");
    await expect(second).not.toBe(first);
    await expect(document.getElementById(second!)).toHaveTextContent(
      "Import suppliers",
    );
    await expect(document.getElementById(second!)).toHaveAttribute(
      "aria-selected",
      "true",
    );
  },
};

/**
 * Filtering matches keywords, and keeps the highlight on something.
 *
 * Two behaviours that pull against each other. "delete" finds "Archive
 * selected" because the caller said so in `keywords`, which is how a palette
 * survives people not knowing the product's vocabulary. And the highlight is
 * clamped rather than reset, so arrowing down and then refining the query
 * are not mutually exclusive.
 */
export const KeywordsMatchAndTheHighlightSurvives: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", commands: [] },
  render: () => (
    <CommandPalette
      defaultOpen
      label="Commands"
      commands={COMMANDS}
      empty="No commands match."
    />
  ),
  play: async () => {
    const body = within(document.body);
    const field = body.getByRole("combobox", { name: "Commands" });

    await userEvent.type(field, "delete");
    const options = body.getAllByRole("option");
    await expect(
      options,
      "a keyword the label does not contain did not match",
    ).toHaveLength(1);
    await expect(options[0]).toHaveTextContent("Archive selected");

    /* The count is announced, once, because it changed. */
    await expect(body.getByRole("status")).toHaveTextContent("1 command");

    await userEvent.clear(field);
    await userEvent.type(field, "zzz");
    await expect(body.queryAllByRole("option")).toHaveLength(0);
    await expect(body.getByRole("status")).toHaveTextContent(
      "No commands match",
    );
  },
};

/**
 * Enter runs the highlighted command; a disabled one refuses.
 *
 * And the palette closes on a run, because a palette that stays open after
 * doing something is a palette that looks like it did nothing.
 */
export const EnterRunsAndDisabledRefuses: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", commands: [] },
  render: function Render() {
    const [open, setOpen] = useState(true);
    const [ran, setRan] = useState<string[]>([]);
    return (
      <>
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          label="Commands"
          commands={COMMANDS}
          onSelect={(command) => setRan((c) => [...c, command.id])}
        />
        <p data-testid="ran">{ran.join(",") || "none"}</p>
        <p data-testid="open">{open ? "open" : "closed"}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    const body = within(document.body);
    const field = body.getByRole("combobox", { name: "Commands" });

    /* The disabled command first: highlight it and press Enter. */
    await userEvent.type(field, "settings");
    await expect(body.getAllByRole("option")).toHaveLength(1);
    await userEvent.keyboard("{Enter}");
    await expect(
      canvas.getByTestId("ran"),
      "a disabled command ran",
    ).toHaveTextContent("none");
    await expect(canvas.getByTestId("open")).toHaveTextContent("open");

    await userEvent.clear(field);
    await userEvent.type(field, "export");
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByTestId("ran")).toHaveTextContent("export");
    await expect(
      canvas.getByTestId("open"),
      "the palette stayed open after running something, so it looks inert",
    ).toHaveTextContent("closed");
  },
};

/**
 * Rows rendered by the caller.
 *
 * The seventh component here with this door. A `Command` is data because
 * that is what a registry holds; an icon per command, a recency hint, a
 * highlighted match — all separate questions.
 */
export const RowsRenderedByTheCaller: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", commands: [] },
  render: () => (
    <CommandPalette
      defaultOpen
      label="Commands"
      commands={COMMANDS.slice(0, 3)}
      item={(command) => (
        <span style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
          <span style={{ color: "var(--uix-text-caption)" }}>
            {command.section}
          </span>
          <span>{command.label}</span>
        </span>
      )}
    />
  ),
  play: async () => {
    const body = within(document.body);
    /* Asserted, because a story that demonstrates a prop and never reads
       the result documents an intention. */
    const first = body.getAllByRole("option")[0]!;
    /* Both parts, not one string. The two spans are adjacent with only a
       CSS gap between them, so the raw text reads "CreateNew supplier" —
       asserting the rendered sentence would be asserting the absence of a
       space character. */
    await expect(first).toHaveTextContent("Create");
    await expect(first).toHaveTextContent("New supplier");
  },
};

/**
 * The key legend, replaced.
 *
 * A palette that opens on a shortcut usually wants to say which one, and
 * only the application knows that. Passing a node replaces the default
 * three rather than adding to them, so the caller has to restate the keys
 * they still want — explicit, because a legend that silently grew a fourth
 * item when we added one would rearrange somebody's footer.
 */
export const HintsReplaced: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", commands: [] },
  render: () => (
    <CommandPalette
      defaultOpen
      label="Commands"
      commands={COMMANDS.slice(0, 3)}
      hints={
        <span
          style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}
        >
          <kbd>⌘K</kbd>
          reopens this
        </span>
      }
    />
  ),
  play: async () => {
    const body = within(document.body);
    await expect(body.getByText("reopens this")).toBeVisible();
    /* The default legend is gone, not appended to. */
    await expect(body.queryByText("to navigate")).toBeNull();
  },
};

/**
 * The legend is not announced.
 *
 * The field is a combobox, and the arrow keys and Enter come with that role
 * for a screen reader already. Read aloud, the legend would be three
 * sentences between opening the palette and typing in it, every time.
 */
export const HintsAreNotAnnounced: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", commands: [] },
  render: () => (
    <CommandPalette
      defaultOpen
      label="Commands"
      commands={COMMANDS.slice(0, 3)}
    />
  ),
  play: async () => {
    const body = within(document.body);
    /* Visible to the eye. */
    await expect(body.getByText("to navigate")).toBeVisible();
    /* Absent from the accessibility tree: getByText finds it in the DOM,
       and the ancestor carrying aria-hidden is what keeps it out. Asserted
       on the attribute rather than through a role query, because there is
       no role query that returns "nothing here has a name". */
    const legend = body.getByText("to navigate").closest("[aria-hidden]");
    await expect(legend).not.toBeNull();
    await expect(legend).toHaveAttribute("aria-hidden", "true");
  },
};

/** No legend at all. */
export const HintsRemoved: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "", commands: [] },
  render: () => (
    <CommandPalette
      defaultOpen
      label="Commands"
      commands={COMMANDS.slice(0, 3)}
      hints={null}
    />
  ),
  play: async () => {
    const body = within(document.body);
    await expect(body.queryByText("to navigate")).toBeNull();
  },
};
