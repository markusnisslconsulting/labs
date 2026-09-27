import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assemble } from "../assemble.ts";
import {
  deployRelease,
  recoverDeployment,
  pendingPath,
  privateRoot,
  publicRoot,
  type ReleaseStore,
  DeploymentFailure,
} from "../deployment.ts";

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});

class MemoryStore implements ReleaseStore {
  files = new Map<string, Buffer>();
  operations: Array<{ operation: string; path: string }> = [];
  before: (operation: string, path: string) => void = () => {};
  after: (operation: string, path: string) => void = () => {};
  async read(path: string) {
    this.before("read", path);
    return this.files.get(path);
  }
  async write(path: string, bytes: Buffer) {
    this.operations.push({ operation: "write", path });
    this.before("write", path);
    this.files.set(path, Buffer.from(bytes));
    this.after("write", path);
  }
  async remove(path: string) {
    this.operations.push({ operation: "remove", path });
    this.before("remove", path);
    this.files.delete(path);
    this.after("remove", path);
  }
  async reconnect() {
    this.before("reconnect", "");
  }
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "labs-deploy-test-"));
  roots.push(root);
  const site = join(root, "site"),
    storybook = join(root, "storybook"),
    directory = join(root, "release");
  await mkdir(join(site, "assets"), { recursive: true });
  await mkdir(join(storybook, "sb-manager"), { recursive: true });
  await writeFile(
    join(site, "catalog-routes.json"),
    JSON.stringify({ routes: ["/"] }),
  );
  await writeFile(
    join(site, "index.html"),
    '<head><title>Labs</title></head><script src="./assets/main-12345678.js"></script>',
  );
  await writeFile(join(site, "assets/main-12345678.js"), "console.log('site')");
  await writeFile(
    join(site, "404.html"),
    "<title>Page not found</title><h1>Page not found</h1>",
  );
  await writeFile(join(site, "sitemap.xml"), "<urlset />");
  await writeFile(join(site, "robots.txt"), "User-agent: *\nAllow: /\n");
  await writeFile(
    join(storybook, "index.html"),
    '<head></head><script type="module">import "./sb-manager/globals-runtime.js";</script>',
  );
  await writeFile(join(storybook, "index.json"), "{}");
  await writeFile(join(storybook, "iframe.html"), "<h1>Example</h1>");
  await writeFile(
    join(storybook, "sb-manager/globals-runtime.js"),
    'var STORY_INDEX_PATH = "./index.json";',
  );
  const sourceSha = "a".repeat(40);
  const manifest = await assemble({
    site,
    storybook,
    output: directory,
    sourceSha,
    dirty: false,
  });
  const store = new MemoryStore();
  const previous = new Map<string, Buffer>();
  for (const path of Object.keys(manifest.files).filter(
    (path) => !path.startsWith("releases/"),
  ))
    previous.set(`${publicRoot}/${path}`, Buffer.from(`previous ${path}`));
  previous.set(`${publicRoot}/assets/legacy.js`, Buffer.from("legacy asset"));
  for (const [path, bytes] of previous) store.files.set(path, bytes);
  const smoke = vi.fn(async () => {});
  return { directory, sourceSha, store, smoke, manifest, previous };
}
function expectPrevious(f: Awaited<ReturnType<typeof fixture>>) {
  for (const [path, bytes] of f.previous)
    expect(f.store.files.get(path), path).toEqual(bytes);
}
function failOnce(
  store: MemoryStore,
  operation: string,
  path: (path: string) => boolean,
  after = false,
) {
  let failed = false;
  store[after ? "after" : "before"] = (actual, target) => {
    if (!failed && actual === operation && path(target)) {
      failed = true;
      throw new Error("simulated interruption");
    }
  };
}

