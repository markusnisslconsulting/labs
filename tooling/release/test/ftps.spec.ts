import { afterEach, describe, expect, it, vi } from "vitest";
import { Client, FileInfo, FileType } from "basic-ftp";
import type { Writable } from "node:stream";
import { FtpsStore } from "../ftps.ts";
import { publicRoot } from "../deployment.ts";

afterEach(() => vi.restoreAllMocks());
const response = { code: 200, message: "OK" };
function connection() {
  vi.spyOn(Client.prototype, "access").mockResolvedValue(response);
  vi.spyOn(Client.prototype, "pwd").mockResolvedValue("/");
  vi.spyOn(Client.prototype, "closed", "get").mockReturnValue(false);
  vi.spyOn(Client.prototype, "ensureDir").mockResolvedValue(undefined);
  vi.spyOn(Client.prototype, "uploadFrom").mockResolvedValue(response);
  vi.spyOn(Client.prototype, "rename").mockResolvedValue(response);
  vi.spyOn(Client.prototype, "remove").mockResolvedValue(response);
  return new FtpsStore({
    host: "localhost",
    user: "fixture",
    password: "fixture",
  });
}
function file(name: string, directory = false) {
  const entry = new FileInfo(name);
  entry.type = directory ? FileType.Directory : FileType.File;
  return entry;
}
function downloads(bytes: string) {
  return vi
    .spyOn(Client.prototype, "downloadTo")
    .mockImplementation(async (destination) => {
      (destination as Writable).end(Buffer.from(bytes));
      return response;
    });
}

describe("FTPS adapter", () => {
  it("requires verified TLS", async () => {
    const store = connection();
    await store.reconnect();
    expect(Client.prototype.access).toHaveBeenCalledWith(
      expect.objectContaining({
        secure: true,
        secureOptions: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
      }),
    );
    store.close();
  });
  it("rejects paths outside the configured destinations before FTP operations", async () => {
    const store = connection();
    await store.reconnect();
    for (const path of [
      "other/index.html",
      publicRoot + "/../outside",
      publicRoot + "/file\r\nDELE index.html",
    ])
      await expect(store.write(path, Buffer.from("data"))).rejects.toThrow(
        "outside",
      );
    expect(Client.prototype.uploadFrom).not.toHaveBeenCalled();
    store.close();
  });
  it("treats download permission errors as errors, not absent files", async () => {
    const store = connection();
    await store.reconnect();
    vi.spyOn(Client.prototype, "list")
      .mockResolvedValueOnce([file("labs.markusnissl.com", true)])
      .mockResolvedValueOnce([file("public", true)])
      .mockResolvedValueOnce([file("index.html")]);
    vi.spyOn(Client.prototype, "downloadTo").mockRejectedValue(
      new Error("permission denied"),
    );
    await expect(store.read(publicRoot + "/index.html")).rejects.toThrow(
      "permission denied",
    );
    store.close();
  });
  it("never promotes a corrupted temporary upload", async () => {
    const store = connection();
    await store.reconnect();
    downloads("corrupt");
    await expect(
      store.write(publicRoot + "/index.html", Buffer.from("expected")),
    ).rejects.toThrow("temporary upload verification");
    expect(Client.prototype.rename).not.toHaveBeenCalled();
    expect(Client.prototype.remove).toHaveBeenCalledWith(
      expect.stringContaining("/.labs-upload-"),
      true,
    );
    store.close();
  });
  it("uses rename replacement and verifies the destination bytes", async () => {
    const store = connection();
    await store.reconnect();
    downloads("expected");
    await store.write(publicRoot + "/index.html", Buffer.from("expected"));
    expect(Client.prototype.rename).toHaveBeenCalledWith(
      expect.stringContaining("/.labs-upload-"),
      "/" + publicRoot + "/index.html",
    );
    expect(Client.prototype.downloadTo).toHaveBeenCalledTimes(2);
    expect(Client.prototype.remove).not.toHaveBeenCalled();
    store.close();
  });
});
