import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { manifestSchema } from "@labs/release-tools/manifest";

export function readManifest() {
  return manifestSchema.parse(
    JSON.parse(
      readFileSync(
        resolve(
          process.env["RELEASE_DIRECTORY"] ?? "dist/release",
          "manifest.json",
        ),
        "utf8",
      ),
    ),
  );
}
