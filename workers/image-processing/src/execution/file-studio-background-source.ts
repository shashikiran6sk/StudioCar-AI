import { readFile } from "node:fs/promises";
import path from "node:path";

import type { StudioBackgroundSource } from "./studio-background.types";

/**
 * Reads packaged background artwork from disk once per warm runtime and keeps
 * the compressed bytes: six files of a few megabytes at most. A failed read is
 * not cached, so the next job tries again.
 */
export class FileStudioBackgroundSource implements StudioBackgroundSource {
  private readonly cache = new Map<string, Promise<Uint8Array>>();

  public constructor(private readonly directory: string) {}

  public read(file: string): Promise<Uint8Array> {
    const cached = this.cache.get(file);
    if (cached) return cached;
    const pending = readFile(path.join(this.directory, path.basename(file)));
    this.cache.set(file, pending);
    pending.catch(() => {
      this.cache.delete(file);
    });
    return pending;
  }
}
