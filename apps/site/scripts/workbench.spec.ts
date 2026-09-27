import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildWorkbench } from "./workbench";
import { filterReferences, storybookHref } from "../src/catalog/workbench";

const inventory = JSON.parse(
  readFileSync("packages/ui/inventory.json", "utf8"),
);
const button = inventory.components.find(
  (entry: { component: string }) => entry.component === "Button",
);
const fixture = { ...inventory, components: [button] };
const entry = (
  id: string,
  title: string,
  type: "story" | "docs",
  name: string,
  tags = ["dev"],
) => ({ id, title, type, name, tags });
const docs = entry(
  "components-button--docs",
  "Components/Button",
  "docs",
  "Docs",
  [],
);
const matrix = entry(
  "components-button--matrix",
  "Components/Button",
  "story",
  "Matrix",
);
const hidden = entry(
  "components-button--keyboard",
  "Components/Button",
  "story",
  "Keyboard",
  ["test"],
);
const index = (...entries: ReturnType<typeof entry>[]) => ({
  entries: Object.fromEntries(entries.map((item) => [item.id, item])),
});

describe("workbench directory", () => {
  it("uses inventory descriptions and real Docs IDs while selecting a visible matrix", () => {
    const result = buildWorkbench(fixture, index(hidden, docs, matrix));
    expect(result.components).toEqual([
      {
        name: "Button",
        description: button.useFor.replace(/`([^`]+)`/g, "$1"),
        status: button.status,
        kind: "component",
        id: docs.id,
        view: "docs",
        example: matrix.id,
      },
    ]);
    expect(storybookHref(result.components[0]!)).toBe(
      "/storybook/index.html?path=/docs/components-button--docs",
    );
    expect(JSON.stringify(result)).not.toContain('"props"');
  });

  it("discovers new foundation and guide pages without admitting hidden-only interaction groups", () => {
    const foundation = entry(
      "foundations-focus--preview",
      "Foundations/Focus",
      "story",
      "Preview",
    );
    const guide = entry(
      "guides-theming--docs",
      "Guides/Theming",
      "docs",
      "Docs",
    );
    const hiddenFoundation = entry(
      "foundations-internal--test",
      "Foundations/Internal",
      "story",
      "Test",
      ["test"],
    );
    expect(
      buildWorkbench(
        fixture,
        index(docs, matrix, guide, foundation, hiddenFoundation),
      ).foundations,
    ).toEqual([
      { name: "Focus", kind: "foundation", id: foundation.id, view: "story" },
      { name: "Theming", kind: "guide", id: guide.id, view: "docs" },
    ]);
  });

  it.each([
    ["missing Docs", index(matrix)],
    ["hidden examples only", index(docs, hidden)],
    [
      "ambiguous Docs",
      index(docs, { ...docs, id: "components-button--other-docs" }, matrix),
    ],
  ])("rejects %s", (_name, input) => {
    expect(() => buildWorkbench(fixture, input)).toThrow(
      "expected one Docs page and a visible example",
    );
  });

  it("rejects mismatched index keys and invalid inventory", () => {
    expect(() => buildWorkbench(fixture, { entries: { wrong: docs } })).toThrow(
      "ID mismatch",
    );
    expect(() =>
      buildWorkbench({ components: [{}] }, index(docs, matrix)),
    ).toThrow();
  });

  it("combines case-insensitive text and status filters without changing the source", () => {
    const entries = buildWorkbench(fixture, index(docs, matrix)).components;
    expect(filterReferences(entries, " BUTTON ", "stable")).toEqual(entries);
    expect(filterReferences(entries, "button", "beta")).toEqual([]);
    expect(filterReferences(entries, "missing", "")).toEqual([]);
    expect(entries).toHaveLength(1);
  });
});
