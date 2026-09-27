import type { Meta, StoryObj } from "@storybook/react-vite";
import { Preferences } from "../../.storybook/examples/Preferences";
import { ContactForm } from "../../.storybook/examples/ContactForm";

const meta = {
  title: "Guides/Examples",
  tags: ["!dev"],
  parameters: { layout: "padded", chromatic: { disableSnapshot: true } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const LocalPreferences: Story = { render: () => <Preferences /> };
export const AccessibleForm: Story = { render: () => <ContactForm /> };
