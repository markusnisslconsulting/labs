import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { afterEach, expect, it } from "vitest";
import { importedSize, measureComponents } from "../package-sizes";
import { readWorkbenchFacts, workbenchFacts } from "../vite-workbench-facts";
import { build } from "vite";

const roots: string[] = [];
afterEach(() =>
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true })),
);
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "labs-package-size-"));
  roots.push(root);
  const put = (file: string, text: string) => {
    const path = join(root, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    return path;
  };
  return { root, put };
}
const gzip = (path: string) => gzipSync(readFileSync(path)).length;

it("counts shared internal files once, follows re-exports and CSS imports, and excludes external packages", () => {
  const { root, put } = fixture();
  const entry = put(
    "components/Example.js",
    'import "react"; import "../shared.js"; export { value } from "../other.js"; import "../part.css";',
  );
  const shared = put(
    "shared.js",
    'export const value = 1; import "./part.css";',
  );
  const other = put("other.js", 'export { value } from "./shared.js";');
  const css = put("part.css", '@import "./base.css"; .part { color: red; }');
  const base = put(
    "base.css",
    '@import url("./part.css"); body { margin: 0; }',
  );
  const expected = {
    js: gzip(entry) + gzip(shared) + gzip(other),
    css: gzip(css) + gzip(base),
  };
  expect(importedSize(entry)).toEqual({
    ...expected,
    total: expected.js + expected.css,
  });
  expect(measureComponents(root)).toEqual({ Example: importedSize(entry) });
});

it("refuses to undercount missing relative imports", () => {
  const { put } = fixture();
  expect(() =>
    importedSize(put("Example.js", 'import "./missing.js";')),
  ).toThrow();
});

it("ignores import-like text in strings and comments", () => {
  const { put } = fixture();
  const entry = put(
    "Example.js",
    `export const example = 'import "./missing.js"'; // export * from "./missing.js"`,
  );
  expect(importedSize(entry)).toEqual({
    js: gzip(entry),
    css: 0,
    total: gzip(entry),
  });
  const css = put(
    "example.css",
    '/* @import "./missing.css"; */ .example { color: red; }',
  );
  expect(importedSize(css)).toEqual({
    js: 0,
    css: gzip(css),
    total: gzip(css),
  });
});

function workbenchFixture() {
  const fixtureFiles = fixture();
  const { put } = fixtureFiles;
  const component = (component: string) => ({
    component,
    props: [],
    parts: [],
    slots: [],
    status: "stable",
    useFor: "Examples",
    insteadWhen: "Other content",
    accessibility: "Native semantics",
  });
  const inventory = {
    note: "Fixture inventory",
    components: [component("Small"), component("Large")],
  };
  put("packages/ui/inventory.json", JSON.stringify(inventory));
  put("dist/packages/ui/components/Small.js", "export const Small = 1;");
  put(
    "dist/packages/ui/components/Large.js",
    'export const Large = 1; import "../large.css";',
  );
  put("dist/packages/ui/large.css", ".large { color: red; }");
  put(
    "dist/packages/ui/styles.css",
    '@layer tokens, base, components, print, overrides; @import "./base.css";',
  );
  put("dist/packages/ui/base.css", "body { margin: 0; }");
  return { ...fixtureFiles, inventory };
}

it("derives current counts, median, largest component, layers and dated global styles without source paths", () => {
  const { root } = workbenchFixture();
  const facts = readWorkbenchFacts(root, "2026-09-22T12:00:00.000Z");
  const components = measureComponents(join(root, "dist/packages/ui"));
  expect(facts).toEqual({
    measuredAt: "2026-09-22T12:00:00.000Z",
    componentCount: 2,
    layers: ["tokens", "base", "components", "print", "overrides"],
    globalStyles: importedSize(join(root, "dist/packages/ui/styles.css")).css,
    median: (components.Small!.total + components.Large!.total) / 2,
    largest: { name: "Large", ...components.Large },
  });
  expect(JSON.stringify(facts)).not.toContain(root);
});

it("rejects stale package components and absent layer declarations", () => {
  const { root, put } = workbenchFixture();
  put("dist/packages/ui/components/Extra.js", "export const Extra = 1;");
  expect(() => readWorkbenchFacts(root)).toThrow(
    "inventory and package components differ",
  );
  rmSync(join(root, "dist/packages/ui/components/Extra.js"));
  put("dist/packages/ui/styles.css", "body { margin: 0; }");
  expect(() => readWorkbenchFacts(root)).toThrow("no layer order");
});

it("bundles the public facts without build code or workstation paths", async () => {
  const { root, put } = workbenchFixture();
  const entry = put("entry.ts", 'export { facts } from "virtual:labs-facts";');
  const result = await build({
    root,
    configFile: false,
    logLevel: "silent",
    plugins: [workbenchFacts(root)],
    build: { write: false, lib: { entry, formats: ["es"] } },
  });
  const output = Array.isArray(result) ? result[0]! : result;
  if (!("output" in output)) throw new Error("Expected a one-shot build");
  const code = output.output
    .filter((item) => item.type === "chunk")
    .map((item) => item.code)
    .join("\n");
  expect(code).toContain("componentCount: 2");
  expect(code).not.toMatch(/node:fs|readFileSync|node:zlib/);
  expect(code).not.toContain(root);
});
