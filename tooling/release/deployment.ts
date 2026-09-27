import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { verifyRelease } from "./assemble.ts";
import { manifestSchema } from "./schema.ts";

export const publicRoot = "labs.markusnissl.com/public";
export const privateRoot = "labs.markusnissl.com/.labs-deploy";
export const pendingPath = `${privateRoot}/pending.json`;
const entryOrder = [
  "favicon.svg",
  "logo.webp",
  "catalogs/ticket-ui.json",
  "sitemap.xml",
  "robots.txt",
  "storybook/index.json",
  "storybook/iframe.html",
  "storybook/index.html",
  "404.html",
  "index.html",
  ".htaccess",
] as const;
const digest = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const journalSchema = z
  .object({
    version: z.literal(1),
    id: z.uuid(),
    releaseId: manifestSchema.shape.releaseId,
    entries: z
      .array(
        z
          .object({
            path: z.enum(entryOrder),
            before: z.object({ data: z.string(), sha256: hash }).nullable(),
            after: hash,
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
type Journal = z.infer<typeof journalSchema>;

/** Writes verify a temporary file before replacing the destination by rename. */
export interface ReleaseStore {
  read(path: string): Promise<Buffer | undefined>;
  write(path: string, data: Buffer): Promise<void>;
  remove(path: string): Promise<void>;
  reconnect(): Promise<void>;
}

/** Fixed transaction outcomes that may be shown without exposing FTP replies. */
export class DeploymentFailure extends Error {}

function previousBytes(entry: Journal["entries"][number]) {
  if (!entry.before) return undefined;
  const bytes = Buffer.from(entry.before.data, "base64");
  if (
    bytes.toString("base64") !== entry.before.data ||
    digest(bytes) !== entry.before.sha256
  )
    throw new Error("Invalid recovery journal content");
  return bytes;
}

/** Recover only bytes owned by this transaction; never overwrite an external edit. */
export async function recoverDeployment(store: ReleaseStore): Promise<boolean> {
  const pending = await store.read(pendingPath);
  if (!pending) return false;
  const journal = journalSchema.parse(JSON.parse(pending.toString("utf8")));
  if (
    new Set(journal.entries.map((entry) => entry.path)).size !==
    journal.entries.length
  )
    throw new Error("Duplicate recovery journal paths");
  for (const entry of journal.entries) {
    const before = previousBytes(entry);
    const current = await store.read(`${publicRoot}/${entry.path}`);
    if (
      current &&
      digest(current) !== entry.after &&
      (!before || digest(current) !== digest(before))
    )
      throw new Error(
        "Recovery stopped because an entry was changed outside this transaction",
      );
  }
  for (const path of entryOrder) {
    const entry = journal.entries.find((candidate) => candidate.path === path);
    if (!entry) continue;
    const before = previousBytes(entry);
    const target = `${publicRoot}/${entry.path}`;
    const current = await store.read(target);
    if (
      current &&
      digest(current) !== entry.after &&
      (!before || !current.equals(before))
    )
      throw new Error("An entry changed while recovery was running");
    if (before && !current?.equals(before)) await store.write(target, before);
    else if (!before && current) await store.remove(target);
    const actual = await store.read(target);
    if (before ? !actual?.equals(before) : actual !== undefined)
      throw new Error("Restored entry did not match the recovery journal");
  }
  await store.remove(pendingPath);
  return true;
}

export async function deployRelease(options: {
  directory: string;
  sourceSha: string;
  store: ReleaseStore;
  smoke: () => Promise<void>;
  beforePromotion?: () => Promise<void>;
  report?: (message: string) => void;
}) {
  const manifest = await verifyRelease(options.directory, options.sourceSha);
  const namespace = `releases/${manifest.releaseId}/`;
  const files = Object.keys(manifest.files);
  for (const required of [
    "index.html",
    "404.html",
    ".htaccess",
    "storybook/index.html",
    "storybook/iframe.html",
    "storybook/index.json",
  ])
    if (!files.includes(required))
      throw new Error("Release is missing a required entry");
  if (
    !files.some((path) => path.startsWith(namespace)) ||
    files.some(
      (path) =>
        !path.startsWith(namespace) &&
        !entryOrder.some((entry) => entry === path),
    )
  )
    throw new Error("Release has an unsupported deployment layout");
  const { store } = options;
  // Prove overwrite-by-rename in private storage before writing public entries.
  const id = randomUUID();
  const probe = `${privateRoot}/.probe-${id}`;
  await store.write(probe, Buffer.from("first"));
  await store.write(probe, Buffer.from("replacement"));
  // A fresh session must discover hidden backup paths through its own listing.
  await store.reconnect();
  if (!(await store.read(probe))?.equals(Buffer.from("replacement")))
    throw new Error("FTPS file replacement preflight failed");
  await store.remove(probe);
  if (await recoverDeployment(store))
    options.report?.("Recovered the interrupted deployment");

  const assets = files.filter((path) => path.startsWith(namespace)).sort();
  for (const path of assets) {
    const target = `${publicRoot}/${path}`;
    const existing = await store.read(target);
    if (existing && digest(existing) !== manifest.files[path]!.sha256)
      throw new Error(
        "An immutable release file already exists with different bytes",
      );
    if (existing) continue;
    if (!existing)
      await store.write(
        target,
        await readFile(join(options.directory, "public", path)),
      );
    const uploaded = await store.read(target);
    if (!uploaded || digest(uploaded) !== manifest.files[path]!.sha256)
      throw new Error("An uploaded release file failed verification");
  }
  options.report?.(`Verified ${assets.length} immutable release files`);
  await options.beforePromotion?.();

  const entries: Journal["entries"] = [];
  for (const path of entryOrder) {
    if (!manifest.files[path]) continue;
    const before = await store.read(`${publicRoot}/${path}`);
    entries.push({
      path,
      before: before
        ? { data: before.toString("base64"), sha256: digest(before) }
        : null,
      after: manifest.files[path]!.sha256,
    });
  }
  const journal: Journal = {
    version: 1,
    id,
    releaseId: manifest.releaseId,
    entries,
  };
  const bytes = Buffer.from(JSON.stringify(journal));
  if (bytes.length > 16 * 1024 * 1024)
    throw new Error("Entry backup exceeds the 16 MiB journal limit");
  await store.write(`${privateRoot}/transactions/${id}.json`, bytes);
  try {
    await store.write(pendingPath, bytes);
    for (const entry of entries) {
      const target = `${publicRoot}/${entry.path}`;
      const current = await store.read(target);
      const before = previousBytes(entry);
      if (before ? !current?.equals(before) : current !== undefined)
        throw new Error(
          "An entry changed while the release was being prepared",
        );
      await store.write(
        target,
        await readFile(join(options.directory, "public", entry.path)),
      );
    }
    options.report?.("Published entry documents; running browser smoke checks");
    await options.smoke();
    // The control connection may expire while HTTP checks are running.
    await store.reconnect();
    for (const entry of entries) {
      const current = await store.read(`${publicRoot}/${entry.path}`);
      if (!current || digest(current) !== entry.after)
        throw new Error("An entry changed during browser verification");
    }
    await store.remove(pendingPath);
    options.report?.("Browser smoke checks passed");
    return { releaseId: manifest.releaseId, backupId: id };
  } catch {
    options.report?.("Promotion failed; restoring previous entries");
    try {
      await store.reconnect();
      const pending = await store.read(pendingPath);
      if (pending && !pending.equals(bytes))
        throw new Error("The pending transaction changed during deployment");
      if (!pending) await store.write(pendingPath, bytes);
      await recoverDeployment(store);
    } catch {
      throw new DeploymentFailure(
        "Deployment and recovery failed; the private pending journal was retained. Run recovery before another release.",
      );
    }
    throw new DeploymentFailure(
      "Deployment failed; previous entry files were restored",
    );
  }
}
