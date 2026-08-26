import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { NARROW } from "../../.storybook/modes";
import { X } from "lucide-react";
import { useState } from "react";
import { Chip } from "./Chip";
import { IconButton } from "./IconButton";
import { SearchInput } from "./SearchInput";
import { Switch } from "./Switch";
import { Checkbox } from "./Checkbox";

const meta = {
  title: "Patterns/FilterBar",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function FilterBar() {
  const [tags, setTags] = useState<Set<string>>(new Set(["agents"]));
  const [compact, setCompact] = useState(false);

  const toggle = (tag: string) =>
    setTags((current) => {
      const next = new Set(current);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });

  return (
    <div style={{ display: "grid", gap: "1rem", justifyItems: "start" }}>
      <div
        style={{
          display: "flex",
          gap: "0.8rem",
          width: "100%",
          maxWidth: "28rem",
          alignItems: "center",
        }}
      >
        <SearchInput
          placeholder="Search the labs"
          label="Search the labs"
          style={{ flex: 1 }}
        />
        <IconButton label="Clear filters" variant="outline">
          <X size={14} />
        </IconButton>
      </div>
      <div
        role="group"
        aria-label="Filter by tag"
        style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}
      >
        {["agents", "web-ai", "chrome"].map((tag) => (
          <Chip
            key={tag}
            interactive
            active={tags.has(tag)}
            onActiveChange={() => toggle(tag)}
          >
            {tag}
          </Chip>
        ))}
      </div>
      <Switch
        label="Compact rows"
        checked={compact}
        onCheckedChange={setCompact}
      />
      <Checkbox label="Include archived labs" defaultChecked />
    </div>
  );
}

/**
 * Why Patterns exists at all.
 *
 * A component story shows one component, so it cannot show the defects
 * that only appear when several sit together — and those are the ones
 * that ship. This composition is where a field 25px tall next to a 43px
 * button was found, and the cause was two lines apart in the shared
 * field stylesheet: a padding shorthand silently cancelling the
 * longhands above it. Nothing in SearchInput's own stories could have
 * shown that, because on its own it looked fine.
 *
 * So the assertion below is about the row, not about any control in it.
 * It is also the story the narrow gate loads to check that a toolbar
 * survives a phone.
 */
export const OverviewFilterBar: Story = {
  play: async ({ canvas }) => {
    // Every control in the toolbar row is on the same height, which is
    // what "aligned" means and what a screenshot review keeps missing.
    const field = canvas.getByRole("searchbox", { name: "Search the labs" });
    const clear = canvas.getByRole("button", { name: "Clear filters" });
    const heights = [field, clear].map((el) =>
      Math.round(el.getBoundingClientRect().height),
    );
    await expect(heights[0]).toBe(heights[1]);
  },
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => <FilterBar />,
};
