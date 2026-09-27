import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { build } from "vite";
import { consulting } from "../src/index";

const source = "packages/brand/src";
const roots: string[] = [];
afterEach(() =>
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true })),
);

it("preserves recorded asset bytes and includes font copyright licenses", () => {
  const provenance = JSON.parse(
    readFileSync("packages/brand/provenance.json", "utf8"),
  ) as {
    assets: { file: string; sha256: string }[];
  };
  expect(provenance.assets).toHaveLength(13);
  for (const asset of provenance.assets) {
    const bytes = readFileSync(join(source, asset.file));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
    if (asset.file.endsWith(".woff2"))
      expect(bytes.subarray(0, 4).toString()).toBe("wOF2");
  }
  for (const family of ["atkinsonhyperlegible", "bricolagegrotesque"]) {
    const license = readFileSync(
      join(source, "licenses", `${family}-OFL.txt`),
      "utf8",
    );
    expect(license).toContain("Copyright");
    expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
  }
  for (const file of [
    "apps/site/public/logo.webp",
    "packages/ui/.storybook/public/logo.webp",
  ])
    expect(readFileSync(file)).toEqual(
      readFileSync(join(source, "logos/navy.webp")),
    );
});

it("preserves the library's current accessible palette and adds no semantic roles", () => {
  const css = readFileSync(
    "packages/ui/src/styles/tokens/primitive.css",
    "utf8",
  );
  const read = (name: string) =>
    new RegExp(`--uix-${name}:\\s*([^;]+);`).exec(css)?.[1]?.trim();
  expect(consulting.labs).toEqual({
    accent: { light: read("red-600"), dark: read("red-400") },
    page: { light: read("grey-25"), dark: read("grey-900") },
    surface: { light: read("white"), dark: read("grey-800") },
    subtle: { light: read("grey-100"), dark: read("grey-700") },
  });
  const semantic = readFileSync(
    "packages/ui/src/styles/tokens/semantic.css",
    "utf8",
  );
  for (const match of readFileSync(join(source, "labs.css"), "utf8").matchAll(
    /(--uix-[\w-]+):/g,
  ))
    expect(semantic).toContain(`${match[1]}:`);
});

it("builds an isolated consumer from the artifact's public exports with local font and logo assets", async () => {
  const root = mkdtempSync(join(tmpdir(), "labs-brand-consumer-"));
  roots.push(root);
  const packageRoot = join(root, "node_modules/@labs/brand");
  mkdirSync(packageRoot, { recursive: true });
  execFileSync("pnpm", ["pack", "--pack-destination", root], {
    cwd: "packages/brand/dist",
    stdio: "pipe",
  });
  const archive = readdirSync(root).find((name) => name.endsWith(".tgz"));
  expect(archive).toBeDefined();
  execFileSync("tar", [
    "-xzf",
    join(root, archive!),
    "-C",
    packageRoot,
    "--strip-components=1",
  ]);
  writeFileSync(
    join(root, "index.html"),
    '<main><h1>Local identity</h1></main><script type="module" src="/entry.js"></script>',
  );
  writeFileSync(
    join(root, "entry.js"),
    'import "@labs/brand/labs.css"; import logo from "@labs/brand/logos/navy.webp"; import { consulting } from "@labs/brand"; document.body.dataset.brandName = consulting.fonts.body; const image = new Image(); image.src = logo; document.body.append(image);',
  );
  const result = await build({
    root,
    configFile: false,
    logLevel: "silent",
    build: { write: false, assetsInlineLimit: 0 },
  });
  const output = Array.isArray(result) ? result[0]! : result;
  if (!("output" in output)) throw new Error("Expected an application build");
  const names = output.output.map((item) => item.fileName);
  expect(names.filter((name) => name.endsWith(".woff2"))).toHaveLength(9);
  expect(names.some((name) => name.endsWith(".webp"))).toBe(true);
  const css = output.output
    .filter((item) => item.type === "asset" && item.fileName.endsWith(".css"))
    .map((item) => (item.type === "asset" ? item.source : ""))
    .join("\n");
  expect(css).toContain("font-weight:200 800");
  expect(css).not.toMatch(
    /fonts\.googleapis|fonts\.gstatic|\/Users\/|\.\.\/www\.markusnissl/,
  );
  expect(
    readFileSync(
      join(packageRoot, "licenses/atkinsonhyperlegible-OFL.txt"),
      "utf8",
    ),
  ).toContain("Braille Institute");
});
