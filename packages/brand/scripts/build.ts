import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { styles } from "./styles";

const root = "packages/brand";
const generated = styles();
const generate = process.argv.includes("--generate");
for (const [name, css] of Object.entries(generated)) {
  const file = join(root, "src", name);
  if (generate) writeFileSync(file, css);
  else if (readFileSync(file, "utf8") !== css)
    throw new Error(`${name} has drifted. Run pnpm nx run brand:generate.`);
}
if (!generate) {
  const dist = join(root, "dist");
  rmSync(dist, { recursive: true, force: true });
  execFileSync("pnpm", ["exec", "tsc", "-p", join(root, "tsconfig.lib.json")], {
    stdio: "inherit",
  });
  mkdirSync(dist, { recursive: true });
  for (const name of readdirSync(join(root, "src"))) {
    if (name.endsWith(".ts")) continue;
    cpSync(join(root, "src", name), join(dist, name), { recursive: true });
  }
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  writeFileSync(
    join(dist, "package.json"),
    JSON.stringify(
      {
        name: manifest.name,
        version: manifest.version,
        private: true,
        type: "module",
        sideEffects: ["*.css"],
        exports: {
          ...manifest.exports,
          ".": { types: "./index.d.ts", import: "./index.js" },
        },
      },
      null,
      2,
    ).replaceAll("./src/", "./") + "\n",
  );
  cpSync(join(root, "README.md"), join(dist, "README.md"));
  cpSync(join(root, "provenance.json"), join(dist, "provenance.json"));
}
