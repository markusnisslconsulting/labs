import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Banner } from "./Banner";

const meta = {
  title: "Components/Banner",
  component: Banner,
  tags: ["autodocs"],
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    severity: "info",
    children: "New supplier onboarding opens in October.",
  },
};

export const Success: Story = {
  args: { severity: "success", children: "Reorder points saved." },
};

export const Warning: Story = {
  args: { severity: "warning", children: "Two suppliers have no lead time." },
  play: async ({ canvas }) => {
    // warning and danger interrupt (role=alert); info and success wait.
    await expect(canvas.getByRole("alert")).toBeVisible();
  },
};

export const Danger: Story = {
  args: { severity: "danger", children: "The nightly sync did not run." },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toBeVisible();
  },
};

export const InfoIsPolite: Story = {
  args: { severity: "info", children: "Onboarding opens in October." },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toBeVisible();
  },
};
