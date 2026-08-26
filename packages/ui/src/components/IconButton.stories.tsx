import { expect, userEvent } from "storybook/test";
import { grouped } from "../../.storybook/argTypes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Settings, X } from "lucide-react";
import { IconButton } from "./IconButton";

const meta = {
  title: "Components/IconButton",
  component: IconButton,
  tags: ["autodocs", "stable"],
  argTypes: grouped(
    "variant",
    "size",
    "label",
    "children",
    "disabled",
    "onClick",
  ),
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The name is required at the type level — an unlabelled icon
    button cannot be authored. */
export const Close: Story = {
  /* Interaction test, not an example: hidden from the sidebar by
     `!dev` so the catalogue lists states a reader can look at, and
     kept in the test run by the default `test` tag. */
  tags: ["!dev"],
  parameters: { chromatic: { disableSnapshot: true } },
  args: { label: "Close", children: <X size={14} /> },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Close" })).toBeVisible();
  },
};

export const Solid: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    label: "Settings",
    variant: "solid",
    children: <Settings size={14} />,
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
  args: Close.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("button")[0]!;
    await expect(target).toHaveFocus();
  },
};

export const Outline: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { ...Close.args, variant: "outline" },
};

export const Small: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { ...Close.args, size: "sm" },
};

/**
 * Every state in one frame.
 *
 * This is the story Chromatic photographs; the per-state stories above
 * opt out, so one component costs one image per theme instead of one per
 * variant. They still run as tests — disabling a snapshot does not
 * disable a play function — and they still document each state on its own
 * in the docs page. A reviewer also sees every combination side by side,
 * which is easier to judge than five separate images.
 */
export const Matrix: StoryObj = {
  parameters: { chromatic: { disableSnapshot: false } },
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      {(["solid", "outline", "ghost"] as const).map((variant) => (
        <div
          key={variant}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.6rem",
            alignItems: "center",
          }}
        >
          {(["sm", "md"] as const).map((size) => (
            <IconButton
              key={size}
              variant={variant}
              size={size}
              label={`${variant} ${size}`}
            >
              <X size={14} />
            </IconButton>
          ))}
        </div>
      ))}
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
        {(["solid", "outline", "ghost"] as const).map((variant) => (
          <IconButton
            key={variant}
            variant={variant}
            label={`${variant} disabled`}
            disabled
          >
            <X size={14} />
          </IconButton>
        ))}
      </div>
    </div>
  ),
};
