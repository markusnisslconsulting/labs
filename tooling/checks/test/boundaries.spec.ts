import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";
import ts from "typescript";
import { resolve } from "node:path";

const eslint = new ESLint();
const messages = async (filePath: string, source: string) =>
  (await eslint.lintText(source, { filePath })).flatMap(
    (result) => result.messages,
  );

describe("workspace import boundaries", () => {
  it.each([
    ["packages/ui/src/probe.ts", "virtual:labs-workbench", "Declare"],
    ["apps/site/src/probe.ts", "virtual:unregistered", "Declare"],
    ["apps/site/src/probe.ts", "@labs/tools/vite-layer-order", "Build tooling"],
    [
      "packages/ui/.storybook/preview.tsx",
      "@labs/tools/vite-public-modules",
      "Build tooling",
    ],
    ["packages/undo-machine/src/probe.ts", "@labs/ui", "Neutral packages"],
    ["packages/agent-stream/src/probe.ts", "react", "Neutral packages"],
    ["packages/reorder-desk/src/probe.ts", "node:fs", "Node APIs"],
    ["apps/site/src/probe.ts", "node:fs", "Node APIs"],
    ["apps/site/src/probe.ts", "@labs/ui/i18n", "public package export"],
    ["apps/site/src/probe.ts", "lucide-react", "Declare lucide-react"],
    [
      "apps/site/src/labs/chat-box/probe.ts",
      "../webmcp/strings",
      "lab internals",
    ],
    [
      "apps/site/src/probe.ts",
      "../../../../www.markusnissl.com/src/index",
      "another checkout",
    ],
  ])("rejects %s importing %s", async (file, specifier, reason) => {
    expect(await messages(file, `import '${specifier}';`)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "labs/package-boundaries",
          message: expect.stringContaining(reason),
        }),
      ]),
    );
  });

  it.each([
    ["apps/site/src/probe.ts", "virtual:labs-workbench"],
    ["apps/site/vite.config.ts", "@labs/tools/vite-layer-order"],
    ["packages/ui/.storybook/main.ts", "@labs/tools/vite-public-modules"],
    ["apps/site/src/probe.ts", "@labs/ui/components/Button"],
    ["packages/undo-machine/test/probe.spec.ts", "vitest"],
    ["packages/ui/src/components/probe.ts", "react"],
  ])("accepts %s importing %s", async (file, specifier) => {
    expect(await messages(file, `import '${specifier}';`)).toEqual([]);
  });

  it("rejects browser globals in neutral source", async () => {
    expect(
      await messages(
        "packages/undo-machine/src/probe.ts",
        "window.location.reload();",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "no-restricted-globals" }),
      ]),
    );
  });

  it("TypeScript resolves the package's exports instead of private source aliases", () => {
    const config = ts.readConfigFile(
      "apps/site/tsconfig.json",
      ts.sys.readFile,
    );
    const parsed = ts.parseJsonConfigFileContent(
      config.config,
      ts.sys,
      resolve("apps/site"),
    );
    const from = resolve("apps/site/src/probe.ts");
    expect(
      ts.resolveModuleName(
        "@labs/ui/components/Button",
        from,
        parsed.options,
        ts.sys,
      ).resolvedModule,
    ).toBeDefined();
    expect(
      ts.resolveModuleName("@labs/ui/i18n", from, parsed.options, ts.sys)
        .resolvedModule,
    ).toBeUndefined();
  });
});
