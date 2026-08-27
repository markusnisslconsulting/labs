import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Combobox, type ComboboxOption } from "./Combobox";
import { Form } from "./Form";

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const SUPPLIERS: ComboboxOption[] = [
  { value: "Northwind Textiles", section: "European Union" },
  { value: "Adria Components", section: "European Union" },
  { value: "Vale Packaging", section: "Switzerland" },
  { value: "Kestrel Metals", section: "United Kingdom" },
  { value: "Halden Foundry", section: "United Kingdom", disabled: true },
];

/**
 * Every state, in one frame.
 *
 * Closed, open with sections, multiple with two values held, disabled, and
 * holding a field error. The open one is the frame to read: the highlight is
 * a background rather than a focus ring, because nothing in the list is
 * focused — focus is in the text field the whole time.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "8rem", maxWidth: "24rem" }}>
      <Combobox
        label="Supplier"
        options={SUPPLIERS}
        placeholder="Search suppliers"
      />
      <Combobox
        label="Suppliers"
        multiple
        options={SUPPLIERS}
        defaultValue={["Adria Components", "Vale Packaging"]}
      />
      <Combobox label="Supplier" options={SUPPLIERS} disabled />
      {/* Waiting on a server, which is a state and not just a spinner: the
          live region says so, and the empty area says so instead of saying
          "no options match" about an answer that has not arrived. */}
      <Combobox
        label="Supplier"
        options={[]}
        loading
        onQueryChange={() => {}}
      />
      <Combobox
        label="Supplier"
        options={SUPPLIERS}
        required
        error="Pick a supplier before continuing."
      />
    </div>
  ),
};

/**
 * Focus stays in the field; the highlight moves with
 * `aria-activedescendant`.
 *
 * The same pattern as `CommandPalette`, on purpose: the two are the same
 * shape of problem, and a library where two components solve it differently
 * is a library where one of them is wrong. Moving DOM focus onto each row as
 * the arrows walk it takes focus out of the input, and the next letter typed
 * goes nowhere.
 */
export const FocusStaysInTheField: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => <Combobox label="Supplier" options={SUPPLIERS} />,
  play: async ({ canvas }) => {
    const field = canvas.getByRole("combobox", { name: "Supplier" });
    await expect(field).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(field);
    await expect(field).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{ArrowDown}");
    await expect(
      field,
      "the arrows moved DOM focus, so the next letter typed goes nowhere",
    ).toHaveFocus();

    const active = field.getAttribute("aria-activedescendant");
    await expect(active).toBeTruthy();
    await expect(document.getElementById(active!)).toHaveTextContent(
      "Adria Components",
    );
  },
};

/**
 * More than one value, each removable by name.
 *
 * The first of the three things the `datalist` version could not do. The
 * chosen values are a list so a reader can count them, and each remove
 * control names its own value — a column of buttons all called "Remove" is
 * a column a screen reader hears as identical controls.
 */
export const MultipleValues: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: function Render() {
    const [value, setValue] = useState<string | string[] | null>([]);
    return (
      <>
        <Combobox
          label="Suppliers"
          multiple
          options={SUPPLIERS}
          value={value}
          onValueChange={setValue}
        />
        <p data-testid="value">
          {Array.isArray(value) ? value.join("|") : String(value)}
        </p>
      </>
    );
  },
  play: async ({ canvas }) => {
    const field = canvas.getByRole("combobox", { name: "Suppliers" });
    await userEvent.click(field);

    await userEvent.click(canvas.getByRole("option", { name: /Northwind/ }));
    await expect(canvas.getByTestId("value")).toHaveTextContent(
      "Northwind Textiles",
    );

    /* The list stays open, because choosing a second value is the next
       thing somebody does. */
    await expect(field).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(canvas.getByRole("option", { name: /Vale/ }));
    await expect(canvas.getByTestId("value")).toHaveTextContent(
      "Northwind Textiles|Vale Packaging",
    );

    // And each held value is removable by its own name.
    await userEvent.click(
      canvas.getByRole("button", { name: "Remove Northwind Textiles" }),
    );
    await expect(canvas.getByTestId("value")).toHaveTextContent(
      /^Vale Packaging$/,
    );
  },
};

