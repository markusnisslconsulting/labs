import { randomUUID, createHash } from "node:crypto";
import { posix } from "node:path";
import { Readable, Writable } from "node:stream";
import { Client } from "basic-ftp";
import { privateRoot, publicRoot, type ReleaseStore } from "./deployment.ts";

const maximumFileBytes = 64 * 1024 * 1024;
const same = (left: Buffer, right: Buffer) =>
  createHash("sha256").update(left).digest("hex") ===
  createHash("sha256").update(right).digest("hex");

export class FtpsStore implements ReleaseStore {
  private readonly client = new Client(30_000);
  private loginRoot = "";
  private readonly directories = new Set<string>();

  constructor(
    private readonly options: {
      host: string;
      user: string;
      password: string;
      port?: number;
      ca?: string;
    },
  ) {
    if (
      [options.host, options.user, options.password].some(
        (value) => !value || /[\r\n\0]/.test(value),
      )
    )
      throw new Error("Invalid FTPS connection configuration");
  }

  async reconnect() {
    this.client.close();
    await this.client.access({
      host: this.options.host,
      port: this.options.port ?? 21,
      user: this.options.user,
      password: this.options.password,
      secure: true,
      secureOptions: {
        rejectUnauthorized: true,
        minVersion: "TLSv1.2",
        ...(this.options.ca ? { ca: this.options.ca } : {}),
      },
    });
    this.loginRoot = await this.client.pwd();
    this.directories.clear();
    this.directories.add(this.loginRoot);
  }

  close() {
    this.client.close();
  }

  private path(relative: string) {
    if (!this.loginRoot || this.client.closed)
      throw new Error("FTPS session is not connected");
    if (
      ![publicRoot, privateRoot].some((root) =>
        relative.startsWith(root + "/"),
      ) ||
      relative
        .split("/")
        .some((part) => !part || part === "." || part === "..") ||
      /[\\\r\n\0]/.test(relative)
    )
      throw new Error("FTPS path is outside the release destinations");
    return posix.join(this.loginRoot, relative);
  }

  private async directoryExists(directory: string): Promise<boolean> {
    if (this.directories.has(directory)) return true;
    const parent = posix.dirname(directory);
    if (parent === directory || !(await this.directoryExists(parent)))
      return false;
    const entry = (await this.client.list(parent)).find(
      (candidate) => candidate.name === posix.basename(directory),
    );
    if (!entry) return false;
    if (!entry.isDirectory)
      throw new Error("FTPS directory path is not a directory");
    this.directories.add(directory);
    return true;
  }

  private async download(path: string): Promise<Buffer> {
    const chunks: Buffer[] = [];
    let bytes = 0;
    const stream = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        bytes += chunk.length;
        if (bytes > maximumFileBytes)
          return callback(new Error("FTPS file exceeds the 64 MiB limit"));
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });
    await this.client.downloadTo(stream, path);
    return Buffer.concat(chunks);
  }

  async read(relative: string): Promise<Buffer | undefined> {
    const path = this.path(relative);
    if (!(await this.directoryExists(posix.dirname(path)))) return undefined;
    const entry = (await this.client.list(posix.dirname(path))).find(
      (candidate) => candidate.name === posix.basename(path),
    );
    if (!entry) return undefined;
    if (!entry.isFile || entry.size > maximumFileBytes)
      throw new Error("FTPS entry is not a supported regular file");
    return this.download(path);
  }

  async write(relative: string, data: Buffer) {
    if (data.length > maximumFileBytes)
      throw new Error("FTPS upload exceeds the 64 MiB limit");
    const target = this.path(relative);
    const directory = posix.dirname(target);
    if (!this.directories.has(directory)) {
      await this.client.ensureDir(directory);
      this.directories.add(directory);
    }
    const temporary = posix.join(directory, `.labs-upload-${randomUUID()}`);
    let renamed = false;
    try {
      await this.client.uploadFrom(Readable.from(data), temporary);
      if (!same(await this.download(temporary), data))
        throw new Error("FTPS temporary upload verification failed");
      await this.client.rename(temporary, target);
      renamed = true;
      if (!same(await this.download(target), data))
        throw new Error("FTPS replacement verification failed");
    } finally {
      // A disconnected session can leave an unpublished temporary file.
      if (!renamed && !this.client.closed)
        await this.client.remove(temporary, true);
    }
  }

  async remove(relative: string) {
    await this.client.remove(this.path(relative));
  }
}
