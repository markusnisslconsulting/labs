import type { StoryIndex } from "storybook/internal/types";

export type ReferenceEntry = StoryIndex["entries"][string];

/** Read destinations from the same index that supplies the sidebar. */
export function referenceEntries(index: StoryIndex): ReferenceEntry[] {
  const entries = Object.values(index.entries);
  const groups = new Map<string, ReferenceEntry>();
  for (const entry of entries) {
    if (
      !/^(Foundations|Guides)\//.test(entry.title) &&
      entry.title !== "Components/Button"
    )
      continue;
    if (entry.type !== "docs" && !entry.tags?.includes("dev")) continue;
    if (!groups.has(entry.title) || entry.type === "docs")
      groups.set(entry.title, entry);
  }
  const example = entries.find(
    (entry) =>
      entry.title === "Components/Button" &&
      entry.type === "story" &&
      entry.name === "Matrix" &&
      entry.tags?.includes("dev"),
  );
  const extra =
    example && groups.get(example.title)?.id !== example.id ? [example] : [];
  return [...groups.values(), ...extra].sort(
    (a, b) =>
      a.title.localeCompare(b.title, "en") ||
      a.name.localeCompare(b.name, "en"),
  );
}