/**
 * Options from a server, and no second filtering on top.
 *
 * The second thing the `datalist` version could not do. Passing
 * `onQueryChange` turns local filtering off entirely — a component that
 * asked for results and then filtered them would hide rows a server
 * deliberately returned, and the reader would have no way to tell which of
 * the two had happened.
 */
export const AsyncOptions: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: function Render() {
    const [query, setQuery] = useState("");
    /* A stand-in for a server: it answers with everything, deliberately
       ignoring the query, so the story can show that the component does not
       filter on top of an answer it was given. */
    const answered = useMemo(() => SUPPLIERS.slice(0, 3), []);
    return (
      <>
        <Combobox
          label="Supplier"
          options={answered}
          onQueryChange={setQuery}
          placeholder="Search suppliers"
        />
        <p data-testid="query">{query || "—"}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    const field = canvas.getByRole("combobox", { name: "Supplier" });
    await userEvent.type(field, "zzz");

    await expect(
      canvas.getByTestId("query"),
      "the caller was not told what was typed",
    ).toHaveTextContent("zzz");
    await expect(
      canvas.getAllByRole("option"),
      "the component filtered the server's answer and hid rows it returned",
    ).toHaveLength(3);
  },
};

/**
 * A disabled option is shown and refused, not hidden.
 *
 * An option that vanishes when it cannot be chosen is one the reader
 * concludes does not exist, and then asks support about.
 */
export const DisabledOptionsAreVisible: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: function Render() {
    const [value, setValue] = useState<string | string[] | null>(null);
    return (
      <>
        <Combobox
          label="Supplier"
          options={SUPPLIERS}
          value={value}
          onValueChange={setValue}
        />
        <p data-testid="value">{String(value)}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Supplier" }));

    const halden = canvas.getByRole("option", { name: /Halden/ });
    await expect(halden).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(halden);
    await expect(
      canvas.getByTestId("value"),
      "a disabled option was chosen",
    ).toHaveTextContent("null");
  },
};

/**
 * Rows rendered by the caller.
 *
 * The third thing the `datalist` version could not do, and the eighth
 * component here with this door. The selected state is handed back, because
 * a custom row almost always wants to show it and recomputing "am I chosen"
 * in the caller is how the row and the checkmark end up disagreeing.
 */
export const RowsRenderedByTheCaller: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <Combobox
      label="Supplier"
      options={SUPPLIERS.slice(0, 3)}
      defaultValue="Adria Components"
      option={(entry, { selected }) => (
        <span style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
          <span style={{ color: "var(--uix-text-caption)" }}>
            {entry.section}
          </span>
          <span>{entry.value}</span>
          {selected ? <Check size={14} aria-hidden /> : null}
        </span>
      )}
    />
  ),
};

/**
 * Inside a form, an error reaches it by name.
 *
 * It goes through `Field` like every other field component, so the wiring is
 * the same one rather than a second copy of it.
 */
export const InAForm: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <Form errors={{ supplier: "Pick a supplier before continuing." }}>
      <Combobox name="supplier" label="Supplier" options={SUPPLIERS} />
    </Form>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole("combobox", { name: "Supplier" });
    await expect(field).toHaveAttribute("aria-invalid", "true");

    const described = field.getAttribute("aria-describedby");
    await expect(described).toBeTruthy();
    await expect(document.getElementById(described!)).toHaveTextContent(
      /Pick a supplier/,
    );
  },
};

/**
 * Two thousand options, which is what filtering has to stay cheap over.
 *
 * Not photographed — it is a measurement fixture rather than a picture, and
 * `browser/runtime.spec.ts` types eight characters into it and compares the
 * cost of the last keystroke to the first. The shape being caught is a
 * filter that re-derives something over the whole typed prefix rather than
 * over the list.
 */
export const LongList: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <Combobox
      label="Supplier"
      options={Array.from(
        { length: 2000 },
        (_, index) => `Supplier ${index + 1} of the European Union`,
      )}
      placeholder="Search suppliers"
    />
  ),
  play: async ({ canvas }) => {
    /* One assertion, so the fixture cannot silently render nothing and
       make the performance test measure an empty list. */
    await expect(
      canvas.getByRole("combobox", { name: "Supplier" }),
    ).toBeInTheDocument();
  },
};
