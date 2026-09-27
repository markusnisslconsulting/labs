import { afterEach, describe, expect, it } from "vitest";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { assemble, fileInventory, verifyRelease } from "../assemble.ts";
import { staticHandler } from "../http.ts";
import { manifestSchema, routeDocuments } from "../schema.ts";
import { c, Header } from "tar";
import { gzipSync } from "node:zlib";
import { extractRelease } from "../extract.ts";

const roots: string[] = [];
const servers: Server[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "labs-release-"));
  roots.push(root);
  const site = join(root, "site"),
    storybook = join(root, "storybook"),
    output = join(root, "release");
  await mkdir(join(site, "assets"), { recursive: true });
  await mkdir(storybook);
  await mkdir(join(storybook, "sb-manager"));
  await writeFile(
    join(storybook, "sb-manager/globals-runtime.js"),
    'var STORY_INDEX_PATH = "./index.json";',
  );
  await writeFile(join(storybook, "index.json"), "{}");
  await writeFile(
    join(site, "index.html"),
    '<html><head><title>Labs</title><script src="./assets/main-12345678.js"></script></head><body><div id="root"></div><a href="#main">Skip</a></body></html>',
  );
  await writeFile(
    join(site, "assets", "main-12345678.js"),
    "console.log('demo');",
  );
  await mkdir(join(site, "pages"));
  await writeFile(join(site, "sitemap.xml"), "<urlset />");
  await writeFile(join(site, "robots.txt"), "User-agent: *\nAllow: /\n");
  await writeFile(
    join(site, "pages/demo.html"),
    '<h1>Demo</h1><script src="./assets/main-12345678.js"></script>',
  );
  await writeFile(
    join(site, "404.html"),
    '<title>Page not found</title><meta name="robots" content="noindex" /><h1>Page not found</h1>',
  );
  await writeFile(
    join(site, "catalog-routes.json"),
    JSON.stringify({ routes: ["/", "/demo"] }),
  );
  await writeFile(
    join(storybook, "index.html"),
    '<html><head><script type="module">import "./sb-manager/globals-runtime.js"</script></head><body><h1>Storybook manager</h1></body></html>',
  );
  await writeFile(join(storybook, "iframe.html"), "<h1>Component preview</h1>");
  await writeFile(
    join(storybook, "project.json"),
    '{"privateBuildDetails":true}',
  );
  await writeFile(
    join(storybook, "preview-stats.json"),
    '{"modules":["/private/source.ts"]}',
  );
  return {
    root,
    site,
    storybook,
    output,
    sourceSha: "a".repeat(40),
    dirty: false,
  };
}
async function start(root: string, documents: Record<string, string>) {
  const server = createServer(staticHandler(root, documents));
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No server address");
  return `http://127.0.0.1:${address.port}`;
}

