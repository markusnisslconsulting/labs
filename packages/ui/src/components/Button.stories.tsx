import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "radio",
      options: ["solid", "outline", "ghost"],
      table: { category: "Appearance", defaultValue: { summary: "solid" } },
    },
    tone: {
      control: "radio",
      options: ["accent", "neutral"],
      table: {
        category: "Appearance",
        defaultValue: { summary: "accent" },
        description:
          "Fill family for the solid variant; outline and ghost record it without changing their look.",
      },
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      table: { category: "Appearance", defaultValue: { summary: "md" } },
    },
    disabled: {
      control: "boolean",
      table: { category: "State" },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SolidAccent: Story = {
  args: { children: "Run the agent" },
};

export const SolidNeutral: Story = {
  args: { tone: "neutral", children: "Accept" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Reset" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Skip" },
};

export const SmallRowPair: StoryObj = {
  render: () => (
    <div style={{ display: "flex", gap: "0.4rem" }}>
      <Button size="sm" tone="neutral">
        Accept
      </Button>
      <Button variant="outline" size="sm">
        Undo
      </Button>
    </div>
  ),
};

export const Large: Story = {
  args: { size: "lg", children: "Get started" },
};

export const Disabled: Story = {
  args: { children: "Run the agent", disabled: true },
  play: async ({ canvas }) => {
    // A disabled button stays in the DOM and keeps its accessible
    // name, so screen readers can still find the control.
    const button = canvas.getByRole("button", { name: "Run the agent" });
    await expect(button).toBeDisabled();
    await expect(button).toHaveTextContent("Run the agent");
  },
};

const variants = ["solid", "outline", "ghost"] as const;
const tones = ["accent", "neutral"] as const;
const sizes = ["sm", "md", "lg"] as const;

/**
 * The full matrix: three variants x two tones x three sizes. Every
 * cell is themed by component tokens; if a combination ever looks
 * wrong, the fix belongs in tokens, not in this story.
 */
export const Matrix: StoryObj = {
  render: () => (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      {variants.map((variant) => (
        <section key={variant}>
          <h3 style={{ margin: "0 0 0.5rem", textTransform: "capitalize" }}>
            {variant}
          </h3>
          {tones.map((tone) => (
            <div
              key={tone}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              {sizes.map((size) => (
                <Button key={size} variant={variant} tone={tone} size={size}>
                  {variant} · {tone} · {size}
                </Button>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  ),
};
