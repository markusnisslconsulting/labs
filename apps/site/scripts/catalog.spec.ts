import { afterEach, describe, expect, it } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./catalog";
import { catalogSchema, type CatalogEntry } from "../src/catalog/schema";
import { localize } from "../src/catalog/localize";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});
const copy = (en: string) => ({ en });
const demo: CatalogEntry = {
  slug: "example",
  kind: "demo",
  title: copy("Example"),
  summary: copy("A local example"),
  explanation: { en: ["Try the example."] },
  tags: ["interfaces"],
  resources: [],
  requirements: [],
  relatedComponents: ["Button"],
  scenarios: [
    {
      id: "edit",
      title: copy("Edit"),
      description: copy("Edit local state."),
      execution: "browser",
      requirements: [],
    },
  ],
  renderer: { type: "demo", entry: "labs/example/LabDemo.tsx" },
};
const reference: CatalogEntry = {
  ...demo,
  slug: "reference",
  kind: "component",
  scenarios: [],
  renderer: {
    type: "storybook",
    id: "components-button--matrix",
    view: "story",
  },
};
function put(root: string, path: string, content: string) {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  return file;
}
function fixture(entries: CatalogEntry[] = [demo]) {
  const root = mkdtempSync(join(tmpdir(), "labs-catalog-"));
  roots.push(root);
  entries.forEach((entry, index) =>
    put(
      root,
      `apps/site/src/labs/item-${index}/lab.json`,
      JSON.stringify(entry),
    ),
  );
  put(
    root,
    "apps/site/src/labs/example/LabDemo.tsx",
    "export default function Demo() { return null; }",
  );
  put(
    root,
    "packages/ui/inventory.json",
    readFileSync(
      fileURLToPath(
        new URL("../../../packages/ui/inventory.json", import.meta.url),
      ),
      "utf8",
    ),
  );
  const storybookIndex = put(
    root,
    "storybook/index.json",
    JSON.stringify({
      entries: {
        "components-button--matrix": {
          id: "components-button--matrix",
          type: "story",
        },
      },
    }),
  );
  return { root, storybookIndex };
}

