import { describe, expect, it } from "vitest";
import { iframeEntry, managerEntry, siteEntry } from "../entries.ts";

describe("release entry documents", () => {
  it("qualifies site assets without changing route or fragment links", () => {
    const result = siteEntry(
      '<script src="./assets/a-12345678.js"></script><link href="./favicon.svg"><a href="/demo">Demo</a><a href="./demo">Relative demo</a><a href="#main">Skip</a>',
      "/releases/build",
    );
    expect(result).toContain('src="/releases/build/assets/a-12345678.js"');
    expect(result).toContain('href="/demo"');
    expect(result).toContain('href="./demo"');
    expect(result).toContain('href="/releases/build/favicon.svg"');
    expect(result).toContain('href="#main"');
    expect(result).not.toContain("<base");
  });

  it("qualifies manager resources and preview without changing link resolution", () => {
    const result = managerEntry(
      `<html><head><link href="./favicon.svg"><style>@font-face{src:url('./sb-common-assets/nunito-sans-bold.woff2')}</style></head><body><script type="module">import './sb-manager/runtime.js';import './sb-addons/docs-3/manager-bundle.js';</script><a href="#sidebar">Skip</a></body></html>`,
      "/releases/build/storybook",
    );
    expect(result).toContain(
      'window.PREVIEW_URL="/releases/build/storybook/iframe.html"',
    );
    expect(result).toContain('href="/releases/build/storybook/favicon.svg"');
    expect(result).toContain(
      "url('/releases/build/storybook/sb-common-assets/nunito-sans-bold.woff2')",
    );
    expect(result).toContain(
      "import '/releases/build/storybook/sb-manager/runtime.js'",
    );
    expect(result).toContain(
      "import '/releases/build/storybook/sb-addons/docs-3/manager-bundle.js'",
    );
    expect(result).toContain('href="#sidebar"');
    expect(result).not.toContain("<base");
    expect(result).not.toContain("./sb-");
  });

  it.each([
    '<head><base href="/old/">',
    '<head><script>window.PREVIEW_URL="/old"</script>',
    "<html>Changed template</html>",
  ])("rejects competing or missing manager configuration", (html) => {
    expect(() => managerEntry(html, "/releases/build/storybook")).toThrow(
      "Unsupported",
    );
  });

  it("preserves the query and fragment on the published iframe entry", () => {
    expect(iframeEntry("/releases/build/storybook")).toContain(
      'location.replace("/releases/build/storybook/iframe.html"+location.search+location.hash)',
    );
  });
});
