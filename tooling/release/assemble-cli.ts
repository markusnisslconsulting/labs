import { execFileSync } from "node:child_process";
import { assemble } from "./assemble.ts";
const sourceSha = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const dirty = Boolean(
  execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim(),
);
const manifest = await assemble({
  site: "apps/site/dist",
  storybook: "dist/packages/ui-storybook",
  output: "dist/release",
  sourceSha,
  dirty,
});
console.log(
  `Assembled ${Object.keys(manifest.files).length} files and ${manifest.routes.length} routes for ${sourceSha}${dirty ? " (local changes)" : ""}.`,
);
