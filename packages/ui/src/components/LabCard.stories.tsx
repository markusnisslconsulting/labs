import type { Meta, StoryObj } from "@storybook/react-vite";
import { LabCard } from "./LabCard";

const meta = {
  title: "Patterns/LabCard",
  component: LabCard,
  tags: ["autodocs"],
} satisfies Meta<typeof LabCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "The chat box is a log",
    href: "/chat-box",
    summary:
      "The same scripted agent run twice: once as a transcript nobody can act on, once as events landing on the row.",
    tags: ["agents", "agentic-ui"],
    articleHref: "https://www.markusnissl.com/blog/the-chat-box-is-a-log",
  },
};

export const WithoutArticle: Story = {
  args: {
    title: "@labs/ui workbench",
    href: "/workbench",
    summary: "Every component, isolated in Storybook.",
    tags: ["components", "storybook"],
  },
};
