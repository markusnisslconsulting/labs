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
          aria-label="Search the labs"
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
            onSelect={() => toggle(tag)}
          >
            {tag}
          </Chip>
        ))}
      </div>
      <Switch label="Compact rows" checked={compact} onChange={setCompact} />
      <Checkbox label="Include archived labs" defaultChecked />
    </div>
  );
}

export const OverviewFilterBar: Story = {
  parameters: { chromatic: { disableSnapshot: false, modes: { ...NARROW } } },
  render: () => <FilterBar />,
};
