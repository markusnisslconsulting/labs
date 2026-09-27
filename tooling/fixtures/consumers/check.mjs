/** Build barrel and subpath consumers against an independently installed UI artifact. */
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = process.cwd();

if (!existsSync(path.join(root, "dist/packages/ui/index.js"))) {
  throw new Error("Build @labs/ui before running the consumer probe.");
}

const consumerRoot = mkdtempSync(path.join(tmpdir(), "labs-consumer-"));
process.on("exit", () =>
  rmSync(consumerRoot, { recursive: true, force: true }),
);
cpSync(path.join(here, "src"), path.join(consumerRoot, "src"), {
  recursive: true,
});
const version = (name) =>
  JSON.parse(
    readFileSync(path.join(root, "node_modules", name, "package.json"), "utf8"),
  ).version;
// Pin the isolated install to the dependency versions exercised by this checkout.
const overrides = {};
const visited = new Set();
function pinDependencies(directory) {
  directory = realpathSync(directory);
  const manifest = JSON.parse(
    readFileSync(path.join(directory, "package.json"), "utf8"),
  );
  const identity = `${manifest.name}@${manifest.version}`;
  if (visited.has(identity)) return;
  visited.add(identity);
  const require = createRequire(path.join(directory, "package.json"));
  for (const name of Object.keys(manifest.dependencies ?? {})) {
    const candidate = (require.resolve.paths(name) ?? [])
      .map((directory) => path.join(directory, name, "package.json"))
      .find((file) => existsSync(file));
    if (!candidate)
      throw new Error(`Cannot locate installed dependency ${name}`);
    const dependency = JSON.parse(readFileSync(candidate, "utf8"));
    overrides[`${identity}>${name}`] = dependency.version;
    pinDependencies(path.dirname(realpathSync(candidate)));
  }
}
pinDependencies(path.join(root, "packages/ui"));
pinDependencies(path.join(root, "node_modules/react-dom"));
writeFileSync(
  path.join(consumerRoot, "pnpm-workspace.yaml"),
  `overrides: ${JSON.stringify(overrides)}\n`,
);

writeFileSync(
  path.join(consumerRoot, "package.json"),
  JSON.stringify({
    name: "ui-consumer-probe",
    private: true,
    type: "module",
    dependencies: {
      "@labs/ui": `file:${path.join(root, "dist/packages/ui")}`,
      react: version("react"),
      "react-dom": version("react-dom"),
    },
  }),
);
execFileSync("pnpm", ["install", "--offline", "--ignore-scripts"], {
  cwd: consumerRoot,
  stdio: "inherit",
});

function build(entry) {
  execFileSync(
    "node",
    [
      path.join(root, "node_modules/vite/bin/vite.js"),
      "build",
      "--config",
      path.join(here, "vite.config.ts"),
    ],
    {
      cwd: root,
      env: { ...process.env, ENTRY: entry, CONSUMER_ROOT: consumerRoot },
      stdio: "pipe",
    },
  );
  const dir = path.join(consumerRoot, ".out", entry);
  const files = readdirSync(dir);
  const css = files.filter((f) => f.endsWith(".css"));
  const js = files.filter((f) => f.endsWith(".js"));
  return {
    css: css.map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n"),
    js: js.map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n"),
  };
}

const barrel = build("barrel");
const subpath = build("subpath");
let failed = false;

/** Classes belonging to components the app never imported. */
const FOREIGN = [
  "uix-field",
  "uix-menu",
  "uix-dialog",
  "uix-table",
  "uix-tabs",
  "uix-accordion",
  "uix-switch",
  "uix-toast",
];

for (const [label, built] of [
  ["barrel", barrel],
  ["subpath", subpath],
]) {
  const leaked = FOREIGN.filter((cls) => built.css.includes(cls));
  if (leaked.length) {
    console.log(
      `✗ consumer probe (${label}): the CSS carries ${leaked.join(", ")} for ` +
        `components this app never imported`,
    );
    failed = true;
  }
  if (!built.css.includes("uix-button")) {
    console.log(
      `✗ consumer probe (${label}): Button's own CSS is missing from the ` +
        `bundle, so importing the component does not carry its styles`,
    );
    failed = true;
  }
}

/* The barrel must cost no more than the subpath. If it does, importing
   from "@labs/ui" is a penalty and every consumer has to know to reach
   for the deep path instead — which is the coupling the exports map
   exists to remove. */
if (barrel.css.length !== subpath.css.length) {
  console.log(
    `✗ consumer probe: the barrel yields ${barrel.css.length} bytes of CSS ` +
      `and the subpath ${subpath.css.length}. One component should cost the ` +
      `same either way.`,
  );
  failed = true;
}

if (!failed) {
  console.log(
    `✓ consumer probe: one component costs one component ` +
      `(${(barrel.css.length / 1024).toFixed(1)} KB css, ` +
      `${(barrel.js.length / 1024).toFixed(1)} KB js, barrel = subpath)`,
  );
}

process.exit(failed ? 1 : 0);
