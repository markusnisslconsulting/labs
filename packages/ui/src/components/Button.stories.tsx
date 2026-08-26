import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs", "stable"],
  argTypes: {
    variant: {
      control: "radio",
      options: ["solid", "outline", "ghost"],
      table: { category: "Appearance", defaultValue: { summary: "solid" } },
    },
    tone: {
      control: "radio",
      options: ["accent", "neutral"],
      // `description` belongs at the argType root, not inside `table`.
      // Nested here it never rendered, and it took the docs page down
      // with "t.startsWith is not a function".
      description:
        "Fill family for the solid variant; outline and ghost record it without changing their look.",
      table: { category: "Appearance", defaultValue: { summary: "accent" } },
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
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: "Run the agent" },
};

export const SolidNeutral: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { tone: "neutral", children: "Accept" },
};

export const Outline: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { variant: "outline", children: "Reset" },
};

export const Ghost: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { variant: "ghost", children: "Skip" },
};

export const SmallRowPair: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
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
  parameters: { chromatic: { disableSnapshot: true } },
  args: { size: "lg", children: "Get started" },
};

export const Disabled: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
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
  parameters: { chromatic: { disableSnapshot: false } },
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
      <section>
        <h3 style={{ margin: "0 0 0.5rem" }}>States</h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <Button>Rest</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button variant="outline" disabled>
            Disabled outline
          </Button>
          <Button variant="ghost" disabled>
            Disabled ghost
          </Button>
          <Button leading="+">Leading</Button>
          <Button trailing="→">Trailing</Button>
        </div>
      </section>
    </div>
  ),
};

export const AsLink: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { children: "Read the article" },
  render: (args) => (
    <Button
      {...args}
      // The anchor's content comes from Button's children, which
      // jsx-a11y cannot see at this call site.
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      renderAs={<a href="#anchor" />}
    />
  ),
  play: async ({ canvas }) => {
    // A link that looks like a button must still BE a link: right-click,
    // middle-click and "open in new tab" all depend on the real element.
    const link = canvas.getByRole("link", { name: /Read the article/ });
    await expect(link).toHaveClass("uix-button");
    await expect(link).toHaveAttribute("href", "#anchor");
  },
};

/**
 * Reachable and operable from the keyboard. Interaction only, so it does
 * not snapshot: the frame after tabbing is a focus state, not the
 * component's resting appearance.
 */
export const KeyboardReachable: Story = {
  args: SolidAccent.args,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const target = canvas.getAllByRole("button")[0]!;
    await expect(target).toHaveFocus();
  },
};

export const Loading: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  args: { loading: true, children: "Saving" },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: /Saving/ });
    // aria-disabled, not the native attribute: the button stays in the
    // tab order so a keyboard user does not lose their place mid-form.
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button).not.toBeDisabled();
  },
};
