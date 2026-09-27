import { describe, expect, it } from "vitest";
import { artifactContentIssues, isPublicArtifact } from "../artifact-policy.ts";

describe("public output paths", () => {
  it("accepts route documents only inside a release declared by the catalog", () => {
    const path = `releases/${"a".repeat(40)}-${"b".repeat(16)}/pages/demo.html`;
    expect(isPublicArtifact(path, ["/", "/demo"])).toBe(true);
    expect(isPublicArtifact(path, ["/"])).toBe(false);
    expect(isPublicArtifact("pages/demo.html", ["/demo"])).toBe(false);
    expect(
      isPublicArtifact(path.replace("demo.html", "../demo.html"), ["/demo"]),
    ).toBe(false);
  });
  it.each([
    "AGENTS.md",
    "AGENTS.txt",
    "CLAUDE.html",
    ".env",
    "release-notes.txt",
    "review.json",
    "docs/audits/status.html",
    "fixtures/customer.json",
    "storybook/project.json",
    "storybook/font-licenses/notes.txt",
    "storybook/brand/provenance.json",
    "assets/debug.js.map",
    "storybook/assets/hidden.ts",
    "assets/notes.json",
    "assets/.notes-12345678.js",
    "assets/nested/notes.js",
    "assets/../notes-12345678.js",
    "storybook/.env",
    `releases/${"a".repeat(40)}-${"b".repeat(16)}/review.json`,
    `releases/${"a".repeat(40)}-${"b".repeat(16)}/.htaccess`,
    "releases/unvalidated/assets/main-AbCd1234.js",
  ])("rejects %s", (path) => expect(isPublicArtifact(path)).toBe(false));

  it.each([
    "index.html",
    "404.html",
    ".htaccess",
    "catalogs/ticket-ui.json",
    "storybook/index.json",
    "storybook/brand/navy.webp",
    "storybook/brand/white.webp",
    "storybook/brand/red.webp",
    "storybook/brand/black.webp",
    "storybook/font-licenses/atkinsonhyperlegible-OFL.txt",
    "storybook/font-licenses/bricolagegrotesque-OFL.txt",
    "assets/main-AbCd1234.js",
    "storybook/assets/Button.stories-AbCd1234.js",
    "storybook/assets/guide-CdEf1234.css",
    "storybook/sb-manager/runtime.js",
    "storybook/sb-addons/a11y-4/manager-bundle.js",
    "storybook/nunito-sans-regular.woff2",
    `releases/${"a".repeat(40)}-${"b".repeat(16)}/storybook/sb-manager/runtime.js`,
  ])("permits %s", (path) => expect(isPublicArtifact(path)).toBe(true));
});

describe("artifact content", () => {
  it.each([
    "/Users/fixture/Developer/private/file.ts",
    "/home/runner/work/private/file.ts",
    "/private/var/folders/example/file.ts",
    "/__w/repository/repository/file.ts",
    String.raw`C:\Users\fixture\private\file.ts`,
    String.raw`C:\\Users\\fixture\\private\\file.ts`,
    String.raw`\u002fUsers\u002ffixture\u002ffile.ts`,
    "&#47;Users&#47;fixture&#47;file.ts",
  ])(
    "detects local and runner paths without returning the matched text (%#)",
    async (content) => {
      const issues = await artifactContentIssues(
        "assets/main-12345678.js",
        Buffer.from(content),
      );
      expect(issues).toContain("workstation-path");
      expect(JSON.stringify(issues)).not.toContain(content);
    },
  );

  it.each([
    "//# sourceMappingURL=data:application/json;base64,e30=",
    "/*# sourceMappingURL=hidden.map */",
    '<codex_internal_context source="goal">Private task</codex_internal_context>',
    "&lt;environment_context&gt;Private workspace&lt;/environment_context&gt;",
  ])(
    "rejects source maps and copied assistant context (%#)",
    async (content) => {
      expect(
        await artifactContentIssues(
          "assets/main-12345678.js",
          Buffer.from(content),
        ),
      ).not.toEqual([]);
    },
  );

  it("detects credentials even when artifact comments try to suppress the rule, without returning the credential", async () => {
    const fakeToken = ["ghp", "A".repeat(36)].join("_");
    const content = `// secretlint-disable\nconst token = ${JSON.stringify(fakeToken)};`;
    const issues = await artifactContentIssues(
      "assets/main-12345678.js",
      Buffer.from(content),
    );
    expect(issues).toContain("@secretlint/secretlint-rule-github");
    expect(JSON.stringify(issues)).not.toContain(fakeToken);
  });

  it("checks readable content in binary assets", async () => {
    const image = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      Buffer.from("/Users/fixture/private/image.png"),
    ]);
    expect(await artifactContentIssues("logo.webp", image)).toContain(
      "workstation-path",
    );
  });

  it("allows component source, interaction examples, protocol prompts and keyboard documentation", async () => {
    const example =
      'export const Default = { play: () => userEvent.click(button) }; // Arrow/Home/End/Escape\nconst prompt = "Summarize this fictional note"; <Button>Save</Button>';
    expect(
      await artifactContentIssues(
        "storybook/assets/Button.stories-AbCd1234.js",
        Buffer.from(example),
      ),
    ).toEqual([]);
  });
});