describe("FTPS release transaction", () => {
  it("restores changed entries without rewriting an unchanged entry that rejected promotion", async () => {
    const f = await fixture();
    f.store.before = (operation, path) => {
      if (operation === "write" && path === `${publicRoot}/index.html`)
        throw new Error("entry is read-only");
    };
    await expect(deployRelease(f)).rejects.toThrow(
      "previous entry files were restored",
    );
    expectPrevious(f);
    expect(f.store.files.has(pendingPath)).toBe(false);
  });
  it("reconnects after a control connection expires during browser checks", async () => {
    const f = await fixture();
    let disconnected = false;
    f.smoke.mockImplementationOnce(async () => {
      disconnected = true;
    });
    f.store.before = (operation) => {
      if (operation === "reconnect") disconnected = false;
      else if (disconnected) throw new Error("idle connection expired");
    };
    await expect(deployRelease(f)).resolves.toMatchObject({
      releaseId: f.manifest.releaseId,
    });
    expect(f.store.files.has(pendingPath)).toBe(false);
  });

  it("detects an external entry change even if browser smoke succeeded", async () => {
    const f = await fixture();
    f.smoke.mockImplementationOnce(async () => {
      f.store.files.set(
        `${publicRoot}/index.html`,
        Buffer.from("external edit"),
      );
    });
    await expect(deployRelease(f)).rejects.toThrow("recovery failed");
    expect(f.store.files.get(`${publicRoot}/index.html`)).toEqual(
      Buffer.from("external edit"),
    );
    expect(f.store.files.has(pendingPath)).toBe(true);
  });
  it("reports the recovery outcome without carrying provider diagnostics", async () => {
    const f = await fixture();
    f.smoke.mockRejectedValueOnce(
      new Error("provider detail that should not be reported"),
    );
    const error: unknown = await deployRelease(f).catch(
      (failure: unknown) => failure,
    );
    expect(error).toBeInstanceOf(DeploymentFailure);
    expect((error as Error).message).toBe(
      "Deployment failed; previous entry files were restored",
    );
  });
  it("verifies provenance before using the remote store", async () => {
    const f = await fixture();
    await expect(
      deployRelease({ ...f, sourceSha: "b".repeat(40) }),
    ).rejects.toThrow("expected commit");
    expect(f.store.operations).toEqual([]);
  });

  it("uploads immutable files and a private backup before entries, retains old assets and writes routing last", async () => {
    const f = await fixture();
    await deployRelease(f);
    const writes = f.store.operations
      .filter((op) => op.operation === "write")
      .map((op) => op.path);
    const firstEntry = writes.findIndex(
      (path) =>
        path.startsWith(publicRoot + "/") && !path.includes("/releases/"),
    );
    expect(writes.indexOf(pendingPath)).toBeLessThan(firstEntry);
    expect(
      writes.slice(firstEntry).every((path) => !path.includes("/releases/")),
    ).toBe(true);
    expect(writes.at(-1)).toBe(`${publicRoot}/.htaccess`);
    expect(
      writes.some((path) => path.startsWith(`${privateRoot}/transactions/`)),
    ).toBe(true);
    expect(f.store.files.get(`${publicRoot}/assets/legacy.js`)).toEqual(
      Buffer.from("legacy asset"),
    );
    expect(f.store.files.has(pendingPath)).toBe(false);
    expect(f.smoke).toHaveBeenCalledOnce();
    expect(
      f.store.operations
        .filter((op) => op.operation === "remove")
        .every((op) => op.path.startsWith(privateRoot + "/")),
    ).toBe(true);
  });

  it.each([
    "asset",
    "backup",
    "pending",
    "entry",
    "entry-ack",
    "cleanup-ack",
    "smoke",
  ])("preserves or restores entries after a %s failure", async (phase) => {
    const f = await fixture();
    if (phase === "asset")
      failOnce(f.store, "write", (path) => path.includes("/releases/"));
    if (phase === "backup")
      failOnce(f.store, "write", (path) => path.includes("/transactions/"));
    if (phase === "pending")
      failOnce(f.store, "write", (path) => path === pendingPath);
    if (phase.startsWith("entry"))
      failOnce(
        f.store,
        "write",
        (path) => path === `${publicRoot}/index.html`,
        phase === "entry-ack",
      );
    if (phase === "cleanup-ack")
      failOnce(f.store, "remove", (path) => path === pendingPath, true);
    if (phase === "smoke")
      f.smoke.mockRejectedValueOnce(new Error("Browser regression"));
    await expect(deployRelease(f)).rejects.toThrow();
    expectPrevious(f);
    expect(f.store.files.has(pendingPath)).toBe(false);
  });

  it("removes only newly introduced entries when the first deployment fails smoke", async () => {
    const f = await fixture();
    f.store.files.clear();
    f.store.files.set(`${publicRoot}/unrelated.txt`, Buffer.from("keep"));
    f.smoke.mockRejectedValueOnce(new Error("failure"));
    await expect(deployRelease(f)).rejects.toThrow("restored");
    expect(f.store.files.has(`${publicRoot}/index.html`)).toBe(false);
    expect(f.store.files.get(`${publicRoot}/unrelated.txt`)).toEqual(
      Buffer.from("keep"),
    );
    expect(
      [...f.store.files.keys()].some((path) => path.includes("/releases/")),
    ).toBe(true);
  });

  it("recovers an interrupted promotion before a subsequent deployment starts", async () => {
    const f = await fixture();
    f.store.before = (operation, path) => {
      if (
        (operation === "reconnect" && f.store.files.has(pendingPath)) ||
        (operation === "write" && path === `${publicRoot}/index.html`)
      )
        throw new Error("connection lost");
    };
    await expect(deployRelease(f)).rejects.toThrow("recovery failed");
    expect(f.store.files.has(pendingPath)).toBe(true);
    f.store.before = () => {};
    expect(await recoverDeployment(f.store)).toBe(true);
    expectPrevious(f);
    await deployRelease(f);
    expect(f.smoke).toHaveBeenCalledOnce();
  });

  it("refuses to restore over an external edit and keeps its journal", async () => {
    const f = await fixture();
    f.smoke.mockImplementationOnce(async () => {
      f.store.files.set(
        `${publicRoot}/index.html`,
        Buffer.from("external writer"),
      );
      throw new Error("failed smoke");
    });
    await expect(deployRelease(f)).rejects.toThrow("recovery failed");
    expect(f.store.files.get(`${publicRoot}/index.html`)).toEqual(
      Buffer.from("external writer"),
    );
    expect(f.store.files.has(pendingPath)).toBe(true);
  });

  it("restores a missing entry after an interrupted server-side replacement", async () => {
    const f = await fixture();
    f.smoke.mockImplementationOnce(async () => {
      f.store.files.delete(`${publicRoot}/index.html`);
      throw new Error("entry disappeared");
    });
    await expect(deployRelease(f)).rejects.toThrow("restored");
    expectPrevious(f);
  });

  it("does not publish entries when main advances during the upload", async () => {
    const f = await fixture();
    await expect(
      deployRelease({
        ...f,
        beforePromotion: async () => {
          throw new Error("main advanced");
        },
      }),
    ).rejects.toThrow("main advanced");
    expectPrevious(f);
    expect(f.smoke).not.toHaveBeenCalled();
    expect(f.store.files.has(pendingPath)).toBe(false);
  });

  it("reuses matching immutable files but rejects a collision before publishing entries", async () => {
    const f = await fixture();
    await deployRelease(f);
    f.store.operations.length = 0;
    await deployRelease(f);
    expect(
      f.store.operations.some(
        (op) => op.operation === "write" && op.path.includes("/releases/"),
      ),
    ).toBe(false);
    const asset = [...f.store.files.keys()].find((path) =>
      path.includes("/releases/"),
    )!;
    f.store.files.set(asset, Buffer.from("conflicting bytes"));
    f.store.operations.length = 0;
    await expect(deployRelease(f)).rejects.toThrow("different bytes");
    expect(
      f.store.operations.some((op) => op.path.startsWith(publicRoot + "/")),
    ).toBe(false);
  });

  it("stops before public writes if private replacement is unsupported", async () => {
    const f = await fixture();
    f.store.before = (operation, path) => {
      if (
        operation === "write" &&
        path.includes("/.probe-") &&
        f.store.files.has(path)
      )
        throw new Error("RNTO refused");
    };
    await expect(deployRelease(f)).rejects.toThrow("RNTO refused");
    expectPrevious(f);
    expect(
      f.store.operations.every((op) => op.path.startsWith(privateRoot + "/")),
    ).toBe(true);
  });

  it("stops before public writes when a fresh listing hides recovery files", async () => {
    const f = await fixture();
    vi.spyOn(f.store, "read").mockImplementation(async (path) =>
      path.includes("/.probe-") ? undefined : f.store.files.get(path),
    );
    await expect(deployRelease(f)).rejects.toThrow("preflight failed");
    expectPrevious(f);
    expect(
      f.store.operations.every((op) => op.path.startsWith(privateRoot + "/")),
    ).toBe(true);
  });
});
