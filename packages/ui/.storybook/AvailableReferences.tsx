import { useEffect, useState } from "react";
import { AnchorMdx } from "@storybook/addon-docs/blocks";
import type { StoryIndex } from "storybook/internal/types";
import { referenceEntries, type ReferenceEntry } from "./referenceEntries";

export function AvailableReferences() {
  const [entries, setEntries] = useState<ReferenceEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("./index.json", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load the Storybook index");
        const selected = referenceEntries(
          (await response.json()) as StoryIndex,
        );
        if (!selected.length)
          throw new Error("No reference pages in the index");
        if (!controller.signal.aborted) setEntries(selected);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);
  if (failed)
    return (
      <p>
        Reference links could not be loaded. Use the sidebar to browse the
        workbench.
      </p>
    );
  if (!entries) return <p role="status">Loading reference links…</p>;
  return (
    <nav aria-label="Workbench references">
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            <AnchorMdx target="_self" href={`?path=/${entry.type}/${entry.id}`}>
              {entry.title.replaceAll("/", " / ")}
              {entry.type === "story" ? ` / ${entry.name}` : ""}
            </AnchorMdx>
          </li>
        ))}
      </ul>
    </nav>
  );
}
