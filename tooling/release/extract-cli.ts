import { extractRelease } from "./extract.ts";
const sourceSha = process.env["RELEASE_SHA"];
if (!sourceSha || !/^[a-f0-9]{40}$/.test(sourceSha))
  throw new Error("A verified release SHA is required");
const manifest = await extractRelease(
  "dist/incoming/labs-release.tar.gz",
  "dist/deploy-release",
  sourceSha,
);
console.log(
  `Verified ${Object.keys(manifest.files).length} downloaded release files for ${manifest.sourceSha}`,
);