describe("catalog manifests", () => {
  it("allows an entry without a companion article and preserves localized copy", () => {
    const options = fixture([
      { ...demo, title: { en: "Example", de: "Beispiel" } },
    ]);
    const entry = loadCatalog(options).entries[0]!;
    expect(entry.resources).toEqual([]);
    expect(localize(entry.title, "de")).toBe("Beispiel");
    expect(localize(entry.title, "fr")).toBe("Example");
  });

  it("rejects duplicate and reserved routes", () => {
    expect(() => loadCatalog(fixture([demo, demo]))).toThrow(
      /Duplicate or reserved slug/,
    );
    for (const slug of [
      "storybook",
      "components",
      "assets",
      "patterns",
      "foundations",
      "releases",
      "404",
    ])
      expect(() => catalogSchema.parse([{ ...demo, slug }])).toThrow(
        /reserved slug/,
      );
  });

  it("rejects missing, ambiguous and escaping renderers", () => {
    const missing: Partial<CatalogEntry> = { ...demo };
    delete missing.renderer;
    expect(() => catalogSchema.parse([missing])).toThrow();
    expect(() =>
      catalogSchema.parse([
        {
          ...demo,
          renderer: { ...demo.renderer, id: "components-button--matrix" },
        },
      ]),
    ).toThrow();
    expect(() =>
      catalogSchema.parse([
        { ...demo, renderer: { type: "demo", entry: "../../private.tsx" } },
      ]),
    ).toThrow();
  });

  it("requires nonempty English copy and usable resource URLs", () => {
    expect(() =>
      catalogSchema.parse([{ ...demo, title: { de: "Beispiel" } }]),
    ).toThrow();
    expect(() =>
      catalogSchema.parse([{ ...demo, summary: copy("  ") }]),
    ).toThrow();
    for (const href of [
      "javascript:alert(1)",
      "/missing",
      "http://example.com",
    ])
      expect(() =>
        catalogSchema.parse([
          {
            ...demo,
            resources: [{ kind: "article", title: copy("Article"), href }],
          },
        ]),
      ).toThrow();
  });

  it("rejects duplicate scenarios and missing requirements", () => {
    expect(() =>
      catalogSchema.parse([
        { ...demo, scenarios: [...demo.scenarios, ...demo.scenarios] },
      ]),
    ).toThrow(/Duplicate scenarios/);
    expect(() =>
      catalogSchema.parse([
        {
          ...demo,
          scenarios: [{ ...demo.scenarios[0]!, requirements: ["missing-api"] }],
        },
      ]),
    ).toThrow(/missing requirement/);
    expect(() => catalogSchema.parse([{ ...demo, scenarios: [] }])).toThrow(
      /at least one scenario/,
    );
  });

  it("checks component names against the shared inventory", () => {
    expect(() =>
      loadCatalog(
        fixture([{ ...demo, relatedComponents: ["MissingControl"] }]),
      ),
    ).toThrow(/unknown component MissingControl/);
  });

  it("rejects missing demo files and files with no default export", () => {
    const options = fixture();
    const path = "apps/site/src/labs/example/LabDemo.tsx";
    put(
      options.root,
      path,
      "// export default is only a comment\nexport function Demo() { return null; }",
    );
    expect(() => loadCatalog(options)).toThrow(/missing demo/);
    put(options.root, path, "export default interface Demo { name: string }");
    expect(() => loadCatalog(options)).toThrow(/missing demo/);
    rmSync(join(options.root, path));
    expect(() => loadCatalog(options)).toThrow(/missing demo/);
  });

  it("checks Storybook IDs and view types against the built index", () => {
    expect(loadCatalog(fixture([reference])).entries).toEqual([reference]);
    expect(() =>
      loadCatalog(
        fixture([
          {
            ...reference,
            renderer: {
              type: "storybook",
              id: "components-missing--matrix",
              view: "story",
            },
          },
        ]),
      ),
    ).toThrow(/missing story/);
    expect(() =>
      loadCatalog(
        fixture([
          {
            ...reference,
            renderer: {
              type: "storybook",
              id: "components-button--matrix",
              view: "docs",
            },
          },
        ]),
      ),
    ).toThrow(/missing docs/);
  });

  it("rejects absent and malformed Storybook indexes", () => {
    const options = fixture([reference]);
    writeFileSync(
      options.storybookIndex,
      JSON.stringify({
        entries: {
          "wrong-id": { id: "components-button--matrix", type: "story" },
        },
      }),
    );
    expect(() => loadCatalog(options)).toThrow(/ID mismatch/);
    rmSync(options.storybookIndex);
    expect(() => loadCatalog(options)).toThrow(/ENOENT/);
  });

  it("reports a malformed manifest with its source path", () => {
    const options = fixture();
    put(options.root, "apps/site/src/labs/item-0/lab.json", "{");
    expect(() => loadCatalog(options)).toThrow(
      /Invalid catalog JSON: apps\/site\/src\/labs\/item-0\/lab.json/,
    );
  });

  it("discovers new pattern manifests and renderers without a central list", () => {
    const options = fixture();
    const pattern: CatalogEntry = {
      ...demo,
      slug: "new-pattern",
      kind: "pattern",
      renderer: { type: "demo", entry: "patterns/new-pattern/LabDemo.tsx" },
    };
    put(
      options.root,
      "apps/site/src/patterns/new-pattern/lab.json",
      JSON.stringify(pattern),
    );
    put(
      options.root,
      "apps/site/src/patterns/new-pattern/LabDemo.tsx",
      "const Pattern = () => null; export { Pattern as default };",
    );
    expect(loadCatalog(options).entries.map((entry) => entry.slug)).toEqual([
      "example",
      "new-pattern",
    ]);
  });
});
