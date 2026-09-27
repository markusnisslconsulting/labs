import { builtinModules } from "node:module";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import type { Rule } from "eslint";

interface Manifest {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  exports?: Record<string, unknown>;
}
interface Owner {
  root: string;
  manifest: Manifest;
  tags: string[];
}
const root = process.cwd();
const json = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8"));
const workspace = json<Manifest>(join(root, "package.json"));
function packageRoots(folder: string): string[] {
  if (!existsSync(join(root, folder))) return [];
  if (existsSync(join(root, folder, "package.json"))) return [folder];
  return readdirSync(join(root, folder), { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules",
    )
    .flatMap((entry) => packageRoots(`${folder}/${entry.name}`));
}
const owners: Owner[] = ["apps", "packages", "tooling", "tests"]
  .flatMap(packageRoots)
  .filter((path) => existsSync(join(root, path, "package.json")))
  .map((path) => ({
    root: path,
    manifest: json<Manifest>(join(root, path, "package.json")),
    tags: existsSync(join(root, path, "project.json"))
      ? (json<{ tags?: string[] }>(join(root, path, "project.json")).tags ?? [])
      : [],
  }));
const packageName = (specifier: string) =>
  specifier
    .split("/")
    .slice(0, specifier.startsWith("@") ? 2 : 1)
    .join("/");
const isInside = (path: string, folder: string) =>
  path === folder || path.startsWith(`${folder}/`);
const ownerOf = (path: string) =>
  owners.find((owner) => isInside(path, owner.root));
const developmentFile = (path: string) =>
  /(?:^|\/)(?:test|tests|e2e|browser|scripts|\.storybook)\//.test(path) ||
  /\.(?:spec|test|stories|config)\.[cm]?[jt]sx?$/.test(path);

/** Package ownership, public entry points and runtime environment constraints. */
export function importViolation(
  file: string,
  specifier: string,
): string | undefined {
  const path = relative(root, resolve(file));
  const owner = ownerOf(path);
  const tooling = !owner || owner.tags.includes("type:tooling");
  const development = tooling || developmentFile(path);
  const tags = owner?.tags ?? [];

  // This module is supplied by the site's Vite plugin, not a package.
  if (specifier === "virtual:labs-workbench" && owner?.root === "apps/site")
    return;

  if (specifier.startsWith(".")) {
    const target = relative(root, resolve(dirname(resolve(file)), specifier));
    if (target.startsWith("../")) return "Do not depend on another checkout.";
    if (ownerOf(target)?.root !== owner?.root)
      return "Use the other workspace package's public entry point.";
    const lab = /\/src\/labs\/([^/]+)\//.exec(path)?.[1];
    const targetLab = /\/src\/labs\/([^/]+)\//.exec(target)?.[1];
    if (lab && targetLab && lab !== targetLab)
      return "Keep lab internals private; share a contract explicitly.";
    return;
  }

  if (specifier.startsWith("node:") || builtinModules.includes(specifier)) {
    if (
      !development &&
      (tags.includes("env:browser") || tags.includes("env:neutral"))
    )
      return "Node APIs do not belong in browser or neutral runtime code.";
    return;
  }
  const name = packageName(specifier);
  if (
    !development &&
    tags.includes("env:neutral") &&
    ["react", "react-dom", "@labs/ui"].includes(name)
  )
    return "Neutral packages must not depend on presentation code.";
  if (!development && tags.includes("env:node") && name === "@labs/ui")
    return "Read the catalog contract instead of importing browser components.";
  const target = owners.find((entry) => entry.manifest.name === name);
  if (
    !tooling &&
    !/\.config\.[cm]?[jt]s$/.test(path) &&
    !/(?:^|\/)\.storybook\/main\.ts$/.test(path) &&
    target?.tags.includes("type:tooling")
  )
    return "Build tooling may only be imported by configuration files.";
  if (target && target !== owner && target.manifest.exports) {
    const subpath =
      specifier === name ? "." : `.${specifier.slice(name.length)}`;
    const exported = Object.keys(target.manifest.exports).some((key) => {
      if (!key.includes("*")) return key === subpath;
      const [prefix, suffix] = key.split("*");
      return (
        subpath.startsWith(prefix!) &&
        subpath.endsWith(suffix!) &&
        !subpath.includes("..")
      );
    });
    if (!exported) return `${specifier} is not a public package export.`;
  }
  const manifest = owner?.manifest ?? workspace;
  const declared = {
    ...manifest.dependencies,
    ...manifest.peerDependencies,
    ...(development
      ? { ...workspace.devDependencies, ...manifest.devDependencies }
      : {}),
  };
  if (name !== manifest.name && !declared[name])
    return `Declare ${name} in ${owner?.root ?? "."}/package.json ${development ? "devDependencies" : "dependencies"}.`;
}

const rule: Rule.RuleModule = {
  meta: { type: "problem", schema: [], messages: { boundary: "{{reason}}" } },
  create(context) {
    const check = (node: Rule.Node, value: unknown) => {
      if (typeof value !== "string") return;
      const reason = importViolation(context.filename, value);
      if (reason)
        context.report({ node, messageId: "boundary", data: { reason } });
    };
    return {
      ImportDeclaration: (node) => check(node, node.source.value),
      ExportNamedDeclaration: (node) => {
        if (node.source) check(node, node.source.value);
      },
      ExportAllDeclaration: (node) => check(node, node.source.value),
      ImportExpression: (node) => {
        if (node.source.type === "Literal") check(node, node.source.value);
      },
    };
  },
};
export default { rules: { "package-boundaries": rule } };
