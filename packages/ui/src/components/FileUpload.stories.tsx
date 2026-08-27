import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { FileUpload, type UploadItem } from "./FileUpload";
import { Form } from "./Form";

const meta = {
  title: "Components/FileUpload",
  component: FileUpload,
  tags: ["autodocs", "beta"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS: UploadItem[] = [
  { id: "a", name: "contract-2026.pdf", size: 184_320, progress: 100 },
  {
    id: "b",
    name: "annex-a-very-long-file-name-indeed.pdf",
    size: 2_400_000,
    progress: 41,
  },
  {
    id: "c",
    name: "scan.png",
    size: 8_100_000,
    error: "Too large. The limit is 5 MB.",
  },
];

/**
 * Every state, in one frame.
 *
 * Empty, mid-upload, one file failed, disabled, and holding a field error.
 * The list is where to look: the name truncates at its *start*, because the
 * end of a file name is where the extension and the distinguishing part
 * usually are, and it is `unicode-bidi: plaintext` so an Arabic name in a
 * left-to-right list still reads correctly.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: "30rem" }}>
      <FileUpload label="Contract" accept="application/pdf" />
      <FileUpload
        label="Attachments"
        multiple
        items={ITEMS}
        onRemove={() => {}}
      />
      <FileUpload label="Contract" disabled />
      <FileUpload
        label="Contract"
        error="A signed contract is required."
        required
      />
    </div>
  ),
};

/**
 * The drop zone is a label over a real file input.
 *
 * The whole design, and the reason to reach for this rather than a div with
 * a drop handler. A div can be dropped on and cannot be reached, focused or
 * activated from a keyboard — and there is no way to add those three back
 * that a browser has not already done better. Drag and drop is the
 * enhancement; the input is the control.
 *
 * Asserted through the input's own reachability, because that is the part a
 * `div` implementation loses.
 */
export const TheZoneIsAFileInput: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => <FileUpload label="Contract" accept="application/pdf" />,
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Contract");
    await expect(input).toHaveProperty("type", "file");
    await expect(input).toHaveAttribute("accept", "application/pdf");

    /* Reachable with Tab, which a div with a drop handler is not. */
    await userEvent.tab();
    await expect(
      input,
      "the drop zone is not keyboard reachable, so it is a div in disguise",
    ).toHaveFocus();
  },
};

/**
 * Choosing files reports them once, and re-choosing the same file reports
 * again.
 *
 * The second half is the one that breaks quietly. A file input keeps its
 * value, so selecting the same file after a failed upload fires no `change`
 * event at all — and retrying the file that just failed is the commonest
 * thing a person does here.
 */
export const ReselectingTheSameFileFiresAgain: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: function Render() {
    const [calls, setCalls] = useState<string[]>([]);
    return (
      <>
        <FileUpload
          label="Contract"
          onFilesSelected={(files) =>
            setCalls((current) => [
              ...current,
              files.map((f) => f.name).join(","),
            ])
          }
        />
        <p data-testid="calls">{calls.join(" | ")}</p>
      </>
    );
  },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Contract") as HTMLInputElement;
    const file = () =>
      new File(["x"], "contract.pdf", { type: "application/pdf" });

    await userEvent.upload(input, file());
    await expect(canvas.getByTestId("calls")).toHaveTextContent("contract.pdf");

    await userEvent.upload(input, file());
    await expect(
      canvas.getByTestId("calls"),
      "the same file chosen twice reported once, so a retry does nothing",
    ).toHaveTextContent("contract.pdf | contract.pdf");

    // And the input is left empty, which is what makes that possible.
    await expect(input).toHaveValue("");
  },
};

/**
 * Progress is per file, and it is not announced.
 *
 * Two decisions that pull against each other. Each `<progress>` needs its
 * own accessible name, because "68 per cent" says nothing when three files
 * are in flight. And none of it goes in a live region: a region that fires
 * on every percentage point is a screen reader nobody can use, so arrival
 * and removal are announced and progress is left to be inspected.
 */
export const ProgressIsNamedAndNotAnnounced: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <FileUpload
      label="Attachments"
      multiple
      items={ITEMS}
      onRemove={() => {}}
    />
  ),
  play: async ({ canvas }) => {
    const bars = canvas.getAllByRole("progressbar");
    await expect(bars).toHaveLength(2);
    await expect(bars[0]).toHaveAccessibleName("Uploading contract-2026.pdf");

    /* Nothing has been announced: the story renders with files already
       present, and progress must never reach the live region. */
    await expect(
      canvas.getByRole("status"),
      "progress or the initial list reached the live region",
    ).toBeEmptyDOMElement();

    // Removing does announce, because it changes a list out of view.
    await userEvent.click(
      canvas.getByRole("button", { name: "Remove scan.png" }),
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "scan.png removed",
    );
  },
};

/**
 * Inside a form, an error reaches it by name.
 *
 * It goes through `Field` like every other field component, so the wiring
 * is the same one and not a second copy of it.
 */
export const InAForm: Story = {
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <Form errors={{ contract: "A signed contract is required." }}>
      <FileUpload name="contract" label="Contract" />
    </Form>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Contract");
    await expect(input).toHaveAttribute("aria-invalid", "true");

    const described = input.getAttribute("aria-describedby");
    await expect(described).toBeTruthy();
    await expect(document.getElementById(described!)).toHaveTextContent(
      /signed contract is required/,
    );
  },
};

/**
 * A row rendered by the caller.
 *
 * The fifth component here with this door, after `AvatarGroup`, `Stepper`,
 * `TagInput` and `InlineEdit`. A thumbnail, a link to the uploaded file, a
 * checksum — an `UploadItem` is data because that is what a caller has, and
 * what a row *looks* like is a separate question.
 *
 * The remove button is not the caller's to draw, for the same reason as in
 * `TagInput`: its accessible name carries the file it removes, and that name
 * is the thing being bought.
 */
export const RowsRenderedByTheCaller: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "" },
  render: () => (
    <FileUpload
      label="Attachments"
      multiple
      items={ITEMS.slice(0, 2)}
      onRemove={() => {}}
      item={(entry) => (
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            aria-hidden
            style={{
              inlineSize: "1.5rem",
              blockSize: "1.5rem",
              borderRadius: "var(--uix-radius-inset)",
              background: "var(--uix-bg-subtle)",
            }}
          />
          <a href="#preview">{entry.name}</a>
        </span>
      )}
    />
  ),
  play: async ({ canvas }) => {
    /* Asserted, because a story that demonstrates a prop and never reads
       the result documents an intention. */
    await expect(
      canvas.getByRole("link", { name: "contract-2026.pdf" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Remove contract-2026.pdf" }),
      "the remove button's name must survive a custom row",
    ).toBeInTheDocument();
  },
};
