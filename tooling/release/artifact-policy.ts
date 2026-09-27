import { lintSource } from "@secretlint/core";
import { rules } from "@secretlint/secretlint-rule-preset-recommend";

const publicFiles = new Set([
  "index.html",
  "404.html",
  ".htaccess",
  "favicon.svg",
  "logo.webp",
  "sitemap.xml",
  "robots.txt",
  "catalogs/ticket-ui.json",
  "storybook/index.html",
  "storybook/iframe.html",
  "storybook/index.json",
  "storybook/logo.webp",
  "storybook/favicon.svg",
  "storybook/favicon-wrapper.svg",
  "storybook/vite-inject-mocker-entry.js",
  "storybook/brand/navy.webp",
  "storybook/brand/white.webp",
  "storybook/brand/red.webp",
  "storybook/brand/black.webp",
  "storybook/font-licenses/atkinsonhyperlegible-OFL.txt",
  "storybook/font-licenses/bricolagegrotesque-OFL.txt",
]);
const generatedFiles = [
  /^(?:storybook\/)?assets\/[^/]+-[\w-]{8,}\.(?:js|css|svg|png|jpe?g|webp|gif|ico|woff2?)$/,
  /^storybook\/(?:sb-common-assets\/)?nunito-sans-(?:regular|italic|bold|bold-italic)\.woff2$/,
  /^storybook\/sb-common-assets\/favicon(?:-wrapper)?\.svg$/,
  /^storybook\/sb-manager\/(?:globals|globals-runtime|manager-stores|runtime)\.js$/,
  /^storybook\/sb-addons\/(?:a11y|docs|packages-ui-storybook|storybook-core-server-presets|tag-badges|themes|vitest)-\d+\/(?:common-)?manager-bundle\.js$/,
];

export function prerenderRoute(path: string): string | undefined {
  const match =
    /^releases\/[a-f0-9]{40}-[a-f0-9]{16}\/pages\/([a-z0-9]+(?:-[a-z0-9]+)*)\.html$/.exec(
      path,
    );
  return match ? `/${match[1]}` : undefined;
}

export function isPublicArtifact(path: string, routes: string[] = []): boolean {
  if (
    path.split("/").some((part) => !part || part === "." || part === "..") ||
    path.includes("\\")
  )
    return false;
  if (
    path !== ".htaccess" &&
    path.split("/").some((part) => part.startsWith("."))
  )
    return false;
  if (path.startsWith("releases/")) {
    const route = prerenderRoute(path);
    if (route) return routes.includes(route);
    const match = /^releases\/[a-f0-9]{40}-[a-f0-9]{16}\/(.+)$/.exec(path);
    if (!match || match[1]!.startsWith("releases/") || match[1] === ".htaccess")
      return false;
    return isPublicArtifact(match[1]!, routes);
  }
  return (
    publicFiles.has(path) ||
    generatedFiles.some((pattern) => pattern.test(path))
  );
}

const contentRules = [
  {
    id: "workstation-path",
    pattern:
      /(?:\/(?:Users|home)\/[^\s/"'<>]+\/|\/(?:private\/)?var\/folders\/|\/__w\/[^\s/"'<>]+\/|[A-Za-z]:[\\/][Uu][Ss][Ee][Rr][Ss][\\/][^\s\\/"'<>]+[\\/])/,
  },
  { id: "source-map", pattern: /(?:\/\/[#@]|\/\*[#@])\s*sourceMappingURL\s*=/ },
  {
    id: "instruction-context",
    pattern:
      /<(?:codex_internal_context|environment_context|user_instructions)(?:\s|>)|#\s*AGENTS\.md instructions for\b/i,
  },
];

// Scan decoded literals as well as their emitted form; never evaluate bundle code.
export function decodeArtifactText(text: string): string {
  return text
    .replace(
      /\\u\{([a-f\d]{1,6})\}|\\u([a-f\d]{4})|\\x([a-f\d]{2})/gi,
      (
        match,
        braced: string | undefined,
        unicode: string | undefined,
        hex: string | undefined,
      ) => {
        const code = Number.parseInt(braced ?? unicode ?? hex ?? "", 16);
        return code <= 0x10ffff ? String.fromCodePoint(code) : match;
      },
    )
    .replace(/\\([\\/"'])/g, "$1")
    .replace(
      /&#(?:x([a-f\d]+)|(\d+));/gi,
      (match, hex: string | undefined, decimal: string | undefined) => {
        const code = Number.parseInt(hex ?? decimal ?? "", hex ? 16 : 10);
        return code <= 0x10ffff ? String.fromCodePoint(code) : match;
      },
    )
    .replace(
      /&(?:lt|gt|quot|apos|amp);/g,
      (entity) =>
        ({
          "&lt;": "<",
          "&gt;": ">",
          "&quot;": '"',
          "&apos;": "'",
          "&amp;": "&",
        })[entity] ?? entity,
    );
}

// Artifact comments cannot suppress a release credential check.
const credentialRules = rules
  .filter(
    (rule) => rule.meta.id !== "@secretlint/secretlint-rule-filter-comments",
  )
  .map((rule) => ({ id: rule.meta.id, rule }));

export async function artifactContentIssues(
  path: string,
  data: Buffer,
): Promise<string[]> {
  const raw = data.toString("utf8");
  const variants = new Set([raw, decodeArtifactText(raw)]);
  const issues = new Set<string>();
  for (const text of variants) {
    for (const rule of contentRules)
      if (rule.pattern.test(text)) issues.add(rule.id);
    const result = await lintSource({
      source: { content: text, filePath: path, contentType: "text" },
      options: {
        maskSecrets: true,
        noPhysicFilePath: true,
        config: { rules: credentialRules },
      },
    });
    for (const message of result.messages) issues.add(message.ruleId);
  }
  return [...issues].sort();
}
