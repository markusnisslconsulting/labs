import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { x } from "tar";
import { isPublicArtifact, prerenderRoute } from "./artifact-policy.ts";
import { verifyRelease } from "./assemble.ts";

/** Extract only regular release files into a disposable directory before verification. */
export async function extractRelease(
  archive: string,
  output: string,
  sourceSha: string,
) {
  const target = resolve(output);
  if (
    dirname(target) === target ||
    resolve(archive).startsWith(target + "/") ||
    resolve(archive) === target
  )
    throw new Error(
      "Extraction output must be separate from its archive and filesystem root",
    );
  await mkdir(dirname(target), { recursive: true });
  const stage = await mkdtemp(target + ".tmp-");
  let issue: string | undefined;
  let totalBytes = 0;
  const names = new Set<string>();
  try {
    await x({
      file: archive,
      cwd: stage,
      strict: true,
      preservePaths: false,
      preserveOwner: false,
      noChmod: true,
      noMtime: true,
      filter(path, entry) {
        const name = path.replace(/\/$/, "");
        const canonical =
          !name.startsWith("/") &&
          !/[\\\r\n\0]/.test(name) &&
          !name
            .split("/")
            .some((part) => !part || part === "." || part === "..");
        if (!("type" in entry) || !canonical || names.has(name))
          issue ??= "Invalid or repeated archive path";
        else if (entry.type === "Directory") {
          if (name !== "public" && !name.startsWith("public/"))
            issue ??= "Unexpected archive directory";
        } else if (
          entry.type !== "File" ||
          (name !== "manifest.json" &&
            (!name.startsWith("public/") ||
              (!isPublicArtifact(name.slice(7)) &&
                !prerenderRoute(name.slice(7)))))
        )
          issue ??= "Unexpected archive file or link";
        totalBytes += entry.size;
        names.add(name);
        if (
          entry.size > 64 * 1024 * 1024 ||
          totalBytes > 512 * 1024 * 1024 ||
          names.size > 20_000
        )
          issue ??= "Release archive exceeds extraction limits";
        return !issue;
      },
    });
    if (issue) throw new Error(issue);
    // Route documents are accepted only if the verified manifest declares them.
    const manifest = await verifyRelease(stage, sourceSha);
    await rm(target, { recursive: true, force: true });
    await rename(stage, target);
    return manifest;
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}
