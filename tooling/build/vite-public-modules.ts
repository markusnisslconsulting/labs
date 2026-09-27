import { realpathSync } from "node:fs";
import { isAbsolute, relative } from "node:path";
import type { Plugin } from "vite";

function isPrivateModule(id: string, workspace: string): boolean {
  const file = id.replace(/^\0/, "").split("?")[0];
  if (!file || !isAbsolute(file)) return false;
  const path = relative(workspace, file).replaceAll("\\", "/");
  const parts = path.split("/");
  if (parts.includes("node_modules")) return false;
  if (path.startsWith("../") || path === "..") return true;
  return (
    /(?:^|\/)(?:AGENTS|CLAUDE)\.md$/i.test(path) ||
    parts.some(
      (part) =>
        /^\.env(?:\.|$)/.test(part) ||
        [
          ".git",
          ".github",
          ".codex",
          ".claude",
          ".nx",
          ".out",
          ".visual-output",
          ".visual-sweep",
          ".visual-axes",
          ".sweep-output",
          ".axes-output",
          "coverage",
          "test-results",
          "playwright-report",
          "__fixtures__",
          "__tests__",
        ].includes(part),
    ) ||
    /^(?:docs\/audits|tasks|tooling\/fixtures|dist\/release)(?:\/|$)/.test(
      path,
    ) ||
    /(?:^|\/)(?:test|tests|fixtures)(?:\/|$)/.test(path) ||
    /\.(?:spec|test)\.[cm]?[jt]sx?$|\.(?:map|pem|key)$/i.test(path)
  );
}

/** Public bundles may include stories and examples, but not private workspace inputs. */
export function publicModules(workspace: string): Plugin {
  const root = realpathSync(workspace);
  return {
    name: "labs-public-modules",
    enforce: "pre",
    apply: "build",
    transform(_code, id) {
      if (isPrivateModule(id, root))
        throw new Error(
          `Private workspace input cannot be bundled: ${relative(root, id).replaceAll("\\", "/")}`,
        );
    },
  };
}
