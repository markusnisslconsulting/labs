import { expect } from "storybook/test";
import { grouped } from "../../.storybook/argTypes";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Banner } from "./Banner";

const meta = {
  title: "Components/Banner",
  component: Banner,
  tags: ["autodocs"],
  argTypes: grouped("severity", "children"),
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: {
    severity: "info",
    children: "New supplier onboarding opens in October.",
  },
};

export const Success: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { severity: "success", children: "Reorder points saved." },
};

export const Warning: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { severity: "warning", children: "Two suppliers have no lead time." },
  play: async ({ canvas }) => {
    // warning and danger interrupt (role=alert); info and success wait.
    await expect(canvas.getByRole("alert")).toBeVisible();
  },
};

export const Danger: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { severity: "danger", children: "The nightly sync did not run." },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toBeVisible();
  },
};

export const InfoIsPolite: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { severity: "info", children: "Onboarding opens in October." },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toBeVisible();
  },
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
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      {(["info", "success", "warning", "danger"] as const).map((severity) => (
        <Banner key={severity} severity={severity}>
          {severity}: the nightly sync reported this.
        </Banner>
      ))}
    </div>
  ),
};