describe("assembled release", () => {
  it("rejects an undeclared route document even if its archive hashes match", async () => {
    const f = await fixture();
    const manifest = await assemble(f);
    await writeFile(
      join(
        f.output,
        "public",
        `releases/${manifest.releaseId}/pages/private.html`,
      ),
      "private",
    );
    manifest.files = await fileInventory(join(f.output, "public"));
    await writeFile(join(f.output, "manifest.json"), JSON.stringify(manifest));
    const archive = join(f.root, "release.tar.gz");
    await c({ file: archive, gzip: true, cwd: f.output }, [
      "manifest.json",
      "public",
    ]);
    await expect(
      extractRelease(archive, join(f.root, "received"), f.sourceSha),
    ).rejects.toThrow("Unexpected release path");
  });

  it("retains the previous output if a declared route has no prerendered document", async () => {
    const f = await fixture();
    const previous = await assemble(f);
    await rm(join(f.site, "pages/demo.html"));
    await expect(assemble(f)).rejects.toThrow();
    expect(await verifyRelease(f.output)).toEqual(previous);
  });
  it("extracts and verifies the retained CI archive without rebuilding", async () => {
    const f = await fixture();
    const original = await assemble(f);
    const archive = join(f.root, "release.tar.gz"),
      received = join(f.root, "received");
    await c({ file: archive, gzip: true, cwd: f.output }, [
      "manifest.json",
      "public",
    ]);
    expect(await extractRelease(archive, received, f.sourceSha)).toEqual(
      original,
    );
    await expect(
      extractRelease(archive, received, "b".repeat(40)),
    ).rejects.toThrow("expected commit");
    expect(await verifyRelease(received)).toEqual(original);
  });

  it.each([
    "../escape.txt",
    "/tmp/labs-escape.txt",
    "public/../escape.txt",
    "public/AGENTS.md",
  ])(
    "rejects an archive entry outside the public contract (%s)",
    async (path) => {
      const f = await fixture();
      const original = await assemble(f);
      const header = new Header({ path, size: 0, type: "File", mode: 0o644 });
      header.encode();
      const archive = join(f.root, "bad.tar.gz");
      await writeFile(
        archive,
        gzipSync(Buffer.concat([header.block!, Buffer.alloc(1024)])),
      );
      await expect(
        extractRelease(archive, f.output, f.sourceSha),
      ).rejects.toThrow();
      expect(await verifyRelease(f.output)).toEqual(original);
    },
  );

  it("rejects archive symlinks before following them", async () => {
    const f = await fixture();
    const original = await assemble(f);
    const archive = join(f.root, "link.tar.gz");
    const header = new Header({
      path: "public/logo.webp",
      type: "SymbolicLink",
      linkpath: "../../outside",
      size: 0,
      mode: 0o644,
    });
    header.encode();
    await writeFile(
      archive,
      gzipSync(Buffer.concat([header.block!, Buffer.alloc(1024)])),
    );
    await expect(
      extractRelease(archive, f.output, f.sourceSha),
    ).rejects.toThrow("file or link");
    expect(await verifyRelease(f.output)).toEqual(original);
  });
  it("isolates both builds, keeps fragment links local and changes the namespace when bytes change", async () => {
    const options = await fixture();
    const first = await assemble(options);
    const prefix = `/releases/${first.releaseId}`;
    const index = await readFile(
      join(options.output, "public/index.html"),
      "utf8",
    );
    expect(index).toContain(`${prefix}/assets/main-12345678.js`);
    expect(index).toContain('href="#main"');
    const runtime = await readFile(
      join(
        options.output,
        `public${prefix}/storybook/sb-manager/globals-runtime.js`,
      ),
      "utf8",
    );
    expect(runtime).toContain(`${prefix}/storybook/index.json`);
    expect(first.files["assets/main-12345678.js"]).toBeUndefined();
    expect(
      first.files["storybook/sb-manager/globals-runtime.js"],
    ).toBeUndefined();
    expect((await assemble(options)).releaseId).toBe(first.releaseId);
    await writeFile(
      join(options.storybook, "sb-manager/globals-runtime.js"),
      'var STORY_INDEX_PATH = "./index.json"; /* next build */',
    );
    const second = await assemble(options);
    expect(second.releaseId).not.toBe(first.releaseId);
    expect(second.sourceSha).toBe(first.sourceSha);
  });

  it("fails closed on a changed Storybook runtime while preserving the previous artifact", async () => {
    const options = await fixture();
    const original = await assemble(options);
    await writeFile(
      join(options.storybook, "sb-manager/globals-runtime.js"),
      "var newRuntime = true;",
    );
    await expect(assemble(options)).rejects.toThrow(
      "Unsupported Storybook story-index assignment",
    );
    expect(await verifyRelease(options.output)).toEqual(original);
  });

  it("rejects a substituted release identifier even when the file hashes match", async () => {
    const options = await fixture();
    const manifest = await assemble(options);
    manifest.releaseId = `${options.sourceSha}-${"0".repeat(16)}`;
    await writeFile(
      join(options.output, "manifest.json"),
      JSON.stringify(manifest),
    );
    await expect(verifyRelease(options.output)).rejects.toThrow(
      "different release identifier",
    );
  });
  it("combines surfaces, omits build metadata and records every public file hash", async () => {
    const options = await fixture();
    const manifest = await assemble(options);
    expect(manifestSchema.parse(manifest).sourceSha).toBe(options.sourceSha);
    expect(manifest.files["storybook/iframe.html"]).toBeDefined();
    expect(manifest.files["storybook/project.json"]).toBeUndefined();
    expect(manifest.files["storybook/preview-stats.json"]).toBeUndefined();
    expect(manifest.files["catalog-routes.json"]).toBeUndefined();
    expect(manifest.files).toEqual(
      await fileInventory(join(options.output, "public")),
    );
    expect(
      await readFile(join(options.output, "public", "404.html"), "utf8"),
    ).toContain('name="robots" content="noindex"');
  });
  it.each(["AGENTS.md", ".env", "bundle.js.map", "private.ts"])(
    "rejects unexpected %s in a build",
    async (name) => {
      const options = await fixture();
      await writeFile(join(options.site, name), "do not publish");
      await expect(assemble(options)).rejects.toThrow(/Unexpected public/);
    },
  );
  it("keeps the previous assembled artifact if a new build is incomplete", async () => {
    const options = await fixture();
    const original = await assemble(options);
    await rm(join(options.storybook, "iframe.html"));
    await expect(assemble(options)).rejects.toThrow();
    expect(await verifyRelease(options.output)).toEqual(original);
  });
  it("keeps the previous release and reports no credential value when new content is rejected", async () => {
    const options = await fixture();
    const original = await assemble(options);
    const fakeToken = ["ghp", "B".repeat(36)].join("_");
    await writeFile(
      join(options.site, "assets", "main-12345678.js"),
      `const token = ${JSON.stringify(fakeToken)}`,
    );
    let message = "";
    try {
      await assemble(options);
    } catch (error) {
      message = error instanceof Error ? error.message : "unknown error";
    }
    expect(message).toContain("Release content rejected");
    expect(message).toContain("secretlint-rule-github");
    expect(message).not.toContain(fakeToken);
    expect(await verifyRelease(options.output)).toEqual(original);
  });
  it("rejects unexpected static files even when their extension is valid for the web", async () => {
    const options = await fixture();
    await writeFile(join(options.site, "review.json"), '{"internal":true}');
    await expect(assemble(options)).rejects.toThrow("Unexpected release path");
  });
  it("does not lose a file named __proto__ from the inventory", async () => {
    const options = await fixture();
    await assemble(options);
    await writeFile(
      join(options.output, "public", "__proto__"),
      "private content",
    );
    await expect(verifyRelease(options.output)).rejects.toThrow(
      "Unexpected release path",
    );
  });
  it("rechecks content when a manifest's hashes match the files", async () => {
    const options = await fixture();
    const manifest = await assemble(options);
    await writeFile(
      join(options.output, "public", "index.html"),
      "<environment_context>Private context</environment_context>",
    );
    manifest.files = await fileInventory(join(options.output, "public"));
    await writeFile(
      join(options.output, "manifest.json"),
      JSON.stringify(manifest),
    );
    await expect(verifyRelease(options.output)).rejects.toThrow(
      "instruction-context",
    );
  });
  it("detects changed, missing and extra files and rejects a mismatched source commit", async () => {
    const options = await fixture();
    await assemble(options);
    await expect(
      verifyRelease(options.output, options.sourceSha),
    ).resolves.toBeDefined();
    await expect(verifyRelease(options.output, "b".repeat(40))).rejects.toThrow(
      /expected commit/,
    );
    const file = join(options.output, "public", "index.html");
    await writeFile(file, "tampered");
    await expect(verifyRelease(options.output)).rejects.toThrow(/mismatch/);
    await rm(file);
    await expect(verifyRelease(options.output)).rejects.toThrow(/mismatch/);
    await assemble(options);
    await writeFile(
      join(
        options.output,
        "public",
        "releases",
        (await verifyRelease(options.output)).releaseId,
        "assets",
        "extra-12345678.js",
      ),
      "extra",
    );
    await expect(verifyRelease(options.output)).rejects.toThrow(/mismatch/);
  });
  it("rejects an artifact assembled from uncommitted changes even when the source SHA matches", async () => {
    const options = await fixture();
    await assemble({ ...options, dirty: true });
    await expect(
      verifyRelease(options.output, options.sourceSha),
    ).rejects.toThrow(/expected commit/);
  });
  it("rejects symlinks and overlapping input/output directories", async () => {
    const options = await fixture();
    await symlink(
      join(options.storybook, "index.html"),
      join(options.site, "linked.html"),
    );
    await expect(assemble(options)).rejects.toThrow(/Unexpected public/);
    await expect(
      assemble({ ...options, output: options.root }),
    ).rejects.toThrow(/separate/);
  });
  it("rejects a symlink replacing the public directory", async () => {
    const options = await fixture();
    await assemble(options);
    await rm(join(options.output, "public"), { recursive: true });
    await symlink(options.site, join(options.output, "public"));
    await expect(verifyRelease(options.output)).rejects.toThrow(
      "real directory",
    );
  });
  it("validates document routes before emitting rewrite rules", async () => {
    const options = await fixture();
    await writeFile(
      join(options.site, "catalog-routes.json"),
      JSON.stringify({ routes: ["/", "/bad|route"] }),
    );
    await expect(assemble(options)).rejects.toThrow();
  });
  it("serves known pages, Storybook, assets and genuine missing responses", async () => {
    const options = await fixture();
    const manifest = await assemble(options);
    const base = await start(
      join(options.output, "public"),
      routeDocuments(manifest.routes, manifest.releaseId),
    );
    for (const route of [
      "/",
      "/demo",
      "/storybook/",
      "/storybook/iframe.html",
    ]) {
      const response = await fetch(base + route);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");
    }
    const script = await fetch(
      base + `/releases/${manifest.releaseId}/assets/main-12345678.js`,
    );
    expect(script.headers.get("content-type")).toContain("text/javascript");
    for (const route of [
      "/missing.js",
      "/assets/missing.css",
      "/storybook/missing.js",
      "/.htaccess",
      "/.env",
      "/storybook/project.json",
    ]) {
      const response = await fetch(base + route);
      expect(response.status).toBe(404);
      expect(await response.text()).not.toContain('<div id="root">');
    }
    const missing = await fetch(base + "/not-a-lab", {
      headers: { accept: "text/html" },
    });
    expect(missing.status).toBe(404);
    expect(await missing.text()).toContain("Page not found");
    const redirect = await fetch(base + "/demo/?query=kept", {
      redirect: "manual",
    });
    expect(redirect.status).toBe(308);
    expect(redirect.headers.get("location")).toBe("/demo?query=kept");
    const storybook = await fetch(base + "/storybook?path=/docs/example", {
      redirect: "manual",
    });
    expect(storybook.headers.get("location")).toBe(
      "/storybook/?path=/docs/example",
    );
  });
  it("supports HEAD and denies writes, malformed encodings and escaping symlinks", async () => {
    const options = await fixture();
    const manifest = await assemble(options);
    const root = join(options.output, "public");
    await symlink(
      join(options.storybook, "index.html"),
      join(root, "outside.html"),
    );
    const base = await start(
      root,
      routeDocuments(manifest.routes, manifest.releaseId),
    );
    const head = await fetch(base + "/demo", { method: "HEAD" });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");
    expect((await fetch(base, { method: "POST" })).status).toBe(405);
    expect((await fetch(base + "/%XX")).status).toBe(400);
    expect((await fetch(base + "/%2e%2e%2fprivate.txt")).status).toBe(404);
    expect((await fetch(base + "/outside.html")).status).toBe(404);
  });
});
