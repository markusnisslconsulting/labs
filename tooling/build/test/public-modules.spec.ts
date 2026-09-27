import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { build } from "vite";
import { publicModules } from "../vite-public-modules";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

async function compile(input: string, query = "raw") {
  const root = await mkdtemp(join(tmpdir(), "labs-public-input-"));
  directories.push(root);
  await mkdir(dirname(join(root, input)), { recursive: true });
  await writeFile(join(root, input), "Private fixture content");
  await writeFile(
    join(root, "index.ts"),
    `export { default } from ${JSON.stringify(`./${input}?${query}`)};`,
  );
  return build({
    root,
    configFile: false,
    logLevel: "silent",
    plugins: [publicModules(root)],
    build: {
      write: false,
      lib: { entry: join(root, "index.ts"), formats: ["es"] },
    },
  });
}

it("rejects private files imported as asset URLs", async () => {
  await expect(compile("src/fixtures/private.json", "url")).rejects.toThrow(
    "Private workspace input cannot be bundled",
  );
});

it.each([
  "AGENTS.md",
  "nested/CLAUDE.md",
  ".env.production",
  ".github/workflows/ci.yml",
  "docs/audits/internal.md",
  "tasks/private-notes.txt",
  "test-results/results.json",
  ".nx/build-evidence.json",
  "tooling/visual/.out/screenshot.svg",
  "dist/release/manifest.json",
  "src/__fixtures__/customer.json",
  "src/test/customer.json",
  "src/demo.spec.ts",
  "private.pem",
])(
  "rejects private input %s before it can become a bundled string",
  async (input) => {
    await expect(compile(input)).rejects.toThrow(
      "Private workspace input cannot be bundled",
    );
  },
);

it.each([
  "src/Guide.mdx",
  "src/Button.stories.ts",
  "src/examples/ticket.json",
  "src/labs/chat-box/spec/catalog.json",
])(
  "permits intentionally public examples and documentation: %s",
  async (input) => {
    await expect(compile(input)).resolves.toBeDefined();
  },
);
