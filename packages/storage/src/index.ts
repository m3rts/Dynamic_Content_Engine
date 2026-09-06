import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StorageScope = {
  agencyId: string;
  clientId: string;
};

export class StorageAccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageAccessDeniedError";
  }
}

export class StoragePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoragePathError";
  }
}

/** Normalize a client-relative storage path and reject traversal or absolute paths. */
export function normalizeRelativePath(relativePath: string): string {
  const trimmed = relativePath.trim();
  if (trimmed.length === 0) {
    throw new StoragePathError("relative path is required");
  }

  if (path.isAbsolute(trimmed)) {
    throw new StoragePathError("absolute paths are not allowed");
  }

  const normalized = path.posix.normalize(trimmed.replace(/\\/g, "/"));
  if (normalized === ".." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new StoragePathError("path traversal is not allowed");
  }

  return normalized;
}

export function scopedStorageSegments(scope: StorageScope, relativePath: string): string[] {
  return [scope.agencyId, scope.clientId, normalizeRelativePath(relativePath)];
}

export class LocalFilesystemStorage {
  constructor(private readonly rootDirectory: string) {}

  resolveAbsolutePath(scope: StorageScope, relativePath: string): string {
    const segments = scopedStorageSegments(scope, relativePath);
    const absolutePath = path.resolve(this.rootDirectory, ...segments);
    const rootWithSep = `${path.resolve(this.rootDirectory)}${path.sep}`;

    if (
      absolutePath !== path.resolve(this.rootDirectory) &&
      !absolutePath.startsWith(rootWithSep)
    ) {
      throw new StorageAccessDeniedError("resolved path escapes storage root");
    }

    return absolutePath;
  }

  async write(scope: StorageScope, relativePath: string, data: Buffer): Promise<void> {
    const absolutePath = this.resolveAbsolutePath(scope, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, data);
  }

  async read(scope: StorageScope, relativePath: string): Promise<Buffer> {
    const absolutePath = this.resolveAbsolutePath(scope, relativePath);
    return readFile(absolutePath);
  }
}
