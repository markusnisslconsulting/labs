import { execFileSync } from "node:child_process";
import { verifyRelease } from "./assemble.ts";

const expectedSha = process.argv[2];
if (!expectedSha || !/^[a-f0-9]{40}$/.test(expectedSha))
  throw new Error("Usage: pnpm release:verify <expected-commit-sha>");
const head = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const changes = execFileSync("git", ["status", "--porcelain"], {
  encoding: "utf8",
}).trim();
if (head !== expectedSha || changes)
  throw new Error(
    "Release verification requires a clean checkout of the expected commit",
  );
const manifest = await verifyRelease("dist/release", expectedSha);
console.log(
  `Verified ${Object.keys(manifest.files).length} release files for ${manifest.sourceSha}`,
);
