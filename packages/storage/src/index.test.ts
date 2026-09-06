import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  LocalFilesystemStorage,
  StorageAccessDeniedError,
  StoragePathError,
  type StorageScope,
} from "./index.js";

describe("LocalFilesystemStorage", () => {
  let rootDirectory: string;
  let storage: LocalFilesystemStorage;
  const scopeA: StorageScope = {
    agencyId: "11111111-1111-4111-8111-111111111111",
    clientId: "33333333-3333-4333-8333-333333333333",
  };
  const scopeB: StorageScope = {
    agencyId: "11111111-1111-4111-8111-111111111111",
    clientId: "44444444-4444-4444-8444-444444444444",
  };

  beforeEach(async () => {
    rootDirectory = await mkdtemp(path.join(os.tmpdir(), "dce-storage-"));
    storage = new LocalFilesystemStorage(rootDirectory);
  });

  afterEach(async () => {
    await rm(rootDirectory, { recursive: true, force: true });
  });

  it("stores and reads files within a client scope", async () => {
    await storage.write(scopeA, "assets/logo.png", Buffer.from("scoped"));
    const data = await storage.read(scopeA, "assets/logo.png");
    expect(data.toString()).toBe("scoped");
  });

  it("denies cross-client reads for the same relative path", async () => {
    await storage.write(scopeA, "assets/logo.png", Buffer.from("client-a"));

    await expect(storage.read(scopeB, "assets/logo.png")).rejects.toThrow(/ENOENT/);
  });

  it("rejects path traversal", async () => {
    await expect(storage.read(scopeA, "../other/file.txt")).rejects.toBeInstanceOf(
      StoragePathError,
    );
    await expect(storage.read(scopeA, "assets/../../escape.txt")).rejects.toBeInstanceOf(
      StoragePathError,
    );
  });

  it("rejects absolute paths", async () => {
    await expect(storage.read(scopeA, "/etc/passwd")).rejects.toBeInstanceOf(StoragePathError);
  });

  it("rejects resolved paths that escape the storage root", async () => {
    const escapeScope: StorageScope = {
      agencyId: "..",
      clientId: "x",
    };

    await expect(
      storage.write(escapeScope, "file.txt", Buffer.from("nope")),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
  });
});
