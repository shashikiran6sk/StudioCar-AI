import { zipSync, type Zippable } from "fflate";

import { createUniqueFilename } from "./create-unique-filename";

export interface PortfolioZipEntry {
  bytes: Uint8Array;
  filename: string;
}

/**
 * Stores the images without recompressing them: they are already compressed,
 * so deflating again costs time and saves nothing.
 */
export function buildPortfolioZip(entries: readonly PortfolioZipEntry[]): Uint8Array {
  const taken = new Set<string>();
  const files: Zippable = {};
  for (const entry of entries) {
    files[createUniqueFilename(entry.filename, taken)] = entry.bytes;
  }
  return zipSync(files, { level: 0 });
}
