import { expect, it } from "vitest";
import type { StoryIndex } from "storybook/internal/types";
import {
  referenceEntries,
  type ReferenceEntry,
} from "../.storybook/referenceEntries";

const entry = (
  title: string,
  type: "docs" | "story",
  name: string,
  tags: string[],
): ReferenceEntry => ({
  id: `${title.toLowerCase().replaceAll("/", "-")}--${name.toLowerCase()}`,
  title,
  ...(type === "story"
    ? ({ type, subtype: "story" } as const)
    : { type, storiesImports: [] }),
  name,
  tags,
  importPath: "./example.tsx",
});
const index = (...entries: ReferenceEntry[]): StoryIndex => ({
  v: 5,
  entries: Object.fromEntries(entries.map((item) => [item.id, item])),
});

it("discovers guide and foundation destinations, preferring Docs over examples", () => {
  const docs = entry("Foundations/New", "docs", "Docs", []);
  const story = entry("Foundations/New", "story", "Preview", ["dev"]);
  const guide = entry("Guides/New", "docs", "Docs", []);
  expect(referenceEntries(index(story, docs, guide))).toEqual([docs, guide]);
  expect(referenceEntries(index(docs, story, guide))).toEqual([docs, guide]);
});
it("keeps visible previews and the Button matrix while excluding hidden tests and unrelated components", () => {
  const focus = entry("Foundations/Focus", "story", "Preview", ["dev"]);
  const matrix = entry("Components/Button", "story", "Matrix", ["dev"]);
  const docs = entry("Components/Button", "docs", "Docs", []);
  const hidden = entry("Foundations/Hidden", "story", "Keyboard", ["test"]);
  const unrelated = entry("Components/Other", "docs", "Docs", ["dev"]);
  expect(
    referenceEntries(index(hidden, focus, matrix, docs, unrelated)),
  ).toEqual([docs, matrix, focus]);
});

it("does not duplicate a matrix when it is the only Button destination", () => {
  const matrix = entry("Components/Button", "story", "Matrix", ["dev"]);
  expect(referenceEntries(index(matrix))).toEqual([matrix]);
});
